use crate::host::interfaces::logging;
use serde::Serialize;

#[derive(Serialize)]
struct ProfileFieldsOutput {
    available_fields: Vec<String>,
    description: String,
}

pub fn get_patient_profile_fields(_input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let fields = vec![
        "first_name".to_string(),
        "last_name".to_string(),
        "date_of_birth".to_string(),
        "gender".to_string(),
        "diagnosis_codes".to_string(),
        "lab_results".to_string(),
        "medications".to_string(),
        "allergies".to_string(),
        "verified_contacts.email.value".to_string(),
    ];

    let _ = logging::info("profile fields requested");

    let output = ProfileFieldsOutput {
        available_fields: fields,
        description: "Fields available for placeholder resolution in http-with-placeholders calls. PII never enters the contract — markers are resolved host-side inside the enclave.".to_string(),
    };

    serde_json::to_vec(&output)
        .map_err(|e| format!("get-patient-profile-fields: serialize output: {e}"))
}
