# Environment Variables Reference

## Backend (`backend/.env`)

| Variable | Purpose | Required | Default | Public/Private |
|---|---|---|---|---|
| `PORT` | HTTP server port | No | `9000` | Private |
| `NODE_ENV` | Runtime environment (`development` / `production` / `test`) | No | `development` | Private |
| `LOG_LEVEL` | Pino logger level (`debug` / `info` / `warn` / `error`) | No | `debug` (dev), `info` (prod) | Private |
| `MONGO_URI` | MongoDB connection string | **Yes** | — | **Secret** |
| `REDIS_URL` | Redis connection URL (e.g. `redis://user:pass@host:6379`) | **Yes** (production) | Falls back to `REDIS_HOST`/`REDIS_PORT` | **Secret** |
| `REDIS_HOST` | Redis host fallback | No | `127.0.0.1` | Private |
| `REDIS_PORT` | Redis port fallback | No | `6379` | Private |
| `REDIS_PASSWORD` | Redis auth password | No | — | **Secret** |
| `REDIS_CONNECT_TIMEOUT_MS` | Redis connection timeout | No | `5000` | Private |
| `JWT_SECRET` | JWT signing key (min 32 chars, cryptographic random) | **Yes** | — | **Secret** |
| `GROQ_API_KEY` | Groq AI API key for LLM inference | **Yes** | — | **Secret** |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | **Yes** | — | Private |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret (if using auth code flow) | No | — | **Secret** |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No | `http://localhost:5173,...` | Private |
| `LANGGRAPH_SERVICE_URL` | LangGraph Python microservice base URL | No | `http://localhost:8001` | Private |

## Frontend (`frontend/.env`)

| Variable | Purpose | Required | Default | Public/Private |
|---|---|---|---|---|
| `VITE_BACKEND_URL` | Backend API base URL | **Yes** | `http://localhost:9000` | Public (bundled) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID for frontend | **Yes** | — | Public (bundled) |

> [!IMPORTANT]
> `VITE_*` variables are embedded into the client bundle at build time and visible to anyone.
> **Never** put API keys, database URLs, or secrets in `VITE_*` variables.

## LangGraph Service (`langgraph-service/.env`)

| Variable | Purpose | Required | Default | Public/Private |
|---|---|---|---|---|
| `PORT` | FastAPI server port | No | `8001` | Private |
| `GROQ_API_KEY` | Groq AI API key (reads from `backend/.env` too) | **Yes** | — | **Secret** |
| `GROQ_MODEL` | Primary LLM model | No | `openai/gpt-oss-120b` | Private |
| `GROQ_FALLBACK_MODEL` | Fallback LLM model | No | `qwen/qwen3.8-27b` | Private |
| `REDIS_URL` | Redis for state checkpointing | No | `redis://localhost:6379` | **Secret** |
| `QDRANT_URL` | Qdrant vector database URL | No | `http://localhost:6333` | Private |
| `QDRANT_COLLECTION` | Qdrant collection name | No | `system_design_rubrics` | Private |

## Docker Compose (`.env.docker`)

Uses the same variables as above but with Docker internal network hostnames:
- `MONGO_URI=mongodb://mongo:27017/prep`
- `REDIS_URL=redis://redis:6379`
- `QDRANT_URL=http://qdrant:6333`
- `LANGGRAPH_SERVICE_URL=http://langgraph:8001`
