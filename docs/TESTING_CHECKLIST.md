# Comprehensive Testing Strategy & Release Checklist

> Platform: Prep AI Interview System | Automated Test Runner: Node.js Test Runner (`node --test`)

## 1. Overview & Strategy

The Prep platform uses a balanced testing pyramid combining **automated integration tests** (backend API routes, rate limiters, token metering, and caching) with **focused smoke checks** for browser WebRTC audio and OAuth. 

Developers and CI pipelines are **not** expected to manually re-test every permutation on every build. Instead, use this tiered checklist.

---

## 2. Test Suites by Category

### 2.1 Smoke Tests (Essential Path)
| Test Target | Verification Type | Command / Action | Expected Result |
|---|---|---|---|
| Backend Boot | Automated | `curl http://localhost:9000/health/live` | Status 200 `{ status: "ok" }` |
| Database & Redis Health | Automated | `curl http://localhost:9000/health/ready` | Status 200 with DB & Redis connected |
| Frontend Dev Server | Automated | `npm run build` in `frontend/` | Zero build errors, assets generated in `dist/` |
| Google OAuth Sign-In | Manual (Periodic) | Click "Continue with Google" on `/signup` | User redirected to `/dashboard` with session stored |
| Protected Route Redirect | Automated / Manual | Navigate to `/dashboard` without token | Immediate redirect to `/login` |
| Ask Query Navigation | Manual | Verify "Ask Query" appears in navbar when logged in | Routes to `/ask-query`, renders AI chat |

### 2.2 Security Tests
| Security Vector | Test Scope | Automated in Test Suite | Manual Verification |
|---|---|---|---|
| Unauthenticated Access | Reject requests missing Bearer token | `backend/test/phase4.test.js` | Direct HTTP GET to `/api/sessions/my-sessions` returns 401 |
| Invalid / Expired JWT | Reject forged or expired tokens | `backend/test/phase4.test.js` | Send expired token; verify 401 response |
| Token Metering & Quota | Deduct 10 tokens per AI query; reject if <10 | `backend/test/tokenAndFeature.test.js` | Send 101 queries or set balance to 0; verify 403 Forbidden |
| Rate Limiting | Enforce 10 req/15min on auth endpoints | `backend/test/phase4.test.js` | Rapid-fire requests return HTTP 429 Too Many Requests |
| IDOR / Object Authorization | Users cannot view or delete others' sessions | `backend/test/phase2.test.js` | User B requesting `/api/sessions/:userA_SessionId` returns 404/403 |
| SQL/NoSQL Injection | Sanitize input query operators (`$gt`, `$ne`) | `backend/test/phase4.test.js` | Payloads with MongoDB operators sanitized via middleware |

### 2.3 Regression Tests
| Feature Area | Automated Coverage | Manual Check (Pre-Release Only) |
|---|---|---|
| Session Creation | `backend/test/phase1.test.js` | Create a new Tech or HR track from Dashboard |
| Q&A Generation | `backend/test/phase3.test.js` | Verify Groq AI returns formatted questions |
| Doubt Solver & Ask Query | `backend/test/tokenAndFeature.test.js` | Send query with attached code snippet in `/ask-query` |
| Audio/Mic Level Meter | Browser native | Speak into mic in Live Interview; verify waveform reacts |
| RAG Fallback Tier | `backend/test/phase6.test.js` | Stop LangGraph container; verify backend uses local rubrics |

### 2.4 Production Tests
| Verification Target | Production Command | Verification |
|---|---|---|
| Multi-Stage Docker Build | `docker compose build` | All 6 services build without cache corruption |
| Container Startup Order | `docker compose up -d` | MongoDB & Redis start before backend & LangGraph |
| Static Asset Delivery | `curl -I http://localhost:80/` | HTTP 200 with gzip/brotli compression |
| Environment Variable Safety | `grep -r "VITE_" frontend/src` | No private backend API keys bundled into client |

---

## 3. Automation vs Manual Verification Matrix

| Area | Can Be Automated | Needs Manual Verification | Does NOT Need Repetitive Testing |
|---|---|---|---|
| Backend API Contracts | ✅ 100% (`npm test`) | ❌ None | Re-testing every endpoint by hand |
| Auth & Protected Routes | ✅ 90% | ⚠️ Real Google OAuth token exchange | Token parsing & session expiration |
| UI Responsiveness | ⚠️ Lint/Build checks | ⚠️ Desktop & Mobile layout check | Re-checking styling on every commit |
| WebRTC Audio / Voice | ⚠️ Mock WebSocket events | ⚠️ Microphone test once before major release | Audio codec negotiations |
| Token Deduction | ✅ 100% (`npm test`) | ❌ None | Manual token balance arithmetic |

---

## 4. Minimum Release Test (5-Minute Smoke Check)

Before tagging a release or deploying to production, execute this exact sequence:

1. **Run Automated Test Suite:**
   ```bash
   cd backend && npm test
   ```
   *Expected: All 9 test suites pass.*

2. **Verify Frontend Production Build:**
   ```bash
   cd ../frontend && npm run build
   ```
   *Expected: Vite builds bundle without TypeScript or syntax errors.*

3. **Verify Docker Stack Launch:**
   ```bash
   docker compose up -d --build
   docker compose ps
   ```
   *Expected: All services status `healthy` or `running`.*

4. **Health Check Verification:**
   ```bash
   curl http://localhost:9000/health/ready
   ```
   *Expected: `{"status":"ready","database":"connected","redis":"connected"}`.*

5. **Quick UI Smoke Check:**
   - Open `http://localhost` (or `http://localhost:5173`)
   - Verify Landing Page video plays with floating score badge
   - Log in and verify Dashboard loads
   - Click "Ask Query" in navbar, ask 1 question, verify 10 tokens deducted and response rendered with syntax highlighting.
