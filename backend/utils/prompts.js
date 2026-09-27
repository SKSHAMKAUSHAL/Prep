const questionAnswerPrompt = (
  role,
  experience,
  topicsToFocus,
  numberOfQuestions
) => {
  const isHr = /hr|human resource|behavioral|culture|leadership|recruiter|people/i.test(
    `${role} ${topicsToFocus}`
  );

  const contextGuide = isHr
    ? `You are an executive HR Director and Talent Acquisition Lead.
Generate realistic, modern behavioral and situational interview questions using the STAR framework (Situation, Task, Action, Result), leadership principles, conflict resolution, work ethic, and culture fit.`
    : `You are a Principal Software Architect and Staff Technical Interviewer at top-tier tech companies.
Generate deep, production-grade technical interview questions covering architecture, distributed systems, edge-cases, performance optimization, and practical software design.`;

  const exampleBlock = isHr
    ? `
### Few-Shot Example 1:
{
  "question": "Tell me about a time you had a fundamental technical disagreement with a team member or lead. How did you handle it?",
  "answer": "A structured answer should follow the STAR format: Explain the context and technical disagreement without placing blame, detail how you gathered empirical data or ran a proof-of-concept rather than arguing opinions, describe finding a consensus-driven compromise, and highlight the successful project delivery and preserved relationship."
}
### Few-Shot Example 2:
{
  "question": "Describe a scenario where you faced a tight production deadline with shifting business priorities. What trade-offs did you make?",
  "answer": "Demonstrate proactive stakeholder communication: identify non-negotiable MVP deliverables vs deferrable technical debt, align with the product manager on priority sequencing, protect team velocity without burning out, and establish post-launch refactoring tickets."
}`
    : `
### Few-Shot Example 1:
{
  "question": "How does PostgreSQL implement Multi-Version Concurrency Control (MVCC), and what are the operational implications of write amplification and VACUUM?",
  "answer": "Postgres MVCC creates a new tuple version on UPDATE instead of in-place mutation, recording xmin and xmax transaction IDs on each row header. While this allows readers to never block writers and writers to never block readers, it creates dead tuples on frequently updated tables. Autovacuum must reclaim this dead row space and prevent transaction ID wraparound; failure to tune vacuum parameters can lead to table bloat and degraded sequential scans."
}
### Few-Shot Example 2:
{
  "question": "In React 18, how does the Fiber reconciler prioritize updates, and how does Concurrent Mode avoid blocking the main thread during heavy re-renders?",
  "answer": "React Fiber represents components as a linked-list work-in-progress tree with lanes-based bitmask priorities. Under Concurrent Mode, React uses cooperative multitasking via MessageChannel scheduler to yield execution back to the browser every 5ms if higher-priority input events occur, discarding or pausing low-priority render passes until idle time."
}`;

  return `
${contextGuide}

Task Requirements:
- Target Role: ${role}
- Candidate Experience: ${experience} years
- Focus Topics: ${topicsToFocus}
- Generate exactly ${numberOfQuestions} distinct, realistic, high-impact interview questions.
- For each question, provide a comprehensive, technically authoritative model answer (3-5 sentences with concrete technical/behavioral depth).
- Never return trivial or generic surface-level questions.
- Keep formatting clean. Do NOT include markdown wrappers like \`\`\`json.
- Output strictly a valid JSON array matching this format:

${exampleBlock}

Output JSON Array:
[
  {
    "question": "Clear, deep interview question?",
    "answer": "Authoritative, insightful answer."
  }
]
`;
};

const conceptExplainPrompt = (question) => `
You are an elite Principal Software Architect and Master Technical Interview Coach.
Explain the following interview question with extraordinary clarity, structured as an interactive Cheat Sheet and Masterclass Guide.

Question: "${question}"

Provide your output strictly as a JSON object with:
1. "title": A punchy, crystal-clear 3-7 word title summarizing the core concept.
2. "summary": A 2-sentence executive summary / mental model (the "TL;DR").
3. "keyPoints": An array of 3-5 high-impact bullet points for quick memory recall (the "Cheat Sheet").
4. "explanation": A beautifully formatted, comprehensive Markdown guide containing:
   - ### 📌 Core Concept & Architecture
     Explain the fundamentals with intuitive analogies and step-by-step breakdown.
   - ### ⚡ Key Trade-offs & Comparisons
     Include a clear Markdown table or structured comparison bullets (e.g. Pros vs Cons, Throughput vs Latency, Time vs Space complexity).
   - ### 💻 Code / Implementation Pattern
     A clean, practical, and commented code snippet demonstrating the best-practice implementation.
   - ### 🎯 Interview Pro-Tips & Common Pitfalls
     What top tech interviewers look for, key edge-cases to mention, and common candidate mistakes to avoid.

Do NOT include markdown syntax like \`\`\`json or \`\`\` around the JSON.
Do NOT include any extra text before or after the JSON.
Output ONLY a valid JSON object matching this structure:
{
  "title": "Short title here",
  "summary": "2-sentence quick summary here.",
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "explanation": "Full rich markdown here"
}
`;

