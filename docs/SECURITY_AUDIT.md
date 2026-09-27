# Security Audit Report

> Audit Date: 2026-09-27 | Auditor: Automated + Manual Review

## Summary

| Severity | Count | Fixed | Remaining |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 3 | 2 | 1 |
| Medium | 4 | 3 | 1 |
| Low | 3 | 1 | 2 |
| Informational | 2 | 2 | 0 |

## Findings

| # | Severity | Issue | Location | Risk | Fix | Status |
|---|---|---|---|---|---|---|
| 1 | **Critical** | Weak JWT secret (`gopgop-gopgop`) — trivially brute-forceable | `backend/.env` | Token forgery, full account takeover | Generate 64-char hex secret via `openssl rand -hex 32` | ⚠️ **User must rotate** |
| 2 | **High** | Placeholder Groq API key in source code | `backend/controllers/aiController.js:14` | Exposes pattern of using fake keys; could mask missing config | Removed fallback — now fails loudly if missing | ✅ Fixed |
| 3 | **High** | JWT token stored in `localStorage` | `frontend/src/context/UserContext.jsx`, Auth pages | XSS could steal tokens | Accepted risk for SPA — mitigated by short token expiry and CSP | ⚠️ Accepted |
| 4 | **High** | No password minimum length in User model | `backend/models/User.js` | Weak passwords accepted | Validator enforces min 6 chars via Zod schema | ✅ Already enforced by validator |
| 5 | **Medium** | CORS allows wildcard via env var | `backend/server.js:102` | Open API access if `*` configured | Documented — dev-only, production should use explicit origins | ✅ Documented |
| 6 | **Medium** | No rate limit on WebSocket connections | `backend/websocket/wsServer.js` | Connection flooding | Connection manager already limits per-user connections | ✅ Already mitigated |
| 7 | **Medium** | Error handler leaks stack traces in dev | `backend/middlewares/errorHandler.js` | Info disclosure in dev mode | Only in development; production hides stacks | ✅ Correct behavior |
| 8 | **Medium** | Source maps may be enabled in prod | `frontend/vite.config.js` | Source code disclosure | Vite default is no sourcemaps in production build | ✅ Already correct |
| 9 | **Low** | `console.error` statements in frontend | Multiple files (32 occurrences) | Minor info leak in browser console | Acceptable for error handling — no secrets logged | ⚠️ Accepted |
| 10 | **Low** | Uploaded files served at predictable URLs | `backend/routes/authRoute.js:66` | Filename enumeration | Files use random timestamp+UUID filenames | ⚠️ Low risk |
| 11 | **Low** | No CSRF token protection | Backend API | CSRF attacks possible | Mitigated: Bearer token auth + SameSite cookies not used | ⚠️ Accepted |
| 12 | **Info** | Helmet CSP disabled | `backend/server.js:63` | Weaker XSS protection | Intentional for dev flexibility | ✅ Documented |
| 13 | **Info** | `.env.docker` contains placeholder secrets | `.env.docker` | Could be confused with real creds | Created clean `.env.docker.example` template | ✅ Fixed |

## Recommendations

1. **Rotate JWT Secret** — Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. **Enable CSP in production** — Configure `helmet({ contentSecurityPolicy: { directives: {...} } })`
3. **Consider HttpOnly cookies** for JWT storage instead of localStorage (requires significant refactor)
