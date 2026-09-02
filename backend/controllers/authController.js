const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImageUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log("User found:", !!user);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    const token = generateToken(user._id);
    console.log("Generated token:", token);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: token,
    });

  } catch (error) {
    console.error("💥 LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, password, profileImageUrl } = req.body;

    // Check if email is being changed and it's not taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Update fields if provided
    if (name) user.name = name;
    if (profileImageUrl) user.profileImageUrl = profileImageUrl;

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImageUrl: updatedUser.profileImageUrl,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const axios = require('axios');

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required for Google login" });
    }

    let googleId = null;
    let email = null;
    let name = null;
    let profileImageUrl = null;

    // 1. Check if token is a JWT (ID Token)
    if (typeof token === 'string' && token.split('.').length === 3) {
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
        console.warn("JWT verification failed, falling back to decoding / userinfo:", jwtErr.message);
        const decoded = jwt.decode(token);
        if (decoded && (decoded.email || decoded.sub)) {
          googleId = decoded.sub;
          email = decoded.email;
          name = decoded.name || decoded.given_name;
          profileImageUrl = decoded.picture;
        }
      }
    }

    // 2. If not obtained via JWT, fetch from Google userinfo endpoint using access token
    if (!email && !googleId) {
      try {
        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = googleResponse.data;
        googleId = data.sub || data.id;
        email = data.email;
        name = data.name || data.given_name;
        profileImageUrl = data.picture;
      } catch (axiosErr1) {
        // Fallback to v2 userinfo endpoint
        try {
          const googleResponseV2 = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = googleResponseV2.data;
          googleId = data.id || data.sub;
          email = data.email;
          name = data.name || data.given_name;
          profileImageUrl = data.picture;
        } catch (axiosErr2) {
          console.error("Google userinfo fetch failed:", axiosErr1.response?.data || axiosErr1.message);
          return res.status(401).json({ 
            message: "Invalid or expired Google token", 
            details: axiosErr1.response?.data || axiosErr1.message 
          });
        }
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Unable to retrieve email from Google profile" });
    }

    // Fallback for name if not provided
    if (!name) {
      name = email.split('@')[0];
    }

    // Check if user exists by email or googleId safely
    const query = [];
    if (email) query.push({ email });
    if (googleId) query.push({ googleId });

    let user = await User.findOne({ $or: query });

    if (!user) {
      // Create new user
      const newUserData = {
        name,
        email,
        profileImageUrl: profileImageUrl || null,
      };
      if (googleId) newUserData.googleId = googleId;

      user = await User.create(newUserData);
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
      }
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: jwtToken,
    });

  } catch (error) {
    console.error("💥 GOOGLE LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Server error during Google login",
      error: error.message
    });
  }
};

module.exports = { registerUser, loginUser, googleLogin, getUserProfile, updateUserProfile };
