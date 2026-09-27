# ==========================================
# Stage 1: Build Dependencies
# ==========================================
FROM node:22-alpine AS deps
WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000

# Security: run as non-root user
USER node

# Copy dependencies and application code
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# Ensure uploads directory exists and is writable
RUN mkdir -p uploads

EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 9000) + '/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
