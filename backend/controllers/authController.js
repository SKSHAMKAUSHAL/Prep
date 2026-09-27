const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const logger = require("../utils/logger");
const { AppError } = require("../middlewares/errorHandler");
const cacheService = require("../services/cacheService");
const { TTL } = require("../services/cacheService");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, profileImageUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError("User already exists with this email address", 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
    });

    logger.info({ userId: user._id, email: user.email }, "New user registered successfully");

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      tokens: user.tokens ?? 1000,
      tokensLastReset: user.tokensLastReset,
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error({ error: error.message }, "Registration error");
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn({ email }, "Failed login attempt: incorrect password");
      return next(new AppError("Invalid email or password", 401));
    }

    const token = generateToken(user._id);
    logger.info({ userId: user._id }, "User logged in successfully");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      tokens: user.tokens ?? 1000,
      tokensLastReset: user.tokensLastReset,
      token,
    });
  } catch (error) {
    logger.error({ error: error.message }, "Login error");
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const cacheKey = `user:profile:${userId}`;

    const user = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return User.findById(userId).select("-password").lean();
      },
      TTL.USER_PROFILE
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.json(user);
  } catch (error) {
    logger.error({ error: error.message, userId: req.user?.id }, "Get user profile error");
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const { name, email, password, profileImageUrl } = req.body;

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return next(new AppError("Email already in use", 400));
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (profileImageUrl !== undefined) user.profileImageUrl = profileImageUrl;

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();
    
    // Invalidate user profile cache on update
    await cacheService.del(`user:profile:${updatedUser._id}`);

    logger.info({ userId: updatedUser._id }, "User profile updated successfully");

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImageUrl: updatedUser.profileImageUrl,
      tokens: updatedUser.tokens ?? 1000,
      tokensLastReset: updatedUser.tokensLastReset,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    logger.error({ error: error.message, userId: req.user?.id }, "Profile update error");
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError("Token is required for Google login", 400));
    }

    let googleId = null;
    let email = null;
    let name = null;
    let profileImageUrl = null;

    // 1. Check if token is a JWT (ID Token)
    if (typeof token === "string" && token.split(".").length === 3) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email;
        name = payload.name || payload.given_name;
        profileImageUrl = payload.picture;
      } catch (jwtErr) {
        logger.warn({ error: jwtErr.message }, "JWT verification failed, falling back to decoding / userinfo");
        const decoded = jwt.decode(token);
        if (decoded && (decoded.email || decoded.sub)) {
          googleId = decoded.sub;
          email = decoded.email;
          name = decoded.name || decoded.given_name;
          profileImageUrl = decoded.picture;
        }
      }
    }

    // 2. Fallback to Google userinfo endpoint using access token
    if (!email && !googleId) {
      try {
        const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = googleResponse.data;
        googleId = data.sub || data.id;
        email = data.email;
        name = data.name || data.given_name;
        profileImageUrl = data.picture;
      } catch (axiosErr1) {
        try {
          const googleResponseV2 = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = googleResponseV2.data;
          googleId = data.id || data.sub;
          email = data.email;
          name = data.name || data.given_name;
          profileImageUrl = data.picture;
        } catch (axiosErr2) {
          logger.error({ error: axiosErr1.message }, "Google userinfo fetch failed");
          return next(new AppError("Invalid or expired Google authentication token", 401));
        }
      }
    }

    if (!email) {
      return next(new AppError("Unable to retrieve email from Google profile", 400));
    }

    if (!name) {
      name = email.split("@")[0];
    }

    const query = [];
    if (email) query.push({ email });
    if (googleId) query.push({ googleId });

    let user = await User.findOne({ $or: query });

    if (!user) {
      const newUserData = {
        name,
        email,
        profileImageUrl: profileImageUrl || null,
      };
      if (googleId) newUserData.googleId = googleId;

      user = await User.create(newUserData);
      logger.info({ userId: user._id, email: user.email }, "Created new user via Google login");
    } else {
      let needsSave = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (profileImageUrl && !user.profileImageUrl) {
        user.profileImageUrl = profileImageUrl;
        needsSave = true;
      }
      if (!user.name && name) {
        user.name = name;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
        await cacheService.del(`user:profile:${user._id}`);
      }
      logger.info({ userId: user._id }, "Existing user logged in via Google");
    }

    const jwtToken = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      tokens: user.tokens ?? 1000,
      tokensLastReset: user.tokensLastReset,
      token: jwtToken,
    });
  } catch (error) {
    logger.error({ error: error.message }, "Google login error");
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
};
