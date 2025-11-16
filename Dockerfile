FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set adapter to node for Docker
ENV SVELTEKIT_ADAPTER=node

# Build application
RUN pnpm run build

# Replace __dirname with import.meta.dirname in all .js files (fix ESM issues)
RUN find /app/build -type f -name "*.js" -exec sed -i 's/__dirname/import.meta.dirname/g' {} \;

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks and git for repository cloning
RUN apk add --no-cache curl git

# Copy everything needed from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy Firebase service account file (will be overridden by volume mount in production)
COPY --from=builder /app/service-account-file.json ./service-account-file.json

# Create temp directory for git operations
RUN mkdir -p /tmp/git-analysis && chmod 777 /tmp/git-analysis

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "build"]
