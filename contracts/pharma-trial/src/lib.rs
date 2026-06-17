wit_bindgen::generate!({
    world: "trial-matching",
    path: "wit",
    additional_derives: [
        serde::Deserialize,
        serde::Serialize,
    ],
    generate_all,
});

mod publish;
mod criteria;
mod results;

struct Component;

#[cfg(target_arch = "wasm32")]
impl exports::z::tenant_trial_matching::contracts::Guest for Component {
    fn publish_trial(req: exports::z::tenant_trial_matching::contracts::GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("publish-trial: missing input")?;
        publish::publish_trial(&input)
    }

    fn get_trial_criteria(req: exports::z::tenant_trial_matching::contracts::GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("get-trial-criteria: missing input")?;
        criteria::get_trial_criteria(&input)
    }

    fn submit_match_result(req: exports::z::tenant_trial_matching::contracts::GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("submit-match-result: missing input")?;
        results::submit_match_result(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);
