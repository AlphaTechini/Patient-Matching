# TrialMatch Project Structure

This document provides a complete mapping of the project's folder structure and where related logic resides.

## Root Directory

```
TrialMatch/
├── contracts/              # TEE smart contracts (Rust/WASM)
├── server/                 # Backend API (Node.js/Fastify)
├── Frontend/               # User interface (SvelteKit)
├── .git/                   # Git version control
├── node_modules/           # Root workspace dependencies
├── .env                    # Root environment variables
├── .gitignore              # Git ignore rules
├── pnpm-workspace.yaml     # PNPM workspace configuration
├── pnpm-lock.yaml          # Lock file for dependencies
└── Documentation files     # See below
```

## Documentation Files (Root)

- [**README.md**](./README.md) - Project overview, setup instructions, and quick start guide
- [**structure.md**](./structure.md) - This file - complete project structure mapping
- [**ARCHITECTURE_DECISIONS.md**](./ARCHITECTURE_DECISIONS.md) - Architectural decisions, rationale, and tradeoffs
- [**BACKEND_IMPLEMENTATION.md**](./BACKEND_IMPLEMENTATION.md) - Backend routes, services, and API documentation
- [**MVP_Frontend_Documentation.md**](./MVP_Frontend_Documentation.md) - Frontend pages, components, and routing
- [**PRIVACY_ARCHITECTURE.md**](./PRIVACY_ARCHITECTURE.md) - Privacy guarantees and TEE implementation
- [**Problem-statement.md**](./Problem-statement.md) - The problem TrialMatch solves
- [**Solution.md**](./Solution.md) - How TrialMatch solves the problem
- [**Demo_User_Flow.md**](./Demo_User_Flow.md) - User flow walkthrough for demo
- [**stages.md**](./stages.md) - Development stages and progress tracking
- [**Bugs.md**](./Bugs.md) - Known bugs and issues tracking
- [**Resources.md**](./Resources.md) - External resources and references

---

## `/contracts` - TEE Smart Contracts

Contains Rust-based WASM smart contracts deployed to Terminal 3 TEE infrastructure.

**[contracts/README.md](./contracts/README.md)** - Overview of all contracts and build instructions

### Structure:
```
contracts/
├── .version                           # Contract version tracking
├── hospital-screening/                # Patient eligibility screening contract
│   ├── src/
│   │   ├── lib.rs                    # Main contract entry point
│   │   └── eligibility.rs            # Eligibility checking logic
│   ├── wit/                          # WebAssembly Interface Types
│   │   ├── world.wit                 # Contract interface definition
│   │   └── deps/                     # Terminal 3 host interfaces
│   ├── target/                       # Compiled WASM artifacts
│   ├── Cargo.toml                    # Rust dependencies
│   ├── Cargo.lock                    # Dependency lock file
│   └── README.md                     # Contract documentation
│
└── pharma-trial/                      # Trial criteria management contract
    ├── src/
    │   ├── lib.rs                    # Main contract entry point
    │   ├── criteria.rs               # Trial criteria types
    │   ├── publish.rs                # Trial publishing logic
    │   └── results.rs                # Result aggregation logic
    ├── wit/                          # WebAssembly Interface Types
    │   ├── world.wit                 # Contract interface definition
    │   └── deps/                     # Terminal 3 host interfaces
    ├── target/                       # Compiled WASM artifacts
    ├── Cargo.toml                    # Rust dependencies
    ├── Cargo.lock                    # Dependency lock file
    └── README.md                     # Contract documentation
```

**Key Files:**
- **[hospital-screening/README.md](./contracts/hospital-screening/README.md)** - Screening contract architecture
- **[pharma-trial/README.md](./contracts/pharma-trial/README.md)** - Trial contract architecture

---

## `/server` - Backend API

Node.js/Fastify backend handling API requests, TEE orchestration, and MongoDB storage.

**[server/README.md](./server/README.md)** - Complete backend documentation, routes, and services

