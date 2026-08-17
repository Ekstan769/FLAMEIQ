# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Install only production dependencies first
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# ---- Builder ----
FROM base AS builder
COPY . .
# Copy production node_modules and install devDependencies
COPY --from=deps /app/node_modules ./node_modules
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run prisma:generate
RUN pnpm run build

# ---- Runner ----
FROM base AS runner

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy Prisma schema for runtime access
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]