const logger = require("../utils/logger");

/**
 * Processor for session report generation jobs
 * Aggregates all session attempts and generates a comprehensive diagnostic summary.
 */
const processReportJob = async (job) => {
  const { sessionId, attempts = [], role = "Software Engineer", experience = "Mid", userId } = job.data;

  logger.info({ jobId: job.id, sessionId, userId }, "Generating interview diagnostic report");

  await job.updateProgress(25);

  const attemptCount = attempts.length;
  let totalScore = 0;
  let totalConfidence = 0;
  let totalDuration = 0;

  for (const att of attempts) {
    totalScore += att.avgScore || 0;
    totalConfidence += att.avgConfidence || 0;
    totalDuration += att.duration || 0;
  }

  const overallAvgScore = attemptCount > 0 ? Math.round(totalScore / attemptCount) : 0;
  const overallAvgConfidence = attemptCount > 0 ? Math.round(totalConfidence / attemptCount) : 0;

  await job.updateProgress(70);

  // Performance classification
  let performanceBand = "Needs Improvement";
  if (overallAvgScore >= 85) performanceBand = "Exceptional";
  else if (overallAvgScore >= 70) performanceBand = "Proficient";
  else if (overallAvgScore >= 50) performanceBand = "Developing";

  const strengths = [];
  const improvementAreas = [];

  if (overallAvgScore >= 75) {
    strengths.push("Consistent technical articulation across questions");
  } else {
    improvementAreas.push("Deepen explanations with concrete technical examples and edge-case awareness");
  }

  if (overallAvgConfidence >= 70) {
    strengths.push("High vocal clarity and calm demeanor during responses");
  } else {
    improvementAreas.push("Practice pacing and minimize verbal pauses to convey higher confidence");
  }

  const report = {
    sessionId,
    userId,
    targetRole: role,
    targetExperience: experience,
    performanceBand,
    overallAvgScore,
    overallAvgConfidence,
    totalDurationSeconds: totalDuration,
    attemptCount,
    strengths,
    improvementAreas,
    generatedAt: new Date().toISOString(),
  };

  await job.updateProgress(100);

  logger.info({ jobId: job.id, performanceBand, overallAvgScore }, "Diagnostic report completed");

  return report;
};

module.exports = { processReportJob };
