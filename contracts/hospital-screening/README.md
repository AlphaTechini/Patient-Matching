# Hospital Screening Contract

Terminal 3 TEE contract that evaluates patient eligibility against pharma trial criteria.

## Files

- [`src/lib.rs`](src/lib.rs) — WASM guest dispatch (wit-bindgen)
- [`src/eligibility.rs`](src/eligibility.rs) — `check-eligibility`:
  - Reads trial criteria from pharma's shared KV map
  - Fetches patient EHR via `http-with-placeholders` using `{{profile.patient_id}}` — resolved host-side inside the TDX enclave so the raw ID never enters guest memory
  - Evaluates inclusion/exclusion criteria and returns a structured result (no raw patient data)
- [`src/profile.rs`](src/profile.rs) — `get-patient-profile-fields`: documents fields available for placeholder resolution
