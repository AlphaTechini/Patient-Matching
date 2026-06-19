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
import type { StructuredQuery, EligibilityResult } from "./orchestrator";

export interface ITeeClient {
  getMatchingTrials(query: StructuredQuery): Promise<{ id: string; name: string; criteria: unknown }[]>;
  checkEligibility(trialId: string, patientDid: string): Promise<EligibilityResult>;
  getEligibleTrials(patientDid: string): Promise<EligibilityResult[]>;
  publishTrial?(trialId: string, criteria: unknown): Promise<void>;
}

export class TEEClient implements ITeeClient {
  private agentClient: T3nClient | null = null;
  private pharmaScriptName = "";
  private hospitalScriptName = "";

  async initialize() {
    setEnvironment("testnet");

    // Use T3N_API_KEY which has credits (AGENT_KEY was randomly generated with 0 credits)
    const t3nApiKey = process.env.T3N_API_KEY!;
    const pharmaTenantDid = process.env.PHARMA_TENANT_DID!;
    const hospitalTenantDid = process.env.HOSPITAL_TENANT_DID!;

    if (!t3nApiKey || !pharmaTenantDid || !hospitalTenantDid) {
      throw new Error("Missing required environment variables for TEE client initialization");
    }

    const wasmComponent = await loadWasmComponent();

    // Agent client using T3N_API_KEY (has 20k credits from claim page)
    const agentAddress = eth_get_address(t3nApiKey);
    this.agentClient = new T3nClient({
      wasmComponent,
      handlers: {
        EthSign: metamask_sign(agentAddress, undefined, t3nApiKey),
      },
    });
    await this.agentClient.handshake();
    await this.agentClient.authenticate(createEthAuthInput(agentAddress));

    const pharmaTenantId = pharmaTenantDid.slice("did:t3n:".length);
    const hospitalTenantId = hospitalTenantDid.slice("did:t3n:".length);

    this.pharmaScriptName = `z:${pharmaTenantId}:trial-matching`;
    this.hospitalScriptName = `z:${hospitalTenantId}:patient-screening`;
  }

  private async ensureInitialized() {
    if (!this.agentClient) {
      await this.initialize();
    }
  }

  async getMatchingTrials(query: StructuredQuery) {
    await this.ensureInitialized();

    const pharmaVersion = await getScriptVersion(getNodeUrl(), this.pharmaScriptName);

    const criteriaResult = await this.agentClient!.executeAndDecode({
      script_name: this.pharmaScriptName,
      script_version: pharmaVersion,
      function_name: "get-trial-criteria",
      input: { trial_id: query.condition || "TRIAL-2026-001" },
    }) as { trial_id: string; criteria: unknown };

    return [{
      id: criteriaResult.trial_id,
      name: `Trial ${criteriaResult.trial_id}`,
      criteria: criteriaResult.criteria,
    }];
  }

  async checkEligibility(trialId: string, patientDid: string): Promise<EligibilityResult> {
    await this.ensureInitialized();

    const hospitalVersion = await getScriptVersion(getNodeUrl(), this.hospitalScriptName) || "0.1.0";

    const result = await this.agentClient!.executeAndDecode({
      script_name: this.hospitalScriptName,
      script_version: hospitalVersion,
      function_name: "check-eligibility",
      input: { trial_id: trialId, patient_did: patientDid },
      pii_did: patientDid,
    }) as EligibilityResult;

    return result;
  }

  async getEligibleTrials(patientDid: string): Promise<EligibilityResult[]> {
    await this.ensureInitialized();

    const hospitalVersion = await getScriptVersion(getNodeUrl(), this.hospitalScriptName) || "0.1.0";

    const result = await this.agentClient!.executeAndDecode({
      script_name: this.hospitalScriptName,
      script_version: hospitalVersion,
      function_name: "check-eligibility",
      input: { trial_id: "TRIAL-2026-001", patient_did: patientDid },
      pii_did: patientDid,
    }) as EligibilityResult;

    return [result];
  }

  async publishTrial(trialId: string, criteria: unknown): Promise<void> {
    await this.ensureInitialized();

    const pharmaVersion = await getScriptVersion(getNodeUrl(), this.pharmaScriptName) || "0.1.0";

    // Add trial_id to criteria object for contract compatibility
    const criteriaWithId = {
      trial_id: trialId,
      ...criteria as object,
    };

    await this.agentClient!.execute({
      script_name: this.pharmaScriptName,
      script_version: pharmaVersion,
      function_name: "publish-trial",
      input: { trial_id: trialId, criteria: criteriaWithId },
    });
  }
}

// ─── Local mock for development without T3N keys ─────────────────────────────

export class MockTEEClient implements ITeeClient {
  async getMatchingTrials(query: StructuredQuery) {
    // Dynamically import trials to avoid circular dependency
    const { getTrialsStore } = await import("./routes/trials");
    const trialsStore = getTrialsStore();
    const allTrials = Array.from(trialsStore.values());
    
    return allTrials
      .filter(t => !query.condition || (t.name + t.id + t.indication).toLowerCase().includes(query.condition.toLowerCase()))
      .map(t => ({ id: t.id, name: t.name, criteria: t.criteria }));
  }

  async checkEligibility(trialId: string, patientDid: string): Promise<EligibilityResult> {
    // Mock implementation - not used in production (real TEE client is used)
    throw new Error("MockTEEClient.checkEligibility: Not implemented. Use real TEEClient for testing.");
  }

  async getEligibleTrials(patientDid: string): Promise<EligibilityResult[]> {
    // Mock implementation - not used in production (real TEE client is used)
    throw new Error("MockTEEClient.getEligibleTrials: Not implemented. Use real TEEClient for testing.");
  }
}
