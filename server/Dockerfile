# ─── Dependency stage — resolve prod deps for server ──────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11 --activate

COPY pnpm-workspace.yaml package.json ./

RUN pnpm install --prod --config.node-linker=hoisted

# ─── Runtime stage ─────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Minimal non-root runtime user
RUN groupadd -r appuser && useradd -r -g appuser -s /sbin/nologin appuser

# Bring in only what the server needs
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src

USER appuser
EXPOSE 3008

CMD ["node", "--import", "tsx", "src/server.ts"]
