export const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GOOGLE_LOGIN: "/api/auth/google",
    GET_PROFILE: "/api/auth/profile",
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  AI: {
    GENERATE_QUESTIONS: "/api/ai/generate-questions",
    GENERATE_EXPLANATION: "/api/ai/generate-explanation",
    EVALUATE_ANSWER: "/api/ai/evaluate-answer",
  },
  SESSION: {
    CREATE: "/api/sessions/create",
    GET_ALL: "/api/sessions/my-sessions",
    GET_ONE: (id) => `/api/sessions/${id}`,
    SAVE_ATTEMPT: (id) => `/api/sessions/${id}/attempt`,
    DELETE: (id) => `/api/sessions/${id}`,
  },
  QUESTION: {
    ADD_TO_SESSION: "/api/questions/add",
    PIN: (id) => `/api/questions/${id}/pin`,
    UPDATE_NOTE: (id) => `/api/questions/${id}/note`,
  },
  RAG: {
    SEARCH: "/api/rag/search",
    STATUS: "/api/rag/status",
  },
  CODE: {
    EXECUTE: "/api/code/execute",
    STATUS: "/api/code/status",
  },
};