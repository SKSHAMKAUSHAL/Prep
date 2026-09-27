const Groq = require("groq-sdk");
const logger = require("../utils/logger");

let groqClient = null;
const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("your_groq")) {
    try {
      groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    } catch (e) {
      logger.warn({ error: e.message }, "Could not instantiate Groq client");
    }
  }
  return groqClient;
};

const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "qwen/qwen3.8-27b";

/**
 * Builds conversational interviewer prompt for streaming responses
 */
const buildInterviewerPrompt = ({ question, userAnswer, persona = "balanced", role = "Software Engineer" }) => {
  let personaInstruction = "";
  if (persona === "tough") {
    personaInstruction =
      "You are a rigorous, demanding Staff Engineer conducting a high-stakes technical interview. Challenge assumptions, probe for architectural trade-offs, and expect deep technical clarity.";
  } else if (persona === "friendly") {
    personaInstruction =
      "You are an encouraging, supportive engineering mentor conducting a technical mock interview. Be warm, constructive, and help the candidate build confidence while keeping technical rigor.";
  } else {
    personaInstruction =
      "You are a seasoned, professional engineering hiring manager. Balance technical depth with conversational engagement and clear real-world evaluation.";
  }

  return `
${personaInstruction}

Interview Context:
- Target Role: ${role}
- Current Question: "${question}"
- Candidate's Answer: "${userAnswer || "I'm thinking about how to approach this..."}"

Instructions:
1. Provide a natural, conversational response as the interviewer (2-4 sentences max).
2. Briefly acknowledge their response, validate their thinking or probe a specific edge case, and either ask a relevant follow-up or transition smoothly to the next point.
3. Speak directly to the candidate in second person ("you"). Do NOT output JSON or markdown headers; output only the natural spoken words of the interviewer.
`.trim();
};

/**
 * Fallback simulated token streamer for test and offline environments
 */
const streamSimulatedResponse = async ({ question, userAnswer, persona, onToken, signal }) => {
  const simulatedWords = [
    "Thank",
    " you",
    " for",
    " that",
    " explanation.",
    " You",
    " touched",
    " on",
    " the",
    " fundamental",
    " trade-offs",
    " nicely.",
    " How",
    " would",
    " your",
    " architecture",
    " handle",
    " sudden",
    " throughput",
    " spikes",
    " or",
    " network",
    " partition",
    " failures?",
  ];

  let fullText = "";

  for (let i = 0; i < simulatedWords.length; i++) {
    if (signal && signal.aborted) {
      logger.info("Simulated AI streaming response interrupted by candidate barge-in");
      return { fullText, interrupted: true };
    }

    const word = simulatedWords[i];
    fullText += word;
    if (onToken) {
      onToken(word, i === 0);
    }

    // Brief delay to simulate realistic voice token generation cadence (20ms)
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  return { fullText, interrupted: false };
};

/**
 * Stream interview AI response token-by-token
 */
const streamInterviewResponse = async ({
  question,
  userAnswer,
  persona = "balanced",
  role = "Software Engineer",
  onToken,
  signal,
}) => {
  const client = getGroqClient();

  if (!client || process.env.NODE_ENV === "test") {
    // Resilient simulated stream when Groq is offline or during testing
    return streamSimulatedResponse({ question, userAnswer, persona, onToken, signal });
  }

  const prompt = buildInterviewerPrompt({ question, userAnswer, persona, role });
  let fullText = "";
  let isFirstToken = true;

  try {
    const stream = await client.chat.completions.create(
      {
        model: PRIMARY_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 300,
      },
      { signal }
    );

    for await (const chunk of stream) {
      if (signal && signal.aborted) {
        logger.info("Groq streaming aborted by client interruption");
        return { fullText, interrupted: true };
      }

      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        if (onToken) {
          onToken(content, isFirstToken);
          isFirstToken = false;
        }
      }
    }

    return { fullText, interrupted: false };
  } catch (err) {
    if (signal && signal.aborted) {
      return { fullText, interrupted: true };
    }

    logger.warn({ error: err.message }, "Primary streaming model failed; falling back to simulated stream");
    return streamSimulatedResponse({ question, userAnswer, persona, onToken, signal });
  }
};

const getLangGraphServiceUrl = () => process.env.LANGGRAPH_SERVICE_URL || "http://localhost:8001";

/**
 * Initiates an interview state machine session via LangGraph microservice
 */
const startLangGraphSession = async ({
  sessionId,
  userId,
  role = "Full Stack Engineer",
  experience = 3,
  topics = ["System Design", "Scalability"],
  persona = "balanced",
  totalQuestions = 5,
  maxDurationSeconds = 600,
}) => {
  try {
    const res = await fetch(`${getLangGraphServiceUrl()}/api/v1/interview/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        role,
        experience,
        topics,
        persona,
        total_questions: totalQuestions,
        max_duration_seconds: maxDurationSeconds,
      }),
    });
    if (!res.ok) {
      throw new Error(`LangGraph service returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    logger.warn({ error: err.message }, "LangGraph service start failed, falling back to local session");
    return null;
  }
};

/**
 * Dispatches candidate response through multi-agent LangGraph state machine
 */
const executeLangGraphTurn = async ({ threadId, userAnswer, gazeMetrics }) => {
  try {
    const res = await fetch(`${getLangGraphServiceUrl()}/api/v1/interview/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: threadId,
        user_answer: userAnswer,
        gaze_metrics: gazeMetrics,
      }),
    });
    if (!res.ok) {
      throw new Error(`LangGraph service returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    logger.warn({ error: err.message }, "LangGraph turn processing failed, falling back to local pipeline");
    return null;
  }
};

/**
 * Fetches persisted state for crash recovery
 */
const getLangGraphState = async (threadId) => {
  try {
    const res = await fetch(`${getLangGraphServiceUrl()}/api/v1/interview/state/${threadId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    logger.warn({ error: err.message }, "LangGraph state fetch failed");
    return null;
  }
};

module.exports = {
  streamInterviewResponse,
  buildInterviewerPrompt,
  startLangGraphSession,
  executeLangGraphTurn,
  getLangGraphState,
};
