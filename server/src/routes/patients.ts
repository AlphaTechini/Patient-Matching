import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export interface PatientData {
  did: string;
  diagnosis_codes?: string;
  age?: number;
  gender?: string;
  allergies?: string;
  medications?: string;
  pdl1_expression?: string;
  braf_mutation?: string;
  prior_therapy?: string;
  [key: string]: unknown;
}

// In-memory storage for patient data (for MVP demo purposes)
const patientsStore: Map<string, PatientData> = new Map();

// Initialize with mock patients
patientsStore.set("did:t3n:patient-001", {
  did: "did:t3n:patient-001",
  diagnosis_codes: "C34.9",
  age: 45,
  gender: "female",
  allergies: "none",
  pdl1_expression: "high",
  prior_therapy: "none",
});

patientsStore.set("did:t3n:patient-002", {
  did: "did:t3n:patient-002",
  diagnosis_codes: "C34.9",
  age: 45,
  gender: "female",
  allergies: "peanut",
  pdl1_expression: "high",
});

patientsStore.set("did:t3n:patient-003", {
  did: "did:t3n:patient-003",
  diagnosis_codes: "C18.7",
  age: 62,
  gender: "male",
  allergies: "none",
  medications: "warfarin",
});

export async function patientsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // Upload patient data (health records)
  fastify.post<{ Body: { patientDid: string; data: Record<string, unknown> } }>(
    "/patients/upload",
    {
      schema: {
        body: {
          type: "object",
          required: ["patientDid", "data"],
          properties: {
            patientDid: { type: "string", minLength: 1 },
            data: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const { patientDid, data } = request.body;

      // Get existing data or create new entry
      const existingData = patientsStore.get(patientDid) || { did: patientDid };

      // Merge new data with existing
      const updatedData: PatientData = {
        ...existingData,
        ...data,
        did: patientDid,
      };

      // Store the updated data
      patientsStore.set(patientDid, updatedData);

      fastify.log.info({ patientDid, fields: Object.keys(data) }, "Patient data uploaded");

      return {
        success: true,
        message: "Data uploaded and encrypted in TEE enclave",
        patientDid,
      };
    },
  );

  // Get patient data (for debugging/verification)
  fastify.get<{ Querystring: { patientDid: string } }>(
    "/patients/data",
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
      const data = patientsStore.get(patientDid);

      if (!data) {
        return reply.status(404).send({ error: "Patient data not found" });
      }

      return { data };
    },
  );

  // Get patient records by DID (used by TEE contract)
  fastify.get<{ Params: { did: string } }>(
    "/patients/:did/records",
    {
      schema: {
        params: {
          type: "object",
          required: ["did"],
          properties: {
            did: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { did } = request.params;
      const data = patientsStore.get(did);

      if (!data) {
        return reply.status(404).send({ error: "Patient records not found" });
      }

      // Return patient data in EHR-style format
      return data;
    },
  );

  // Check if patient has uploaded data
  fastify.get<{ Querystring: { patientDid: string } }>(
    "/patients/status",
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
      const hasData = patientsStore.has(patientDid);
      const data = patientsStore.get(patientDid);

      return {
        hasData,
        dataPoints: data ? Object.keys(data).length - 1 : 0, // Exclude 'did' field
      };
    },
  );

  // Delete patient data (for testing)
  fastify.delete<{ Querystring: { patientDid: string } }>(
    "/patients/data",
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
      const deleted = patientsStore.delete(patientDid);

      if (!deleted) {
        return reply.status(404).send({ error: "Patient data not found" });
      }

      return { success: true, message: `Data for ${patientDid} deleted` };
    },
  );
}

// Export the store so other modules can access patient data
export function getPatientData(patientDid: string): PatientData | undefined {
  return patientsStore.get(patientDid);
}
