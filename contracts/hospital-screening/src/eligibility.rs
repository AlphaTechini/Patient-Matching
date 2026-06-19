use crate::host::interfaces::{http_with_placeholders as hwp, kv_store, logging};
use crate::host::tenant::tenant_context;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CheckEligibilityInput {
    trial_id: String,
    patient_did: String,
}

#[derive(Serialize)]
struct EligibilityResult {
    trial_id: String,
    eligible: bool,
    confidence: f64,
    matched_criteria: u32,
    total_criteria: u32,
    failed_criteria: Vec<String>,
}

#[derive(Deserialize)]
struct TrialCriteria {
    #[allow(dead_code)]
    trial_id: String,
    inclusion: Vec<serde_json::Value>,
    exclusion: Vec<serde_json::Value>,
}

fn get_api_key() -> Result<String, String> {
    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:secrets", hex::encode(&tid));
    let bytes = kv_store::get(&map_name, b"ehr_api_key")
        .map_err(|e| format!("kv read: {e}"))?
        .ok_or("ehr_api_key not found in z:<tid>:secrets — populate it via the tenant SDK before use")?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

fn get_ehr_base_url() -> Result<String, String> {
    let tid = tenant_context::tenant_did();
    let map_name = format!("z:{}:secrets", hex::encode(&tid));
    let bytes = kv_store::get(&map_name, b"ehr_base_url")
        .map_err(|e| format!("kv read: {e}"))?
        .ok_or("ehr_base_url not found in z:<tid>:secrets — populate it via the tenant SDK before use")?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

fn duffel_headers(api_key: &str) -> Vec<(String, String)> {
    vec![
        ("Authorization".to_string(), format!("Bearer {api_key}")),
        ("Content-Type".to_string(), "application/json".to_string()),
    ]
}

fn format_http_error(e: hwp::HttpError) -> String {
    match e {
        hwp::HttpError::EgressDenied(host) => format!("egress denied for host {host}"),
        hwp::HttpError::PlaceholderDenied(marker) => format!("placeholder not permitted: {marker}"),
        hwp::HttpError::PlaceholderUnknown(field) => format!("user profile missing field: {field}"),
        hwp::HttpError::PlaceholderNoUserContext => "no user context bound for placeholder resolution".to_string(),
        hwp::HttpError::UpstreamError(reason) => format!("upstream: {reason}"),
    }
}

fn evaluate_criteria(criteria: &TrialCriteria, patient_data: &serde_json::Value) -> (bool, f64, u32, u32, Vec<String>) {
    let mut matched = 0u32;
    let mut total = 0u32;
    let mut failed = Vec::new();

    // Check inclusion criteria
    for criterion in &criteria.inclusion {
        total += 1;
        let field = criterion.get("field").and_then(|v| v.as_str()).unwrap_or("");
        let expected = criterion.get("expected");

        let patient_value = patient_data.get(field);

        let passes = match (patient_value, expected) {
            (Some(pv), Some(ev)) => pv == ev,
            (Some(_), None) => true,
            (None, _) => false,
        };

        if passes {
            matched += 1;
        } else {
            failed.push(field.to_string());
        }
    }

    // Check exclusion criteria — any match means ineligible
    for criterion in &criteria.exclusion {
        total += 1;
        let field = criterion.get("field").and_then(|v| v.as_str()).unwrap_or("");
        let expected = criterion.get("expected");

        let patient_value = patient_data.get(field);

        let matches = match (patient_value, expected) {
            (Some(pv), Some(ev)) => pv == ev,
            (Some(_), None) => true,
            (None, _) => false,
        };

        if matches {
            failed.push(format!("EXCLUDED: {field}"));
        }
    }

    let confidence = if total > 0 {
        matched as f64 / total as f64
    } else {
        0.0
    };

    let eligible = failed.is_empty();

    (eligible, confidence, matched, total, failed)
}

pub fn check_eligibility(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let input: CheckEligibilityInput = serde_json::from_slice(input_bytes)
        .map_err(|e| format!("check-eligibility: invalid input: {e}"))?;

    // 1. Read trial criteria from pharma's KV map (shared via cross-tenant ACL)
    let tid = tenant_context::tenant_did();
    let criteria_map = format!("z:{}:trial-criteria", hex::encode(&tid));

    let criteria_bytes = kv_store::get(&criteria_map, input.trial_id.as_bytes())
        .map_err(|e| format!("check-eligibility: kv read criteria: {e}"))?
        .ok_or(format!("check-eligibility: trial '{}' not found", input.trial_id))?;

    let criteria: TrialCriteria = serde_json::from_slice(&criteria_bytes)
        .map_err(|e| format!("check-eligibility: deserialize criteria: {e}"))?;

    let _ = logging::info(&format!("evaluating patient against trial {}", input.trial_id));

    // 2. Fetch patient data from hospital EHR via http-with-placeholders
    //    patient_did is passed directly in the input
    let api_key = get_api_key()?;
    let ehr_base = get_ehr_base_url()?;

    let ehr_resp = hwp::call(&hwp::Request {
        method: hwp::Verb::Get,
        url: format!("{ehr_base}/api/patients/{}/records", input.patient_did),
        headers: Some(duffel_headers(&api_key)),
        payload: None,
    }).map_err(|e| format!("check-eligibility: ehr call: {}", format_http_error(e)))?;

    if ehr_resp.code != 200 {
        let body = String::from_utf8_lossy(&ehr_resp.payload);
        return Err(format!("check-eligibility: EHR returned HTTP {} — {body}", ehr_resp.code));
    }

    let patient_data: serde_json::Value = serde_json::from_slice(&ehr_resp.payload)
        .map_err(|e| format!("check-eligibility: deserialize ehr response: {e}"))?;

    // 3. Evaluate criteria against patient data (inside TDX enclave)
    let (eligible, confidence, matched, total, failed) = evaluate_criteria(&criteria, &patient_data);

    let _ = logging::info(&format!(
        "eligibility: trial={} eligible={} confidence={:.2} matched={}/{}",
        input.trial_id, eligible, confidence, matched, total
    ));

    // 4. Return match result — NOT raw patient data
    let output = EligibilityResult {
        trial_id: input.trial_id,
        eligible,
        confidence,
        matched_criteria: matched,
        total_criteria: total,
        failed_criteria: failed,
    };

    serde_json::to_vec(&output)
        .map_err(|e| format!("check-eligibility: serialize output: {e}"))
}
