# Pharma Trial Contract

Terminal 3 TEE contract for pharma-sponsor trial management, criteria sharing, and match result recording.

## Current Implementation

This contract runs inside an Intel TDX (Trusted Execution Environment) enclave on the Terminal 3 network. It manages clinical trial criteria and records match results while maintaining patient privacy through:
- **Criteria stored in TEE KV maps** - shared securely with hospital contracts via ACLs
- **Cross-tenant data access** - hospital contracts read trial criteria without pharma involvement
- **Dual storage architecture** - trials stored in both backend (fast queries) and TEE (secure matching)
- **Backend-initiated publishing** - frontend never directly calls TEE contracts

---

## Key Architectural Decisions

### **1. Dual Storage Strategy (Backend + TEE)**

**Decision:** Trials stored in both backend JavaScript Map AND TEE KV store.

**Backend Storage:**
```typescript
// Fast reads for UI (trials.ts)
const trialsStore: Map<string, ParsedTrial> = new Map();
```

**TEE Storage:**
```rust
// Secure cross-tenant access (publish.rs)
kv_store::set(map_name, trial_id.as_bytes(), &criteria_json)?;
```

**Rationale:**
- **Backend storage** enables fast trial listing, search, filtering for UI
- **TEE storage** provides secure cross-tenant access for confidential matching
- **Graceful fallback** - MockTEEClient uses backend only, real TEE uses both
- **Production-ready** - supports both development (mock) and deployment (real TEE) modes

**Flow:**
```
1. Pharma creates trial via frontend
   ↓
2. POST /api/trials/create → stores in backend Map
   ↓
3. If TEEClient (not mock) → also publish to TEE KV store
   ↓
4. Trial queryable from backend (fast) + TEE (secure)
```

---

### **2. Cross-Tenant ACL Sharing**

**Decision:** Trial criteria stored in pharma's KV map is readable by hospital contracts via explicit ACLs.

**Setup Script Configuration:**
```typescript
// Grant hospital contract read access to pharma's trial-criteria map
await client.execute({
  function_name: "map-acls-set",
  input: {
    map_name: "trial-criteria",
    acls: [{
      principal: hospitalTenantDid,
      read: true,
      write: false
    }]
  }
});
```

**Rationale:**
- **Pharma ownership** - pharma maintains control of trial criteria
- **Hospital access** - hospital contract needs criteria to evaluate patients
- **Auditable** - ACL-based access control is logged and verifiable
- **Revocable** - pharma can revoke access by updating ACLs
- **Zero-trust** - follows principle of least privilege

**Hospital Contract Usage:**
```rust
// Hospital contract reads from pharma's KV map
let pharma_tid = ...; // from trial metadata
let map_name = format!("z:{}:trial-criteria", hex::encode(&pharma_tid));
let criteria = kv_store::get(&map_name, trial_id.as_bytes())?;
```

---

### **3. Backend-Initiated Publishing**

**Decision:** Backend automatically publishes trials to TEE when using real TEE client.

**Backend Logic:**
```typescript
// Store trial in backend
trialsStore.set(trialId, newTrial);

// Publish to TEE if using real TEEClient (not mock)
if (teeClient && typeof teeClient.publishTrial === 'function') {
  await teeClient.publishTrial(trialId, newTrial.criteria);
}
```

**Rationale:**
- **User experience** - pharma users interact with REST API, not TEE contracts directly
- **Backend handles complexity** - TEE authentication, contract calls, error handling
- **Graceful degradation** - falls back to backend-only storage when MockTEEClient active
- **Smooth transition** - same API contract regardless of TEE deployment mode
- **MVP-appropriate** - enables rapid development with or without T3N credentials

---

### **4. Match Result Storage (Future)**

**Planned Feature:** Record match results with patient identity hashing.

**Privacy Design:**
```rust
// Hash patient DID before storing
let patient_hash = hash_patient_id(&patient_id);
kv_store::set("match-results", &result_key, &json!({
  "patient_hash": patient_hash,  // Not raw DID
  "eligible": true,
  "confidence": 0.94
}))?;
```

**Rationale:**
- **Pharma doesn't need patient identity** until application stage
- **Prevents patient tracking** across multiple trial queries
- **HIPAA compliance** - no PII stored without consent
- **Deduplication** - same hash = same patient (without revealing identity)

**Current Status:** Match results currently cached in MongoDB backend (`match_results` collection) instead of TEE KV maps for MVP simplicity.

---

## Files

- **[`src/lib.rs`](file:///c:/Hackathons/Terminal%203/contracts/pharma-trial/src/lib.rs)** - WASM guest entry point (wit-bindgen dispatch)
- **[`src/publish.rs`](file:///c:/Hackathons/Terminal%203/contracts/pharma-trial/src/publish.rs)** - `publish-trial` function:
  - Stores trial criteria in `z:<tid>:trial-criteria` KV map
  - Returns confirmation of storage
- **[`src/criteria.rs`](file:///c:/Hackathons/Terminal%203/contracts/pharma-trial/src/criteria.rs)** - `get-trial-criteria` function:
  - Reads criteria from KV map
  - Used by hospital contract during matching
- **[`src/results.rs`](file:///c:/Hackathons/Terminal%203/contracts/pharma-trial/src/results.rs)** - `submit-match-result` function (placeholder):
  - Intended to hash patient DID for privacy
  - Record eligibility result in `z:<tid>:match-results` KV map
  - Currently unused (backend caching used instead for MVP)

---

## Contract Interface

### `publish-trial`

Stores trial criteria in TEE KV map for cross-tenant access.

**Input:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "criteria": {
    "inclusion": [
      {
        "field": "diagnosis_codes",
        "expected": "C34.9",
        "description": "NSCLC diagnosis"
      }
    ],
    "exclusion": [
      {
        "field": "allergies",
        "expected": "peanut",
        "description": "Peanut allergy"
      }
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

---

### `get-trial-criteria`

Retrieves trial criteria (called by hospital contract during matching).

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
  "criteria": {
    "inclusion": [...],
    "exclusion": [...]
  }
}
```

---

### `submit-match-result` (Placeholder)

Records match result with patient identity hashing.

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

**Note:** Currently not used in MVP. Match results cached in MongoDB backend (`match_results` collection) via `match-cache` service instead.

---

## Building

```bash
# From contract directory
cd contracts/pharma-trial
cargo component build --release

# Output location
ls target/wasm32-wasip2/release/z_tenant_trial_matching.wasm
```

---

## Testing

The contract is tested via:
- **Setup script:** [`../../server/src/scripts/setup.ts`](file:///c:/Hackathons/Terminal%203/server/src/scripts/setup.ts) (registers contract, creates KV maps, sets ACLs)
- **Backend integration:** [`../../server/src/routes/trials.ts`](file:///c:/Hackathons/Terminal%203/server/src/routes/trials.ts) (calls `publishTrial()` on trial creation)
- **Cross-tenant reads:** Hospital screening contract reads from this contract's KV maps

---

## Dependencies

**WIT Interfaces:**
- `host-interfaces-2.1.0` - kv-store, tenant-context
- `host-tenant-1.0.0` - Tenant-specific capabilities

**Rust Crates:**
- `serde` + `serde_json` - JSON serialization
- `hex` - Tenant ID encoding
- `wit-bindgen` - WASM component model bindings

