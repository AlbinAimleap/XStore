# Multi-stage build for production
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy built app and server files
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Create uploads directory
RUN mkdir -p /app/server/uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership and permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "server/app.js"]