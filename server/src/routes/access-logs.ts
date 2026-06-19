import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getDatabase } from "../services/database";

export interface AccessLog {
  patientDid: string;
  timestamp: Date;
  requester: string; // Agent DID
  requesterName: string; // Agent name
  trialId: string;
  trialName: string;
  action: "authorization" | "eligibility_check" | "match_evaluation";
  purpose: string;
  hashProof?: string; // Optional: TEE execution hash
}

interface AccessLogsRoutesOptions extends FastifyPluginOptions {
  useDatabase: boolean;
}

export async function accessLogsRoutes(fastify: FastifyInstance, opts: AccessLogsRoutesOptions) {
  const { useDatabase } = opts;

  function getAccessLogsCollection() {
    if (!useDatabase) return null;
    const db = getDatabase();
    return db.collection<AccessLog>("access_logs");
  }

  // Log an access event
  fastify.post<{ Body: Omit<AccessLog, "timestamp"> }>(
    "/access-logs",
    {
      schema: {
        body: {
          type: "object",
          required: ["patientDid", "requester", "requesterName", "trialId", "trialName", "action", "purpose"],
          properties: {
            patientDid: { type: "string" },
            requester: { type: "string" },
            requesterName: { type: "string" },
            trialId: { type: "string" },
            trialName: { type: "string" },
            action: { type: "string", enum: ["authorization", "eligibility_check", "match_evaluation"] },
            purpose: { type: "string" },
            hashProof: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const logEntry: AccessLog = {
        ...request.body,
        timestamp: new Date(),
      };

      const logsCollection = getAccessLogsCollection();
      if (!logsCollection) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      await logsCollection.insertOne(logEntry);

      return { success: true };
    },
  );

  // Get access logs for a patient
  fastify.get<{ Querystring: { patientDid: string; limit?: string } }>(
    "/access-logs",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["patientDid"],
          properties: {
            patientDid: { type: "string" },
            limit: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { patientDid, limit } = request.query;
      const limitNum = limit ? parseInt(limit, 10) : 50;

      const logsCollection = getAccessLogsCollection();
      if (!logsCollection) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const logs = await logsCollection
        .find({ patientDid })
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .toArray();

      return {
        logs: logs.map((log) => ({
          timestamp: log.timestamp,
          requester: log.requester,
          requesterName: log.requesterName,
          trialId: log.trialId,
          trialName: log.trialName,
          action: log.action,
          purpose: log.purpose,
          hashProof: log.hashProof,
        })),
      };
    },
  );
}
