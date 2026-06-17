# Solution: TrialMatch — TEE-Governed Patient Matching

## Overview

TrialMatch is a confidential patient-to-clinical-trial matching system built on the Terminal 3 Agent Developer Kit (ADK). It uses Trusted Execution Environments (TEEs) to match patients against trial criteria without ever exposing raw patient health data to the matching logic, the platform, or any unauthorized party.

---

## Actors & Their Roles

| Actor | T3N Role | What They Hold |
|---|---|---|
| **Pharma Sponsor** | Tenant A | Trial protocols, inclusion/exclusion criteria |
| **Hospital / Site** | Tenant B | Patient EHRs, medical records |
| **CRO** | Tenant C | Trial operations, site coordination |
| **Patient** | User (data owner) | Their own health data, consent |
| **Matching Agent** | Agent (authenticated via DID) | Executes matching logic inside TEE |

---

## Architecture

### Phase 1: Setup (Tenant Operations)

#### 1. Pharma Sponsor — Register Trial Contract

**Rust WASM contract exports:**
- `publish-trial` — stores trial criteria in a KV map
- `get-trial-criteria` — returns criteria for matching
- `submit-match-result` — records match outcome

**Build + Register:**
```bash
cargo build --target wasm32-wasip2 --release
```
```typescript
const result = await tenant.contracts.register({
  tail: "trial-matching",
  version: "0.1.0",
  wasm: wasmBytes,
});
const pharmaContractId = result.contract_id;
```

#### 2. Hospital — Register Patient Screening Contract

**Rust WASM contract exports:**
- `check-eligibility` — matches patient against trial criteria
- `get-patient-profile-fields` — returns available profile fields

**Imports in `world.wit`:**
```wit
import host:tenant/tenant-context@1.0.0;
import host:interfaces/logging@2.1.0;
import host:interfaces/kv-store@2.1.0;
import host:interfaces/http@2.1.0;                    // fetch trial criteria
import host:interfaces/http-with-placeholders@2.1.0;  // PII-safe EHR access
```

#### 3. Create KV Maps with ACLs

```typescript
// Pharma tenant — trial criteria (shared with hospital for matching)
await tenant.maps.create({
  tail: "trial-criteria",
  visibility: "private",
  writers: { only: [pharmaContractId] },
  readers: { only: [pharmaContractId, hospitalContractId] },
});

// Pharma tenant — secrets (API keys, never shared)
await tenant.maps.create({
  tail: "secrets",
  visibility: "private",
  writers: { only: [pharmaContractId] },
  readers: { only: [pharmaContractId] },
});

// Hospital tenant — match results (shared with pharma)
await tenant.maps.create({
  tail: "match-results",
  visibility: "private",
  writers: { only: [hospitalContractId] },
  readers: { only: [hospitalContractId, pharmaContractId] },
});
```

#### 4. Seed API Keys (Secrets Vault)

```typescript
await tenant.executeControl("map-entry-set", {
  map_name: tenant.canonicalName("secrets"),
  key:      "ehr_api_key",
  value:    process.env.EHR_API_KEY!,
});
```

- Key sealed inside TEE via `map-entry-set` — bypasses writers ACL
- Not visible to agent, developer, or platform
- Contract reads at runtime: `kv_store::get("secrets", "ehr_api_key")`

---

### Phase 2: Patient Authorization

#### 5. Patient Grants the Matching Agent

```typescript
// Signed by the PATIENT (data owner), not the agent
await userClient.execute({
  script_name: "tee:user/contracts",
  script_version: userContractVersion,
  function_name: "agent-auth-update",
  input: {
    agents: [{
      agentDid: matchingAgentDid,
      scripts: [{
        scriptName: `z:${hospitalTenantId}:patient-screening`,
        versionReq: hospitalScriptVersion,
        functions: ["check-eligibility"],
        allowedHosts: ["ehr.hospital-system.com"],
      }, {
        scriptName: `z:${pharmaTenantId}:trial-matching`,
        versionReq: pharmaScriptVersion,
        functions: ["get-trial-criteria", "submit-match-result"],
        allowedHosts: ["trials.pharma-company.com"],
      }],
    }],
  },
});
```

The patient controls:
- Which contracts the agent can call
- Which functions within each contract
- Which external hosts the contract may reach

Without this grant, the contract runs but outbound calls are denied with `host/http.egress_denied`.

---

### Phase 3: Matching Execution (Inside the TEE)

#### 6. Agent Invokes Hospital's Screening Contract

```typescript
const result = await agentClient.executeAndDecode({
  script_name: `z:${hospitalTenantId}:patient-screening`,
  script_version: hospitalScriptVersion,
  function_name: "check-eligibility",
  input: {
    trial_id: "TRIAL-2026-001",
    patient_id: "PAT-12345",  // opaque ID — not PII
  },
});
// → { eligible: true, confidence: 0.94, matched_criteria: 47, total_criteria: 50 }
```

#### Inside the WASM Contract (`check-eligibility`)

