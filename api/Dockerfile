FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN pnpm build

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Create .env file with proper permissions
RUN touch /app/.env && chown appuser:appgroup /app/.env && chmod 644 /app/.env

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Run the server
CMD ["pnpm", "start:prod"]
