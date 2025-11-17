# Build stage
FROM node:22-slim AS builder

WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Set build-time environment variables
ENV SVELTEKIT_ADAPTER=node
ENV GOOGLE_APPLICATION_CREDENTIALS=service-account-file.example.json

RUN pnpm run build

# Replace __dirname with import.meta.dirname in all .js files (fix ESM issues)
RUN find /app/build -type f -name "*.js" -exec sed -i 's/__dirname/import.meta.dirname/g' {} \;

# Production stage
FROM node:22-slim

WORKDIR /app

# Install git and ca-certificates for repository cloning and SSL
RUN apt-get update && \
    apt-get install -y git ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build /app
RUN echo '{"type": "module"}' > package.json

# Create temp directory for git operations
RUN mkdir -p /tmp/git-analysis && chmod 777 /tmp/git-analysis

# Force Firestore to use REST API instead of gRPC to fix disconnection issues in Docker
ENV FIRESTORE_PREFER_REST=true

# Start application
CMD ["node", "index.js"]