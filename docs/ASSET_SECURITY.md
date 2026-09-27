# Client Asset & Network Request Security

> Document Version: 1.0.0 | System: Prep AI Interview Platform

## Executive Summary & Engineering Boundary

In client-server web architecture, **no browser-rendered resource can be completely hidden from a determined user with local DevTools access**. Any HTML, JavaScript, CSS, image, video, audio buffer, or network payload delivered to the client's device resides in browser memory and local cache. 

Attempts to implement client-side "anti-inspect" tricks (such as disabling right-click context menus, intercepting F12 keystrokes, or debugger loop traps) provide only trivial annoyance to users while degrading accessibility and providing **zero cryptographic or authorization security**.

True defense-in-depth relies on **strict server-side authorization boundaries, asset classification, scoped token delivery, and origin controls**.

---

## 1. Asset & Data Classification Matrix

| Classification Level | Examples in Prep Platform | Storage / Serving Mechanism | Protection Mechanism |
|---|---|---|---|
| **A. Public Assets** | `public/subject.mp4`, `public/Proview-Symbol.png`, favicon, fonts, landing page CSS/JS bundle | Static file serving via Vite (dev) / NGINX / Express static | Cached via CDN / Cache-Control headers; no authentication required |
| **B. Authenticated Assets** | User session Q&A, mock interview feedback reports, custom session tracks, speech recognition transcripts | Database (MongoDB Atlas) & authenticated API endpoints | JWT Bearer token authentication required; verified on every HTTP/WebSocket request |
| **C. Admin / Scoped Assets** | User token balance adjustments, aggregated analytics, system health metrics | Scoped backend routes with role/ownership validation | Object-level authorization (`req.user.id === resource.userId`); server-side validation |
| **D. Private / Server-Only Assets** | Groq API keys, OpenAI API keys, JWT secret, database connection strings, LangGraph service tokens | Server environment variables (`.env`) | Never exposed via `VITE_*` prefixes; isolated strictly to Node.js backend processes |
| **E. Ephemeral Media Buffers** | Live microphone PCM audio frames, WebRTC RTP media streams, temporary speech synthesis chunks | Memory / WebRTC UDP data channels / ephemeral memory | In-memory only; not persisted to disk; cleared immediately after turn processing |

---

## 2. Server-Side Protection Architecture

### 2.1 Object-Level Access Control (IDOR Prevention)
- All session retrieval, update, and deletion endpoints (`/api/sessions/:id`, `/api/sessions/:id/questions`) strictly enforce ownership:
  ```javascript
  // backend/middlewares/authMiddleware.js
  const protect = async (req, res, next) => {
    let token = req.headers.authorization?.startsWith("Bearer") 
      ? req.headers.authorization.split(" ")[1] 
      : null;
    if (!token) return next(new AppError("Not authorized to access this route", 401));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  };
  ```
- User queries are filtered by `userId: req.user._id`, ensuring users can never query or mutate another candidate's interview sessions or evaluations.

### 2.2 Upload Validation & Path Traversal Prevention
- User avatar uploads (`/api/auth/upload-image`) are processed via `multer` with strict controls:
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
  - Max file size: 5 MB limit
  - Filenames: Cryptographically generated UUID / timestamp strings; original client filenames are never used directly in filesystem paths to prevent path traversal (`../../`).

### 2.3 Rate Limiting & Abuse Prevention
- Sensitive API routes (AI generation, question bank queries, login) enforce distributed rate limiting backed by Redis or memory stores:
  - General API: 100 requests per 15 minutes per IP
  - Auth routes (`/api/auth/login`, `/api/auth/google-login`): 10 requests per 15 minutes per IP
  - AI Generation (`/api/ai/*`): Token-metered (10 tokens per interaction out of 1,000 monthly quota)

---

## 3. Frontend Bundle & Code Protection

### 3.1 Environment Variable Isolation
- **Rule**: Only variables prefixed with `VITE_` are bundled into the frontend bundle.
- **Audit Result**: Only `VITE_BACKEND_URL` and `VITE_GOOGLE_CLIENT_ID` are bundled into client code. Both are safe for public browser exposure. All AI keys (`GROQ_API_KEY`, `OPENAI_API_KEY`), database credentials (`MONGO_URI`, `REDIS_URL`), and secrets (`JWT_SECRET`) are strictly kept on the server.

### 3.2 Production Build Optimization & Minification
- The Vite build configuration uses Rollup with `esbuild` minification, stripping dead code, comments, and identifiers.
- Production source maps (`build.sourcemap: false`) are disabled by default in production builds to prevent exposing source code directory structures.

### 3.3 Security Headers
Production deployments (NGINX / Cloudflare / Node Helmet) should enforce:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```

---

## 4. Media & Video Protection Assessment

- **Hero Video (`subject.mp4`)**:
  - Purpose: Public marketing asset demonstrating AI voice mock interview capability.
  - Classification: **Public Asset (A)**.
  - Delivery: Static stream with range requests (`Accept-Ranges: bytes`) for smooth playback.
  - UI Masking: Floating interactive AI evaluation score card seamlessly integrates over background video watermarks.
