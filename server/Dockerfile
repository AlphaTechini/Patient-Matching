# syntax=docker/dockerfile:1
# ─── Dependency stage — resolve prod deps for server ──────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11 --activate

# Workspace manifests only — preserved by layer cache when they don't change
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY Frontend/package.json ./Frontend/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter server --prod --config.node-linker=hoisted

# ─── Runtime stage ─────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Minimal non-root runtime user
RUN groupadd -r appuser && useradd -r -g appuser -s /sbin/nologin appuser

# Bring in only what the server needs
COPY --link --from=deps /app/node_modules ./node_modules
COPY --link server/package.json server/tsconfig.json ./
COPY --link server/src ./src

USER appuser
EXPOSE 3008

CMD ["node", "--import", "tsx", "src/server.ts"]
