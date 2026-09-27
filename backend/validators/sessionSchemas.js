const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createSessionSchema = {
  body: z.object({
    role: z
      .string({ required_error: "Role is required" })
      .trim()
      .min(2, "Role must be at least 2 characters")
      .max(100, "Role must be at most 100 characters"),
    experience: z.coerce
      .number({ required_error: "Experience is required" })
      .min(0, "Experience cannot be negative")
      .max(50, "Experience exceeds realistic range"),
    topicsToFocus: z.union([
      z.array(z.string().trim().min(1)).min(1, "At least one topic is required"),
      z.string().trim().min(1, "Topic cannot be empty"),
    ]),
    description: z.string().trim().max(1000).optional().default(""),
    questions: z
      .array(
        z.object({
          question: z.string().trim().min(1, "Question text cannot be empty"),
          answer: z.string().optional().default(""),
        })
      )
      .min(1, "At least one question is required for the session"),
  }),
};

const sessionIdParamSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid session ID format"),
  }),
};

const saveAttemptSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid session ID format"),
  }),
  body: z.object({
    history: z.array(z.any()).optional().default([]),
    persona: z.string().optional().default("balanced"),
    duration: z.coerce.number().min(0).optional().default(0),
  }),
};

const updateLiveStateSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid session ID format"),
  }),
  body: z.object({
    currentQuestionIndex: z.coerce.number().int().min(0).optional(),
    currentPhase: z.enum(["intro", "technical", "behavioral", "closing"]).optional(),
    agentState: z.enum(["interviewer", "evaluator", "moderator"]).optional(),
    elapsedSeconds: z.coerce.number().int().min(0).optional(),
    questionHistory: z.array(z.any()).optional(),
    interruptionCount: z.coerce.number().int().min(0).optional(),
    status: z.enum(["active", "paused", "completed"]).optional(),
  }),
};

const jobStatusParamSchema = {
  params: z.object({
    queueName: z.enum(["evaluation-queue", "report-queue", "analytics-queue"], {
      errorMap: () => ({ message: "Invalid queue name" }),
    }),
    jobId: z.string().trim().min(1, "Job ID cannot be empty").max(100),
  }),
};

module.exports = {
  createSessionSchema,
  sessionIdParamSchema,
  saveAttemptSchema,
  updateLiveStateSchema,
  jobStatusParamSchema,
};
