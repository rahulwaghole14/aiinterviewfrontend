# Multi-stage Dockerfile for React Frontend
# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Stage 2: Serve the application with nginx
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Create startup script that properly handles PORT
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'PORT=${PORT:-8080}' >> /start.sh && \
    echo 'export PORT' >> /start.sh && \
    echo 'envsubst '"'"'$PORT'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /start.sh && \
    echo 'echo "Starting nginx on port $PORT"' >> /start.sh && \
    echo 'exec nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-8080}/ || exit 1

# Use the startup script
CMD ["/start.sh"]
