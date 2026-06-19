# Pharma Trial Contract

Terminal 3 TEE contract for pharma-sponsor trial management and match result recording.

## Architecture

This contract runs inside an Intel TDX (Trusted Execution Environment) enclave on the Terminal 3 network. It manages clinical trial criteria and records match results while maintaining patient privacy through:
- **Criteria stored in TEE KV maps** - shared securely with hospital contracts via ACLs
- **Patient identity hashing** - match results use cryptographic hashes, not raw patient IDs
- **Verifiable audit trail** - all operations are logged and immutable

### Key Architectural Decisions

#### 1. Dual Storage Strategy (Backend + TEE)
**Decision:** Trials are stored both in the backend (JavaScript Map) and in the TEE KV store.

**Rationale:**
- Backend storage enables fast trial listing, search, and management
- TEE storage provides secure cross-tenant access for matching
- Graceful fallback to MockTEEClient for development without T3N credentials
- Production-ready architecture that supports both modes

**Impact:**
- Trial creation: `POST /api/trials/create` → stores in backend → optionally publishes to TEE
- Trial retrieval: Fast reads from backend for UI
- Matching: Uses TEE storage for confidential computation

#### 2. Cross-Tenant ACL Sharing
**Decision:** Trial criteria stored in pharma's KV map is readable by hospital contracts via explicit ACLs.

**Rationale:**
- Pharma maintains ownership of trial criteria
- Hospital contract needs criteria to evaluate patients
- ACL-based access control is auditable and revocable
- Follows zero-trust security model

**Impact:**
- Setup script grants hospital contract read access to `trial-criteria` map
- Hospital contract can fetch criteria without pharma involvement
- Pharma can revoke access by updating ACLs

#### 3. Patient Identity Hashing
**Decision:** Match results store a cryptographic hash of the patient DID, not the raw DID.

**Rationale:**
- Pharma doesn't need to know patient identity until application
- Prevents patient tracking across multiple trial queries
- Maintains HIPAA compliance and privacy guarantees
- Still allows deduplication (same hash = same patient)

**Impact:**
- `submit-match-result` hashes patient_id before storing
- Pharma sees only: trial_id, patient_hash, eligibility, confidence
- Patient can reveal identity only when actively applying

#### 4. Backend-Initiated Publishing
**Decision:** Backend automatically publishes trials to TEE when using real TEE client.

**Rationale:**
- Pharma users interact with backend API, not TEE contracts directly
- Backend handles complexity of TEE authentication and calls
- Falls back gracefully when MockTEEClient is active
- Enables smooth dev-to-production transition

**Impact:**
- Real TEE: Backend publishes to both storage systems
- Mock TEE: Backend only stores locally, no TEE calls
- Same API contract regardless of deployment mode

## Files

- [`src/lib.rs`](src/lib.rs) — WASM guest dispatch (wit-bindgen)
- [`src/publish.rs`](src/publish.rs) — `publish-trial`:
  - Stores trial criteria in `z:<tid>:trial-criteria` KV map
  - Returns confirmation of storage
- [`src/criteria.rs`](src/criteria.rs) — `get-trial-criteria`:
  - Reads criteria from KV map
  - Used by hospital contract during matching
- [`src/results.rs`](src/results.rs) — `submit-match-result`:
  - Hashes patient DID for privacy
  - Records eligibility result in `z:<tid>:match-results` KV map
  - Returns confirmation with patient hash

## Contract Interface

### `publish-trial`

**Input:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "criteria": {
    "inclusion": [
      {"field": "diagnosis_codes", "expected": "C34.9", "description": "NSCLC diagnosis"}
    ],
    "exclusion": [
      {"field": "allergies", "expected": "peanut", "description": "Peanut allergy"}
    ]
  }
}
```

**Output:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "stored": true
}
```

### `get-trial-criteria`

**Input:**
```json
{
  "trial_id": "TRIAL-2026-001"
}
```

**Output:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "criteria": { /* same structure as publish input */ }
}
```

### `submit-match-result`

**Input:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "patient_id": "did:t3n:patient-001",
  "eligible": true,
  "confidence": 0.94,
  "matched_criteria": 14,
  "total_criteria": 14
}
```

**Output:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "patient_hash": "a1b2c3d4e5f67890",
  "eligible": true,
  "recorded": true
}
```

## Building

```bash
cargo build --target wasm32-wasip2 --release
```

Output: `target/wasm32-wasip2/release/z_tenant_trial_matching.wasm`

