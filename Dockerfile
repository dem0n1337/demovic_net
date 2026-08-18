# Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package files and install dependencies (deterministic via lockfile)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/.output ./

# Create non-root user for security + writable /data for notify signups
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs && \
    chown -R nuxtjs:nodejs /app && \
    mkdir -p /data && chown nuxtjs:nodejs /data

USER nuxtjs

EXPOSE 3000

CMD ["node", "server/index.mjs"]
