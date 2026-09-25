const express = require("express");
const {
  getSessionById,
  getMySessions,
  deleteSession,
  createSession,
  saveAttempt,
  getLiveSessionState,
  updateLiveSessionState,
  recordLiveInterruption,
  getJobStatus,
} = require("../controllers/sessionController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { sessionLimiter } = require("../middlewares/rateLimiter");
const {
  createSessionSchema,
  sessionIdParamSchema,
  saveAttemptSchema,
  updateLiveStateSchema,
  jobStatusParamSchema,
} = require("../validators/sessionSchemas");

const router = express.Router();

router.use(sessionLimiter);

router.post("/create", protect, validate(createSessionSchema), createSession);
router.get("/my-sessions", protect, getMySessions);
router.get("/:id", protect, validate(sessionIdParamSchema), getSessionById);
router.post("/:id/attempt", protect, validate(saveAttemptSchema), saveAttempt);
router.delete("/:id", protect, validate(sessionIdParamSchema), deleteSession);

// Phase 2: Live session state endpoints
router.get("/:id/live-state", protect, validate(sessionIdParamSchema), getLiveSessionState);
router.put("/:id/live-state", protect, validate(updateLiveStateSchema), updateLiveSessionState);
router.post("/:id/interruption", protect, validate(sessionIdParamSchema), recordLiveInterruption);

// Phase 3: Background job status endpoint
router.get("/jobs/:queueName/:jobId", protect, validate(jobStatusParamSchema), getJobStatus);

module.exports = router;
