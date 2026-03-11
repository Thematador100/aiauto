# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy all frontend source
COPY . .

# Build production frontend (outputs to /app/dist)
RUN npm run build

# ── Stage 2: Build backend ────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy backend node_modules and source
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend into backend's public folder
COPY --from=frontend-builder /app/dist ./backend/public

# Copy migrations
COPY backend/migrations ./backend/migrations

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
