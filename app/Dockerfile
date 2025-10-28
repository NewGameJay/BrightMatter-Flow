# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm i; fi

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Serve stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy built files
COPY --from=builder /app/dist ./

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
