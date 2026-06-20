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

## Current Implementation Status

### **✅ Completed Features**

**Backend Infrastructure:**
- Fastify REST API with MongoDB integration
- Agent-driven batch matching architecture
- Match result caching system (7-day expiry)
- Access logs tracking for patient data usage
- Pharma organization registration and management
- Patient custodial wallet system with AES-256-GCM encryption
- Seed script for populating test data (5 trials, 10 patients)

**Frontend (Patient Portal):**
- Patient registration and authentication
- Health data upload interface
- Trial matches dashboard (fetches from backend cache)
- Secure wallet view with real patient DID display
- Access logs display (shows agent authorization events)
- Sign-out functionality for testing multiple accounts

**Frontend (Pharma Portal):**
- Pharma organization onboarding flow
- Trial creation with LLM-based protocol parsing
- Trial management and listing
- Trial details modal with full criteria display
- Match results aggregation page (eligible patients by trial)
- Reactive organization name in sidebar navigation

**TEE Integration:**
- Hospital screening contract (eligibility checking)
- Pharma trial contract (criteria management)
- MockTEEClient for local development
- Agent authorization workflow
- Cross-tenant ACL configuration

**Data Management:**
- 5 seeded trials under RayPharma organization
- 10 comprehensive patient records with realistic medical data
- MongoDB collections: patients, trials, agents, match_results, access_logs, pharma_organizations
- Strategic patient-trial matching for demo purposes

### **⏱️ Roadmap (Future Phases)**

**Phase 2:**
- Scheduled agent runs (cron-based batch matching every 2 days)
- Email-based patient contact system
- Consent management dashboard
- Real-time agent execution progress tracking

**Phase 3:**
- In-platform messaging (WebSockets for hospital-patient communication)
- Partial match recommendations (near-eligible patients)
- Advanced analytics (eligibility funnel, criteria impact analysis)
- Multi-hospital support with separate EHR backends

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

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd server
pnpm install

# Frontend
cd ../Frontend
pnpm install
```

### 2. Configure Environment

Copy `server/.env.example` to `server/.env` and add:

```env
# MongoDB Connection (required)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trialmatch?retryWrites=true&w=majority

# Terminal 3 API Key (optional - uses MockTEEClient if omitted)
T3N_API_KEY=

# LLM Configuration (required for trial parsing)
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here

# Auto-configured keys (already set in .env)
WALLET_ENCRYPTION_KEY=<generated>
AGENT_KEY=<generated>
EHR_API_KEY=mock-ehr-key
TRIALS_API_KEY=mock-trials-key
EHR_BASE_URL=http://localhost:3008
```

**MongoDB Setup:**
1. Sign up for free MongoDB Atlas account
2. Create M0 cluster (512MB free tier)
3. Whitelist your IP (or 0.0.0.0/0 for development)
4. Get connection string and add to `.env`

### 3. Seed Database

```bash
cd server
pnpm run seed
```

This populates MongoDB with:
- 5 clinical trials (SGLT2 inhibitor, ARNI therapy, PD-1/CTLA-4 combo)
- 10 patients with comprehensive medical records
- Strategic matching (4 patients for trial 3, 3 each for trials 4-5)

### 4. Run Application

```bash
# Terminal 1: Backend
cd server
pnpm dev   # http://localhost:3008

# Terminal 2: Frontend
cd Frontend
pnpm dev   # http://localhost:5173
```

### 5. Test Workflow

1. **Patient Flow:**
   - Go to http://localhost:5173
   - Click "Enter Patient Portal" → Register with email
   - Upload health data (or use seeded patient accounts)
   - View trial matches on dashboard

2. **Pharma Flow:**
   - Click "For Institutions" → Register organization
   - Create new trial (paste protocol text)
   - View match results aggregated by trial

> **Note:** Without `T3N_API_KEY`, the system uses `MockTEEClient` for local development. All features work normally with mock data.

---

## Backend API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trials/create` | POST | Create trial from protocol text (LLM parsing) |
| `/api/trials/all` | GET | List all trials |
| `/api/trials/:id` | GET | Get trial details |
| `/api/trials/:id/check-eligibility` | POST | Check patient eligibility (with caching) |
| `/api/patients/:patientDid/matches` | GET | Get patient's eligible trials |
| `/api/pharma/matches` | GET | Get all matches across trials |
| `/api/access-logs` | GET/POST | Track agent authorization events |
| `/api/pharma/register` | POST | Register pharma organization |
| `/api/pharma/login` | POST | Login pharma organization |
| `/api/patients/register` | POST | Create patient with custodial wallet |
| `/api/patients/login` | POST | Patient login |

---

## Development Scripts

```bash
# Database seeding
pnpm run seed           # Populate 5 trials + 10 patients

# TEE contract deployment (requires T3N_API_KEY)
pnpm run setup          # Register contracts, create KV maps
pnpm run authorize      # Grant agent permissions
pnpm run invoke         # Test agent execution flow

# Contract building
pnpm run build:pharma   # Build pharma-trial contract
pnpm run build:hospital # Build hospital-screening contract
pnpm run build:all      # Build both contracts
```

---

## ADK Capabilities Used

| ADK Feature | Usage in TrialMatch |
|---|---|
| **TEE Contracts (WASM)** | Eligibility matching inside Intel TDX enclave |
| **Agent DIDs** | Cryptographic identity for autonomous agents |
| **Custodial Wallets** | Platform-managed patient wallets (AES-256-GCM encrypted) |
| **KV Maps + ACLs** | Cross-tenant trial criteria sharing |
| **Secrets Vault** | EHR URLs and API keys sealed in TEE |
| **HTTP with Placeholders** | Patient data resolved host-side, never enters WASM |
| **Agent Authorization** | Patients grant agents access to screening contracts |
| **Match Caching** | 7-day cache in MongoDB to avoid redundant TEE calls |

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
