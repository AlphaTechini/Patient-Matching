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

const T3N_API_KEY = process.env.T3N_API_KEY!;
const AGENT_KEY = process.env.AGENT_KEY!;

if (!T3N_API_KEY || !AGENT_KEY) {
  console.error("Missing required env vars: T3N_API_KEY, AGENT_KEY");
  process.exit(1);
}

// ─── Contract references (must match setup.ts values) ───────────────────────
const PHARMA_CONTRACT_TAIL = "trial-matching";
const HOSPITAL_CONTRACT_TAIL = "patient-screening";

// ─── These get populated after running setup.ts ─────────────────────────────
// In production, these would be stored/retrieved from a config store.
// For the hackathon, paste the values output by setup.ts here.
const PHARMA_TENANT_DID = process.env.PHARMA_TENANT_DID!;
const HOSPITAL_TENANT_DID = process.env.HOSPITAL_TENANT_DID!;
const PHARMA_SCRIPT_VERSION = process.env.PHARMA_SCRIPT_VERSION || "0.1.0";
const HOSPITAL_SCRIPT_VERSION = process.env.HOSPITAL_SCRIPT_VERSION || "0.1.0";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function createClient(apiKey: string): Promise<T3nClient> {
  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(apiKey);

  const client = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, apiKey),
    },
  });

  await client.handshake();
  await client.authenticate(createEthAuthInput(address));

  return client;
}

// ─── Main authorization ─────────────────────────────────────────────────────
async function main() {
  console.log("=== TrialMatch — Agent Authorization ===\n");

  const agentAddress = eth_get_address(AGENT_KEY);
  const agentDid = `did:t3n:${agentAddress}`;
  console.log(`  Agent DID: ${agentDid}\n`);

  // ── Step 1: User (patient) authorizes the matching agent ─────────────────
  console.log("── Step 1: Patient grants the matching agent ──");

  const userClient = await createClient(T3N_API_KEY);

  const pharmaTenantId = PHARMA_TENANT_DID.slice("did:t3n:".length);
  const hospitalTenantId = HOSPITAL_TENANT_DID.slice("did:t3n:".length);

  const pharmaScriptName = `z:${pharmaTenantId}:${PHARMA_CONTRACT_TAIL}`;
  const hospitalScriptName = `z:${hospitalTenantId}:${HOSPITAL_CONTRACT_TAIL}`;

  console.log(`  pharma script: ${pharmaScriptName}`);
  console.log(`  hospital script: ${hospitalScriptName}\n`);

  // Resolve current script versions
  const pharmaVersion = await getScriptVersion(getNodeUrl(), pharmaScriptName) || PHARMA_SCRIPT_VERSION;
  const hospitalVersion = await getScriptVersion(getNodeUrl(), hospitalScriptName) || HOSPITAL_SCRIPT_VERSION;
  console.log(`  pharma version: ${pharmaVersion}`);
  console.log(`  hospital version: ${hospitalVersion}\n`);

  // The user contract version for agent-auth-update
  const userContractVersion = await getScriptVersion(getNodeUrl(), "tee:user/contracts");

  // Build the grant
  const grantInput = {
    agents: [{
      agentDid,
      scripts: [
        {
          scriptName: hospitalScriptName,
          versionReq: hospitalVersion,
          functions: ["check-eligibility"],
          allowedHosts: [process.env.EHR_BASE_URL?.replace(/^https?:\/\//, "") || "localhost:3008"],
        },
        {
          scriptName: pharmaScriptName,
          versionReq: pharmaVersion,
          functions: ["get-trial-criteria", "submit-match-result"],
          allowedHosts: ["trials.pharma-company.com"],
        },
      ],
    }],
  };

  console.log("  Granting agent access to:");
  console.log(`    - ${hospitalScriptName}::check-eligibility (hosts: ehr.hospital-system.com)`);
  console.log(`    - ${pharmaScriptName}::get-trial-criteria, submit-match-result (hosts: trials.pharma-company.com)\n`);

  // Execute the authorization
  await userClient.execute({
    script_name: "tee:user/contracts",
    script_version: userContractVersion,
    function_name: "agent-auth-update",
    input: grantInput,
  });

  console.log("  Agent authorization granted successfully.\n");

  // ── Step 2: Verify the grant ─────────────────────────────────────────────
  console.log("── Step 2: Verify the grant ──");

  const grantCheck = await userClient.execute({
    script_name: "tee:user/contracts",
    script_version: userContractVersion,
    function_name: "agent-auth-get",
    input: { agentDid },
  }) as any;

  console.log("  Active grants for agent:", JSON.stringify(grantCheck, null, 2));

  console.log("\n=== Authorization Complete ===");
  console.log("\nNext step:");
  console.log("  Run scripts/invoke.ts to execute the matching flow");
}

main().catch((err) => {
  console.error("Authorization failed:", err);
  process.exit(1);
});
