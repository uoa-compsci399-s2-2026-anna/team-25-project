# syntax=docker/dockerfile:1
ARG NODE_VERSION=26.5.1

FROM node:${NODE_VERSION}-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# pg verifies the RDS certificate, and Node does not trust the RDS CA by default.
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem /etc/ssl/rds-ca.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/rds-ca.pem

RUN npm install -g corepack && corepack enable pnpm

# Stage 1: Prune the workspace down to web and its dependencies
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Root manifests only, so turbo is reinstalled only when these files change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter ccca
COPY . .
# --docker splits manifests (out/json) from sources (out/full) for the deps stage.
RUN pnpm turbo prune web --docker

# Stage 2: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Manifests first, so this layer caches until dependencies change.
COPY --from=pruner /app/out/json/ ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /app/out/full/ ./

# Stage 3: Build the application
FROM deps AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# BuildKit leaves secret values out of the cache key, so a hash of them is
# passed in to make a changed secret rebuild rather than reuse a stale layer.
ARG BUILD_SECRETS_HASH
# Next inlines NEXT_PUBLIC_* at build time, so the public origin must be set here.
ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL

# Prerendering queries Payload, so the build needs a migrated database.
# An empty secret or hash fails here, before next build runs with it.
RUN --mount=type=secret,id=DATABASE_URL,required=true \
    --mount=type=secret,id=PAYLOAD_SECRET,required=true \
    sh -euc '[ -n "${BUILD_SECRETS_HASH:-}" ] || { echo "BUILD_SECRETS_HASH is not set" >&2; exit 1; }; \
             for name in DATABASE_URL PAYLOAD_SECRET; do \
               value=$(cat "/run/secrets/$name"); \
               [ -n "$value" ] || { echo "Build secret $name is empty" >&2; exit 1; }; \
               export "$name=$value"; \
             done; \
             pnpm turbo run build --filter=web'

# Stage 4: Production runner (minimal image)
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=base /etc/ssl/rds-ca.pem /etc/ssl/rds-ca.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/rds-ca.pem

# Standalone mirrors the monorepo layout, so server.js is under apps/web/.
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
