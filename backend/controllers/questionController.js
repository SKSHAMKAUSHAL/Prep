const Question = require("../models/Question");
const Session = require("../models/Session");
const logger = require("../utils/logger");
const { AppError } = require("../middlewares/errorHandler");
const cacheService = require("../services/cacheService");

exports.addQuestionsToSession = async (req, res, next) => {
  try {
    const { sessionId, questions } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    const createdQuestions = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer || "",
      }))
    );

    if (!session.questions) {
      session.questions = [];
    }
    session.questions.push(...createdQuestions.map((q) => q._id));
    await session.save();

    // Invalidate cached session so new questions are immediately reflected
    await cacheService.del(`session:${sessionId}`);

    logger.info({ sessionId, count: createdQuestions.length }, "Questions added to session");

    res.status(201).json(createdQuestions);
  } catch (error) {
    logger.error({ error: error.message }, "Failed to add questions to session");
    next(error);
  }
};

exports.togglePinQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return next(new AppError("Question not found", 404));
    }

    question.isPinned = !question.isPinned;
    await question.save();

    // Invalidate session cache to update pinned question order
    await cacheService.del(`session:${question.session}`);

    logger.info({ questionId: req.params.id, isPinned: question.isPinned }, "Question pin status toggled");

    res.status(200).json({ success: true, question });
  } catch (error) {
    logger.error({ error: error.message, questionId: req.params.id }, "Failed to toggle pin question");
    next(error);
  }
};

exports.updateQuestionNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return next(new AppError("Question not found", 404));
    }

    question.note = note || "";
    await question.save();

    // Invalidate session cache to reflect note update
    await cacheService.del(`session:${question.session}`);

    logger.info({ questionId: req.params.id }, "Question note updated");

    res.status(200).json({ success: true, question });
  } catch (error) {
    logger.error({ error: error.message, questionId: req.params.id }, "Failed to update question note");
    next(error);
  }
};
