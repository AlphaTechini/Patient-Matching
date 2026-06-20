# Hospital Screening Contract

Terminal 3 TEE contract that evaluates patient eligibility against pharma trial criteria inside Intel TDX enclave.

## Current Implementation

This contract performs confidential patient-to-trial matching where:
- **Patient data never leaves the enclave** - matching happens entirely inside Intel TDX
- **Pharma never sees raw patient data** - only receives boolean eligibility results
- **Hospital maintains data sovereignty** - patient data fetched from hospital's backend API
- **Agent-driven execution** - agents invoke this contract during batch matching runs

---

## Key Architectural Decisions

### **1. Direct DID Passing (No Placeholders)**

**Decision:** Patient DID passed directly as input parameter instead of using Terminal 3's placeholder system (`{{profile.patient_id}}`).

**Input Structure:**
```rust
struct CheckEligibilityInput {
    trial_id: String,
    patient_did: String,  // Direct DID, not placeholder
}
```

**Rationale:**
- Simpler implementation for MVP
- More explicit - contract knows exactly which patient is being evaluated
- Easier to debug (DID visible in logs/traces)
- Still maintains TEE security guarantees

**Agent Flow:**
```
Agent → check-eligibility(trial_id, patient_did)
  ↓
Contract fetches patient data using patient_did
  ↓
Returns: { eligible: bool, confidence: f32 }
```

---

### **2. Dynamic EHR URL Configuration**

**Decision:** EHR base URL stored in secrets vault (KV store) instead of hardcoded in WASM.

**Implementation:**
```rust
fn get_ehr_base_url() -> Result<String, String> {
    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:secrets", hex::encode(&tid));
    let bytes = kv_store::get(&map_name, b"ehr_base_url")?;
    String::from_utf8(bytes)
}
```

**Rationale:**
- Environment flexibility (dev/staging/production without recompiling)
- Multi-hospital support (different hospitals = different backend URLs)
- Production-ready pattern (secrets in vault, not hardcoded)
- Matches API key storage pattern

**Setup:**
- `setup.ts` script seeds `ehr_base_url` in secrets vault during initialization
- Contract reads URL at runtime
- URL can be updated by re-running setup (no contract rebuild needed)

---

### **3. Backend API Integration**

**Decision:** Contract fetches patient data from TrialMatch backend (`GET /api/patients/:did/records`) instead of external EHR system.

**Data Flow:**
```
Patient uploads data → TrialMatch backend (MongoDB)
  ↓
Agent calls check-eligibility
  ↓
Contract fetches from /api/patients/:did/records (inside TEE)
  ↓
Evaluates criteria inside Intel TDX enclave
  ↓
Returns eligibility (no PHI exposed)
```

**Rationale:**
- Patients upload health data directly to TrialMatch platform
- No need to integrate with hospital's legacy EHR systems for MVP
- Simplifies demo while maintaining real TEE architecture
- Data still flows through TEE enclave for matching
- Architecture easily extensible to support real EHR integrations later

---

## Files

- **[`src/lib.rs`](file:///c:/Hackathons/Terminal%203/contracts/hospital-screening/src/lib.rs)** - WASM guest entry point (wit-bindgen dispatch)
- **[`src/eligibility.rs`](file:///c:/Hackathons/Terminal%203/contracts/hospital-screening/src/eligibility.rs)** - Core matching logic:
  - Reads trial criteria from pharma's KV map (cross-tenant read access via ACL)
  - Reads EHR base URL from secrets vault (`ehr_base_url` key)
  - Fetches patient data via `http-with-placeholders` from backend API
  - Evaluates inclusion/exclusion criteria inside TEE
  - Returns structured eligibility result (no raw patient data exposed)

---

## Contract Interface

### `check-eligibility`

Evaluates patient against trial criteria inside TEE enclave.

**Input:**
```json
{
  "trial_id": "TRIAL-2026-001",
  "patient_did": "did:t3n:patient-001"
}
```

**Process:**
1. Read trial criteria from pharma's `trial-criteria` KV map
2. Read EHR base URL from hospital's `secrets` vault
3. Fetch patient data via `http-with-placeholders` (inside TEE)
4. Evaluate inclusion criteria (all must match)
5. Evaluate exclusion criteria (none can match)
6. Calculate confidence score based on match quality

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

**Privacy Guarantee:**
- Patient health data (diagnoses, medications, lab results) processed entirely inside Intel TDX enclave
- Only eligibility boolean + confidence score returned to agent
- No PHI exposed outside TEE

---

## Building

```bash
# From contract directory
cd contracts/hospital-screening
cargo component build --release

# Output location
ls target/wasm32-wasip2/release/z_tenant_patient_screening.wasm
```

---

## Testing

The contract is tested via:
- **Integration tests:** [`../../server/src/tests/integration.test.ts`](file:///c:/Hackathons/Terminal%203/server/src/tests/integration.test.ts)
- **E2E flow:** [`../../server/src/tests/e2e-flow.ts`](file:///c:/Hackathons/Terminal%203/server/src/tests/e2e-flow.ts)
- **Agent deployment:** [`../../server/src/services/agent-deployment.ts`](file:///c:/Hackathons/Terminal%203/server/src/services/agent-deployment.ts) (live agent runs)

---

## Dependencies

**WIT Interfaces:**
- `host-interfaces-2.1.0` - kv-store, http-with-placeholders, tenant-context
- `host-tenant-1.0.0` - Tenant-specific capabilities

**Rust Crates:**
- `serde` + `serde_json` - JSON serialization
- `hex` - Tenant ID encoding
- `wit-bindgen` - WASM component model bindings

