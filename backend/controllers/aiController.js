const Groq = require("groq-sdk");
const Session = require("../models/Session");
const logger = require("../utils/logger");
const { AppError } = require("../middlewares/errorHandler");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
  evaluateAnswerPrompt,
} = require("../utils/prompts");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "qwen/qwen3.8-27b";

async function createChatCompletion(options) {
  try {
    return await client.chat.completions.create({
      model: PRIMARY_MODEL,
      ...options,
    });
  } catch (error) {
    logger.warn(
      { error: error.message, primaryModel: PRIMARY_MODEL, fallbackModel: FALLBACK_MODEL },
      `Primary model failed, trying fallback model`
    );
    return await client.chat.completions.create({
      model: FALLBACK_MODEL,
      ...options,
    });
  }
}

function parseJsonFromLlm(rawText) {
  if (!rawText) throw new AppError("Empty response received from AI model", 502);

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBracket = rawText.indexOf("[");
    const lastBracket = rawText.lastIndexOf("]");
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    // Try bracket substring for arrays
    if (
      firstBracket !== -1 &&
      lastBracket !== -1 &&
      (firstBrace === -1 || firstBracket < firstBrace)
    ) {
      try {
        const sub = rawText.substring(firstBracket, lastBracket + 1);
        return JSON.parse(sub);
      } catch (err) {
        // Fall through to truncation recovery
      }
    }

    // Attempt to recover truncated JSON array (cut off at max tokens)
    if (firstBracket !== -1) {
      const lastClosedObject = rawText.lastIndexOf("}");
      if (lastClosedObject > firstBracket) {
        try {
          const repaired = rawText.substring(firstBracket, lastClosedObject + 1) + "]";
          const data = JSON.parse(repaired);
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        } catch (repairErr) {
          // Fall through
        }
      }
    }

    // Try object substring
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        const sub = rawText.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sub);
      } catch (err) {
        // Fall through
      }
    }

    // Attempt to repair truncated object by closing open string and brace
    if (firstBrace !== -1) {
      try {
        const candidate = rawText.trim() + '"\n}';
        return JSON.parse(candidate.substring(firstBrace));
      } catch (repairErr) {
        // Fall through
      }
    }

    logger.error({ rawText }, "Failed to parse JSON response from LLM");
    throw new AppError("Failed to parse valid structured JSON from AI response", 502);
  }
}

const generateInterviewQuestions = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
    const count = Math.min(Math.max(parseInt(numberOfQuestions, 10) || 5, 1), 15);

    logger.info({ role, experience, count, reqId: req.id }, "Generating interview questions");

    const prompt = questionAnswerPrompt(role, experience, topicsToFocus, count);

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawText = response.choices[0].message.content;
    const data = parseJsonFromLlm(rawText);

    logger.info(
      { latencyMs: Date.now() - startTime, questionCount: Array.isArray(data) ? data.length : 1, reqId: req.id },
      "Interview questions generated successfully"
    );

    res.status(200).json(data);
  } catch (error) {
    logger.error({ error: error.message, latencyMs: Date.now() - startTime, reqId: req.id }, "Question generation error");
    next(error);
  }
};

const generateConceptExplanation = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { question } = req.body;

    logger.info({ questionLength: question.length, reqId: req.id }, "Generating concept explanation");

    const prompt = conceptExplainPrompt(question);

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawText = response.choices[0].message.content;
    const data = parseJsonFromLlm(rawText);

    logger.info(
      { latencyMs: Date.now() - startTime, reqId: req.id },
      "Concept explanation generated successfully"
    );

    res.status(200).json(data);
  } catch (error) {
    logger.error({ error: error.message, latencyMs: Date.now() - startTime, reqId: req.id }, "Concept explanation error");
    next(error);
  }
};

const evaluateLiveAnswer = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { question, userAnswer, persona, sessionId, history } = req.body;

    logger.info({ sessionId, persona, reqId: req.id }, "Evaluating live interview answer");

    // Fetch session details for context if provided
    let sessionContext = "";
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (session) {
        sessionContext = `
Candidate target role: ${session.role || "Software Developer"}
Target experience level: ${session.experience ? `${session.experience} years` : "General/Any"}
Key topics to focus on: ${(session.topicsToFocus || []).join(", ") || "Software development and computer science concepts"}
        `.trim();
      }
    }

    // Parse history for reference
    let historyContext = "";
    if (history && Array.isArray(history) && history.length > 0) {
      historyContext = history
        .map(
          (item, idx) => `
- Question ${idx + 1}: "${item.question}"
  User's Answer: "${item.userAnswer || "No answer provided"}"
  Score: ${item.evaluation?.score !== undefined ? `${item.evaluation.score}/10` : "Unevaluated"}
      `.trim()
        )
        .join("\n");
    }

    const prompt = evaluateAnswerPrompt({
      persona,
      sessionContext,
      historyContext,
      question,
      userAnswer,
    });

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1536,
    });

    const rawText = response.choices[0].message.content;
    const data = parseJsonFromLlm(rawText);

    logger.info(
      { latencyMs: Date.now() - startTime, score: data?.score, reqId: req.id },
      "Live answer evaluated successfully"
    );

    res.status(200).json(data);
  } catch (error) {
    logger.error({ error: error.message, latencyMs: Date.now() - startTime, reqId: req.id }, "Live answer evaluation error");
    next(error);
  }
};

module.exports = {
  generateInterviewQuestions,
  generateConceptExplanation,
  evaluateLiveAnswer,
};
