# Project Structure

```
trialmatch/
├── contracts/                     # TEE contracts (Rust → WASM)
│   ├── pharma-trial/
│   │   └── README.md              # Pharma contract docs
│   └── hospital-screening/
│       └── README.md              # Hospital contract docs
│
├── server/                        # Fastify backend + agent scripts
│   ├── src/
│   │   ├── server.ts              # App bootstrap & env validation
│   │   ├── orchestrator.ts        # LLM ↔ TEE coordination
│   │   ├── llm.ts                 # Gemini / Groq / Mock providers
│   │   ├── tee-client.ts          # T3N SDK client + MockTEEClient
│   │   ├── routes/match.ts        # API routes: /api/match, /explain, /trials
│   │   ├── test/
│   │   │   └── integration.test.ts
│   │   └── scripts/
│   │       ├── setup.ts           # Tenant onboarding script
│   │       ├── authorize.ts       # Agent grant script
│   │       └── invoke.ts          # End-to-end invocation demo
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── README.md                  # Server architecture & runbook
│
├── Frontend/                      # SvelteKit web UI
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +layout.svelte     # Tailwind root layout
│   │   │   ├── +page.svelte       # Match dashboard
│   │   │   └── layout.css         # Tailwind v4 imports
│   │   └── lib/
│   │       └── config.ts          # API_BASE config
│   ├── svelte.config.js           # Vercel adapter
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md                  # Frontend docs
│
├── README.md                      # Root project overview
├── structure.md                   # This file
├── Problem-statement.md           # Crisis research & data
└── Solution.md                    # ADK capability mapping
```

## Where to find things

- **Trial matching logic**: [server/src/orchestrator.ts](server/src/orchestrator.ts)
- **Patient eligibility (TEE contract)**: [contracts/hospital-screening/src/eligibility.rs](contracts/hospital-screening/src/eligibility.rs)
- **Trial criteria storage (TEE contract)**: [contracts/pharma-trial/src/criteria.rs](contracts/pharma-trial/src/criteria.rs)
- **API routes**: [server/src/routes/match.ts](server/src/routes/match.ts)
- **LLM abstraction**: [server/src/llm.ts](server/src/llm.ts)
- **TEE client & mock**: [server/src/tee-client.ts](server/src/tee-client.ts)
- **Matching dashboard UI**: [Frontend/src/routes/+page.svelte](Frontend/src/routes/+page.svelte)
