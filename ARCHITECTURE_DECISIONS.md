# TrialMatch: Architectural Decisions & Implementation Notes

This document captures the key architectural decisions made during development, the rationale behind them, and their impact on the system.

---

## 🎯 **Core Design Philosophy**

**Goal:** Build a production-ready TEE-based clinical trial matching system that works for both MVP demo and real-world deployment.

**Approach:** Dual-mode architecture that gracefully falls back from real TEE to mock TEE, enabling rapid development and testing without compromising production architecture.

---

## 📊 **Major Architectural Decisions**

### **1. Dual Storage Strategy (Backend + TEE)**

**Decision:** Store trials in both JavaScript Map (backend) and TEE KV store (contracts).

**Rationale:**
- Backend storage enables fast queries for UI (list trials, search, filter)
- TEE storage provides secure cross-tenant access for confidential matching
- Graceful fallback: MockTEEClient uses backend only, real TEE uses both
- Production-ready: supports both development and deployment modes

**Implementation:**
- `POST /api/trials/create` stores in backend Map
- If using real TEE, also calls `teeClient.publishTrial()` to store in KV map
- MockTEEClient reads from backend Map
- Real TEE reads from KV map

**Files Changed:**
- `server/src/routes/trials.ts` - Added TEE publishing logic
- `server/src/tee-client.ts` - Added `publishTrial()` method
- `contracts/pharma-trial/src/publish.rs` - Stores in KV map

---

### **2. Direct DID Passing (Not Placeholder-Based)**

**Decision:** Pass patient DID directly as input parameter instead of using Terminal 3's placeholder system (`{{profile.patient_id}}`).

**Rationale:**
- **Simpler implementation** - No complex placeholder resolution setup
- **More explicit** - Contract knows exactly which patient to evaluate
- **Easier debugging** - Can see DID in logs and traces
- **Still secure** - TEE guarantees apply regardless of input method
- **MVP-appropriate** - Reduces complexity for hackathon timeline

**Implementation:**
```rust
struct CheckEligibilityInput {
    trial_id: String,
    patient_did: String,  // Direct DID
}
```

**Files Changed:**
- `contracts/hospital-screening/src/eligibility.rs` - Added `patient_did` field
- `contracts/hospital-screening/src/lib.rs` - Removed `get_patient_profile_fields`
- `contracts/hospital-screening/wit/world.wit` - Removed function from interface
- Deleted `contracts/hospital-screening/src/profile.rs`

---

### **3. Dynamic EHR URL Configuration**

**Decision:** Store EHR base URL in secrets vault instead of hardcoding in WASM.

**Rationale:**
- **Environment flexibility** - Switch between dev/staging/prod without recompiling
- **Multi-tenant support** - Different hospitals can use different backends
- **Production-ready** - Follows security best practices (secrets in vault)
- **Follows existing pattern** - API keys already stored this way

**Implementation:**
```rust
fn get_ehr_base_url() -> Result<String, String> {
    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:secrets", hex::encode(&tid));
    let bytes = kv_store::get(&map_name, b"ehr_base_url")?;
    String::from_utf8(bytes)
}
```

**Files Changed:**
- `contracts/hospital-screening/src/eligibility.rs` - Added `get_ehr_base_url()`
- `server/src/scripts/setup.ts` - Seeds `ehr_base_url` in secrets vault
- `server/.env` - Added `EHR_BASE_URL` variable

---

### **4. Patient Data Stored in Backend (Not External EHR)**

**Decision:** Patients upload health data to TrialMatch backend, not external EHR system.

**Rationale:**
- **MVP simplification** - No need to integrate with hospital EHR systems
- **User control** - Patients own and manage their data
- **Still TEE-secured** - Data flows through TEE enclave for matching
- **Extensible** - Can add external EHR integration later

**Implementation:**
- Frontend: Patient uploads → `POST /api/patients/upload`
- Backend: Stores in Map (`patientsStore`)
- Contract: Calls `GET /api/patients/:did/records` via `http-with-placeholders`
- TEE enclave: Fetches data, evaluates, returns result

**Files Changed:**
- `server/src/routes/patients.ts` - Added `/patients/:did/records` endpoint
- `contracts/hospital-screening/src/eligibility.rs` - Updated URL to backend

---

### **5. Removed TenantClient Instances**

**Decision:** Use `agentClient.executeAndDecode()` directly instead of `TenantClient` wrappers.

**Rationale:**
- **Simpler code** - One client instead of three (agent, pharma, hospital)
- **More explicit** - Script names show exactly which contract is called
- **Agent-appropriate** - Matches the agent-based authorization model
- **No functional difference** - TenantClient is just a wrapper around T3nClient

**Implementation:**
```typescript
// Before:
await this.pharmaTenant.execute({ function_name: "get-trial-criteria", ... })

// After:
await this.agentClient.executeAndDecode({
  script_name: "z:{pharmaTenantId}:trial-matching",
  script_version: "0.1.0",
  function_name: "get-trial-criteria",
  ...
})
```

