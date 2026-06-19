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
import { config } from "dotenv";

config();

setEnvironment("testnet");

const T3N_API_KEY = process.env.T3N_API_KEY!;

async function createTenantClient(apiKey: string): Promise<TenantClient> {
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

  return new TenantClient({
    t3n,
    baseUrl: getNodeUrl(),
    tenantDid,
  });
}

async function main() {
  console.log("=== Updating KV Map ACLs for New Contract IDs ===\n");

  const pharmaTenant = await createTenantClient(T3N_API_KEY);
  const hospitalTenant = await createTenantClient(T3N_API_KEY);

  // New contract IDs from latest setup
  const pharmaContractId = 211;
  const hospitalContractId = 212;

  console.log("Updating pharma secrets map ACLs...");
  await pharmaTenant.maps.update("secrets", {
    writers: { only: [pharmaContractId] },
    readers: { only: [pharmaContractId] },
  });
  console.log("✅ Pharma secrets updated\n");

  console.log("Updating pharma trial-criteria map ACLs...");
  await pharmaTenant.maps.update("trial-criteria", {
    writers: { only: [pharmaContractId] },
    readers: { only: [pharmaContractId, hospitalContractId] },
  });
  console.log("✅ Pharma trial-criteria updated\n");

  console.log("Updating pharma match-results map ACLs...");
  await pharmaTenant.maps.update("match-results", {
    writers: { only: [pharmaContractId, hospitalContractId] },
    readers: { only: [pharmaContractId] },
  });
  console.log("✅ Pharma match-results updated\n");

  console.log("Updating hospital secrets map ACLs...");
  await hospitalTenant.maps.update("secrets", {
    writers: { only: [hospitalContractId] },
    readers: { only: [hospitalContractId] },
  });
  console.log("✅ Hospital secrets updated\n");

  console.log("Updating hospital match-results map ACLs...");
  await hospitalTenant.maps.update("match-results", {
    writers: { only: [hospitalContractId] },
    readers: { only: [hospitalContractId, pharmaContractId] },
  });
  console.log("✅ Hospital match-results updated\n");

  console.log("=== ACL Update Complete ===");
}

main().catch((err) => {
  console.error("ACL update failed:", err);
  process.exit(1);
});
