# packages/api/Dockerfile

# --- Stage 1: Builder ---
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
# Note: No package-lock.json in subfolder, so we generate one implicitly via install
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Remove devDependencies to prepare for production copy
RUN npm prune --production --legacy-peer-deps

# --- Stage 1.5: Development ---
FROM node:20-slim AS dev
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "dev"]

# --- Stage 2: Production ---
FROM node:20-slim AS production

# Install OpenSSL for Prisma matches builder
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built artifacts and production dependencies from builder
# This avoids running 'npm install' and 'prisma generate' again in production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]