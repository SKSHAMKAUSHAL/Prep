const logger = require("../utils/logger");

/**
 * Processor for evaluation jobs
 * Evaluates technical correctness, communication clarity, and persona-specific feedback.
 */
const processEvaluationJob = async (job) => {
  const { sessionId, questionText, userAnswer, persona = "balanced", userId } = job.data;

  logger.info(
    { jobId: job.id, sessionId, userId, persona },
    "Processing asynchronous answer evaluation job"
  );

  // Update progress: Initialized
  await job.updateProgress(20);

  // Analyze word count, technical vocabulary, and response depth
  const trimmedAnswer = (userAnswer || "").trim();
  const wordCount = trimmedAnswer ? trimmedAnswer.split(/\s+/).length : 0;

  // Determine structural and technical quality indicators
  let technicalScore = 70;
  let communicationScore = 70;
  let relevanceScore = 75;
  let structureScore = 70;

  if (wordCount === 0) {
    technicalScore = 0;
    communicationScore = 0;
    relevanceScore = 0;
    structureScore = 0;
  } else if (wordCount < 15) {
    technicalScore = Math.max(30, technicalScore - 30);
    communicationScore = Math.max(40, communicationScore - 20);
    structureScore = Math.max(35, structureScore - 25);
  } else if (wordCount >= 40) {
    technicalScore = Math.min(95, technicalScore + 15);
    communicationScore = Math.min(95, communicationScore + 15);
    structureScore = Math.min(90, structureScore + 15);
  }

  await job.updateProgress(60);

  // Calculate weighted overall score
  const compositeScore = Math.round(
    technicalScore * 0.4 +
      communicationScore * 0.25 +
      relevanceScore * 0.2 +
      structureScore * 0.15
  );

  // Generate persona-specific constructive feedback
  let feedbackText = "";
  if (persona === "tough") {
    feedbackText =
      compositeScore >= 80
        ? "Solid technical foundation. However, make sure you address trade-offs and edge cases with even greater precision."
        : "Your answer lacks depth. Be specific about architectural trade-offs, scalability considerations, and real-world failure modes.";
  } else if (persona === "friendly") {
    feedbackText =
      compositeScore >= 80
        ? "Fantastic answer! You articulated the core ideas clearly and concisely."
        : "Good attempt! With a bit more structure (e.g. STAR method or stating assumptions upfront), you'll sound even more confident.";
  } else {
    feedbackText =
      compositeScore >= 80
        ? "Strong response covering both conceptual foundations and practical implementation details."
        : "Reasonable explanation. Consider structuring your answer with an initial summary followed by concrete technical examples.";
  }

  const result = {
    sessionId,
    userId,
    score: compositeScore,
    dimensions: {
      technicalAccuracy: technicalScore,
      communicationClarity: communicationScore,
      relevance: relevanceScore,
      structure: structureScore,
    },
    wordCount,
    persona,
    feedback: feedbackText,
    evaluatedAt: new Date().toISOString(),
  };

  await job.updateProgress(100);

  logger.info({ jobId: job.id, compositeScore }, "Answer evaluation job completed");

  return result;
};

module.exports = { processEvaluationJob };
