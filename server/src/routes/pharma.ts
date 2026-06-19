import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getDatabase } from "../services/database";

interface PharmaOrganization {
  name: string;
  did: string;
  createdAt: Date;
}

interface PharmaRoutesOptions extends FastifyPluginOptions {
  useDatabase: boolean;
}

// In-memory store for when MongoDB is not available
const pharmaStore: Map<string, PharmaOrganization> = new Map();

export async function pharmaRoutes(fastify: FastifyInstance, opts: PharmaRoutesOptions) {
  const { useDatabase } = opts;

  function getPharmaCollection() {
    if (!useDatabase) return null;
    const db = getDatabase();
    return db.collection<PharmaOrganization>("pharma_organizations");
  }

  // Register pharma organization
  fastify.post<{ Body: { name: string; did: string } }>(
    "/pharma/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "did"],
          properties: {
            name: { type: "string", minLength: 2 },
            did: { type: "string", pattern: "^did:t3n:" },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, did } = request.body;

      const pharmaCollection = getPharmaCollection();

      // Check if pharma already exists
      if (pharmaCollection) {
        const existing = await pharmaCollection.findOne({ name });
        if (existing) {
          return reply.status(409).send({ error: "Pharma organization already registered" });
        }
      } else {
        if (pharmaStore.has(name)) {
          return reply.status(409).send({ error: "Pharma organization already registered" });
        }
      }

      const pharmaOrg: PharmaOrganization = {
        name,
        did,
        createdAt: new Date(),
      };

      if (pharmaCollection) {
        await pharmaCollection.insertOne(pharmaOrg);
      } else {
        pharmaStore.set(name, pharmaOrg);
      }

      fastify.log.info({ name, did }, "Pharma organization registered");

      return {
        success: true,
        pharma: {
          name: pharmaOrg.name,
          did: pharmaOrg.did,
        },
      };
    },
  );

  // Login pharma organization
  fastify.post<{ Body: { name: string } }>(
    "/pharma/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2 },
          },
        },
      },
    },
    async (request, reply) => {
      const { name } = request.body;

      const pharmaCollection = getPharmaCollection();

      let pharmaOrg: PharmaOrganization | null = null;

      if (pharmaCollection) {
        pharmaOrg = await pharmaCollection.findOne({ name });
      } else {
        pharmaOrg = pharmaStore.get(name) || null;
      }

      if (!pharmaOrg) {
        return reply.status(404).send({ error: "Pharma organization not found" });
      }

      fastify.log.info({ name, did: pharmaOrg.did }, "Pharma organization logged in");

      return {
        success: true,
        pharma: {
          name: pharmaOrg.name,
          did: pharmaOrg.did,
        },
      };
    },
  );

  // Get pharma organization by name
  fastify.get<{ Params: { name: string } }>(
    "/pharma/:name",
    {
      schema: {
        params: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { name } = request.params;

      const pharmaCollection = getPharmaCollection();

      let pharmaOrg: PharmaOrganization | null = null;

      if (pharmaCollection) {
        pharmaOrg = await pharmaCollection.findOne({ name });
      } else {
        pharmaOrg = pharmaStore.get(name) || null;
      }

      if (!pharmaOrg) {
        return reply.status(404).send({ error: "Pharma organization not found" });
      }

      return {
        pharma: {
          name: pharmaOrg.name,
          did: pharmaOrg.did,
        },
      };
    },
  );
}
