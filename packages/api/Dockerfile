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
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the project
# Build the project
RUN npm run build

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

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --only=production --legacy-peer-deps

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client for production (Pin version to match dependencies)
RUN npx prisma@6 generate

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]