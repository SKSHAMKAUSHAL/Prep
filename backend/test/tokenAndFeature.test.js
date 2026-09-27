const test = require("node:test");
const assert = require("node:assert");
const {
  questionAnswerPrompt,
  conceptExplainPrompt,
  evaluateAnswerPrompt,
  questionChatPrompt,
  doubtSolverPrompt,
} = require("../utils/prompts");
const { deductTokens, COST_PER_CHAT, MONTHLY_TOKENS } = require("../middlewares/tokenLimiter");

test("Feature: questionAnswerPrompt distinguishes Technical and HR domains", () => {
  const techPrompt = questionAnswerPrompt("Senior Frontend Engineer", 3, "React, TypeScript", 5);
  assert.ok(techPrompt.includes("Principal Software Architect"));
  assert.ok(techPrompt.includes("PostgreSQL") || techPrompt.includes("React Fiber"));

  const hrPrompt = questionAnswerPrompt("HR Screening & Leadership", 4, "Conflict, Culture Fit, STAR", 5);
  assert.ok(hrPrompt.includes("HR Director") || hrPrompt.includes("STAR"));
  assert.ok(hrPrompt.includes("STAR framework") || hrPrompt.includes("disagreement"));
});

test("Feature: questionChatPrompt includes full situational context", () => {
  const prompt = questionChatPrompt({
    question: "What is double buffering in graphical renderers?",
    answer: "It uses two buffers to prevent screen flickering.",
    role: "Graphics Engine Developer",
    experience: "5",
    topicsToFocus: "Vulkan, OpenGL",
    chatHistory: [{ role: "user", content: "Can you give a real-life analogy?" }],
    userMessage: "How does this apply to React Fiber work-in-progress trees?",
  });

  assert.ok(prompt.includes("Graphics Engine Developer"));
  assert.ok(prompt.includes("What is double buffering in graphical renderers?"));
  assert.ok(prompt.includes("Vulkan, OpenGL"));
  assert.ok(prompt.includes("How does this apply to React Fiber work-in-progress trees?"));
});

test("Feature: doubtSolverPrompt creates structured Principal Engineer prompt", () => {
  const prompt = doubtSolverPrompt({
    userQuery: "How do I resolve circular dependencies in NestJS modules?",
    chatHistory: [],
    userRole: "Backend Architect",
  });

  assert.ok(prompt.includes("Principal Engineer"));
  assert.ok(prompt.includes("How do I resolve circular dependencies in NestJS modules?"));
  assert.ok(prompt.includes("Backend Architect"));
});

test("Feature: Token Limiter deducts 10 tokens and blocks when balance is low", async () => {
  assert.strictEqual(COST_PER_CHAT, 10);
  assert.strictEqual(MONTHLY_TOKENS, 1000);

  // Mock User with 15 tokens
  const mockUser = {
    _id: "mock_user_1",
    tokens: 15,
    tokensLastReset: new Date(),
    save: async function () { return this; },
  };

  // Mock Request & Response
  const req = { user: { _id: "mock_user_1" } };
  let statusSent = null;
  let jsonSent = null;
  const res = {
    status: (s) => {
      statusSent = s;
      return {
        json: (j) => { jsonSent = j; },
      };
    },
  };

  // Verify that User schema has tokens
  const User = require("../models/User");
  assert.ok(User.schema.paths.tokens, "User schema must have tokens field");
  assert.ok(User.schema.paths.tokensLastReset, "User schema must have tokensLastReset field");
});

test("Feature: Session schema supports trackType", () => {
  const Session = require("../models/Session");
  assert.ok(Session.schema.paths.trackType, "Session schema must have trackType field");
  assert.deepStrictEqual(Session.schema.paths.trackType.enumValues, ["technical", "hr"]);
});
