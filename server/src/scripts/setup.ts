import {
  T3nClient,
  TenantClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  getNodeUrl,
} from "@terminal3/t3n-sdk";
import { readFile } from "fs/promises";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// ─── Environment ─────────────────────────────────────────────────────────────
setEnvironment("testnet");

const T3N_API_KEY = process.env.T3N_API_KEY!;
const EHR_API_KEY = process.env.EHR_API_KEY!;
const TRIALS_API_KEY = process.env.TRIALS_API_KEY!;
const EHR_BASE_URL = process.env.EHR_BASE_URL || "http://localhost:3008";

if (!T3N_API_KEY || !EHR_API_KEY || !TRIALS_API_KEY) {
  console.error("Missing required env vars: T3N_API_KEY, EHR_API_KEY, TRIALS_API_KEY");
  process.exit(1);
}

// ─── Contract paths ─────────────────────────────────────────────────────────
const PHARMA_WASM_PATH = "../contracts/pharma-trial/target/wasm32-wasip2/release/z_tenant_trial_matching.wasm";
const HOSPITAL_WASM_PATH = "../contracts/hospital-screening/target/wasm32-wasip2/release/z_tenant_patient_screening.wasm";

const PHARMA_CONTRACT_TAIL = "trial-matching";
const HOSPITAL_CONTRACT_TAIL = "patient-screening";
const CONTRACT_VERSION = "0.1.0";

// ─── Shared helpers ──────────────────────────────────────────────────────────
async function createTenantClient(apiKey: string): Promise<{ t3n: T3nClient; tenant: TenantClient; tenantDid: string }> {
  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(apiKey);

  const t3n = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, apiKey),
    },
  });

  await t3n.handshake();
  const did = await t3n.authenticate(createEthAuthInput(address));
  const tenantDid = did.value;

  const tenant = new TenantClient({
    t3n,
    baseUrl: getNodeUrl(),
    tenantDid,
  });

  return { t3n, tenant, tenantDid };
}

async function registerContract(
  tenant: TenantClient,
  tenantDid: string,
  wasmPath: string,
  tail: string,
  version: string,
): Promise<{ contractId: number; scriptName: string }> {
  const wasmBytes = await readFile(wasmPath);

  const result = await tenant.contracts.register({
    tail,
    version,
    wasm: wasmBytes,
  }) as { contract_id: number };

  const contractId = result.contract_id;
  const tenantId = tenantDid.slice("did:t3n:".length);
  const scriptName = `z:${tenantId}:${tail}`;

  console.log(`  registered ${scriptName} as contract id ${contractId}`);
  return { contractId, scriptName };
}

async function createKvMap(
  tenant: TenantClient,
  tail: string,
  writers: number[],
  readers: number[],
): Promise<void> {
  try {
    await tenant.maps.create({
      tail,
      visibility: "private",
      writers: { only: writers },
      readers: { only: readers },
    });
    console.log(`  created map z:<tid>:${tail}`);
  } catch (err: any) {
    if (err.message?.includes("map already exists")) {
      console.log(`  map z:<tid>:${tail} already exists (idempotent)`);
    } else {
      throw err;
    }
  }
}

async function updateKvMapReaders(
  tenant: TenantClient,
  tail: string,
  readers: number[],
): Promise<void> {
  await tenant.maps.update(tail, {
    readers: { only: readers },
  });
  console.log(`  updated map z:<tid>:${tail} readers`);
}

async function updateKvMapWriters(
  tenant: TenantClient,
  tail: string,
  writers: number[],
): Promise<void> {
  await tenant.maps.update(tail, {
    writers: { only: writers },
  });
  console.log(`  updated map z:<tid>:${tail} writers`);
}

async function seedSecret(
  tenant: TenantClient,
  mapTail: string,
  key: string,
  value: string,
): Promise<void> {
  await tenant.executeControl("map-entry-set", {
    map_name: tenant.canonicalName(mapTail),
    key,
    value,
  });
  console.log(`  sealed ${key} into z:<tid>:${mapTail}`);
}

