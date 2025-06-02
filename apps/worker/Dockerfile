# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/worker/package*.json ./apps/worker/

# Install dependencies
RUN npm ci --only=production
RUN cd apps/worker && npm ci

# Copy source code
COPY apps/worker ./apps/worker

# Build TypeScript
RUN cd apps/worker && npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy node modules and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/

# Set working directory to worker app
WORKDIR /app/apps/worker

# Default command (can be overridden)
CMD ["node", "dist/index.js"]