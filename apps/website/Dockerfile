# Website (Next.js standalone) — monorepo build. BUILD CONTEXT = repo root:
#   docker build -f apps/website/Dockerfile -t ph360-website .
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@11.11.0
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @ph360/website...
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @ph360/website build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /repo
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# Standalone traces from the monorepo root -> server entry at apps/website/server.js
COPY --from=build --chown=nextjs:nodejs /repo/apps/website/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/website/.next/static ./apps/website/.next/static
COPY --from=build /repo/apps/website/public ./apps/website/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/website/server.js"]
