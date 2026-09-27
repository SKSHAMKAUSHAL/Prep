const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const addQuestionsSchema = {
  body: z.object({
    sessionId: z.string().regex(objectIdRegex, "Invalid session ID format"),
    questions: z
      .array(
        z.object({
          question: z.string().trim().min(1, "Question text cannot be empty"),
          answer: z.string().optional().default(""),
        })
      )
      .min(1, "At least one question is required"),
  }),
};

const questionIdParamSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid question ID format"),
  }),
};

const updateNoteSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid question ID format"),
  }),
  body: z.object({
    note: z.string().max(5000, "Note exceeds maximum length of 5000 characters").optional().default(""),
  }),
};

module.exports = {
  addQuestionsSchema,
  questionIdParamSchema,
  updateNoteSchema,
};
