const express = require('express');
const { getSessionById, getMySessions, deleteSession, createSession, saveAttempt } = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/create', protect, createSession);
router.get('/my-sessions', protect, getMySessions);
router.get('/:id', protect, getSessionById);
router.post('/:id/attempt', protect, saveAttempt);
router.delete('/:id', protect, deleteSession);

module.exports = router;
