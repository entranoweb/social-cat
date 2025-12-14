# Multi-stage build for b0t platform
# Optimized for production deployment on Coolify
# Next.js: 15.5.9 (with security patches)
# Node.js: 20-bullseye-slim (LTS, native module support)

# Stage 1: Build
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
# Using npm ci for deterministic builds
RUN npm ci --verbose

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Stage 2: Runtime
FROM node:20-bullseye-slim

WORKDIR /app

# Install only runtime dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpython3.9 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 nodeusr

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Fix permissions
RUN chown -R nodeusr:nodeusr /app

USER nodeusr

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3123/api/health || exit 1

EXPOSE 3123

ENV NODE_ENV=production

CMD ["node", "server.js"]
