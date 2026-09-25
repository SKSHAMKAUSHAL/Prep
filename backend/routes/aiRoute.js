const express = require("express");
const router = express.Router();
const {
  generateInterviewQuestions,
  generateConceptExplanation,
  evaluateLiveAnswer,
} = require("../controllers/aiController");
const { protect } = require("../middlewares/authMiddleware");
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

module.exports = router;
