const { Queue } = require("bullmq");
const crypto = require("crypto");
const { getBullMQConnectionOptions, isRedisConnected } = require("../config/redis");
const logger = require("../utils/logger");
const { processEvaluationJob } = require("../workers/evaluationWorker");
const { processReportJob } = require("../workers/reportWorker");
const { processAnalyticsJob } = require("../workers/analyticsWorker");

const QUEUE_NAMES = {
  EVALUATION: "evaluation-queue",
  REPORT: "report-queue",
  ANALYTICS: "analytics-queue",
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: {
    count: 100,
    age: 3600, // 1 hour
  },
  removeOnFail: {
    count: 500, // Keep failed jobs longer for debugging
  },
};

/**
 * In-memory fallback job runner for test/offline environments
 */
class MemoryQueueRunner {
  constructor() {
    this.jobs = new Map();
  }

  async addJob(queueName, jobName, data, processor) {
    const id = `mem-${crypto.randomUUID()}`;
    const jobRecord = {
      id,
      queueName,
      name: jobName,
      data,
      state: "active",
      progress: 0,
      returnvalue: null,
      failedReason: null,
      timestamp: Date.now(),
    };

    this.jobs.set(`${queueName}:${id}`, jobRecord);

    const mockJob = {
      id,
      name: jobName,
      data,
      updateProgress: async (p) => {
        jobRecord.progress = p;
      },
    };

    // Execute asynchronously
    setImmediate(async () => {
      try {
        const result = await processor(mockJob);
        jobRecord.state = "completed";
        jobRecord.progress = 100;
        jobRecord.returnvalue = result;
      } catch (err) {
        jobRecord.state = "failed";
        jobRecord.failedReason = err.message;
      }
    });

    return { id, name: jobName, data };
  }

  getJob(queueName, id) {
    return this.jobs.get(`${queueName}:${id}`) || null;
  }

  getMetrics() {
    let waiting = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.state === "active") active++;
      else if (job.state === "completed") completed++;
      else if (job.state === "failed") failed++;
      else waiting++;
    }

    return { waiting, active, completed, failed, total: this.jobs.size };
  }

  clear() {
    this.jobs.clear();
  }
}

const memoryRunner = new MemoryQueueRunner();

class QueueService {
  constructor() {
    this.queues = {};
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    if (isRedisConnected()) {
      try {
        const connection = getBullMQConnectionOptions();

        this.queues[QUEUE_NAMES.EVALUATION] = new Queue(QUEUE_NAMES.EVALUATION, {
          connection,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        });

        this.queues[QUEUE_NAMES.REPORT] = new Queue(QUEUE_NAMES.REPORT, {
          connection,
          defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
        });

        this.queues[QUEUE_NAMES.ANALYTICS] = new Queue(QUEUE_NAMES.ANALYTICS, {
          connection,
          defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
        });

        this.isInitialized = true;
        logger.info("BullMQ queues initialized with Redis backend");
      } catch (err) {
        logger.warn({ err: err.message }, "BullMQ queue initialization failed; using in-memory queue fallback");
      }
    } else {
      logger.info("Redis is offline; BullMQ operates in resilient in-memory mode");
    }
  }

  /**
   * Dispatches evaluation job
   */
  async addEvaluationJob(data, options = {}) {
    if (isRedisConnected()) {
      this.init();
      if (this.queues[QUEUE_NAMES.EVALUATION]) {
        try {
          return await this.queues[QUEUE_NAMES.EVALUATION].add("evaluateAnswer", data, options);
        } catch (err) {
          logger.warn({ err: err.message }, "BullMQ add evaluation job error, using in-memory runner");
        }
      }
    }
    return memoryRunner.addJob(QUEUE_NAMES.EVALUATION, "evaluateAnswer", data, processEvaluationJob);
  }

  /**
   * Dispatches report generation job
   */
  async addReportJob(data, options = {}) {
    if (isRedisConnected()) {
      this.init();
      if (this.queues[QUEUE_NAMES.REPORT]) {
        try {
          return await this.queues[QUEUE_NAMES.REPORT].add("generateReport", data, options);
        } catch (err) {
          logger.warn({ err: err.message }, "BullMQ add report job error, using in-memory runner");
        }
      }
    }
    return memoryRunner.addJob(QUEUE_NAMES.REPORT, "generateReport", data, processReportJob);
  }

  /**
   * Dispatches analytics aggregation job
   */
  async addAnalyticsJob(data, options = {}) {
    if (isRedisConnected()) {
      this.init();
      if (this.queues[QUEUE_NAMES.ANALYTICS]) {
        try {
          return await this.queues[QUEUE_NAMES.ANALYTICS].add("updateAnalytics", data, options);
        } catch (err) {
          logger.warn({ err: err.message }, "BullMQ add analytics job error, using in-memory runner");
        }
      }
    }
    return memoryRunner.addJob(QUEUE_NAMES.ANALYTICS, "updateAnalytics", data, processAnalyticsJob);
  }

  /**
   * Fetches job status across Redis or memory fallback
   */
  async getJobStatus(queueName, jobId) {
    if (isRedisConnected() && this.queues[queueName]) {
      try {
        const job = await this.queues[queueName].getJob(jobId);
        if (job) {
          const state = await job.getState();
          return {
            id: job.id,
            queueName,
            name: job.name,
            state,
            progress: job.progress || 0,
            returnvalue: job.returnvalue || null,
            failedReason: job.failedReason || null,
            data: {
              sessionId: job.data.sessionId,
              userId: job.data.userId,
            },
          };
        }
      } catch (err) {
        logger.warn({ queueName, jobId, err: err.message }, "Error fetching BullMQ job status");
      }
    }

    const memJob = memoryRunner.getJob(queueName, jobId);
    if (memJob) {
      return {
        id: memJob.id,
        queueName: memJob.queueName,
        name: memJob.name,
        state: memJob.state,
        progress: memJob.progress,
        returnvalue: memJob.returnvalue,
        failedReason: memJob.failedReason,
        data: {
          sessionId: memJob.data.sessionId,
          userId: memJob.data.userId,
        },
      };
    }

    return null;
  }

  /**
   * Health metrics across all queues
   */
  async getQueuesMetrics() {
    if (isRedisConnected() && this.isInitialized) {
      const metrics = {};
      for (const [name, queue] of Object.entries(this.queues)) {
        try {
          const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
          metrics[name] = counts;
        } catch (err) {
          metrics[name] = { error: err.message };
        }
      }
      return { isRedisBacked: true, queues: metrics };
    }

    return {
      isRedisBacked: false,
      memoryMetrics: memoryRunner.getMetrics(),
    };
  }

  /**
   * Cleanly close queue connections on shutdown
   */
  async closeQueues() {
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        await queue.close();
        logger.info({ queue: name }, "Queue closed cleanly");
      } catch (err) {
        logger.warn({ queue: name, err: err.message }, "Error closing queue");
      }
    }
    this.queues = {};
    this.isInitialized = false;
  }

  clearMemoryRunner() {
    memoryRunner.clear();
  }
}

module.exports = new QueueService();
module.exports.QUEUE_NAMES = QUEUE_NAMES;
