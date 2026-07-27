const Groq = require("groq-sdk");
const Session = require("../models/Session");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../../backend/utils/prompts");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const rawText = response.choices[0].message.content;

    const cleanedText = rawText
      .replace(/^\s*```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const data = JSON.parse(cleanedText);

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

    const prompt = `Provide the explanation as valid JSON like this:\n\`\`\`json\n{\n  "explanation": "Your answer here"\n}\n\`\`\`\n\nQuestion: ${question}`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const rawText = response.choices[0].message.content;

    console.log("RAW:", rawText);

    const cleanedText = rawText
      .replace(/```json\s*/i, "")
      .replace(/```/g, "")
      .trim();


    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
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

    const personaInstruction = persona === "strict" 
      ? "You are a strict technical interviewer. Your feedback should be direct, challenging, and focus heavily on edge cases."
      : persona === "friendly"
      ? "You are a friendly HR recruiter. Your feedback should be encouraging, warm, and focus on communication style."
      : "You are a balanced professional interviewer. Provide constructive, balanced feedback.";

    const prompt = `
      ${personaInstruction}
      Evaluate the candidate's response to the interview question below.

      --- INTERVIEW CONTEXT ---
      ${sessionContext || "General technical interview."}

      --- PAST INTERACTION HISTORY ---
      ${historyContext || "This is the first question in the interview."}

      --- CURRENT QUESTION ---
      Question: "${question}"

      --- CANDIDATE'S ANSWER TO EVALUATE ---
      User's Answer: "${userAnswer}"

      --- CORE OBJECTIVES ---
      1. **INTELLIGENT EVALUATION**: 
         - Evaluate the candidate's understanding of the concept. Do NOT search for rigid keyword matches.
         - Award credit if they understand the concepts and explain it accurately in their own terms (even with informal phrasing or analogies).
         - Award a score (0 to 10).
         - CRITICAL RULE: If the answer is blank, extremely short/brief, indicates they do not know the answer (e.g., "I don't know", "no idea", "skip"), or is completely irrelevant, you MUST award a score of EXACTLY 0.
         - Score confidenceScore between 0 and 100 based on their level of certainty. If they skip or don't know, this MUST be EXACTLY 0.
         - Generate constructive sentiment analysis, an industry-standard benchmark answer, and bulleted key differences.

      2. **DYNAMIC ADAPTIVE NEXT QUESTION GENERATION**:
         - Generate a completely dynamic and customized next question (\`nextDynamicQuestion\`) based on the candidate's performance on the current question:
           - **High Performance (Score >= 7)**: Acknowledge their strong answer in the spoken feedback, and generate a *more advanced*, conceptually deeper, or harder question (e.g., system design considerations, edge cases, advanced features) within the target topics.
           - **Low Performance (Score <= 4)**: Constructively support them in the spoken feedback, and generate a *simpler / easier / more fundamental* question to test core concepts and help them build confidence.
           - **Average Performance (Score 5-6)**: Acknowledge their correct baseline knowledge and ask a *medium-difficulty* question on a different aspect of the target topics.
         - **STRICT CONSTRAINT**: Never repeat questions or ask the same concept twice. Ensure the question remains aligned with the target role and experience.

      Provide your evaluation and the dynamic next question strictly as a valid JSON object matching the following structure exactly (with no markdown wrappers in values, just clean JSON):
      {
        "spokenFeedback": "A short, highly natural conversational response (max 2 sentences) responding to the candidate's answer and giving a smooth transition directly into the next question.",
        "nextDynamicQuestion": "The dynamically generated next question for the candidate, tailored to their performance level based on the rules.",
        "evaluation": {
          "score": 8,
          "confidenceScore": 85,
          "sentiment": "e.g., 'Assertive and clear', 'Hesitant but conceptually sound'",
          "industryStandardAnswer": "A detailed example of how a senior professional would answer the current question.",
          "keyDifferences": ["Difference 1", "Difference 2"]
        }
      }
    `;

    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1536,
    });

    const rawText = response.choices[0].message.content;
    const cleanedText = rawText
      .replace(/```json\s*/i, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleanedText);
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
