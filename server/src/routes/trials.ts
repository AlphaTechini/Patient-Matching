import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { LLMService } from "../llm";
import type { ITeeClient } from "../tee-client";

interface TrialsRoutesOptions extends FastifyPluginOptions {
  llm: LLMService;
  teeClient?: ITeeClient;
}

export interface TrialCriteria {
  field: string;
  expected: string | null;
  description?: string;
}

export interface ParsedTrial {
  id: string;
  name: string;
  phase: string;
  indication: string;
  sponsor: string;
  description: string;
  startDate?: string;
  enrollmentCount?: number;
  criteria: {
    inclusion: TrialCriteria[];
    exclusion: TrialCriteria[];
  };
}

// In-memory storage for trials (for MVP demo purposes)
const trialsStore: Map<string, ParsedTrial> = new Map();

// Initialize with mock trial for testing
trialsStore.set("TRIAL-2026-001", {
  id: "TRIAL-2026-001",
  name: "Phase III NSCLC Immunotherapy Trial",
  phase: "III",
  indication: "Non-small cell lung cancer",
  sponsor: "GenoPharma Inc.",
  description: "A randomized, double-blind study evaluating the efficacy and safety of a novel PD-L1 inhibitor in patients with advanced non-small cell lung cancer.",
  startDate: "2026-07-01",
  enrollmentCount: 500,
  criteria: {
    inclusion: [
      { field: "diagnosis_codes", expected: "C34.9", description: "Histologically confirmed NSCLC" },
      { field: "age", expected: null, description: "Age 18 to 75 years" },
      { field: "gender", expected: "female", description: "Female patients" },
      { field: "pdl1_expression", expected: "high", description: "PD-L1 Expression ≥ 50%" },
    ],
    exclusion: [
      { field: "allergies", expected: "peanut", description: "Peanut allergy" },
      { field: "prior_therapy", expected: "metastatic", description: "Prior systemic therapy for metastatic disease" },
    ],
  },
});

trialsStore.set("TRIAL-2026-002", {
  id: "TRIAL-2026-002",
  name: "Advanced Melanoma Combination Therapy",
  phase: "II",
  indication: "Melanoma",
  sponsor: "Nexus Labs",
  description: "Evaluating safety and tolerability of combination therapy in patients with BRAF V600E mutated unresectable melanoma.",
  startDate: "2026-08-15",
  enrollmentCount: 250,
  criteria: {
    inclusion: [
      { field: "diagnosis_codes", expected: "C43.9", description: "Confirmed melanoma diagnosis" },
      { field: "braf_mutation", expected: "V600E", description: "BRAF V600E mutation" },
      { field: "age", expected: null, description: "Age 18 or older" },
    ],
    exclusion: [
      { field: "medications", expected: "warfarin", description: "Current warfarin use" },
    ],
  },
});

export async function trialsRoutes(fastify: FastifyInstance, opts: TrialsRoutesOptions) {
  const { llm, teeClient } = opts;

  // Create a new trial by parsing protocol text
  fastify.post<{ Body: { protocolText: string; trialName?: string; phase?: string; indication?: string } }>(
    "/trials/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["protocolText"],
          properties: {
            protocolText: { type: "string", minLength: 10 },
            trialName: { type: "string" },
            phase: { type: "string" },
            indication: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { protocolText, trialName, phase, indication } = request.body;

      fastify.log.info("Parsing trial protocol with LLM...");

      // Use LLM to parse the protocol text
      const parsed = await llm.parseTrialProtocol(protocolText) as {
        trialName: string;
        phase: string;
        indication: string;
        description: string;
        inclusion: TrialCriteria[];
        exclusion: TrialCriteria[];
      };

      // Generate a trial ID
      const trialId = `TRIAL-${new Date().getFullYear()}-${String(trialsStore.size + 1).padStart(3, "0")}`;

      // Create the trial object, preferring user input over LLM parsing
      const newTrial: ParsedTrial = {
        id: trialId,
        name: trialName || parsed.trialName || `Clinical Trial ${trialId}`,
        phase: phase || parsed.phase || "II",
        indication: indication || parsed.indication || "Various",
        sponsor: "GenoPharma Inc.", // Hardcoded for demo
        description: parsed.description || protocolText.substring(0, 200) + "...",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        enrollmentCount: 100,
        criteria: {
          inclusion: parsed.inclusion || [],
          exclusion: parsed.exclusion || [],
        },
      };

      // Store the trial in backend
      trialsStore.set(trialId, newTrial);

      fastify.log.info({ trialId, criteriaCount: newTrial.criteria.inclusion.length }, "Trial created in backend store");

      // Publish to TEE contract if using real TEE
      if (teeClient && typeof teeClient.publishTrial === 'function') {
        try {
          await teeClient.publishTrial(trialId, newTrial.criteria);
          fastify.log.info({ trialId }, "Trial published to TEE contract");
        } catch (error) {
          fastify.log.warn({ trialId, error }, "Failed to publish to TEE contract, continuing with backend-only storage");
        }
      }

      return {
        success: true,
        trial: newTrial,
      };
    },
  );

  // Get all trials
  fastify.get("/trials/all", async (_request, reply) => {
    const trials = Array.from(trialsStore.values());
    return { trials };
  });

  // Get a specific trial by ID
  fastify.get<{ Params: { id: string } }>(
    "/trials/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const trial = trialsStore.get(id);

      if (!trial) {
        return reply.status(404).send({ error: "Trial not found" });
      }

      return { trial };
    },
  );

  // Delete a trial (for testing)
  fastify.delete<{ Params: { id: string } }>(
    "/trials/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const deleted = trialsStore.delete(id);

      if (!deleted) {
        return reply.status(404).send({ error: "Trial not found" });
      }

      return { success: true, message: `Trial ${id} deleted` };
    },
  );

  // Check eligibility for a specific trial (patient-initiated)
  fastify.post<{ 
    Params: { id: string };
    Body: { patientDid: string };
  }>(
    "/trials/:id/check-eligibility",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["patientDid"],
          properties: {
            patientDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { patientDid } = request.body;

      const trial = trialsStore.get(id);
      if (!trial) {
        return reply.status(404).send({ error: "Trial not found" });
      }

      if (!teeClient) {
        return reply.status(503).send({ error: "TEE client not configured" });
      }

      fastify.log.info({ trialId: id, patientDid }, "Checking eligibility via TEE");

      try {
        const result = await teeClient.checkEligibility(id, patientDid);
        
        return {
          success: true,
          eligibility: result,
          trial: {
            id: trial.id,
            name: trial.name,
            phase: trial.phase,
            indication: trial.indication,
          },
        };
      } catch (error) {
        fastify.log.error({ error, trialId: id, patientDid }, "Eligibility check failed");
        
        if (error instanceof Error) {
          return reply.status(500).send({ error: error.message });
        }
        
        return reply.status(500).send({ error: "Failed to check eligibility" });
      }
    },
  );
}

// Export function to access the trials store
export function getTrialsStore(): Map<string, ParsedTrial> {
  return trialsStore;
}
