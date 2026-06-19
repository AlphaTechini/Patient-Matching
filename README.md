# TrialMatch — TEE-Governed Clinical Trial Patient Matching

A confidential patient-to-clinical-trial matching system built on the [Terminal 3 Agent Developer Kit (ADK)](https://docs.terminal3.io/developers/adk/overview/what-is-adk). Uses Trusted Execution Environments (TEEs) to match patients against trial criteria without ever exposing raw patient health data to the matching logic, the platform, or any unauthorized party.

Built for the [Terminal 3 Bounty Challenge](https://www.terminal3.io/claim-page) (June 9–22, 2026).

---

## The Problem

- **~80% of clinical trials fail to meet enrollment timelines** — nearly 30% of sites enroll zero patients
- **85% of cancer patients are unaware trials are an option** — 75% would enroll if they knew
- **Manual screening bottleneck** — doctors review medical records by hand against 50-100+ inclusion/exclusion criteria
- **Patient data exposure** — PHI flows through sponsors, CROs, recruitment agencies, and sites with no confidential computation layer
- **No verifiable audit** — regulators cannot independently verify that matching was performed fairly or that patient data was handled appropriately

Full problem statement with sources: [Problem-statement.md](Problem-statement.md)

---

## The Solution

TrialMatch uses Terminal 3's TEE contracts to:

| Capability | How It Works |
|---|---|
| **Confidential matching** | Matching logic runs inside Intel TDX — code + data invisible to all parties |
| **PII never enters the contract** | `http-with-placeholders` resolves patient names, DOBs, diagnoses host-side inside the enclave |
| **Verifiable identity** | Every party (pharma, hospital, CRO, patient, agent) has a cryptographic DID |
| **Tamper-resistant audit** | Every match decision recorded on T3N's immutable ledger |
| **Cross-boundary interoperability** | Hospital contract talks to pharma contract via cross-tenant calls — no data siloed in one platform |
| **User-granted egress** | Patient controls exactly which contracts, functions, and hosts the agent can access |

Full solution architecture: [Solution.md](Solution.md)

---

## Competitive Differentiation

| | Deep 6 AI | TriNetX | **TrialMatch (TEE Agent)** |
|---|---|---|---|
| Matching logic visibility | Visible to Tempus engineers | Visible to TriNetX platform | **Inside TDX — invisible to everyone** |
| Patient PII handling | Processed in cloud memory | Shared across federated nodes | **Placeholders — never enters contract** |
| Audit trail | Internal logs (editable) | Internal logs (editable) | **T3N ledger (tamper-resistant)** |
| Identity | Platform-managed accounts | Institutional trust | **Cryptographic DIDs (verifiable)** |
| Cross-boundary | Walled-garden | Walled-garden | **Cross-tenant calls (neutral layer)** |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Pharma Tenant  │     │  Hospital Tenant │     │  Patient (User) │
│                 │     │                  │     │                 │
│  trial-matching │◄───►│ patient-screening│     │  agent-auth     │
│  WASM contract  │ ACL │  WASM contract   │     │  grant          │
│                 │     │                  │     │                 │
│  - KV maps      │     │  - KV maps       │     └────────┬────────┘
│  - Secrets vault│     │  - http-w-placeholders          │
└────────┬────────┘     └────────┬─────────┘              │
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Matching Agent (DID)  │
                    │                         │
                    │  1. get-trial-criteria  │
                    │  2. check-eligibility   │
                    │  3. submit-match-result │
                    └─────────────────────────┘
```

### Data Flow

1. **Pharma** publishes trial criteria → stored in KV map (`trial-criteria`)
2. **Hospital** shares read ACL on `trial-criteria` with pharma contract
3. **Patient** grants the matching agent access to specific contracts, functions, and hosts
4. **Agent** fetches trial criteria from pharma contract
5. **Agent** invokes hospital's `check-eligibility` — patient data fetched via `http-with-placeholders` (PII never enters WASM)
6. **Hospital contract** evaluates criteria inside TEE, returns eligibility result (no raw patient data)
7. **Agent** submits match result to pharma contract — recorded immutably

---

## Project Structure

See [`structure.md`](structure.md) for a full directory map and logic locator.

---

## Prerequisites

- **Node.js** >= 18
- **pnpm** (package manager)
- **Rust** with `wasm32-wasip2` target
- **Terminal 3 API Key** from the [claim page](https://www.terminal3.io/claim-page)

### Install Rust WASM Target

```bash
rustup target add wasm32-wasip2
```

### Install Dependencies

```bash
pnpm install
```

---

## Configuration

Copy `server/.env.example` to `server/.env` and fill in your values:

```env
# Terminal 3 API Key (from https://www.terminal3.io/claim-page)
T3N_API_KEY=

# Agent Key (Ethereum private key for the matching agent - generate your own)
# You can generate one at https://vanity-eth.tk/ or use: openssl rand -hex 32
AGENT_KEY=

# EHR System API Key (mock or test key for hospital EHR integration)
EHR_API_KEY=

# Clinical Trials System API Key (mock or test key for trials API)
TRIALS_API_KEY=

# EHR Base URL (your backend API URL)
EHR_BASE_URL=http://localhost:3008

# LLM Configuration (Qwen 3.6 27B via Groq)
LLM_PROVIDER=groq
GROQ_API_KEY=

# ─── Populated after running setup.ts ─────────────────────────────────────────
# Paste the DID values output by setup.ts here
PHARMA_TENANT_DID=
HOSPITAL_TENANT_DID=
```

> **Note:** 
> - `T3N_API_KEY` comes from the [Terminal 3 claim page](https://www.terminal3.io/claim-page) - save it immediately as it only appears once
> - `AGENT_KEY` is an Ethereum private key for your matching agent - generate a new one (never use a wallet key!)
> - `GROQ_API_KEY` get your free key from [console.groq.com](https://console.groq.com/) for LLM capabilities
> - `EHR_API_KEY` and `TRIALS_API_KEY` can be mock values (they get sealed inside the TEE)

---

## Build Contracts

```bash
cd server
pnpm run build:all
```

Or individually:
```bash
cd server
pnpm run build:pharma
pnpm run build:hospital
```

Output WASM files:
- `contracts/pharma-trial/target/wasm32-wasip2/release/z_tenant_trial_matching.wasm`
- `contracts/hospital-screening/target/wasm32-wasip2/release/z_tenant_patient_screening.wasm`

---

## Run

Execute from the `server/` directory:

```bash
cd server

# 1. Register contracts, create KV maps, seed secrets
pnpm run setup

# 2. Patient grants the matching agent access
pnpm run authorize

# 3. Agent executes the matching flow
pnpm run invoke
```

After `setup` completes, copy the output `PHARMA_TENANT_DID` and `HOSPITAL_TENANT_DID` values into `.env` before running `authorize` and `invoke`.

---

## ADK Capabilities Used

| ADK Feature | Usage in TrialMatch |
|---|---|
| **TEE Contracts (WASM)** | Matching logic runs inside Intel TDX |
| **Agent Auth (DID)** | Cryptographic identity for all parties |
| **KV Maps + ACLs** | Trial criteria shared between pharma and hospital |
| **Secrets Vault** | EHR API keys sealed via `map-entry-set` |
| **HTTP with Placeholders** | Patient PII resolved host-side — never enters WASM |
| **Outbound HTTP (user-granted)** | Agent can only call authorized EHR endpoints |
| **Cross-tenant calls** | Hospital records match in pharma's contract |
| **Capabilities from WIT** | Contract imports only what it needs |

---

## Run Locally

The server automatically falls back to a `MockTEEClient` when T3N credentials are missing, so you can develop and demo without testnet keys.

### Backend

```bash
cd server
pnpm install
pnpm dev           # http://localhost:3008
pnpm test          # vitest with mocks
```

### Frontend

```bash
cd Frontend
pnpm install
pnpm dev           # http://localhost:5173
```

In a separate terminal, start the backend first so the frontend can call `http://localhost:3000/api/*`.

---

## Documentation

- [Project Structure](structure.md) — Directory map and file locator
- [Server README](server/README.md) — Backend architecture, routes, and runbook
- [Problem Statement](Problem-statement.md) — Research, statistics, competitive landscape
- [Solution Architecture](Solution.md) — Full technical design and ADK capability mapping
- [Terminal 3 ADK Docs](https://docs.terminal3.io/developers/adk/overview/what-is-adk)
- [Agentic AI Security Manifesto](https://blog.terminal3.io/the-agentic-ai-security-governance-manifesto/)

---

## License

ISC
