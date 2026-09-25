const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const generateQuestionsSchema = {
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
    numberOfQuestions: z.coerce
      .number({ required_error: "Number of questions is required" })
      .int()
      .min(1, "At least 1 question is required")
      .max(15, "Maximum 15 questions can be generated at once")
      .default(5),
  }),
};

const conceptExplanationSchema = {
  body: z.object({
    question: z
      .string({ required_error: "Question is required" })
      .trim()
      .min(2, "Question must be at least 2 characters")
      .max(2000, "Question is too long"),
  }),
};

const evaluateLiveAnswerSchema = {
  body: z.object({
    question: z
      .string({ required_error: "Question is required" })
      .trim()
      .min(1, "Question cannot be empty"),
    userAnswer: z.string({ required_error: "userAnswer is required" }),
    persona: z.string().optional().default("balanced"),
    sessionId: z
      .string()
      .regex(objectIdRegex, "Invalid session ID format")
      .optional()
      .nullable(),
    history: z
      .array(
        z.object({
          question: z.string().optional(),
          userAnswer: z.string().optional(),
          evaluation: z.any().optional(),
        })
      )
      .optional()
      .default([]),
  }),
};

module.exports = {
  generateQuestionsSchema,
  conceptExplanationSchema,
  evaluateLiveAnswerSchema,
};
