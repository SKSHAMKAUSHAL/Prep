const express = require('express');
const router = express.Router();
const {
  generateInterviewQuestions,
  generateConceptExplanation,
  evaluateLiveAnswer,
} = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/generate-questions', protect, generateInterviewQuestions);
router.post('/generate-explanation', protect, generateConceptExplanation);
router.post('/evaluate-answer', protect, evaluateLiveAnswer);

module.exports = router;
