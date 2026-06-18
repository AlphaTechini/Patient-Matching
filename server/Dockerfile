# syntax=docker/dockerfile:1
# ─── Dependency stage ──────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─── Runtime stage ─────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Minimal non-root runtime user
RUN groupadd -r appuser && useradd -r -g appuser -s /sbin/nologin appuser

# Bring in only what the server needs
COPY --from=deps /app/server/node_modules ./node_modules
COPY server/tsconfig.json server/src ./

USER appuser
EXPOSE 3008

CMD ["node", "--import", "tsx", "src/server.ts"]