```rust
// 1. Read trial criteria from KV map (shared by pharma)
let criteria_bytes = kv_store::get(&pharma_criteria_map, trial_id)
    .ok_or("trial criteria not found")?;
let criteria: TrialCriteria = serde_json::from_slice(&criteria_bytes)?;

// 2. Fetch patient data from hospital EHR via http-with-placeholders
//    PII markers resolved host-side — never enter WASM memory
let ehr_resp = hwp::call(&hwp::Request {
    method: hwp::Verb::Get,
    url: format!("{EHR_BASE}/patients/{patient_id}/records"),
    headers: Some(ehr_headers(&api_key)),
    payload: None,
    // Placeholders in the request body resolve patient PII inside the enclave:
    // The contract never sees: name, DOB, diagnosis codes, lab results in plaintext
})?;

// 3. Match criteria against patient data (inside TDX enclave)
let match_result = evaluate_eligibility(&criteria, &ehr_resp.payload);

// 4. Return match result — NOT raw patient data
Ok(serde_json::to_vec(&EligibilityResult {
    eligible: match_result.eligible,
    confidence: match_result.confidence,
    matched_criteria: match_result.matched_count,
    total_criteria: criteria.len(),
    // NO patient name, NO diagnosis, NO lab values
})?)
```

**Key protection:** `{{profile.*}}` placeholders mean the contract's WASM memory **never contains** the patient's name, date of birth, diagnosis codes, or lab values. The host resolves them inside the enclave just before the EHR request goes out.

---

### Phase 4: Cross-Tenant Match Recording

#### 7. Hospital Contract Calls Pharma Contract

```rust
// Inside hospital's WASM contract, after eligibility check:
let match_record = MatchRecord {
    trial_id: "TRIAL-2026-001",
    patient_hash: hash_patient_id(patient_id),  // anonymized
    eligible: true,
    timestamp: now(),
    agent_did: context.agent_did,
};

// Cross-tenant call to pharma's contract
let _ = execute_business_contract(
    &pharma_tenant,
    "trial-matching",
    "submit-match-result",
    &match_record,
);
```

#### 8. Pharma Contract Records Match

```rust
// Inside pharma's WASM contract:
kv_store::put(&match_results_map, &record.trial_id, &serde_json::to_vec(&record)?);
```

---

### Phase 5: Audit & Compliance

#### 9. Immutable Audit Trail

T3N automatically records:
- Agent authentication (DID verified)
- Contract invocation (which function, which version)
- KV map reads/writes (what was accessed, by whom)
- HTTP egress (which host was called, authorized by whose grant)
- Cross-tenant calls (which tenant, which contract)

**Regulators can independently verify:**
- The matching agent had verifiable identity
- The patient authorized the specific functions and hosts
- Patient PII was processed via placeholders (never entered contract)
- Match results were recorded immutably

---

## ADK Capability Mapping

| ADK Feature | How We Use It |
|---|---|
| **TEE Contracts (WASM)** | Matching logic runs inside Intel TDX — code + data invisible to all parties |
| **Agent Auth (DID)** | Every party has cryptographic identity recognized by any counterparty |
| **KV Maps + ACLs** | Trial criteria shared between pharma and hospital; match results isolated |
| **Secrets Vault** | EHR API keys sealed in TEE — bypasses writers ACL, never visible outside |
| **HTTP with Placeholders** | Patient PII resolved host-side — never enters WASM contract |
| **Outbound HTTP (user-granted)** | Agent can only call EHR endpoints the patient explicitly authorized |
| **Cross-tenant calls** | Hospital contract records match in pharma's contract without raw data exchange |
| **Capabilities from WIT** | Contract imports only what it needs — no excess permissions |
| **Hardware-enforced isolation** | Every read/write checked against tenant prefix inside T3N |

---

## Repository Structure

```
trialmatch/
├── contracts/
│   ├── pharma-trial/          # Pharma sponsor's TEE contract
│   │   ├── src/
│   │   │   ├── lib.rs         # wit-bindgen entry + dispatch
│   │   │   ├── publish.rs     # publish-trial
│   │   │   ├── criteria.rs    # get-trial-criteria
│   │   │   └── results.rs     # submit-match-result
│   │   ├── wit/
│   │   │   ├── world.wit
│   │   │   └── deps/
│   │   └── Cargo.toml
│   │
│   └── hospital-screening/    # Hospital's TEE contract
│       ├── src/
│       │   ├── lib.rs         # wit-bindgen entry + dispatch
│       │   ├── eligibility.rs # check-eligibility
│       │   └── profile.rs     # get-patient-profile-fields
│       ├── wit/
│       │   ├── world.wit
│       │   └── deps/
│       └── Cargo.toml
│
├── scripts/
│   ├── setup.ts               # Tenant onboarding, contract registration, KV maps, secrets
│   ├── authorize.ts           # Patient grant (agent-auth-update)
│   └── invoke.ts              # Agent invokes matching, records results
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Competitive Differentiation

| | Deep 6 AI | TriNetX | **TrialMatch (TEE Agent)** |
|---|---|---|---|
| Matching logic visibility | Visible to Tempus engineers | Visible to TriNetX platform | **Inside TDX — invisible to everyone** |
| Patient PII handling | Processed in cloud memory | Shared across federated nodes | **Placeholders — never enters contract** |
| Audit trail | Internal logs (editable) | Internal logs (editable) | **T3N ledger (tamper-resistant)** |
| Identity | Platform-managed accounts | Institutional trust | **Cryptographic DIDs (verifiable by any party)** |
| Cross-boundary | Walled-garden | Walled-garden | **Cross-tenant calls (neutral layer)** |
| Regulatory compliance | Asserted | Asserted | **Demonstrable via cryptographic attestation** |

---

## Next Steps

1. Set up dev environment (Rust WASM toolchain, SDK)
2. Build hospital screening contract (WIT interface + Rust logic)
3. Build pharma trial contract (WIT interface + Rust logic)
4. Write setup scripts (tenant onboarding, registration, KV maps, secrets)
5. Write authorization script (patient grant)
6. Write invocation script (agent matching flow)
7. Test end-to-end on T3N testnet
