FROM node:20-alpine

WORKDIR /app

# Copy package files (yarn comes with node:20)
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN yarn build

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
CMD ["yarn", "start:prod"]

