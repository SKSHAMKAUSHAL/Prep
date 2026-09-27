const express = require("express");
const router = express.Router();
const ragController = require("../controllers/ragController");
const { protect } = require("../middlewares/authMiddleware");
const { generalLimiter } = require("../middlewares/rateLimiter");

// Public or authenticated status check
router.get("/status", generalLimiter, ragController.getStatus);

// Authenticated vector rubric search
router.get("/search", protect, generalLimiter, ragController.searchRubrics);

module.exports = router;
