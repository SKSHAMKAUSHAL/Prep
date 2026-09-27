const express = require("express");
const router = express.Router();
const codeController = require("../controllers/codeController");
const { protect } = require("../middlewares/authMiddleware");
const { generalLimiter, strictLimiter } = require("../middlewares/rateLimiter");

// Status endpoint
router.get("/status", generalLimiter, codeController.getStatus);

// Secure code execution endpoint (authenticated & rate limited to prevent resource exhaustion)
router.post("/execute", protect, strictLimiter, codeController.runCode);

module.exports = router;