**Files Changed:**
- `server/src/tee-client.ts` - Removed `pharmaTenant` and `hospitalTenant`

---

### **6. MockTEEClient Dynamic Data Sources**

**Decision:** MockTEEClient reads from trials and patients stores dynamically instead of hardcoded mock data.

**Rationale:**
- **Consistent behavior** - Mock matches real TEE behavior
- **Development speed** - Test real data flows without TEE setup
- **Integration testing** - Backend routes work with mock client
- **Demo-ready** - Can demo full flow without T3N credentials

**Implementation:**
```typescript
async checkEligibility(trialId: string, patientDid: string) {
  const { getTrialsStore } = await import("./routes/trials");
  const trial = getTrialsStore().get(trialId);
  const patientData = getPatientData(patientDid);
  return evaluateCriteria(trial.criteria, patientData);
}
```

**Files Changed:**
- `server/src/tee-client.ts` - Updated `MockTEEClient` methods
- `server/src/routes/trials.ts` - Exported `getTrialsStore()`
- `server/src/routes/patients.ts` - Exported `getPatientData()`

---

### **7. Authorization Uses Dynamic Backend URL**

**Decision:** `allowedHosts` reads from environment variable instead of hardcoded host.

**Rationale:**
- **Environment flexibility** - Works with localhost, staging, production
- **No authorization recompile** - Change URL without re-running authorize script
- **Matches contract URL** - Backend URL consistent across system

**Implementation:**
```typescript
allowedHosts: [
  process.env.EHR_BASE_URL?.replace(/^https?:\/\//, "") || "localhost:3008"
]
```

**Files Changed:**
- `server/src/scripts/authorize.ts` - Dynamic host extraction

---

## 🔧 **Technical Implementation Details**

### **Environment Variables Added**

```env
# Backend API URL for TEE contracts
EHR_BASE_URL=http://localhost:3008

# Mock API keys for development
EHR_API_KEY=mock-ehr-key
TRIALS_API_KEY=mock-trials-key
AGENT_KEY=mock-agent-key
```

### **New Backend Endpoints**

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `GET /api/patients/:did/records` | Return patient health data | TEE contract |
| `POST /api/trials/create` | Create and optionally publish trial | Frontend |
| `GET /api/trials/all` | List all trials | Frontend |

### **Contract Changes Summary**

| Contract | Changes | Impact |
|----------|---------|--------|
| hospital-screening | Added `patient_did` input, dynamic URL, removed profile function | Simpler, more maintainable |
| pharma-trial | No changes needed | Already correct |

### **Build Artifacts**

```
contracts/pharma-trial/target/wasm32-wasip2/release/
  └─ z_tenant_trial_matching.wasm

contracts/hospital-screening/target/wasm32-wasip2/release/
  └─ z_tenant_patient_screening.wasm
```

---

## 📈 **Impact Analysis**

### **Development Velocity**
- ✅ Faster iteration (no WASM recompilation for config changes)
- ✅ Local development without T3N credentials
- ✅ Easier debugging with explicit parameters

### **Production Readiness**
- ✅ Supports real TEE deployment
- ✅ Environment-based configuration
- ✅ Secure secrets management
- ✅ Graceful fallback mechanisms

### **Code Maintainability**
- ✅ Cleaner contract code (removed unused functions)
- ✅ Simplified client architecture (no redundant TenantClients)
- ✅ Clear data flow (backend → TEE → result)

### **Security Posture**
- ✅ Still maintains TEE confidentiality guarantees
- ✅ Patient data encrypted in transit
- ✅ Matching happens inside enclave
- ✅ No raw patient data exposed to pharma

---

## 🎯 **Future Enhancements**

### **Potential Improvements**

1. **External EHR Integration**
   - Add support for HL7 FHIR endpoints
   - Implement EHR system authentication
   - Support multiple EHR vendors

2. **Advanced Matching**
   - Fuzzy matching for diagnosis codes
   - Probabilistic criteria evaluation
   - Machine learning-based ranking

3. **Real-time Notifications**
   - WebSocket updates for new matches
   - Email notifications for pharma sponsors
   - SMS alerts for patients

4. **Enhanced Privacy**
   - Zero-knowledge proofs for eligibility
   - Differential privacy for aggregate statistics
   - Homomorphic encryption for sensitive fields

---

## 📚 **References**

- [Terminal 3 ADK Documentation](https://docs.terminal3.io/developers/adk/overview/what-is-adk)
- [Contract Architecture Diagrams](./README.md#architecture)
- [Backend API Documentation](./BACKEND_IMPLEMENTATION.md)
- [Demo User Flow](./Demo_User_Flow.md)

---

**Last Updated:** June 19, 2026  
**Contract Build:** Successfully compiled both WASM contracts  
**Backend Status:** All routes implemented and tested  
**Ready For:** Frontend integration and real TEE deployment
