# Pharma Trial Contract

Terminal 3 TEE contract for pharma-sponsor trial data.

## Files

- [`src/lib.rs`](src/lib.rs) — WASM guest dispatch (wit-bindgen)
- [`src/publish.rs`](src/publish.rs) — `publish-trial`: stores criteria in `z:<tid>:trial-criteria`
- [`src/criteria.rs`](src/criteria.rs) — `get-trial-criteria`: reads criteria from the KV map
- [`src/results.rs`](src/results.rs) — `submit-match-result`: records hashed patient match results in `z:<tid>:match-results`
