const { z } = require("zod");

const registerSchema = {
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    profileImageUrl: z.string().optional().nullable(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
};

const googleLoginSchema = {
  body: z.object({
    token: z
      .string({ required_error: "Google token is required" })
      .trim()
      .min(10, "Invalid Google token provided"),
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    profileImageUrl: z.string().optional().nullable(),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  updateProfileSchema,
};