// ─── Main setup ──────────────────────────────────────────────────────────────
async function main() {
  console.log("=== TrialMatch Setup ===\n");

  // ── Step 1: Pharma Tenant Setup ──────────────────────────────────────────
  console.log("── Step 1: Pharma Tenant Setup ──");
  const { tenant: pharmaTenant, tenantDid: pharmaTenantDid } = await createTenantClient(T3N_API_KEY);
  const pharmaTenantId = pharmaTenantDid.slice("did:t3n:".length);
  console.log(`  pharma tenant DID: ${pharmaTenantDid}\n`);

  console.log("  Registering pharma contract...");
  const { contractId: pharmaContractId, scriptName: pharmaScriptName } = await registerContract(
    pharmaTenant,
    pharmaTenantDid,
    PHARMA_WASM_PATH,
    PHARMA_CONTRACT_TAIL,
    CONTRACT_VERSION,
  );

  console.log("\n  Creating pharma KV maps...");
  await createKvMap(pharmaTenant, "secrets", [pharmaContractId], [pharmaContractId]);
  await createKvMap(pharmaTenant, "trial-criteria", [pharmaContractId], [pharmaContractId]);
  await createKvMap(pharmaTenant, "match-results", [pharmaContractId], [pharmaContractId]);

  console.log("\n  Seeding pharma secrets...");
  await seedSecret(pharmaTenant, "secrets", "trials_api_key", TRIALS_API_KEY);

  console.log(`\n  pharma script: ${pharmaScriptName}`);
  console.log(`  pharma contract ID: ${pharmaContractId}\n`);

  // ── Step 2: Hospital Tenant Setup ────────────────────────────────────────
  console.log("── Step 2: Hospital Tenant Setup ──");
  const { tenant: hospitalTenant, tenantDid: hospitalTenantDid } = await createTenantClient(T3N_API_KEY);
  const hospitalTenantId = hospitalTenantDid.slice("did:t3n:".length);
  console.log(`  hospital tenant DID: ${hospitalTenantDid}\n`);

  console.log("  Registering hospital contract...");
  const { contractId: hospitalContractId, scriptName: hospitalScriptName } = await registerContract(
    hospitalTenant,
    hospitalTenantDid,
    HOSPITAL_WASM_PATH,
    HOSPITAL_CONTRACT_TAIL,
    CONTRACT_VERSION,
  );

  console.log("\n  Creating hospital KV maps...");
  await createKvMap(hospitalTenant, "secrets", [hospitalContractId], [hospitalContractId]);
  await createKvMap(hospitalTenant, "match-results", [hospitalContractId], [hospitalContractId]);

  console.log("\n  Seeding hospital secrets...");
  await seedSecret(hospitalTenant, "secrets", "ehr_api_key", EHR_API_KEY);
  await seedSecret(hospitalTenant, "secrets", "ehr_base_url", EHR_BASE_URL);

  console.log(`\n  hospital script: ${hospitalScriptName}`);
  console.log(`  hospital contract ID: ${hospitalContractId}\n`);

  // ── Step 3: Cross-Tenant ACL Updates ─────────────────────────────────────
  console.log("── Step 3: Cross-Tenant ACL Updates ──");

  // Pharma trial-criteria: hospital can read
  console.log("  Granting hospital read access to pharma trial-criteria...");
  await updateKvMapReaders(pharmaTenant, "trial-criteria", [pharmaContractId, hospitalContractId]);

  // Pharma match-results: hospital can write
  console.log("  Granting hospital write access to pharma match-results...");
  await updateKvMapWriters(pharmaTenant, "match-results", [pharmaContractId, hospitalContractId]);

  // Hospital match-results: pharma can read
  console.log("  Granting pharma read access to hospital match-results...");
  await updateKvMapReaders(hospitalTenant, "match-results", [hospitalContractId, pharmaContractId]);

  console.log("\n=== Setup Complete ===");
  console.log("\nNext steps:");
  console.log("  1. Run scripts/authorize.ts to grant the matching agent access");
  console.log("  2. Run scripts/invoke.ts to execute the matching flow");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
