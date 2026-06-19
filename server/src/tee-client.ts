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
import { getPatientData } from "./routes/patients";

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

    const agentKey = process.env.AGENT_KEY!;
    const t3nApiKey = process.env.T3N_API_KEY!;
    const pharmaTenantDid = process.env.PHARMA_TENANT_DID!;
    const hospitalTenantDid = process.env.HOSPITAL_TENANT_DID!;

    if (!agentKey || !t3nApiKey || !pharmaTenantDid || !hospitalTenantDid) {
      throw new Error("Missing required environment variables for TEE client initialization");
    }

    const wasmComponent = await loadWasmComponent();

    // Agent client
    const agentAddress = eth_get_address(agentKey);
    this.agentClient = new T3nClient({
      wasmComponent,
      handlers: {
        EthSign: metamask_sign(agentAddress, undefined, agentKey),
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

    await this.agentClient!.execute({
      script_name: this.pharmaScriptName,
      script_version: pharmaVersion,
      function_name: "publish-trial",
      input: { trial_id: trialId, criteria },
    });
  }
}

// ─── Local mock data for development without T3N keys ─────────────────────

const MOCK_TRIALS = [
  {
    id: "TRIAL-2026-001",
    name: "Lung Cancer Immunotherapy Phase III",
    criteria: {
      inclusion: [
        { field: "diagnosis_codes", expected: "C34.9" },
        { field: "age", expected: null },
        { field: "gender", expected: "female" },
      ],
      exclusion: [
        { field: "allergies", expected: "peanut" },
      ],
    },
  },
  {
    id: "TRIAL-2026-002",
    name: "Colorectal Cancer Checkpoint Inhibitor Phase II",
    criteria: {
      inclusion: [
        { field: "diagnosis_codes", expected: "C18.7" },
        { field: "age", expected: null },
      ],
      exclusion: [
        { field: "medications", expected: "warfarin" },
      ],
    },
  },
];

const MOCK_PATIENTS: Record<string, Record<string, unknown>> = {
  "did:t3n:patient-001": {
    diagnosis_codes: "C34.9",
    age: 45,
    gender: "female",
    allergies: "none",
  },
  "did:t3n:patient-002": {
    diagnosis_codes: "C34.9",
    age: 45,
    gender: "female",
    allergies: "peanut",
  },
  "did:t3n:patient-003": {
    diagnosis_codes: "C18.7",
    age: 62,
    gender: "male",
    allergies: "none",
    medications: "warfarin",
  },
};

function evaluateCriteria(criteria: any, patientData: Record<string, unknown>): Omit<EligibilityResult, "trial_id"> {
  let matched = 0;
  let total = 0;
  const failed: string[] = [];

  for (const c of criteria.inclusion || []) {
    total++;
    const field = c.field as string;
    const expected = c.expected;
    const pv = patientData[field];
    const passes = expected !== null && expected !== undefined ? pv === expected : pv !== undefined && pv !== null;
    if (passes) matched++; else failed.push(field);
  }

  for (const c of criteria.exclusion || []) {
    total++;
    const field = c.field as string;
    const expected = c.expected;
    const pv = patientData[field];
    const matches = expected !== null && expected !== undefined ? pv === expected : pv !== undefined && pv !== null;
    if (matches) failed.push(`EXCLUDED: ${field}`);
  }

  const confidence = total > 0 ? matched / total : 0;
  return {
    eligible: failed.length === 0,
    confidence,
    matched_criteria: matched,
    total_criteria: total,
    failed_criteria: failed,
  };
}

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
    // Dynamically import trials to avoid circular dependency
    const { getTrialsStore } = await import("./routes/trials");
    const trialsStore = getTrialsStore();
    const trial = trialsStore.get(trialId);
    
    if (!trial) {
      throw new Error(`Trial ${trialId} not found`);
    }
    
    const patientData = getPatientData(patientDid);
    if (!patientData) {
      throw new Error(`Patient data not found for ${patientDid}`);
    }
    
    const result = evaluateCriteria(trial.criteria, patientData);
    return { trial_id: trialId, ...result };
  }

  async getEligibleTrials(patientDid: string): Promise<EligibilityResult[]> {
    // Dynamically import trials to avoid circular dependency
    const { getTrialsStore } = await import("./routes/trials");
    const trialsStore = getTrialsStore();
    const allTrials = Array.from(trialsStore.values());
    
    const results: EligibilityResult[] = [];
    for (const trial of allTrials) {
      const result = await this.checkEligibility(trial.id, patientDid);
      results.push(result);
    }
    return results;
  }
}
