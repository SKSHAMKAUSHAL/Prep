const crypto = require("crypto");
const Session = require("../models/Session");
const Question = require("../models/Question");
const logger = require("../utils/logger");
const { AppError } = require("../middlewares/errorHandler");
const cacheService = require("../services/cacheService");
const sessionStateService = require("../services/sessionStateService");
const queueService = require("../queues");
const { TTL } = require("../services/cacheService");

exports.createSession = async (req, res, next) => {
  try {
    const { role, experience, topicsToFocus, description, questions } = req.body;
    const userId = req.user._id;

    logger.info({ userId, role, experience, questionCount: questions?.length }, "Creating new interview session");

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      user: userId,
      token,
      expiresAt,
      role,
      experience,
      topicsToFocus,
      description,
    });

    const questionDocs = await Promise.all(
      questions.map(async (q) => {
        const question = await Question.create({
          session: session._id,
          question: q.question,
          answer: q.answer,
        });
        return question._id;
      })
    );

    session.questions = questionDocs;
    await session.save();

    // Invalidate user session list cache
    await cacheService.del(`user:${userId}:sessions`);

    // Initialize real-time session state in Redis
    await sessionStateService.initSessionState(session._id, userId, { role, experience });

    logger.info({ sessionId: session._id, userId }, "Interview session created successfully");

    res.status(201).json({ success: true, session });
  } catch (error) {
    logger.error({ error: error.message, userId: req.user?._id }, "Failed to create session");
    next(error);
  }
};

exports.getMySessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = `user:${userId}:sessions`;

    const sessions = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return Session.find({ user: userId })
          .sort({ createdAt: -1 })
          .populate("questions")
          .lean();
      },
      TTL.SESSION_LIST
    );

    res.status(200).json(sessions);
  } catch (error) {
    logger.error({ error: error.message, userId: req.user?._id }, "Failed to fetch user sessions");
    next(error);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const cacheKey = `session:${sessionId}`;

    const session = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return Session.findById(sessionId)
          .populate({
            path: "questions",
            options: { sort: { isPinned: -1, createdAt: 1 } },
          })
          .lean();
      },
      TTL.SESSION_DETAIL
    );

    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    // IDOR Protection: Always enforce user ownership check even on cached reads
    const sessionOwnerId = session.user?._id ? session.user._id.toString() : session.user.toString();
    const requesterId = (req.user._id || req.user.id).toString();

    if (sessionOwnerId !== requesterId && req.user.role !== "admin") {
      return next(new AppError("Not authorized to access this session", 403));
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    logger.error({ error: error.message, sessionId: req.params.id }, "Failed to get session by ID");
    next(error);
  }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);

    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    const sessionOwnerId = session.user.toString();
    const requesterId = (req.user.id || req.user._id).toString();

    if (sessionOwnerId !== requesterId) {
      return next(new AppError("Not authorized to delete this session", 403));
    }

    await Question.deleteMany({ session: session._id });
    await session.deleteOne();

    // Invalidate caches and end live state
    await cacheService.del(`session:${sessionId}`);
    await cacheService.del(`user:${requesterId}:sessions`);
    await sessionStateService.endSessionState(sessionId, requesterId);

    logger.info({ sessionId, userId: requesterId }, "Session deleted successfully");

    res.status(200).json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    logger.error({ error: error.message, sessionId: req.params.id }, "Failed to delete session");
    next(error);
  }
};

