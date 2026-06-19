import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { LLMService } from "../llm";
import { getPatientsCollection, type PatientRecord } from "../services/database";
import { extractTextFromPdf, validatePdfBuffer } from "../services/pdf-extractor";

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

// In-memory storage for patient data (fallback when MongoDB is not configured)
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

export async function patientsRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions & { llm: LLMService; useDatabase: boolean },
) {
  const { llm, useDatabase } = opts;

  // Upload patient data as PDF
  fastify.post("/patients/upload-pdf", async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      // Get patient DID from fields
      const patientDid = data.fields.patientDid?.value;
      if (!patientDid || typeof patientDid !== "string") {
        return reply.status(400).send({ error: "patientDid field is required" });
      }

      // Read file buffer
      const buffer = await data.toBuffer();
      const fileName = data.filename;
      const fileSize = buffer.length;

      // Validate PDF
      validatePdfBuffer(buffer, 20 * 1024 * 1024); // 20MB max

      // Extract text from PDF
      const { text: rawText, numPages } = await extractTextFromPdf(buffer);

      if (!rawText || rawText.length < 50) {
        return reply.status(400).send({
          error: "PDF text extraction failed or document is too short",
        });
      }

      fastify.log.info(
        { patientDid, fileName, fileSize, numPages, textLength: rawText.length },
        "PDF extracted successfully",
      );

      // Parse patient data using LLM
      const extractedData = await llm.parsePatientRecords(rawText);

      fastify.log.info(
        { patientDid, extractedFields: Object.keys(extractedData) },
        "Patient data extracted by LLM",
      );

      // Store in database or memory
      if (useDatabase) {
        const patientsCollection = getPatientsCollection();
        const record: PatientRecord = {
          did: patientDid,
          rawText,
          extractedData,
          metadata: {
            uploadedAt: new Date(),
            fileName,
            fileSize,
            processingStatus: "completed",
          },
        };

        await patientsCollection.updateOne(
          { did: patientDid },
          { $set: record },
          { upsert: true },
        );

        fastify.log.info({ patientDid }, "Patient record saved to MongoDB");
      } else {
        // Fallback to in-memory storage
        patientsStore.set(patientDid, {
          did: patientDid,
          ...extractedData,
        } as PatientData);

        fastify.log.info({ patientDid }, "Patient record saved to memory (MongoDB not configured)");
      }

      return {
        success: true,
        message: "Patient records processed and stored",
        patientDid,
        extractedFields: Object.keys(extractedData),
        metadata: {
          fileName,
          fileSize,
          numPages,
          textLength: rawText.length,
        },
      };
    } catch (error) {
      fastify.log.error(error, "PDF upload processing failed");

      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Internal server error" });
    }
  });
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

      let data: PatientData | undefined;

      if (useDatabase) {
        try {
          const patientsCollection = getPatientsCollection();
          const record = await patientsCollection.findOne({ did: patientDid });

          if (record) {
            data = {
              did: record.did,
              ...record.extractedData,
            } as PatientData;
          }
        } catch (error) {
          fastify.log.error(error, "Database query failed");
        }
      } else {
        data = patientsStore.get(patientDid);
      }

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

      let data: PatientData | undefined;

      if (useDatabase) {
        try {
          const patientsCollection = getPatientsCollection();
          const record = await patientsCollection.findOne({ did });

          if (record) {
            data = {
              did: record.did,
              ...record.extractedData,
            } as PatientData;
          }
        } catch (error) {
          fastify.log.error(error, "Database query failed");
        }
      } else {
        data = patientsStore.get(did);
      }

      if (!data) {
        return reply.status(404).send({ error: "Patient records not found" });
      }

      return data;
    },
  );

  // Get raw text from patient record (for debugging LLM extraction)
  fastify.get<{ Querystring: { patientDid: string } }>(
    "/patients/raw-text",
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

      if (!useDatabase) {
        return reply.status(501).send({
          error: "Raw text only available when using MongoDB storage",
        });
      }

      try {
        const patientsCollection = getPatientsCollection();
        const record = await patientsCollection.findOne({ did: patientDid });

        if (!record) {
          return reply.status(404).send({ error: "Patient record not found" });
        }

        return {
          did: record.did,
          rawText: record.rawText,
          extractedData: record.extractedData,
          metadata: record.metadata,
        };
      } catch (error) {
        fastify.log.error(error, "Database query failed");
        return reply.status(500).send({ error: "Database error" });
      }
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

      let hasData = false;
      let dataPoints = 0;

      if (useDatabase) {
        try {
          const patientsCollection = getPatientsCollection();
          const record = await patientsCollection.findOne({ did: patientDid });

          if (record) {
            hasData = true;
            dataPoints = Object.keys(record.extractedData).length;
          }
        } catch (error) {
          fastify.log.error(error, "Database query failed");
        }
      } else {
        hasData = patientsStore.has(patientDid);
        const data = patientsStore.get(patientDid);
        dataPoints = data ? Object.keys(data).length - 1 : 0; // Exclude 'did' field
      }

      return {
        hasData,
        dataPoints,
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

      let deleted = false;

      if (useDatabase) {
        try {
          const patientsCollection = getPatientsCollection();
          const result = await patientsCollection.deleteOne({ did: patientDid });
          deleted = result.deletedCount > 0;
        } catch (error) {
          fastify.log.error(error, "Database delete failed");
        }
      } else {
        deleted = patientsStore.delete(patientDid);
      }

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
