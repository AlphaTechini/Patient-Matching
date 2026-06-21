import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { LLMService } from "../llm";
import type { ITeeClient } from "../tee-client";
import { getCachedMatchResult, cacheMatchResult, invalidateTrialMatches } from "../services/match-cache";

interface TrialsRoutesOptions extends FastifyPluginOptions {
  llm: LLMService;
  teeClient?: ITeeClient;
  useDatabase?: boolean;
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

// Initialize with mock trials for testing
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

/**
 * Load trials from MongoDB into the in-memory store on server startup
 * This ensures seeded trials persist across server restarts
 */
async function loadTrialsFromDatabase(useDatabase: boolean) {
  if (!useDatabase) {
    return;
  }

  try {
    const { getDatabase } = await import("../services/database");
    const db = getDatabase();
    const trialsCollection = db.collection<ParsedTrial>("trials");
    
    const trials = await trialsCollection.find({}).toArray();
    
    trials.forEach((trial) => {
      trialsStore.set(trial.id, trial);
    });
    
    console.log(`✅ Loaded ${trials.length} trials from MongoDB into memory`);
  } catch (error) {
    console.error("⚠️  Failed to load trials from MongoDB:", error);
  }
}

export async function trialsRoutes(fastify: FastifyInstance, opts: TrialsRoutesOptions) {
  const { llm, teeClient } = opts;
  
  // Load trials from MongoDB on startup (if database is available)
  const useDatabase = !!opts.useDatabase;
  await loadTrialsFromDatabase(useDatabase);

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

      // Also store in MongoDB if database is available
      if (useDatabase) {
        try {
          const { getDatabase } = await import("../services/database");
          const db = getDatabase();
          const trialsCollection = db.collection("trials");
          await trialsCollection.updateOne(
            { id: trialId },
            { $set: newTrial },
            { upsert: true }
          );
          fastify.log.info({ trialId }, "Trial saved to MongoDB");
        } catch (error) {
          fastify.log.warn({ trialId, error }, "Failed to save trial to MongoDB, continuing with in-memory only");
        }
      }

      fastify.log.info({ trialId, criteriaCount: newTrial.criteria.inclusion.length }, "Trial created");

      // Attempt to publish to TEE contract (optional - fallback to backend if fails)
      if (teeClient) {
        try {
          await teeClient.publishTrial(trialId, newTrial.criteria);
          fastify.log.info({ trialId }, "Trial published to TEE contract");
        } catch (error) {
          fastify.log.warn({ trialId, error }, "Failed to publish trial to TEE - using backend fallback for matching");
          // Continue - backend eligibility checking will handle matching
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

      // Check cache first
      const cached = await getCachedMatchResult(id, patientDid);
      if (cached) {
        fastify.log.info({ trialId: id, patientDid }, "Returning cached eligibility result");
        
        return {
          success: true,
          eligibility: {
            eligible: cached.eligible,
            confidence: cached.confidence,
            matched_criteria: cached.matchedCriteria,
            total_criteria: cached.totalCriteria,
            details: cached.details,
          },
          trial: {
            id: trial.id,
            name: trial.name,
            phase: trial.phase,
            indication: trial.indication,
          },
          cached: true,
        };
      }

      if (!teeClient) {
        return reply.status(503).send({ error: "TEE client not configured" });
      }

      fastify.log.info({ trialId: id, patientDid }, "Checking eligibility via TEE (cache miss)");

      try {
        const result = await teeClient.checkEligibility(id, patientDid);
        
        // Generate AI explanation if available
        let details: string | undefined;
        if (llm) {
          try {
            details = await llm.generateExplanation(id, result) as string;
          } catch (err) {
            fastify.log.warn({ err }, "Failed to generate AI explanation");
          }
        }

        // Cache the result for future lookups
        await cacheMatchResult({
          trialId: id,
          patientDid,
          eligible: result.eligible,
          confidence: result.confidence,
          matchedCriteria: result.matched_criteria,
          totalCriteria: result.total_criteria,
          details,
        });
        
        return {
          success: true,
          eligibility: {
            ...result,
            details,
          },
          trial: {
            id: trial.id,
            name: trial.name,
            phase: trial.phase,
            indication: trial.indication,
          },
          cached: false,
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

  // Invalidate trial matches (when trial criteria changes)
  fastify.delete<{ Params: { id: string } }>(
    "/trials/:id/matches",
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

      await invalidateTrialMatches(id);

      return { success: true, message: `Match cache cleared for trial ${id}` };
    },
  );
  // Get patient-specific matches (eligible trials with cached results)
  fastify.get<{ Querystring: { patientDid: string } }>(
    "/patients/:patientDid/matches",
    {
      schema: {
        params: {
          type: "object",
          required: ["patientDid"],
          properties: {
            patientDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { patientDid } = request.params;

      // Get cached match results from match-cache service
      const { getPatientMatches } = await import("../services/match-cache");
      const matchResults = await getPatientMatches(patientDid);

      // Filter only eligible matches
      const eligibleMatches = matchResults.filter(m => m.eligible);

      // Enrich with trial details
      const matches = eligibleMatches.map((result) => {
        const trial = trialsStore.get(result.trialId);
        
        if (!trial) {
          return null;
        }

        return {
          trialId: result.trialId,
          trialName: trial.name,
          phase: trial.phase,
          indication: trial.indication,
          sponsor: trial.sponsor,
          description: trial.description,
          criteria: {
            inclusionCount: trial.criteria.inclusion.length,
            exclusionCount: trial.criteria.exclusion.length,
          },
          confidence: result.confidence,
          matchedCriteria: result.matchedCriteria,
          totalCriteria: result.totalCriteria,
          checkedAt: result.checkedAt,
        };
      }).filter(m => m !== null);

      return {
        patientDid,
        matchCount: matches.length,
        matches,
      };
    },
  );

  // Get all pharma match results (all eligible matches across all trials)
  fastify.get("/pharma/matches", async (_request, reply) => {
    try {
      const { getAllEligibleMatches } = await import("../services/match-cache");
      const allMatches = await getAllEligibleMatches();

      // Enrich with trial details
      const matches = allMatches.map((result) => {
        const trial = trialsStore.get(result.trialId);
        
        if (!trial) {
          return null;
        }

        return {
          trialId: result.trialId,
          trialName: trial.name,
          phase: trial.phase,
          indication: trial.indication,
          sponsor: trial.sponsor,
          patientDid: result.patientDid,
          confidence: result.confidence,
          matchedCriteria: result.matchedCriteria,
          totalCriteria: result.totalCriteria,
          details: result.details,
          checkedAt: result.checkedAt,
        };
      }).filter(m => m !== null);

      return {
        totalMatches: matches.length,
        matches,
      };
    } catch (error) {
      fastify.log.error({ error }, "Failed to fetch pharma matches");
      return reply.status(500).send({ error: "Failed to fetch match results" });
    }
  });
}

// Export function to access the trials store
export function getTrialsStore(): Map<string, ParsedTrial> {
  return trialsStore;
}
