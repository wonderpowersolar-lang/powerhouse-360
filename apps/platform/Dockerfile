# Platform (Next.js standalone + Prisma). BUILD CONTEXT = repo root:
#   docker build -f apps/platform/Dockerfile -t ph360-platform .
# node:20-slim (debian) for reliable Prisma engine support.
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@11.11.0
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @ph360/platform...
RUN pnpm --filter @ph360/database generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @ph360/platform build

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=0.0.0.0
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs
COPY --from=build --chown=nextjs:nodejs /repo/apps/platform/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/platform/.next/static ./apps/platform/.next/static
USER nextjs
EXPOSE 3100
CMD ["node", "apps/platform/server.js"]
