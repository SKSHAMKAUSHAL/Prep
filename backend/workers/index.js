const { Worker } = require("bullmq");
const { getBullMQConnectionOptions, isRedisConnected } = require("../config/redis");
const { QUEUE_NAMES } = require("../queues");
const { processEvaluationJob } = require("./evaluationWorker");
const { processReportJob } = require("./reportWorker");
const { processAnalyticsJob } = require("./analyticsWorker");
const logger = require("../utils/logger");

let workers = {};

const createWorker = (queueName, processor, concurrency = 5) => {
  const connection = getBullMQConnectionOptions();

  const worker = new Worker(queueName, processor, {
    connection,
    concurrency,
    limiter: {
      max: 20,
      duration: 1000,
    },
  });

  worker.on("completed", (job) => {
    logger.info({ queueName, jobId: job.id }, "Job completed successfully");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { queueName, jobId: job ? job.id : "unknown", error: err.message },
      "Job failed execution"
    );
  });

  worker.on("error", (err) => {
    logger.warn({ queueName, error: err.message }, "Worker encountered connection issue");
  });

  return worker;
};

const startWorkers = () => {
  if (!isRedisConnected()) {
    logger.info("Redis is offline; BullMQ workers not started in Redis mode (in-memory runner is active)");
    return workers;
  }

  try {
    workers.evaluation = createWorker(QUEUE_NAMES.EVALUATION, processEvaluationJob, 5);
    workers.report = createWorker(QUEUE_NAMES.REPORT, processReportJob, 2);
    workers.analytics = createWorker(QUEUE_NAMES.ANALYTICS, processAnalyticsJob, 10);

    logger.info("BullMQ background workers started successfully (evaluation, report, analytics)");
    return workers;
  } catch (err) {
    logger.error({ err: err.message }, "Failed to start BullMQ workers");
    return workers;
  }
};

const stopWorkers = async () => {
  logger.info("Gracefully stopping BullMQ workers...");
  for (const [name, worker] of Object.entries(workers)) {
    try {
      await worker.close();
      logger.info({ worker: name }, "Worker closed cleanly");
    } catch (err) {
      logger.warn({ worker: name, err: err.message }, "Error closing worker");
    }
  }
  workers = {};
};

// If run directly via `node workers/index.js`
if (require.main === module) {
  require("dotenv").config();
  const { connectRedis } = require("../config/redis");
  connectRedis().then(() => {
    startWorkers();
    logger.info("Standalone worker process running. Press Ctrl+C to terminate.");
  });

  process.on("SIGTERM", async () => {
    await stopWorkers();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await stopWorkers();
    process.exit(0);
  });
}

module.exports = {
  startWorkers,
  stopWorkers,
};
