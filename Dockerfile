FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG DATABASE_URL
ARG SESSION_SECRET
ARG ANTHROPIC_API_KEY

ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV SESSION_SECRET=$SESSION_SECRET
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
