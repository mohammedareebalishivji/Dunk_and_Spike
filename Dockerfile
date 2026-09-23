# syntax=docker/dockerfile:1

# --------------------------------------------------
# Stage 1: Build Frontend Assets
# --------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Run tests and production bundle
RUN npm test && npm run build

# --------------------------------------------------
# Stage 2: Production Server Runner
# --------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server runtime and source files
COPY server ./server
COPY src/types.ts ./src/types.ts
COPY src/data/mockData.ts ./src/data/mockData.ts

# Ensure data directory exists for SQLite WAL database
RUN mkdir -p /app/data

# Expose HTTP & WebSocket port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start unified production server
CMD ["node", "--experimental-strip-types", "server/index.ts"]
