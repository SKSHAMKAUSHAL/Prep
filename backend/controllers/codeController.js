const codeExecutionService = require("../services/codeExecutionService");
const logger = require("../utils/logger");

/**
 * Executes a code snippet or test suite inside the secure Firecracker MicroVM sandbox
 */
const runCode = async (req, res, next) => {
  try {
    const { code, language, input, testCases, timeoutMs, memoryLimitMb } = req.body;

    const result = await codeExecutionService.executeCode({
      code,
      language: language || "javascript",
      input,
      testCases,
      timeoutMs: timeoutMs ? Math.min(timeoutMs, 5000) : 3000,
      memoryLimitMb: memoryLimitMb ? Math.min(memoryLimitMb, 256) : 128,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.warn({ error: error.message }, "Code execution rejected or failed");
    next(error);
  }
};

/**
 * Returns security sandbox observability and virtualization metrics
 */
const getStatus = (req, res) => {
  const status = codeExecutionService.getSandboxStatus();
  res.status(200).json({
    success: true,
    data: status,
  });
};

module.exports = {
  runCode,
  getStatus,
};
