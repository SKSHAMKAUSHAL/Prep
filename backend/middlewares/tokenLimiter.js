const User = require("../models/User");
const { AppError } = require("./errorHandler");
const cacheService = require("../services/cacheService");
const logger = require("../utils/logger");

const COST_PER_CHAT = 10;
const MONTHLY_TOKENS = 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Middleware that manages the user's monthly 1000-token quota.
 * Automatically resets tokens after 30 days.
 * Deducts 10 tokens per chat message.
 */
const deductTokens = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return next(new AppError("User authentication required", 401));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const now = new Date();
    const lastReset = user.tokensLastReset ? new Date(user.tokensLastReset) : new Date(user.createdAt || now);

    // 1. Auto-reset tokens if 30 days have elapsed since last reset
    if (now.getTime() - lastReset.getTime() >= THIRTY_DAYS_MS || user.tokens === undefined) {
      user.tokens = MONTHLY_TOKENS;
      user.tokensLastReset = now;
      logger.info({ userId: user._id }, "Monthly tokens reset to 1000");
    }

    // 2. Check if user has sufficient tokens
    if (user.tokens < COST_PER_CHAT) {
      return res.status(403).json({
        message: `Insufficient tokens. You have ${user.tokens} tokens remaining. Each chat costs 10 tokens. Your 1000 monthly quota resets on ${new Date(user.tokensLastReset.getTime() + THIRTY_DAYS_MS).toLocaleDateString()}.`,
        tokens: user.tokens,
        cost: COST_PER_CHAT,
        nextReset: new Date(user.tokensLastReset.getTime() + THIRTY_DAYS_MS),
      });
    }

    // 3. Deduct tokens
    user.tokens -= COST_PER_CHAT;
    await user.save();

    // Invalidate cached profile
    await cacheService.del(`user:profile:${user._id}`).catch(() => {});

    // Attach remaining tokens to request
    req.userTokens = user.tokens;
    req.tokensDeducted = COST_PER_CHAT;

    logger.info({ userId: user._id, remainingTokens: user.tokens }, `Deducted ${COST_PER_CHAT} tokens for chat`);
    next();
  } catch (error) {
    logger.error({ error: error.message }, "Token deduction middleware error");
    next(error);
  }
};

module.exports = { deductTokens, COST_PER_CHAT, MONTHLY_TOKENS };
