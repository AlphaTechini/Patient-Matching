use crate::host::interfaces::{kv_store, logging};
use crate::host::tenant::tenant_context;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct PublishTrialInput {
    trial_id: String,
    criteria: serde_json::Value,
}

#[derive(Serialize)]
struct PublishTrialOutput {
    trial_id: String,
    stored: bool,
}

pub fn publish_trial(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let input: PublishTrialInput = serde_json::from_slice(input_bytes)
        .map_err(|e| format!("publish-trial: invalid input: {e}"))?;

    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:trial-criteria", hex::encode(&tid));

    let criteria_bytes = serde_json::to_vec(&input.criteria)
        .map_err(|e| format!("publish-trial: serialize criteria: {e}"))?;

    kv_store::put(&map_name, input.trial_id.as_bytes(), &criteria_bytes)
        .map_err(|e| format!("publish-trial: kv write: {e}"))?;

    let _ = logging::info(&format!("trial {} published to {}", input.trial_id, map_name));

    let output = PublishTrialOutput {
        trial_id: input.trial_id,
        stored: true,
    };

    serde_json::to_vec(&output)
        .map_err(|e| format!("publish-trial: serialize output: {e}"))
}
