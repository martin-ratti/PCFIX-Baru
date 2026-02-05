# packages/web/Dockerfile

# --- Stage 1: Base ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Stage 2: Development ---
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 4321
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- Stage 3: Builder ---
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# --- Stage 4: Production (Environment Simulation) ---
# Note: In production, this project is deployed to Vercel.
# This stage is for local testing of the build artifact using Node adapter behavior if configured,
# or simply verifying the build passes.
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Fallback command if using Node adapter, otherwise this might need adjustment based on astro.config
CMD ["node", "./dist/server/entry.mjs"]