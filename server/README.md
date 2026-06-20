# TrialMatch Server

Fastify backend orchestrating agent-driven batch matching with TEE contract invocations, MongoDB persistence, and match result caching.

## Current Architecture

### **Core Services**

- **[`src/server.ts`](file:///c:/Hackathons/Terminal%203/server/src/server.ts)** - Fastify entry point with CORS, env validation, pino logging, and route registration
- **[`src/tee-client.ts`](file:///c:/Hackathons/Terminal%203/server/src/tee-client.ts)** - Dual TEE implementation:
  - `TEEClient` - Real Terminal 3 contract execution
  - `MockTEEClient` - Local development fallback (reads from backend stores)
- **[`src/llm.ts`](file:///c:/Hackathons/Terminal%203/server/src/llm.ts)** - LLM abstraction supporting Groq (Qwen 3.6 27B) and mock provider

### **Routes**

- **[`src/routes/trials.ts`](file:///c:/Hackathons/Terminal%203/server/src/routes/trials.ts)** - Trial CRUD, eligibility checking with caching, patient/pharma match endpoints
- **[`src/routes/pharma.ts`](file:///c:/Hackathons/Terminal%203/server/src/routes/pharma.ts)** - Pharma organization registration and login
- **[`src/routes/access-logs.ts`](file:///c:/Hackathons/Terminal%203/server/src/routes/access-logs.ts)** - Agent authorization tracking and patient access logs
- **[`src/routes/patients-new.ts`](file:///c:/Hackathons/Terminal%203/server/src/routes/patients-new.ts)** - Patient registration with custodial wallets, login, health record upload

### **Services**

- **[`src/services/agent-deployment.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/agent-deployment.ts)** - Agent creation, automatic patient authorization, batch eligibility runs
- **[`src/services/match-cache.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/match-cache.ts)** - MongoDB-based match caching (7-day expiry), cache invalidation
- **[`src/services/patient-onboarding.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/patient-onboarding.ts)** - Custodial wallet creation with AES-256-GCM encryption
- **[`src/services/database.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/database.ts)** - MongoDB connection and collection management
- **[`src/services/pdf-extractor.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/pdf-extractor.ts)** - PDF protocol parsing (text extraction)

### **Scripts**

- **[`src/scripts/seed.ts`](file:///c:/Hackathons/Terminal%203/server/src/scripts/seed.ts)** - Populates database with 5 trials and 10 comprehensive patient records
- **[`src/scripts/setup.ts`](file:///c:/Hackathons/Terminal%203/server/src/scripts/setup.ts)** - Registers TEE contracts, creates KV maps, seeds secrets vault
- **[`src/scripts/authorize.ts`](file:///c:/Hackathons/Terminal%203/server/src/scripts/authorize.ts)** - Grants agent authorization for patient contracts
- **[`src/scripts/invoke.ts`](file:///c:/Hackathons/Terminal%203/server/src/scripts/invoke.ts)** - End-to-end agent execution demo

---

## Key Architectural Decisions

### **1. Agent-Driven Batch Matching**

Agents autonomously scan all patients for trial eligibility instead of patient-initiated searches.

**Benefits:**
- Reduces patient friction (upload once, agents find trials)
- Scalable batch processing
- Agents have meaningful purpose (proactive matching)

**Implementation:**
```typescript
// Agent runs eligibility check for all patients
const patients = await getPatientCredentialsCollection().find({}).toArray();
for (const patient of patients) {
  const result = await teeClient.checkEligibility(trialId, patient.patientDid);
  await cacheMatchResult({ trialId, patientDid: patient.patientDid, ...result });
}
```

---

### **2. Match Result Caching**

All eligibility results (eligible AND non-eligible) cached in MongoDB for 7 days.

**Why Cache Non-Eligible?**
- Without: Agent runs on 50 patients → 2 eligible, 48 non-eligible
- Patient visits trial → Must re-run TEE for non-eligible (cache only helps 2/50 = 4%)
- With caching: All 50 results cached → 100% cache hit rate

**Cache Invalidation:**
- Patient uploads new health records → `invalidatePatientMatches(patientDid)`
- Trial criteria changes → `invalidateTrialMatches(trialId)`
- 7-day automatic expiry

**Implementation:** [`src/services/match-cache.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/match-cache.ts)

---

### **3. Custodial Wallet System**

Platform manages patient wallets (no MetaMask required).

**Why Custodial?**
- Reduces onboarding friction (patients don't need crypto wallets)
- Platform signs transactions on patient's behalf
- Private keys encrypted with AES-256-GCM before MongoDB storage

**Security:**
- Encryption key stored in `.env` (`WALLET_ENCRYPTION_KEY`)
- Keys decrypted only when needed for T3N operations
- MongoDB stores only encrypted blobs

**Implementation:** [`src/services/patient-onboarding.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/patient-onboarding.ts)

---

### **4. MockTEEClient Fallback**

Automatic fallback to mock implementation when `T3N_API_KEY` is missing.

**Benefits:**
- Local development without T3N testnet credentials
- Frontend can be developed/demoed without backend TEE setup
- Mock reads from same backend stores as real TEE

**Implementation:** [`src/tee-client.ts`](file:///c:/Hackathons/Terminal%203/server/src/tee-client.ts)

---

## MongoDB Collections

| Collection | Purpose | Key Fields |
|------------|---------|-----------|
| `trials` | Trial metadata | `id`, `name`, `phase`, `criteria`, `sponsor` |
| `patients` | Patient health records | `patientDid`, `demographics`, `diagnoses`, `medications` |
| `patient_credentials` | Encrypted wallet credentials | `patientDid`, `encryptedPrivateKey`, `ethAddress` |
| `agents` | Agent metadata | `agentDid`, `trialId`, `agentName`, `stats` |
| `match_results` | Cached eligibility results | `trialId`, `patientDid`, `eligible`, `confidence`, `expiresAt` |
| `access_logs` | Agent authorization events | `patientDid`, `requester`, `action`, `timestamp` |
| `pharma_organizations` | Pharma accounts | `name`, `did`, `createdAt` |

---

## Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://...        # MongoDB Atlas connection string
GROQ_API_KEY=gsk_...                # LLM for trial protocol parsing

# Optional (MockTEEClient used if omitted)
T3N_API_KEY=...                     # Terminal 3 testnet API key
PHARMA_TENANT_DID=did:t3n:...       # From setup.ts output
HOSPITAL_TENANT_DID=did:t3n:...     # From setup.ts output

# Auto-configured (already in .env)
WALLET_ENCRYPTION_KEY=...           # Generated 256-bit key
AGENT_KEY=...                       # Generated Ethereum private key
EHR_BASE_URL=http://localhost:3008  # Backend API URL
EHR_API_KEY=mock-ehr-key           # Sealed in TEE secrets vault
TRIALS_API_KEY=mock-trials-key     # Sealed in TEE secrets vault
NODE_ENV=development               # development = pino-pretty, production = JSON logs
```

---

## Running

```bash
# Development (with hot reload)
pnpm dev              # tsx watch mode, port 3008

# Production
pnpm build
pnpm start

# Testing
pnpm test             # vitest integration tests

# Database seeding
pnpm run seed         # 5 trials + 10 patients

# TEE setup (requires T3N_API_KEY)
pnpm run setup        # Register contracts
pnpm run authorize    # Grant agent permissions
pnpm run invoke       # Test agent execution
```

---

## Docker

```bash
# Build from project root
docker build -f server/Dockerfile -t trialmatch-server .

# Run
docker run -p 3008:3008 --env-file server/.env trialmatch-server
```

Multi-stage Dockerfile:
- Stage 1: pnpm install + TypeScript build
- Stage 2: Minimal runtime image with non-root user

---

## API Documentation

### Trial Management

```bash
# Create trial from protocol text
POST /api/trials/create
Body: { protocolText: "...", trialName?: "...", phase?: "II" }

# List all trials
GET /api/trials/all

# Get trial details
GET /api/trials/:id

# Check patient eligibility (with caching)
POST /api/trials/:id/check-eligibility
Body: { patientDid: "did:t3n:patient-001" }
```

### Match Results

```bash
# Get patient's eligible trials
GET /api/patients/:patientDid/matches

# Get all matches (pharma view)
GET /api/pharma/matches
```

### Pharma Organizations

```bash
# Register pharma
POST /api/pharma/register
Body: { name: "RayPharma", did: "did:t3n:org-001" }

# Login pharma
POST /api/pharma/login
Body: { name: "RayPharma" }
```

### Patient Management

```bash
# Register patient (creates custodial wallet)
POST /api/patients/register
Body: { email: "patient@example.com" }

# Login patient
POST /api/patients/login
Body: { email: "patient@example.com" }
```

### Access Logs

```bash
# Log agent authorization
POST /api/access-logs
Body: { patientDid, requester, action, purpose, ... }

# Get patient logs
GET /api/access-logs?patientDid=did:t3n:p1&limit=50
```

---

## Contract Integration

To understand TEE data flow, see the hospital screening contract: [`../contracts/hospital-screening/src/eligibility.rs`](file:///c:/Hackathons/Terminal%203/contracts/hospital-screening/src/eligibility.rs)

The contract:
1. Reads trial criteria from pharma's KV map (cross-tenant ACL)
2. Fetches patient data via `http-with-placeholders` (resolved host-side in TEE)
3. Evaluates inclusion/exclusion criteria inside Intel TDX enclave
4. Returns only eligibility boolean (no PHI exposed to agent)
