import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  createEthAuthInput,
  metamask_sign,
  getScriptVersion,
  getNodeUrl,
  eth_get_address,
} from "@terminal3/t3n-sdk";
import { getAgentsCollection, getPatientCredentialsCollection, type Agent } from "./database";
import { encryptPrivateKey, decryptPrivateKey, getPatientClient } from "./patient-onboarding";

export interface DeployAgentResult {
  agentName: string;
  agentDid: string;
  trialId: string;
  status: string;
  patientsAuthorized: number;
}

export async function deployAgent(trialId: string, trialName: string, agentName?: string): Promise<DeployAgentResult> {
  setEnvironment("testnet");

  // 1. Generate agent name if not provided
  const finalAgentName = agentName || `${trialName} Agent`;

  // 2. Use T3N_API_KEY for agents (has credits from claim page)
  // Note: Creating random wallets results in 0 credits since tokens are non-transferable
  const agentPrivateKey = process.env.T3N_API_KEY!;
  if (!agentPrivateKey) {
    throw new Error("T3N_API_KEY not set in environment");
  }

  const agentAddress = eth_get_address(agentPrivateKey);
  const wasmComponent = await loadWasmComponent();

  const agentClient = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(agentAddress, undefined, agentPrivateKey),
    },
  });

  await agentClient.handshake();
  const authResult = await agentClient.authenticate(createEthAuthInput(agentAddress));
  const agentDid = authResult.value;

  console.log(`✅ Using agent DID: ${agentDid} (T3N_API_KEY account with credits)`);

  // 3. Store agent in database
  const agentsCollection = getAgentsCollection();
  const agent: Agent = {
    agentName: finalAgentName,
    agentDid,
    trialId,
    ethAddress: agentAddress,
    encryptedPrivateKey: encryptPrivateKey(agentPrivateKey),
    status: "active",
    createdAt: new Date(),
    stats: {
      totalRuns: 0,
      patientsScreened: 0,
      patientsMatched: 0,
    },
  };

  await agentsCollection.insertOne(agent);
  console.log(`✅ Stored agent in database`);

  // 4. Authorize agent for all patients
  const patientsAuthorized = await authorizeAgentForAllPatients(agentDid);

  return {
    agentName: finalAgentName,
    agentDid,
    trialId,
    status: "active",
    patientsAuthorized,
  };
}

