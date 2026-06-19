# Hospital Screening Contract

Terminal 3 TEE contract that evaluates patient eligibility against pharma trial criteria.

## Architecture

This contract runs inside an Intel TDX (Trusted Execution Environment) enclave on the Terminal 3 network. It performs confidential patient-to-trial matching where:
- **Patient data never leaves the enclave** - matching happens entirely in the TEE
- **Pharma never sees raw patient data** - only receives anonymized eligibility results
- **Hospital maintains data sovereignty** - patient data is fetched from the hospital's own backend

### Key Architectural Decisions

#### 1. Direct DID Passing (No Placeholders)
**Decision:** Patient DID is passed directly as an input parameter instead of using Terminal 3's placeholder system (`{{profile.patient_id}}`).

**Rationale:**
- Simpler implementation for MVP/demo
- More explicit - contract knows exactly which patient is being evaluated
- Easier to debug and reason about
- Still maintains TEE security guarantees

**Impact:**
- Patient grants agent permission to call this function
- Agent explicitly passes the patient's DID
- Contract uses DID to fetch patient records from backend API

#### 2. Dynamic EHR URL Configuration
**Decision:** EHR base URL is stored in the secrets vault (KV store) instead of hardcoded in the contract.

**Rationale:**
- Enables dev/staging/production environment switching without recompiling WASM
- Different hospitals can use different backend URLs
- Follows same pattern as API key storage
- Production-ready architecture

**Impact:**
- Setup script (`setup.ts`) seeds `ehr_base_url` in secrets vault
- Contract reads URL at runtime via `get_ehr_base_url()`
- URL can be updated by re-running setup without rebuilding contract

#### 3. Backend API Integration
**Decision:** Contract fetches patient data from the TrialMatch backend (`/api/patients/:did/records`) instead of an external EHR system.

**Rationale:**
- Patients upload health data directly to TrialMatch platform
- No need to integrate with hospital's legacy EHR systems for MVP
- Simplifies demo while maintaining real TEE architecture
- Data still flows through TEE enclave for matching

**Impact:**
- Patient uploads → TrialMatch backend → TEE contract → Matching result
- TEE still provides confidential computation guarantees
- Architecture can easily be extended to support real EHR integrations

## Files

- [`src/lib.rs`](src/lib.rs) — WASM guest dispatch (wit-bindgen)
- [`src/eligibility.rs`](src/eligibility.rs) — `check-eligibility`:
  - Reads trial criteria from pharma's shared KV map (cross-tenant read access)
  - Reads EHR base URL from secrets vault (`ehr_base_url`)
  - Fetches patient data via `http-with-placeholders` from `/api/patients/:did/records`
  - Evaluates inclusion/exclusion criteria inside TEE
  - Returns structured eligibility result (no raw patient data exposed)

## Contract Interface

### `check-eligibility`

**Input:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "patient_did": "did:t3n:patient-001"
}
```

**Output:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "eligible": true,
  "confidence": 0.94,
  "matched_criteria": 14,
  "total_criteria": 14,
  "failed_criteria": []
}
```

## Building

```bash
cargo build --target wasm32-wasip2 --release
```

Output: `target/wasm32-wasip2/release/z_tenant_patient_screening.wasm`

