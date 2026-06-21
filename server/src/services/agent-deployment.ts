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
import { getPatientClient } from "./patient-onboarding";
import { cacheMatchResult } from "./match-cache";

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

  // 2. Get DID from T3N_API_KEY (all agents share this DID for MVP)
  const t3nApiKey = process.env.T3N_API_KEY!;
  if (!t3nApiKey) {
    throw new Error("T3N_API_KEY not set in environment");
  }

  const agentAddress = eth_get_address(t3nApiKey);
  const wasmComponent = await loadWasmComponent();

  const client = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(agentAddress, undefined, t3nApiKey),
    },
  });

  await client.handshake();
  const authResult = await client.authenticate(createEthAuthInput(agentAddress));
  const agentDid = authResult.value;

  console.log(`✅ Agent DID: ${agentDid} (shared T3N_API_KEY account)`);

  // 3. Store agent in database (no wallet storage needed)
  const agentsCollection = getAgentsCollection();
  const agent: Agent = {
    agentName: finalAgentName,
    agentDid,
    trialId,
    ethAddress: agentAddress,
    encryptedPrivateKey: "", // Not storing private key - uses env var
    status: "active",
    createdAt: new Date(),
    stats: {
      totalRuns: 0,
      patientsScreened: 0,
      patientsMatched: 0,
    },
  };

  await agentsCollection.insertOne(agent);
  console.log(`✅ Agent record created for trial ${trialId}`);

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