exports.saveAttempt = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { history, persona, duration } = req.body;

    let totalScore = 0;
    let totalConfidence = 0;

    if (history && history.length > 0) {
      history.forEach((h) => {
        totalScore += h.evaluation?.score || 0;
        totalConfidence += h.evaluation?.confidenceScore || 0;
      });
    }

    const avgScore = history && history.length > 0 ? Math.round(totalScore / history.length) : 0;
    const avgConfidence = history && history.length > 0 ? Math.round(totalConfidence / history.length) : 0;

    const attempt = {
      persona,
      duration,
      avgScore,
      avgConfidence,
      history,
    };

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { $push: { attempts: attempt } },
      { new: true }
    );

    if (!session) {
      return next(new AppError("Session not found", 404));
    }

    const requesterId = (req.user.id || req.user._id).toString();

    // Invalidate caches
    await cacheService.del(`session:${sessionId}`);
    await cacheService.del(`user:${requesterId}:sessions`);

    // Update live state in Redis
    await sessionStateService.updateSessionState(sessionId, requesterId, {
      status: "completed",
    }).catch((err) => {
      logger.warn({ err: err.message }, "Notice: live session state already closed or expired");
    });

    // Asynchronously dispatch background jobs to BullMQ queues
    const evaluationJob = await queueService.addEvaluationJob({
      sessionId,
      userId: requesterId,
      questionText: history?.[0]?.question || "Interview Session Evaluation",
      userAnswer: history?.[0]?.userAnswer || "",
      persona,
      history,
    });

    const reportJob = await queueService.addReportJob({
      sessionId,
      userId: requesterId,
      attempts: session.attempts || [attempt],
      role: session.role,
      experience: session.experience,
    });

    const analyticsJob = await queueService.addAnalyticsJob({
      userId: requesterId,
      sessionId,
      metrics: {
        score: avgScore,
        confidence: avgConfidence,
        duration,
      },
    });

    logger.info(
      {
        sessionId,
        evalJobId: evaluationJob.id,
        reportJobId: reportJob.id,
        analyticsJobId: analyticsJob.id,
      },
      "Background processing jobs dispatched to BullMQ queues"
    );

    res.status(200).json({
      success: true,
      attempt,
      jobIds: {
        evaluation: evaluationJob.id,
        report: reportJob.id,
        analytics: analyticsJob.id,
      },
    });
  } catch (error) {
    logger.error({ error: error.message, sessionId: req.params.id }, "Failed to save attempt");
    next(error);
  }
};

/**
 * Real-time live session state endpoints
 */
exports.getLiveSessionState = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const requesterId = (req.user._id || req.user.id).toString();

    const state = await sessionStateService.getSessionState(sessionId, requesterId);
    if (!state) {
      return next(new AppError("Active live session state not found or has expired", 404));
    }

    res.status(200).json({ success: true, state });
  } catch (error) {
    logger.error({ error: error.message, sessionId: req.params.id }, "Failed to get live session state");
    next(error);
  }
};

exports.updateLiveSessionState = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const requesterId = (req.user._id || req.user.id).toString();

    const updatedState = await sessionStateService.updateSessionState(sessionId, requesterId, req.body);
    res.status(200).json({ success: true, state: updatedState });
  } catch (error) {
    logger.error({ error: error.message, sessionId: req.params.id }, "Failed to update live session state");
    next(error);
  }
};

exports.recordLiveInterruption = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const requesterId = (req.user._id || req.user.id).toString();

    const state = await sessionStateService.recordInterruption(sessionId, requesterId);
    res.status(200).json({ success: true, interruptionCount: state?.interruptionCount || 0 });
  } catch (error) {
    logger.error({ error: error.message, sessionId: req.params.id }, "Failed to record interruption");
    next(error);
  }
};

/**
 * Phase 3: Background job status endpoint with IDOR authorization guard
 */
exports.getJobStatus = async (req, res, next) => {
  try {
    const { queueName, jobId } = req.params;
    const requesterId = (req.user._id || req.user.id).toString();

    const job = await queueService.getJobStatus(queueName, jobId);
    if (!job) {
      return next(new AppError("Background job not found or expired from queue", 404));
    }

    // IDOR Protection: Verify job belongs to requesting user
    if (job.data?.userId && String(job.data.userId) !== requesterId && req.user.role !== "admin") {
      return next(new AppError("Access denied: You do not have permission to view this job", 403));
    }

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        queueName: job.queueName,
        name: job.name,
        state: job.state,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
      },
    });
  } catch (error) {
    logger.error({ error: error.message, jobId: req.params.jobId }, "Failed to get background job status");
    next(error);
  }
};
