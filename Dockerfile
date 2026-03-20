FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY . .
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

FROM base AS builder
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy the built application
COPY --from=builder /app/dist ./dist

# Copy migration files (needed for TypeORM migrations)
COPY --from=builder /app/libs/database/src/migrations ./libs/database/src/migrations

# Copy entities (needed for TypeORM)
COPY --from=builder /app/libs/database/src/entities ./libs/database/src/entities

EXPOSE 3001
CMD ["node", "dist/main.js"]