### Structure:
```
server/
├── src/
│   ├── routes/                       # API route handlers
│   │   ├── trials.ts                 # Trial management endpoints
│   │   ├── agents.ts                 # Agent deployment and execution
│   │   ├── patients.ts               # Patient data and matching
│   │   └── pharma.ts                 # Pharma organization management
│   │
│   ├── services/                     # Business logic services
│   │   ├── database.ts               # MongoDB connection and collections
│   │   ├── agent-deployment.ts       # Agent creation and authorization
│   │   ├── patient-onboarding.ts     # Patient account creation (T3N SDK)
│   │   ├── match-cache.ts            # Match result caching logic
│   │   └── pdf-extractor.ts          # PDF health record parsing
│   │
│   ├── scripts/                      # Utility scripts
│   │   ├── seed.ts                   # Database seeding with test data
│   │   ├── setup.ts                  # TEE contract setup and authorization
│   │   ├── authorize.ts              # Agent authorization setup
│   │   ├── invoke.ts                 # Contract invocation testing
│   │   ├── clean-patients.ts         # Patient data cleanup utilities
│   │   ├── debug-matching.ts         # Matching logic debugging
│   │   ├── fix-duplicates.ts         # Duplicate patient removal
│   │   └── test-agent-run.ts         # Agent execution testing
│   │
│   ├── tests/                        # Test files
│   │   ├── e2e-flow.ts               # End-to-end flow testing
│   │   └── integration.test.ts       # Integration tests
│   │
│   ├── server.ts                     # Main server entry point
│   ├── tee-client.ts                 # TEE SDK client wrapper
│   ├── llm.ts                        # LLM integration (Groq)
│   └── orchestrator.ts               # Request orchestration logic
│
├── .env                              # Environment variables (secrets)
├── .env.example                      # Example environment file
├── .dockerignore                     # Docker build exclusions
├── .gitignore                        # Git ignore rules
├── Dockerfile                        # Docker containerization
├── package.json                      # NPM dependencies and scripts
├── pnpm-lock.yaml                    # Dependency lock file
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Vitest test configuration
├── CLI_TEST_GUIDE.md                 # CLI testing guide
└── README.md                         # Backend documentation
```

**Key Routes:**
- `POST /api/trials/create` - Create new trial
- `GET /api/trials/all` - List all trials
- `POST /api/trials/:id/deploy-agent` - Deploy agent for trial
- `POST /api/agents/:agentDid/run` - Run agent to scan patients
- `POST /api/agents/:agentDid/reauthorize` - Re-authorize agent for new patients
- `GET /api/pharma/matches` - Get all eligible matches
- `POST /api/patients/upload` - Upload patient health records

**Environment Variables:**
```
MONGODB_URI                  # MongoDB connection string
T3N_API_KEY                  # Terminal 3 API key
HOSPITAL_TENANT_DID          # Hospital tenant DID
PHARMA_TENANT_DID            # Pharma tenant DID
EHR_BASE_URL                 # Backend API URL for TEE
GROQ_API_KEY                 # Groq LLM API key
WALLET_ENCRYPTION_KEY        # Patient wallet encryption key
```

---

## `/Frontend` - User Interface

SvelteKit-based frontend with three main user portals: Patients, Hospitals, and Pharma.

**[Frontend/README.md](./Frontend/README.md)** - Frontend setup and development guide

### Structure:
```
Frontend/
├── src/
│   ├── routes/                       # Page routes (file-based routing)
│   │   ├── +page.svelte              # Landing page
│   │   ├── +layout.svelte            # Root layout
│   │   │
│   │   ├── patient/                  # Patient portal
│   │   │   ├── +page.svelte          # Patient dashboard
│   │   │   ├── upload/+page.svelte   # Health record upload
│   │   │   └── trials/+page.svelte   # View matching trials
│   │   │
│   │   ├── hospital/                 # Hospital portal (minimal - platform acts as hospital)
│   │   │   └── +page.svelte          # Hospital dashboard
│   │   │
│   │   └── pharma/                   # Pharma portal
│   │       ├── +page.svelte          # Pharma dashboard
│   │       ├── onboarding/           # Pharma registration
│   │       ├── trials/               # Trial management
│   │       │   ├── +page.svelte      # List trials
│   │       │   └── new/+page.svelte  # Create trial
│   │       └── matches/+page.svelte  # View matches
│   │
│   ├── lib/                          # Reusable components and utilities
│   │   ├── components/               # UI components
│   │   │   ├── TopBar.svelte         # Navigation bar
│   │   │   ├── SideNav.svelte        # Sidebar navigation
│   │   │   ├── Modal.svelte          # Modal dialog
│   │   │   ├── StatusChip.svelte     # Status badge
│   │   │   └── ProtocolUpload.svelte # Trial protocol upload
│   │   │
│   │   └── stores/                   # Svelte stores (state management)
│   │       └── pharma.svelte.ts      # Pharma organization state
│   │
│   ├── app.html                      # HTML template
│   └── app.d.ts                      # TypeScript definitions
│
├── static/                           # Static assets
│   └── robots.txt                    # SEO robots file
│
├── .env                              # Environment variables
├── .env.example                      # Example environment file
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier code formatting
├── .prettierignore                   # Prettier ignore rules
├── eslint.config.js                  # ESLint configuration
├── svelte.config.js                  # SvelteKit configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite bundler configuration
├── package.json                      # NPM dependencies and scripts
└── pnpm-lock.yaml                    # Dependency lock file
```

