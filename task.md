# Migration Task Tracker

## Phase 1: Fix Critical Bugs
- [x] Fix `rawText` undefined bug in `evaluateLiveAnswer` (aiController.js)
- [x] Change AI routes from `app.use()` to `app.post()` and group in `aiRoute.js` (server.js)
- [x] Migrate Groq model from unentitled `llama-3.3-70b-versatile` to available `openai/gpt-oss-120b` & `qwen/qwen3.8-27b` with resilient fallback and parser (aiController.js)

## Phase 2: Clean Definitely Unused Code
- [x] Delete `InterviewSession.js` model
- [x] Delete `uploadMiddleware.js`
- [x] Remove unused `express-session` import from `sessionRoute.js`
- [x] Connect `conceptExplainPrompt` with `generateConceptExplanation` and clean path in `aiController.js`
- [x] Delete unused `data.js`
- [x] Remove `.input-box` CSS class from `index.css`
- [x] Delete empty `App.css`
- [x] Remove `@google/genai` and `express-session` from `backend/package.json`

## Phase 3: Separate Five Engineering Domains
- [x] Backend: Clean modular routes (`authRoute.js`, `sessionRoute.js`, `questionRoute.js`, `aiRoute.js`)
- [x] Frontend Voice Domain: Extracted into reusable hooks (`useVoiceSTT`, `useVoiceTTS`, `useMicMeter`)
- [x] Frontend Voice UI: Extracted `AIPresence.jsx` and `SettingsPopover.jsx`

## Phase 4: Frontend Restructuring
- [x] Secure private routes with `ProtectedRoute.jsx` component in `App.jsx`
- [x] Refactor `LiveInterview.jsx` from ~931 tightly-coupled lines into clean orchestrator
- [x] Consolidate `getInitials()` in `helper.js` and remove duplicate in `ProfileInfoCard.jsx`
- [x] Fix `react-icons` imports across `LandingPage.jsx` for production builds
- [x] Complete overhaul of "Learn More" Drawer into an interactive Cheat Sheet & Deep-Dive Masterclass (`AIResponsePreview.jsx`, `Drawer.jsx`, `prompts.js`)

## Phase 5: Backend Hardening
- [x] Safe filesystem upload directory check in `authRoute.js`
- [x] Centralize AI prompt templates in `prompts.js` including `evaluateAnswerPrompt` and structured `conceptExplainPrompt`
- [x] Node syntax verification on all backend modules
- [x] Vite production build verification passing 100%
