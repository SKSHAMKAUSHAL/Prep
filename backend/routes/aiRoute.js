const express = require("express");
const router = express.Router();
const {
  generateInterviewQuestions,
  generateConceptExplanation,
  evaluateLiveAnswer,
  chatWithQuestionContext,
  solveDoubt,
  getTokenBalance,
} = require("../controllers/aiController");
const { protect } = require("../middlewares/authMiddleware");
const { deductTokens } = require("../middlewares/tokenLimiter");
const validate = require("../middlewares/validate");
const { aiLimiter } = require("../middlewares/rateLimiter");
const {
  generateQuestionsSchema,
  conceptExplanationSchema,
  evaluateLiveAnswerSchema,
} = require("../validators/aiSchemas");

router.post(
  "/generate-questions",
  aiLimiter,
  protect,
  validate(generateQuestionsSchema),
  generateInterviewQuestions
);

router.post(
  "/generate-explanation",
  aiLimiter,
  protect,
  validate(conceptExplanationSchema),
  generateConceptExplanation
);

router.post(
  "/evaluate-answer",
  aiLimiter,
  protect,
  validate(evaluateLiveAnswerSchema),
  evaluateLiveAnswer
);

// Question-specific deep dive chat inside Learn More (Costs 10 tokens)
router.post(
  "/question-chat",
  aiLimiter,
  protect,
  deductTokens,
  chatWithQuestionContext
);

// Dedicated Doubt Solver chat (Costs 10 tokens)
router.post(
  "/doubt-solver",
  aiLimiter,
  protect,
  deductTokens,
  solveDoubt
);

// Get current token balance for logged-in user
router.get(
  "/token-balance",
  protect,
  getTokenBalance
);

module.exports = router;
