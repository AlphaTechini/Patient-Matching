import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  getNodeUrl,
  getScriptVersion,
} from "@terminal3/t3n-sdk";

// ─── Environment ─────────────────────────────────────────────────────────────
setEnvironment("testnet");

const AGENT_KEY = process.env.AGENT_KEY;

if (!AGENT_KEY || !PHARMA_TENANT_DID || !HOSPITAL_TENANT_DID) {
  console.error("Missing required env vars: AGENT_KEY, PHARMA_TENANT_DID, HOSPITAL_TENANT_DID");
  process.exit(1);
}

// ─── Contract references (must match setup.ts values) ───────────────────────
const PHARMA_CONTRACT_TAIL = "trial-matching";
const HOSPITAL_CONTRACT_TAIL = "patient-screening";

// ─── These get populated after running setup.ts ─────────────────────────────
const PHARMA_TENANT_DID = process.env.PHARMA_TENANT_DID!;
const HOSPITAL_TENANT_DID = process.env.HOSPITAL_TENANT_DID!;

// ─── Test data ───────────────────────────────────────────────────────────────
const TEST_TRIAL_ID = "TRIAL-2026-001";
const TEST_PATIENT_DID = process.env.TEST_PATIENT_DID || "did:t3n:patient-001";
const TEST_PATIENT_ID = process.env.TEST_PATIENT_ID || "PAT-12345";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function createAgentClient(agentKey: string): Promise<T3nClient> {
  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(agentKey);

  const client = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, agentKey),
    },
  });

  await client.handshake();
  await client.authenticate(createEthAuthInput(address));

  return client;
}

// ─── Main invocation flow ───────────────────────────────────────────────────
async function main() {
  console.log("=== TrialMatch — Invoke Matching Flow ===\n");

  const agentClient = await createAgentClient(AGENT_KEY);

  const pharmaTenantId = PHARMA_TENANT_DID.slice("did:t3n:".length);
  const hospitalTenantId = HOSPITAL_TENANT_DID.slice("did:t3n:".length);

  const pharmaScriptName = `z:${pharmaTenantId}:${PHARMA_CONTRACT_TAIL}`;
  const hospitalScriptName = `z:${hospitalTenantId}:${HOSPITAL_CONTRACT_TAIL}`;

  console.log(`  Agent invoking matching flow...`);
  console.log(`  pharma script: ${pharmaScriptName}`);
  console.log(`  hospital script: ${hospitalScriptName}`);
  console.log(`  trial ID: ${TEST_TRIAL_ID}`);
  console.log(`  patient DID: ${TEST_PATIENT_DID}\n`);

  // ── Step 1: Get trial criteria from pharma contract ──────────────────────
  console.log("── Step 1: Fetch trial criteria ──");

  const pharmaVersion = await getScriptVersion(getNodeUrl(), pharmaScriptName);

  const criteriaResult = await agentClient.executeAndDecode({
    script_name: pharmaScriptName,
    script_version: pharmaVersion,
    function_name: "get-trial-criteria",
    input: { trial_id: TEST_TRIAL_ID },
  });

  console.log("  Trial criteria fetched:", JSON.stringify(criteriaResult, null, 2));

  // ── Step 2: Check patient eligibility via hospital contract ──────────────
  console.log("\n── Step 2: Check patient eligibility ──");

  const hospitalVersion = await getScriptVersion(getNodeUrl(), hospitalScriptName);

  const eligibilityResult = await agentClient.executeAndDecode({
    script_name: hospitalScriptName,
    script_version: hospitalVersion,
    function_name: "check-eligibility",
    input: { trial_id: TEST_TRIAL_ID },
    pii_did: TEST_PATIENT_DID,
  }) as { eligible: boolean; confidence: number; matched_criteria: number; total_criteria: number };

  console.log("  Eligibility result:");
  console.log(`    eligible: ${eligibilityResult.eligible}`);
  console.log(`    confidence: ${eligibilityResult.confidence}`);
  console.log(`    matched: ${eligibilityResult.matched_criteria}/${eligibilityResult.total_criteria}`);

  // ── Step 3: Submit match result to pharma contract ───────────────────────
  if (eligibilityResult.eligible) {
    console.log("\n── Step 3: Submit match result ──");

    const submitResult = await agentClient.executeAndDecode({
      script_name: pharmaScriptName,
      script_version: pharmaVersion,
      function_name: "submit-match-result",
      input: {
        trial_id: TEST_TRIAL_ID,
        patient_id: TEST_PATIENT_ID,
        eligible: true,
        confidence: eligibilityResult.confidence,
        matched_criteria: eligibilityResult.matched_criteria,
        total_criteria: eligibilityResult.total_criteria,
      },
    });

    console.log("  Match result submitted:", JSON.stringify(submitResult, null, 2));
  } else {
    console.log("\n  Patient not eligible — skipping match submission.");
  }

  console.log("\n=== Matching Flow Complete ===");
}

main().catch((err) => {
  console.error("Invocation failed:", err);
  process.exit(1);
});
