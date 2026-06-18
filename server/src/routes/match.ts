import type { FastifyInstance } from "fastify";
import type { FastifyPluginOptions } from "fastify";
import { Orchestrator } from "../orchestrator";

interface MatchRoutesOptions extends FastifyPluginOptions {
  orchestrator: Orchestrator;
}

export async function matchRoutes(fastify: FastifyInstance, opts: MatchRoutesOptions) {
  const { orchestrator } = opts;

  fastify.post<{ Body: { query: string; patientDid: string } }>(
    "/match",
    {
      schema: {
        body: {
          type: "object",
          required: ["query", "patientDid"],
          properties: {
            query: { type: "string", minLength: 1 },
            patientDid: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { query, patientDid } = request.body;
      const result = await orchestrator.processMatch(query, patientDid);
      return result;
    },
  );

  fastify.post<{ Body: { trialId: string; eligibilityResult: unknown } }>(
    "/explain",
    {
      schema: {
        body: {
          type: "object",
          required: ["trialId", "eligibilityResult"],
          properties: {
            trialId: { type: "string" },
            eligibilityResult: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const { trialId, eligibilityResult } = request.body;
      const explanation = await orchestrator.explainMatch(trialId, eligibilityResult as any);
      return { explanation };
    },
  );

  fastify.get<{ Querystring: { patientDid: string } }>(
    "/trials",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["patientDid"],
          properties: {
            patientDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { patientDid } = request.query;
      const trials = await orchestrator.recommendTrials(patientDid);
      return { trials };
    },
  );
}