const evaluateAnswerPrompt = ({
  persona,
  sessionContext,
  historyContext,
  question,
  userAnswer,
}) => {
  let personaInstruction = "You are a balanced professional interviewer. Provide constructive, balanced feedback.";
  if (persona === "strict" || persona === "system_design" || persona === "coding") {
    personaInstruction = "You are a strict technical interviewer. Your feedback should be direct, challenging, and focus heavily on scalability, algorithmic complexity, and edge cases.";
  } else if (persona === "friendly" || persona === "hr" || persona === "behavioral") {
    personaInstruction = "You are an empathetic HR Director and behavioral assessor. Your feedback should focus on communication structure (STAR), emotional intelligence, ownership, and collaborative clarity.";
  }

  return `
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
       - Evaluate understanding of the concept. Do NOT search for rigid keyword matches.
       - Award credit if they understand the concepts and explain it accurately in their own terms (even with informal phrasing or analogies).
       - Award a score (0 to 10).
       - CRITICAL RULE: If the answer is blank, extremely short/brief, indicates they do not know the answer (e.g., "I don't know", "no idea", "skip"), or is completely irrelevant, you MUST award a score of EXACTLY 0.
       - Score confidenceScore between 0 and 100 based on their level of certainty. If they skip or don't know, this MUST be EXACTLY 0.
       - Generate constructive sentiment analysis, an industry-standard benchmark answer, and bulleted key differences.

    2. **DYNAMIC ADAPTIVE NEXT QUESTION GENERATION**:
       - Generate a completely dynamic and customized next question (\`nextDynamicQuestion\`) based on candidate performance:
         - **High Performance (Score >= 7)**: Acknowledge their strong answer in spokenFeedback, and generate a *more advanced*, conceptually deeper question within the topics.
         - **Low Performance (Score <= 4)**: Constructively support them in spokenFeedback, and generate a *simpler / foundational* question to test core concepts and help them build confidence.
         - **Average Performance (Score 5-6)**: Acknowledge baseline knowledge and ask a *medium-difficulty* question on a different aspect.
       - **STRICT CONSTRAINT**: Never repeat questions or ask the same concept twice. Ensure the question remains aligned with the target role and experience.

    Provide evaluation strictly as a valid JSON object:
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
};

/**
 * Prompt for interactive chat inside Learn More Drawer with full track context
 */
const questionChatPrompt = ({
  question,
  answer,
  role,
  experience,
  topicsToFocus,
  chatHistory,
  userMessage,
}) => `
You are a Staff Software Engineer & Dedicated Interview Mentor assisting a candidate preparing for the role of ${role || "Software Engineer"} (${experience || "3"} years experience).

Focus Topics: ${topicsToFocus || "Technical interview preparation"}

Current Question Under Study:
"${question}"

Official Model Answer / Reference:
"${answer}"

${chatHistory && chatHistory.length > 0 ? `
Conversation History:
${chatHistory.map((m) => `${m.role === "user" ? "Candidate" : "Mentor"}: ${m.content}`).join("\n")}
` : ""}

Candidate's Follow-up Query:
"${userMessage}"

Mentor Instructions:
- Answer with deep technical precision, clarity, and an encouraging tone.
- Directly answer the candidate's question in relation to the current topic and target role.
- Provide concrete code examples, ASCII architecture diagrams, or step-by-step bullet points where helpful.
- Highlight how to present this concept effectively to a real human interviewer.
- Keep the response structured with Markdown headers and bullet points.
`;

/**
 * Prompt for the dedicated Doubt Solver page
 */
const doubtSolverPrompt = ({ userQuery, chatHistory, userRole }) => `
You are an elite Principal Engineer and Technical Interview Architect powering the Nitro Doubt Solver.
Your mission is to provide deeply impressive, authoritative, and actionable solutions to the candidate's coding, architectural, algorithm, or behavioral interview doubts.

${userRole ? `Candidate Background / Target Role: ${userRole}` : ""}

${chatHistory && chatHistory.length > 0 ? `
Conversation History:
${chatHistory.map((m) => `${m.role === "user" ? "User" : "Doubt Solver"}: ${m.content}`).join("\n")}
` : ""}

Candidate Doubt / Question:
"${userQuery}"

Response Guidelines:
1. **Direct Clarity First**: Start with a concise, authoritative 1-2 sentence direct answer or diagnosis.
2. **Deep Dive & Mental Model**: Break down the root cause or underlying architecture with intuitive explanations.
3. **Clean Code & Practical Implementation**: If applicable, provide production-grade, cleanly commented code with time & space complexity.
4. **Interview Edge & Pitfalls**: Detail what top interviewers look for and common pitfalls candidates make.
5. Format with rich Markdown: headings (###), code blocks with syntax highlighting, bullet points, and bold key terms.
`;

module.exports = {
  questionAnswerPrompt,
  conceptExplainPrompt,
  evaluateAnswerPrompt,
  questionChatPrompt,
  doubtSolverPrompt,
};
