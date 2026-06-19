/**
 * Check T3N Token Balance
 * 
 * This script checks the token balance for T3N accounts
 */

import { config } from "dotenv";
import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
} from "@terminal3/t3n-sdk";

config();

setEnvironment("testnet");

async function checkBalance(privateKey: string, label: string) {
  try {
    const address = eth_get_address(privateKey);
    console.log(`\n${label}:`);
    console.log(`  Address: ${address}`);

    const wasmComponent = await loadWasmComponent();
    const client = new T3nClient({
      wasmComponent,
      handlers: {
        EthSign: metamask_sign(address, undefined, privateKey),
      },
    });

    await client.handshake();
    const authResult = await client.authenticate(createEthAuthInput(address));
    console.log(`  DID: ${authResult.value}`);

    // Try to get balance - T3N SDK doesn't have a direct balance method
    // The balance is shown in errors like "InsufficientCredit (required=10000, available=X)"
    console.log(`  Status: Authenticated successfully`);
    console.log(`  Note: Balance not directly queryable via SDK`);
    console.log(`  Tip: Make a small contract call to see balance in error message`);

  } catch (error) {
    console.error(`  Error: ${error}`);
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log("T3N Token Balance Checker");
  console.log("=".repeat(70));

  const t3nApiKey = process.env.T3N_API_KEY;
  const agentKey = process.env.AGENT_KEY;

  if (!t3nApiKey) {
    console.error("❌ T3N_API_KEY not set");
    process.exit(1);
  }

  if (!agentKey) {
    console.error("❌ AGENT_KEY not set");
    process.exit(1);
  }

  await checkBalance(t3nApiKey, "T3N_API_KEY (Main Account)");
  await checkBalance(agentKey, "AGENT_KEY (Generated for Agents)");

  console.log("\n" + "=".repeat(70));
  console.log("Recommendation:");
  console.log("=".repeat(70));
  console.log("If AGENT_KEY has 0 credits, update agent-deployment.ts to use T3N_API_KEY");
  console.log("instead of generating random wallets for agents.");
  console.log("\nTokens are non-transferable, so each wallet needs to claim from faucet.");
  console.log("Visit: https://www.terminal3.io/claim-page");
}

main();
