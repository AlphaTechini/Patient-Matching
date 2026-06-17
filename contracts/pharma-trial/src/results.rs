use crate::host::interfaces::{kv_store, logging};
use crate::host::tenant::tenant_context;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct SubmitMatchResultInput {
    trial_id: String,
    patient_id: String,
    eligible: bool,
    confidence: f64,
    matched_criteria: u32,
    total_criteria: u32,
}

#[derive(Serialize)]
struct MatchResultOutput {
    trial_id: String,
    patient_hash: String,
    eligible: bool,
    recorded: bool,
}

fn hash_patient_id(patient_id: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    patient_id.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

pub fn submit_match_result(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let input: SubmitMatchResultInput = serde_json::from_slice(input_bytes)
        .map_err(|e| format!("submit-match-result: invalid input: {e}"))?;

    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:match-results", hex::encode(&tid));

    let patient_hash = hash_patient_id(&input.patient_id);

    let result_record = serde_json::json!({
        "trial_id": input.trial_id,
        "patient_hash": patient_hash,
        "eligible": input.eligible,
        "confidence": input.confidence,
        "matched_criteria": input.matched_criteria,
        "total_criteria": input.total_criteria,
    });

    let result_bytes = serde_json::to_vec(&result_record)
        .map_err(|e| format!("submit-match-result: serialize result: {e}"))?;

    let key = format!("{}:{}", input.trial_id, patient_hash);
    kv_store::put(&map_name, key.as_bytes(), &result_bytes)
        .map_err(|e| format!("submit-match-result: kv write: {e}"))?;

    let _ = logging::info(&format!(
        "match result recorded: trial={} patient_hash={} eligible={}",
        input.trial_id, patient_hash, input.eligible
    ));

    let output = MatchResultOutput {
        trial_id: input.trial_id,
        patient_hash,
        eligible: input.eligible,
        recorded: true,
    };

    serde_json::to_vec(&output)
        .map_err(|e| format!("submit-match-result: serialize output: {e}"))
}
