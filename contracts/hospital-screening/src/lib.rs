wit_bindgen::generate!({
    world: "patient-screening",
    path: "wit",
    additional_derives: [
        serde::Deserialize,
        serde::Serialize,
    ],
    generate_all,
});

mod eligibility;
mod profile;

struct Component;

#[cfg(target_arch = "wasm32")]
impl exports::z::tenant_patient_screening::contracts::Guest for Component {
    fn check_eligibility(req: exports::z::tenant_patient_screening::contracts::GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("check-eligibility: missing input")?;
        eligibility::check_eligibility(&input)
    }

    fn get_patient_profile_fields(req: exports::z::tenant_patient_screening::contracts::GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("get-patient-profile-fields: missing input")?;
        profile::get_patient_profile_fields(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);
