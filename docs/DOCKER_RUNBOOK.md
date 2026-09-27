# Docker Operations & Development Runbook

> System: Prep AI Platform | Architecture: Distributed Multi-Service Architecture

## 1. System Services & Port Mapping

| Service Name | Container Name | Image / Base | Internal Port | Host Port | Purpose |
|---|---|---|---|---|---|
| **Frontend** | `prep-frontend` | `nginx:1.27-alpine` | `80` | `http://localhost:80` | Client React SPA + Nginx reverse proxy |
| **Backend** | `prep-backend` | `node:22-alpine` | `9000` | `http://localhost:9000` | Node.js Express API & WebSocket Gateway |
| **LangGraph Service** | `prep-langgraph` | `python:3.12-slim` | `8001` | `http://localhost:8001` | Multi-agent interview FSM & RAG engine |
| **Redis** | `prep-redis` | `redis:7-alpine` | `6379` | `6379` | Cache-aside layer, session store & BullMQ broker |
| **MongoDB** | `prep-mongodb` | `mongo:7.0` | `27017` | `27017` | Primary NoSQL document datastore |
| **Qdrant** | `prep-qdrant` | `qdrant/qdrant:latest` | `6333` | `6333` | Vector database for System Design rubrics |

---

## 2. Environment Preparation

Before launching Docker containers, prepare your environment configuration:

```bash
# 1. Copy the docker environment template
cp .env.docker.example .env.docker

# 2. Fill in your valid API keys in .env.docker:
# - GROQ_API_KEY (Required for AI generation)
# - JWT_SECRET (Generate via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - GOOGLE_CLIENT_ID (Required for Google OAuth)
```

---

## 3. Core Docker Commands

### 3.1 Start Full Platform Stack (Development & Staging)
```bash
# Build and start all 6 services in detached mode
docker compose up -d --build

# Verify all containers are healthy and running
docker compose ps
```

### 3.2 Tail Logs & Observability
```bash
# Tail logs across all services in real time
docker compose logs -f

# Tail logs for a specific service
docker compose logs -f backend
docker compose logs -f langgraph
docker compose logs -f frontend
```

### 3.3 Rebuilding Services After Code Changes
```bash
# Rebuild only the backend after modifying server code
docker compose build backend
docker compose up -d backend

# Rebuild only the frontend after modifying client components
docker compose build frontend
docker compose up -d frontend

# Rebuild LangGraph Python microservice
docker compose build langgraph
docker compose up -d langgraph
```

### 3.4 Stopping Containers
```bash
# Gracefully stop containers without destroying volume data
docker compose stop

# Stop and remove containers and network bridges
docker compose down
```

### 3.5 Resetting & Cleaning Volumes (Fresh State)
```bash
# CAUTION: This removes all MongoDB database records, Redis caches, and Qdrant vectors
docker compose down -v

# Clean dangling images and builder cache
docker image prune -f
docker builder prune -f
```

---

## 4. Local Development Without Full Docker

If running services locally on your host machine:

### 4.1 Run Infrastructure Only in Docker
```bash
# Run only Redis, MongoDB, and Qdrant in Docker
docker compose up -d mongo redis qdrant
```

### 4.2 Run Backend Locally
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:9000
```

### 4.3 Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### 4.4 Run LangGraph Microservice Locally (Optional)
```bash
cd langgraph-service
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 5. Health Checks & Verification

Verify the system status via curl:
```bash
# Backend Live Health Check
curl http://localhost:9000/health/live

# Backend Ready Health Check (Verifies DB & Redis connections)
curl http://localhost:9000/health/ready

# Frontend Web Server
curl -I http://localhost:80/health

# LangGraph Microservice Health
curl http://localhost:8001/health
```
