const Groq = require("groq-sdk");
const Session = require("../models/Session");
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
    console.warn(`Primary model (${PRIMARY_MODEL}) failed, trying fallback (${FALLBACK_MODEL}):`, error.message);
    return await client.chat.completions.create({
      model: FALLBACK_MODEL,
      ...options,
    });
  }
}

function parseJsonFromLlm(rawText) {
  if (!rawText) throw new Error("Empty response from AI");
  
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBracket = rawText.indexOf('[');
    const lastBracket = rawText.lastIndexOf(']');
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    // Try bracket substring for arrays
    if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      try {
        const sub = rawText.substring(firstBracket, lastBracket + 1);
        return JSON.parse(sub);
      } catch (err) {
        // Fall through to truncation recovery
      }
    }

    // Attempt to recover truncated JSON array (cut off at max tokens)
    if (firstBracket !== -1) {
      const lastClosedObject = rawText.lastIndexOf('}');
      if (lastClosedObject > firstBracket) {
        try {
          const repaired = rawText.substring(firstBracket, lastClosedObject + 1) + ']';
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

    throw e;
  }
}

const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const count = Math.min(Math.max(parseInt(numberOfQuestions, 10) || 5, 1), 15);

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      count
    );

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawText = response.choices[0].message.content;
    const data = parseJsonFromLlm(rawText);

    res.status(200).json(data);
  } catch (error) {
    console.error("GENERATION ERROR:", error);
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const prompt = conceptExplainPrompt(question);

    const response = await createChatCompletion({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawText = response.choices[0].message.content;
    const data = parseJsonFromLlm(rawText);

    res.status(200).json(data);
  } catch (error) {
    console.error("EXPLANATION ERROR:", error);
    res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};

const evaluateLiveAnswer = async (req, res) => {
  try {
    const { question, userAnswer, persona, sessionId, history } = req.body;
    if (!question || userAnswer === undefined) {
      return res.status(400).json({ message: "Question and userAnswer are required" });
    }

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
      historyContext = history.map((item, idx) => `
- Question ${idx + 1}: "${item.question}"
  User's Answer: "${item.userAnswer || "No answer provided"}"
  Score: ${item.evaluation?.score !== undefined ? `${item.evaluation.score}/10` : "Unevaluated"}
      `.trim()).join("\n");
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
    
    res.status(200).json(data);
  } catch (error) {
    console.error("EVALUATION ERROR:", error);
    res.status(500).json({
      message: "Failed to evaluate answer",
      error: error.message,
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation, evaluateLiveAnswer };