export async function authorizeAgentForAllPatients(agentDid: string): Promise<number> {
  // Get patient credentials to authorize the agent
  const credentialsCollection = getPatientCredentialsCollection();
  const allCredentials = await credentialsCollection.find({}).toArray();

  if (allCredentials.length === 0) {
    console.log("⚠️  No patient credentials found to authorize");
    return 0;
  }

  const hospitalTenantDid = process.env.HOSPITAL_TENANT_DID!;
  if (!hospitalTenantDid) {
    throw new Error("HOSPITAL_TENANT_DID not set in environment");
  }

  const hospitalTenantId = hospitalTenantDid.slice("did:t3n:".length);
  const hospitalScriptName = `z:${hospitalTenantId}:patient-screening`;

  let authorizedCount = 0;

  for (const credential of allCredentials) {
    try {
      // Create T3N client as the patient
      const patientClient = await getPatientClient(
        credential.encryptedPrivateKey,
        credential.ethAddress,
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
      console.log(`✅ Authorized agent for patient ${credential.patientDid} (${authorizedCount}/${allCredentials.length})`);

      // Log the authorization event
      try {
        const response = await fetch(`${process.env.EHR_BASE_URL || "http://localhost:3008"}/api/access-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientDid: credential.patientDid,
            requester: agentDid,
            requesterName: "Trial Agent",
            trialId: "unknown",
            trialName: "Unknown Trial",
            action: "authorization",
            purpose: "Agent authorized to check trial eligibility",
          }),
        });

        if (!response.ok) {
          console.warn(`Failed to log authorization for ${credential.patientDid}`);
        }
      } catch (error) {
        console.warn(`Failed to log authorization event:`, error);
      }
    } catch (error) {
      console.error(`❌ Failed to authorize agent for patient ${credential.patientDid}:`, error);
      // Continue with other patients
    }
  }

  console.log(`🎉 Agent ${agentDid} authorized for ${authorizedCount}/${allCredentials.length} patients`);
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
  errors?: Array<{
    patientDid: string;
    error: string;
    errorType: string;
  }>;
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

  // 1. Get all patients from `patients` collection (has healthRecord data)
  const { getDatabase } = await import("./database");
  const db = getDatabase();
  const patientsCollection = db.collection("patients");
  const allPatients = await patientsCollection.find({}).toArray();
  
  console.log(`📋 Found ${allPatients.length} patients to screen`);

  if (allPatients.length === 0) {
    console.log("⚠️  No patients found to screen");
    return {
      agentDid,
      trialId: agent.trialId,
      eligiblePatients: [],
      summary: {
        screened: 0,
        eligible: 0,
        eligibilityRate: "0%",
        averageConfidence: 0,
      },
      ranAt: new Date(),
    };
  }

  // 2. Get trial details from trials store
  const { getTrialsStore } = await import("../routes/trials");
  const trialsStore = getTrialsStore();
  const trial = trialsStore.get(agent.trialId);

  if (!trial) {
    throw new Error(`Trial ${agent.trialId} not found`);
  }

  console.log(`📋 Trial: ${trial.name} (${trial.id})`);
  console.log(`   Inclusion criteria: ${trial.criteria.inclusion.length}`);
  console.log(`   Exclusion criteria: ${trial.criteria.exclusion.length}`);

  // 3. Check eligibility for each patient using BACKEND (TEE bypass)
  const results: Array<{
    patientDid: string;
    eligible: boolean;
    confidence: number;
    matchedCriteria: number;
    totalCriteria: number;
  }> = [];

  const errors: Array<{
    patientDid: string;
    error: string;
    errorType: string;
  }> = [];

  // Import backend eligibility checker
  const { checkEligibility } = await import("./eligibility-checker");
  
  // Import LLM service for AI summaries
  const { LLMService } = await import("../llm");
  const llmService = new LLMService(process.env.LLM_PROVIDER || "groq");

  for (const patient of allPatients) {
    const patientDid = patient.patientDid;
    
    try {
      // Use backend eligibility checking (bypasses TEE)
      const eligibility = checkEligibility(trial, patient.healthRecord);
      
      // Generate AI summary only for eligible patients
      let aiSummary = "";
      if (eligibility.eligible) {
        try {
          const summaryPrompt = `Analyze this patient's eligibility for the trial "${trial.name}".

Patient matched ${eligibility.matched_criteria}/${eligibility.total_criteria} criteria with ${(eligibility.confidence * 100).toFixed(0)}% confidence.

Trial Inclusion Criteria:
${trial.criteria.inclusion.map((c: any, i: number) => `${i + 1}. ${c.description || `${c.field}: ${c.expected}`}`).join('\n')}

Trial Exclusion Criteria:
${trial.criteria.exclusion.map((c: any, i: number) => `${i + 1}. ${c.description || `${c.field}: ${c.expected}`}`).join('\n')}

Patient Demographics:
- Age: ${patient.healthRecord.demographics.age}
- Gender: ${patient.healthRecord.demographics.gender}
- BMI: ${patient.healthRecord.vitals.bmi}

Patient Conditions:
${patient.healthRecord.diagnosis_codes.join(', ')}

Medications:
${patient.healthRecord.medications.join(', ')}

Lab Results:
${JSON.stringify(patient.healthRecord.lab_results, null, 2)}

Provide a brief 2-3 sentence summary explaining why this patient is a good match for the trial. Focus on the key matching criteria.`;

          aiSummary = await llmService.provider.generate(summaryPrompt) as string;
        } catch (error) {
          console.warn(`Failed to generate AI summary for ${patientDid}:`, error);
          aiSummary = "AI summary generation failed";
        }
      }

      results.push({
        patientDid,
        eligible: eligibility.eligible,
        confidence: eligibility.confidence,
        matchedCriteria: eligibility.matched_criteria,
        totalCriteria: eligibility.total_criteria,
      });

      // Cache ALL results (eligible AND non-eligible) per architecture
      await cacheMatchResult({
        trialId: agent.trialId,
        patientDid,
        eligible: eligibility.eligible,
        confidence: eligibility.confidence,
        matchedCriteria: eligibility.matched_criteria,
        totalCriteria: eligibility.total_criteria,
        details: aiSummary || undefined,
      });

      console.log(
        `${eligibility.eligible ? "✅" : "❌"} Patient ${patientDid.substring(0, 20)}...: ${eligibility.matched_criteria}/${eligibility.total_criteria} (confidence: ${eligibility.confidence.toFixed(2)}) - cached`,
      );
    } catch (error) {
      console.error(`❌ Failed to check eligibility for ${patientDid}:`, error);
      
      // Categorize error type
      let errorType = "unknown";
      let errorMessage = "Unknown error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorType = "execution";
      }
      
      errors.push({
        patientDid,
        error: errorMessage,
        errorType,
      });
      
      // Cache failure as non-eligible to avoid repeated failures
      await cacheMatchResult({
        trialId: agent.trialId,
        patientDid,
        eligible: false,
        confidence: 0,
        matchedCriteria: 0,
        totalCriteria: trial.criteria.inclusion.length + trial.criteria.exclusion.length,
      });
    }
  }

  // 5. Filter eligible patients only (100% match)
  const eligiblePatients = results
    .filter((r) => r.eligible && r.matchedCriteria === r.totalCriteria)
    .map((r) => ({
      patientDid: r.patientDid,
      confidence: r.confidence,
      matchedCriteria: r.matchedCriteria,
      totalCriteria: r.totalCriteria,
    }));

  // 6. Calculate summary
  const summary = {
    screened: results.length,
    eligible: eligiblePatients.length,
    eligibilityRate: `${results.length > 0 ? ((eligiblePatients.length / results.length) * 100).toFixed(1) : "0"}%`,
    averageConfidence:
      eligiblePatients.length > 0
        ? eligiblePatients.reduce((sum, p) => sum + p.confidence, 0) / eligiblePatients.length
        : 0,
  };

  // 7. Update agent stats
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
  console.log(`   Eligibility rate: ${summary.eligibilityRate}`);
  console.log(`   Average confidence: ${summary.averageConfidence.toFixed(2)}`);
  
  if (errors.length > 0) {
    console.log(`⚠️  Encountered ${errors.length} errors during screening`);
  }

  return {
    agentDid,
    trialId: agent.trialId,
    eligiblePatients,
    summary,
    ranAt: new Date(),
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function getAgentClient(encryptedPrivateKey: string, ethAddress: string): Promise<T3nClient> {
  setEnvironment("testnet");

  // For MVP, all agents use T3N_API_KEY from environment
  const privateKey = process.env.T3N_API_KEY!;
  if (!privateKey) {
    throw new Error("T3N_API_KEY not set in environment");
  }

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
