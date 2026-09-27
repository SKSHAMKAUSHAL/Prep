const ragService = require("../services/ragService");
const logger = require("../utils/logger");

/**
 * Search system design evaluation rubrics via vector search
 */
const searchRubrics = async (req, res, next) => {
  try {
    const { q, query, role, topic, limit } = req.query;
    const searchQuery = query || q || "";

    const results = await ragService.searchRubrics({
      query: searchQuery,
      role,
      topic,
      limit: limit ? parseInt(limit, 10) : 3,
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error({ error: error.message }, "Error searching RAG rubrics");
    next(error);
  }
};

/**
 * Get RAG engine health and vector indexing status
 */
const getStatus = async (req, res, next) => {
  try {
    const status = await ragService.getRAGStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchRubrics,
  getStatus,
};
