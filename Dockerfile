# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Copy root package files and install frontend deps
COPY package.json ./
RUN npm install

# Copy frontend sources
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src/ ./src/
COPY public/ ./public/

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/server

COPY server/package.json ./
RUN npm install

COPY server/tsconfig.json ./
COPY server/src/ ./src/

RUN npm run build

# Stage 3: Production image
FROM node:22-alpine AS production
WORKDIR /app

# Copy backend dist and node_modules
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/

# Copy built frontend into dist/ (served as static files by express)
COPY --from=frontend-builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