async function authorizeAgentForAllPatients(agentDid: string): Promise<number> {
  const credentialsCollection = getPatientCredentialsCollection();
  const allPatients = await credentialsCollection.find({}).toArray();

  if (allPatients.length === 0) {
    console.log("⚠️  No patients to authorize yet");
    return 0;
  }

  const hospitalTenantDid = process.env.HOSPITAL_TENANT_DID!;
  if (!hospitalTenantDid) {
    throw new Error("HOSPITAL_TENANT_DID not set in environment");
  }

  const hospitalTenantId = hospitalTenantDid.slice("did:t3n:".length);
  const hospitalScriptName = `z:${hospitalTenantId}:patient-screening`;

  let authorizedCount = 0;

  for (const patient of allPatients) {
    try {
      // Create T3N client as the patient
      const patientClient = await getPatientClient(
        patient.encryptedPrivateKey,
        patient.ethAddress,
      );

      // Get user contract version
      const userContractVersion = await getScriptVersion(getNodeUrl(), "tee:user/contracts");

      // Authorize the agent
      await patientClient.execute({
        script_name: "tee:user/contracts",
        script_version: userContractVersion,
        function_name: "agent-auth-update",
        input: {
          agents: [
            {
              agentDid: agentDid,
              scripts: [
                {
                  scriptName: hospitalScriptName,
                  versionReq: "0.1.0",
                  functions: ["check-eligibility"],
                  allowedHosts: [
                    "api.groq.com",
                    process.env.EHR_BASE_URL?.replace(/^https?:\/\//, "") || "localhost:3008",
                  ],
                },
              ],
            },
          ],
        },
      });

      authorizedCount++;
      console.log(`✅ Authorized agent for patient ${patient.patientDid} (${authorizedCount}/${allPatients.length})`);
    } catch (error) {
      console.error(`❌ Failed to authorize agent for patient ${patient.patientDid}:`, error);
      // Continue with other patients
    }
  }

  console.log(`🎉 Agent ${agentDid} authorized for ${authorizedCount}/${allPatients.length} patients`);
  return authorizedCount;
}

export async function authorizeAllAgentsForPatient(
  patientDid: string,
  encryptedPrivateKey: string,
  ethAddress: string,
): Promise<number> {
  const agentsCollection = getAgentsCollection();
  const activeAgents = await agentsCollection.find({ status: "active" }).toArray();

  if (activeAgents.length === 0) {
    console.log("⚠️  No active agents to authorize");
    return 0;
  }

  const hospitalTenantDid = process.env.HOSPITAL_TENANT_DID!;
  const hospitalTenantId = hospitalTenantDid.slice("did:t3n:".length);
  const hospitalScriptName = `z:${hospitalTenantId}:patient-screening`;

  // Create patient client
  const patientClient = await getPatientClient(encryptedPrivateKey, ethAddress);

  // Get user contract version
  const userContractVersion = await getScriptVersion(getNodeUrl(), "tee:user/contracts");

  // Authorize all agents at once
  await patientClient.execute({
    script_name: "tee:user/contracts",
    script_version: userContractVersion,
    function_name: "agent-auth-update",
    input: {
      agents: activeAgents.map((agent) => ({
        agentDid: agent.agentDid,
        scripts: [
          {
            scriptName: hospitalScriptName,
            versionReq: "0.1.0",
            functions: ["check-eligibility"],
            allowedHosts: [
              "api.groq.com",
              process.env.EHR_BASE_URL?.replace(/^https?:\/\//, "") || "localhost:3008",
            ],
          },
        ],
      })),
    },
  });

  console.log(`✅ Patient ${patientDid} authorized ${activeAgents.length} agents`);
  return activeAgents.length;
}

export interface AgentRunResult {
  agentDid: string;
  trialId: string;
  eligiblePatients: Array<{
    patientDid: string;
    confidence: number;
    matchedCriteria: number;
    totalCriteria: number;
  }>;
  summary: {
    screened: number;
    eligible: number;
    eligibilityRate: string;
    averageConfidence: number;
  };
  ranAt: Date;
}

export async function runAgent(agentDid: string): Promise<AgentRunResult> {
  const agentsCollection = getAgentsCollection();
  const agent = await agentsCollection.findOne({ agentDid });

  if (!agent) {
    throw new Error(`Agent ${agentDid} not found`);
  }

  if (agent.status !== "active") {
    throw new Error(`Agent ${agentDid} is ${agent.status}, not active`);
  }

  console.log(`🤖 Running agent ${agent.agentName} (${agentDid})`);

  // 1. Get all patient DIDs
  const credentialsCollection = getPatientCredentialsCollection();
  const allPatients = await credentialsCollection.find({}).toArray();
  const patientDids = allPatients.map((p) => p.patientDid);

  console.log(`📋 Found ${patientDids.length} patients to screen`);

  // 2. Create agent T3N client
  const agentClient = await getAgentClient(agent.encryptedPrivateKey, agent.ethAddress);

  // 3. Check eligibility for each patient
  const results: Array<{
    patientDid: string;
    eligible: boolean;
    confidence: number;
    matchedCriteria: number;
    totalCriteria: number;
  }> = [];

  const hospitalTenantDid = process.env.HOSPITAL_TENANT_DID!;
  const hospitalTenantId = hospitalTenantDid.slice("did:t3n:".length);
  const hospitalScriptName = `z:${hospitalTenantId}:patient-screening`;
  const scriptVersion = await getScriptVersion(getNodeUrl(), hospitalScriptName);

  for (const patientDid of patientDids) {
    try {
      const eligibility = await agentClient.executeAndDecode({
        script_name: hospitalScriptName,
        script_version: scriptVersion,
        function_name: "check-eligibility",
        input: {
          trial_id: agent.trialId,
          patient_did: patientDid,
        },
        pii_did: patientDid,
      }) as any;

      results.push({
        patientDid,
        eligible: eligibility.eligible,
        confidence: eligibility.confidence,
        matchedCriteria: eligibility.matched_criteria,
        totalCriteria: eligibility.total_criteria,
      });

      console.log(
        `${eligibility.eligible ? "✅" : "❌"} Patient ${patientDid}: ${eligibility.matched_criteria}/${eligibility.total_criteria} (confidence: ${eligibility.confidence})`,
      );
    } catch (error) {
      console.error(`❌ Failed to check eligibility for ${patientDid}:`, error);
    }
  }

  // 4. Filter eligible patients only (100% match)
  const eligiblePatients = results
    .filter((r) => r.eligible && r.matchedCriteria === r.totalCriteria)
    .map((r) => ({
      patientDid: r.patientDid,
      confidence: r.confidence,
      matchedCriteria: r.matchedCriteria,
      totalCriteria: r.totalCriteria,
    }));

  // 5. Calculate summary
  const summary = {
    screened: results.length,
    eligible: eligiblePatients.length,
    eligibilityRate: `${((eligiblePatients.length / results.length) * 100).toFixed(1)}%`,
    averageConfidence:
      eligiblePatients.length > 0
        ? eligiblePatients.reduce((sum, p) => sum + p.confidence, 0) / eligiblePatients.length
        : 0,
  };

  // 6. Update agent stats
  await agentsCollection.updateOne(
    { agentDid },
    {
      $set: {
        lastRunAt: new Date(),
      },
      $inc: {
        "stats.totalRuns": 1,
        "stats.patientsScreened": results.length,
        "stats.patientsMatched": eligiblePatients.length,
      },
    },
  );

  console.log(`🎉 Agent run complete: ${eligiblePatients.length}/${results.length} eligible`);

  return {
    agentDid,
    trialId: agent.trialId,
    eligiblePatients,
    summary,
    ranAt: new Date(),
  };
}

async function getAgentClient(encryptedPrivateKey: string, ethAddress: string): Promise<T3nClient> {
  setEnvironment("testnet");

  const privateKey = decryptPrivateKey(encryptedPrivateKey);

  const wasmComponent = await loadWasmComponent();
  const client = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(ethAddress, undefined, privateKey),
    },
  });

  await client.handshake();
  await client.authenticate(createEthAuthInput(ethAddress));

  return client;
}
