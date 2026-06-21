import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getAgentsCollection } from "../services/database";
import { deployAgent, runAgent } from "../services/agent-deployment";
import { getTrialsStore } from "./trials";

interface AgentsRoutesOptions extends FastifyPluginOptions {
  useDatabase: boolean;
}

export async function agentsRoutes(fastify: FastifyInstance, opts: AgentsRoutesOptions) {
  const { useDatabase } = opts;

  if (!useDatabase) {
    fastify.log.warn("MongoDB not configured - agent deployment will not work");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Deploy Agent for Trial
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post<{
    Params: { trialId: string };
    Body: { agentName?: string };
  }>(
    "/trials/:trialId/deploy-agent",
    {
      schema: {
        params: {
          type: "object",
          required: ["trialId"],
          properties: {
            trialId: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            agentName: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { trialId } = request.params;
      const { agentName } = request.body;

      // Get trial details
      const trialsStore = getTrialsStore();
      const trial = trialsStore.get(trialId);

      if (!trial) {
        return reply.status(404).send({ error: "Trial not found" });
      }

      fastify.log.info({ trialId, trialName: trial.name }, "Deploying agent for trial");

      try {
        const result = await deployAgent(trialId, trial.name, agentName);

        return {
          success: true,
          message: "Agent deployed and authorized for all patients",
          agent: {
            agentName: result.agentName,
            agentDid: result.agentDid,
            trialId: result.trialId,
            status: result.status,
          },
          patientsAuthorized: result.patientsAuthorized,
        };
      } catch (error) {
        fastify.log.error(error, "Agent deployment failed");

        if (error instanceof Error) {
          return reply.status(500).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Agent deployment failed" });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Run Agent (Check Eligibility for All Patients)
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post<{ Params: { agentDid: string } }>(
    "/agents/:agentDid/run",
    {
      schema: {
        params: {
          type: "object",
          required: ["agentDid"],
          properties: {
            agentDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { agentDid } = request.params;

      fastify.log.info({ agentDid }, "Running agent");

      try {
        const result = await runAgent(agentDid);

        return {
          success: result.errors && result.errors.length > 0 ? false : true,
          agent: {
            agentDid: result.agentDid,
            trialId: result.trialId,
          },
          eligiblePatients: result.eligiblePatients,
          summary: result.summary,
          ranAt: result.ranAt,
          errors: result.errors,
        };
      } catch (error) {
        fastify.log.error(error, "Agent run failed");

        if (error instanceof Error) {
          return reply.status(500).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Agent run failed" });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Get Agent by DID
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get<{ Params: { agentDid: string } }>(
    "/agents/:agentDid",
    {
      schema: {
        params: {
          type: "object",
          required: ["agentDid"],
          properties: {
            agentDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { agentDid } = request.params;

      const agentsCollection = getAgentsCollection();
      const agent = await agentsCollection.findOne({ agentDid });

      if (!agent) {
        return reply.status(404).send({ error: "Agent not found" });
      }

      return {
        agent: {
          agentName: agent.agentName,
          agentDid: agent.agentDid,
          trialId: agent.trialId,
          status: agent.status,
          createdAt: agent.createdAt,
          lastRunAt: agent.lastRunAt,
          stats: agent.stats,
        },
      };
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // List All Agents for Trial
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get<{ Params: { trialId: string } }>(
    "/trials/:trialId/agents",
    {
      schema: {
        params: {
          type: "object",
          required: ["trialId"],
          properties: {
            trialId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { trialId } = request.params;

      const agentsCollection = getAgentsCollection();
      const agents = await agentsCollection.find({ trialId }).toArray();

      return {
        trialId,
        agents: agents.map((a) => ({
          agentName: a.agentName,
          agentDid: a.agentDid,
          status: a.status,
          createdAt: a.createdAt,
          lastRunAt: a.lastRunAt,
          stats: a.stats,
        })),
      };
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Re-authorize Agent (for all new patients)
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post<{ Params: { agentDid: string } }>(
    "/agents/:agentDid/reauthorize",
    {
      schema: {
        params: {
          type: "object",
          required: ["agentDid"],
          properties: {
            agentDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { agentDid } = request.params;

      fastify.log.info({ agentDid }, "Re-authorizing agent for all patients");

      try {
        const { authorizeAgentForAllPatients } = await import("../services/agent-deployment");
        const authorizedCount = await authorizeAgentForAllPatients(agentDid);

        return {
          success: true,
          message: `Agent re-authorized for ${authorizedCount} patients`,
          agentDid,
          patientsAuthorized: authorizedCount,
        };
      } catch (error) {
        fastify.log.error(error, "Agent re-authorization failed");

        if (error instanceof Error) {
          return reply.status(500).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Agent re-authorization failed" });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Pause/Resume Agent
  // ──────────────────────────────────────────────────────────────────────────

  fastify.patch<{
    Params: { agentDid: string };
    Body: { status: "active" | "paused" };
  }>(
    "/agents/:agentDid/status",
    {
      schema: {
        params: {
          type: "object",
          required: ["agentDid"],
          properties: {
            agentDid: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["active", "paused"] },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { agentDid } = request.params;
      const { status } = request.body;

      const agentsCollection = getAgentsCollection();
      const result = await agentsCollection.updateOne({ agentDid }, { $set: { status } });

      if (result.matchedCount === 0) {
        return reply.status(404).send({ error: "Agent not found" });
      }

      return {
        success: true,
        agentDid,
        status,
      };
    },
  );
}
