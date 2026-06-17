use crate::host::interfaces::{kv_store, logging};
use crate::host::tenant::tenant_context;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct GetTrialCriteriaInput {
    trial_id: String,
}

#[derive(Serialize)]
struct TrialCriteriaOutput {
    trial_id: String,
    criteria: serde_json::Value,
}

pub fn get_trial_criteria(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let input: GetTrialCriteriaInput = serde_json::from_slice(input_bytes)
        .map_err(|e| format!("get-trial-criteria: invalid input: {e}"))?;

    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:trial-criteria", hex::encode(&tid));

    let criteria_bytes = kv_store::get(&map_name, input.trial_id.as_bytes())
        .map_err(|e| format!("get-trial-criteria: kv read: {e}"))?
        .ok_or(format!("get-trial-criteria: trial '{}' not found in {}", input.trial_id, map_name))?;

    let criteria: serde_json::Value = serde_json::from_slice(&criteria_bytes)
        .map_err(|e| format!("get-trial-criteria: deserialize criteria: {e}"))?;

    let _ = logging::info(&format!("criteria fetched for trial {}", input.trial_id));

    let output = TrialCriteriaOutput {
        trial_id: input.trial_id,
        criteria,
    };

    serde_json::to_vec(&output)
        .map_err(|e| format!("get-trial-criteria: serialize output: {e}"))
}
