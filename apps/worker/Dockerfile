# Worker (tsx runtime + Prisma). BUILD CONTEXT = repo root:
#   docker build -f apps/worker/Dockerfile -t ph360-worker .
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@11.11.0
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @ph360/worker... --filter @ph360/database
RUN pnpm --filter @ph360/database generate

FROM build AS runner
ENV NODE_ENV=production
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nodeuser
USER nodeuser
WORKDIR /repo/apps/worker
CMD ["pnpm", "start"]
