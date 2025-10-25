FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY verifier/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY verifier/ ./

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

CMD ["npm", "start"]
