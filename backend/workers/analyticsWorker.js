const logger = require("../utils/logger");

/**
 * Processor for user analytics aggregation jobs
 */
const processAnalyticsJob = async (job) => {
  const { userId, sessionId, metrics = {} } = job.data;

  logger.info({ jobId: job.id, userId, sessionId }, "Aggregating candidate performance analytics");

  await job.updateProgress(30);

  const analyticsUpdate = {
    userId,
    sessionId,
    score: metrics.score || 0,
    confidence: metrics.confidence || 0,
    duration: metrics.duration || 0,
    processedAt: new Date().toISOString(),
  };

  await job.updateProgress(100);

  logger.info({ jobId: job.id, userId }, "Candidate performance analytics updated");

  return analyticsUpdate;
};

module.exports = { processAnalyticsJob };
