# TrialMatch Server

Fastify backend that orchestrates LLM reasoning and TEE contract invocations for the TrialMatch system.

## Architecture

- **Entry point**: [`src/server.ts`](src/server.ts) bootstraps Fastify, wires CORS, env validation, and routes.
- **Matching logic**: [`src/orchestrator.ts`](src/orchestrator.ts) coordinates query parsing → trial lookup → eligibility check → LLM summary.
- **Routes**: [`src/routes/match.ts`](src/routes/match.ts) exposes `/api/match`, `/api/explain`, and `/api/trials`.
- **LLM abstraction**: [`src/llm.ts`](src/llm.ts) supports Gemini, Groq, and a mock provider for local development without API keys.
- **TEE client**: [`src/tee-client.ts`](src/tee-client.ts) contains two implementations:
  - `TEEClient` — executes real Terminal 3 tenant contracts.
  - `MockTEEClient` — returns canned trial data and eligibility results when T3N credentials are absent.

## TEE Data Flow

To understand how a match request traverses the enclave, visit [`src/orchestrator.ts`](src/orchestrator.ts).

The hospital eligibility contract (`check-eligibility`) resolves `{{profile.patient_id}}` host-side inside the Intel TDX enclave via `http-with-placeholders`; the raw value never enters WASM guest memory. See the contract source in [`../contracts/hospital-screening/src/eligibility.rs`](../contracts/hospital-screening/src/eligibility.rs).

## Scripts

Lifecycle helpers for the T3N testnet live in [`src/scripts/`](src/scripts/):

- `pnpm run setup` — registers contracts, creates KV maps, seeds secrets.
- `pnpm run authorize` — executes `agent-auth-update` so the matching agent can act on behalf of patients.
- `pnpm run invoke` — end-to-end invocation demo (`get-trial-criteria` → `check-eligibility` → `submit-match-result`).

## Environment

Copy `.env.example` to `.env` and fill in credentials. When `T3N_API_KEY` and `AGENT_KEY` are omitted, the server automatically falls back to `MockTEEClient` so the UI can be developed locally.

## Running

```bash
pnpm dev      # tsx watch for local dev (defaults to port 3008)
pnpm test     # vitest integration tests (uses mocks)
```

## Container Image

```bash
docker build -f Dockerfile -t trialmatch-server ..
```

The multi-stage Dockerfile isolates dependency installation and runs as a non-root user.
