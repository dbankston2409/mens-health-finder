# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install all dependencies (including dev for TypeScript build)
RUN npm install

# Copy source code
COPY . ./

# Ensure glob is available for fix-imports
RUN npm install glob --no-save

# Build TypeScript (will run prebuild script automatically)
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy node modules and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Default command (can be overridden)
CMD ["node", "dist/index.js"]