**Frontend Tech Stack:**
- **Svelte 5** - UI framework (runes API)
- **SvelteKit** - Full-stack framework
- **Tailwind CSS 4** - Utility-first CSS
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Vercel Adapter** - Deployment

**Key Pages:**
- **Patient Portal**: `/patient`, `/patient/upload`, `/patient/trials`
- **Pharma Portal**: `/pharma`, `/pharma/trials`, `/pharma/trials/new`, `/pharma/matches`
- **Hospital Portal**: `/hospital` (minimal - platform infrastructure owner)

---

## MongoDB Collections

The application uses MongoDB with the following collections:

### Collections:
- **`trials`** - Published clinical trials
- **`patients`** - Patient accounts and health records
- **`patient_credentials`** - Patient wallet credentials (encrypted)
- **`agents`** - Deployed agents for trials
- **`match_results`** - Cached eligibility match results (7-day TTL)
- **`pharma_organizations`** - Pharma company registrations
- **`access_logs`** - Audit trail for data access

### Key Data Structures:

**Trial:**
```typescript
{
  id: string;                      // TRIAL-YYYY-###
  name: string;
  phase: string;
  indication: string;
  sponsor: string;
  description: string;
  startDate: string;
  enrollmentCount: number;
  criteria: {
    inclusion: TrialCriteria[];
    exclusion: TrialCriteria[];
  };
}
```

**Patient:**
```typescript
{
  email: string;
  patientDid: string;              // did:t3n:...
  ethAddress: string;
  encryptedPrivateKey: string;
  healthRecord: {
    demographics: { age, gender, ethnicity };
    vitals: { height, weight, bmi, blood_pressure, heart_rate };
    diagnosis_codes: string[];
    lab_results: Record<string, any>;
    medications: string[];
    medical_history: string[];
    allergies: string[];
    smoking_status: string;
    alcohol_use: string;
  };
  createdAt: Date;
}
```

**Agent:**
```typescript
{
  agentName: string;
  agentDid: string;                // did:t3n:...
  trialId: string;
  ethAddress: string;
  encryptedPrivateKey: string;
  status: "active" | "paused";
  createdAt: Date;
  lastRunAt?: Date;
  stats: {
    totalRuns: number;
    patientsScreened: number;
    patientsMatched: number;
  };
}
```

**Match Result (Cached):**
```typescript
{
  trialId: string;
  patientDid: string;
  eligible: boolean;
  confidence: number;
  matchedCriteria: number;
  totalCriteria: number;
  details?: string;              // AI-generated explanation
  checkedAt: Date;
  expiresAt: Date;               // 7 days from checkedAt
}
```

---

## Development Workflow

### Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp server/.env.example server/.env
cp Frontend/.env.example Frontend/.env

# Seed database
cd server
pnpm seed
```

### Running
```bash
# Backend (port 3008)
cd server
pnpm dev

# Frontend (port 5173)
cd Frontend
pnpm dev
```

### Building
```bash
# Build backend
cd server
docker build -t trialmatch-backend .

# Build frontend
cd Frontend
pnpm build
```

### Testing
```bash
# Backend tests
cd server
pnpm test

# Run agent
pnpm invoke
```

---

## Key Architectural Patterns

1. **Dual Storage** - Trials stored in both backend (fast queries) and TEE (secure matching)
2. **Agent-Driven Matching** - Autonomous agents scan all patients proactively
3. **Result Caching** - Match results cached for 7 days (both eligible and non-eligible)
4. **Direct DID Passing** - Patient DIDs passed directly to contracts (not placeholder-based)
5. **Dynamic Configuration** - EHR URL and secrets stored in TEE vault (not hardcoded)
6. **MockTEEClient** - Development mode without TEE credentials

---

## Related Documentation

- **Architecture**: [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)
- **Backend API**: [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md)
- **Frontend**: [MVP_Frontend_Documentation.md](./MVP_Frontend_Documentation.md)
- **Privacy**: [PRIVACY_ARCHITECTURE.md](./PRIVACY_ARCHITECTURE.md)
- **User Flow**: [Demo_User_Flow.md](./Demo_User_Flow.md)

---

**Last Updated:** June 21, 2026  
**Version:** 1.0.0  
**Status:** MVP Complete
