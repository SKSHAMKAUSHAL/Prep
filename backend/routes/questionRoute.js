const express = require("express");
const {
  togglePinQuestion,
  updateQuestionNote,
  addQuestionsToSession,
} = require("../controllers/questionController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { sessionLimiter } = require("../middlewares/rateLimiter");
const {
  addQuestionsSchema,
  questionIdParamSchema,
  updateNoteSchema,
} = require("../validators/questionSchemas");

const router = express.Router();

router.use(sessionLimiter);

router.post("/add", protect, validate(addQuestionsSchema), addQuestionsToSession);
router.post("/:id/pin", protect, validate(questionIdParamSchema), togglePinQuestion);
router.post("/:id/note", protect, validate(updateNoteSchema), updateQuestionNote);

module.exports = router;
