import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getPatientCredentialsCollection, getPatientMetadataCollection } from "../services/database";
import { createPatientAccount, getPatientClient, storePatientHealthData } from "../services/patient-onboarding";
import { authorizeAllAgentsForPatient } from "../services/agent-deployment";
import { extractTextFromPdf, validatePdfBuffer } from "../services/pdf-extractor";
import { invalidatePatientMatches } from "../services/match-cache";

interface PatientsRoutesOptions extends FastifyPluginOptions {
  useDatabase: boolean;
}

export async function patientsRoutes(fastify: FastifyInstance, opts: PatientsRoutesOptions) {
  const { useDatabase } = opts;

  if (!useDatabase) {
    fastify.log.warn("MongoDB not configured - patient onboarding will not work");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Patient Registration
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post<{ Body: { email: string } }>(
    "/patients/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { email } = request.body;

      const credentialsCollection = getPatientCredentialsCollection();

      // Check if patient already exists
      const existing = await credentialsCollection.findOne({ email });
      if (existing) {
        return reply.status(409).send({ error: "Patient already registered" });
      }

      fastify.log.info({ email }, "Creating new patient account");

      // Create custodial wallet and T3N DID
      const account = await createPatientAccount();

      // Store encrypted credentials in MongoDB
      await credentialsCollection.insertOne({
        email,
        patientDid: account.patientDid,
        ethAddress: account.ethAddress,
        encryptedPrivateKey: account.encryptedPrivateKey,
        createdAt: account.createdAt,
      });

      // Initialize metadata
      const metadataCollection = getPatientMetadataCollection();
      await metadataCollection.insertOne({
        patientDid: account.patientDid,
        uploadStatus: {
          hasHealthRecords: false,
        },
      });

      // Authorize all existing agents for this patient
      try {
        const agentsAuthorized = await authorizeAllAgentsForPatient(
          account.patientDid,
          account.encryptedPrivateKey,
          account.ethAddress,
        );

        fastify.log.info({ email, patientDid: account.patientDid, agentsAuthorized }, "Patient authorized for agents");
      } catch (error) {
        fastify.log.warn({ email, error }, "Failed to authorize agents for patient (continuing anyway)");
      }

      fastify.log.info(
        { email, patientDid: account.patientDid },
        "Patient account created successfully",
      );

      return {
        success: true,
        patientDid: account.patientDid,
        message: "Patient account created. You can now upload health records.",
      };
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Patient Login (Get DID by email)
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post<{ Body: { email: string } }>(
    "/patients/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { email } = request.body;

      const credentialsCollection = getPatientCredentialsCollection();
      const credentials = await credentialsCollection.findOne({ email });

      if (!credentials) {
        return reply.status(404).send({ error: "Patient not found" });
      }

      // Update last login
      await credentialsCollection.updateOne(
        { email },
        { $set: { lastLogin: new Date() } },
      );

      return {
        success: true,
        patientDid: credentials.patientDid,
        ethAddress: credentials.ethAddress,
      };
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Upload Health Records (PDF)
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post("/patients/upload-pdf", async (request, reply) => {
    if (!useDatabase) {
      return reply.status(503).send({ error: "Database not configured" });
    }

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

      // Get patient credentials
      const credentialsCollection = getPatientCredentialsCollection();
      const credentials = await credentialsCollection.findOne({ patientDid });

      if (!credentials) {
        return reply.status(404).send({ error: "Patient not found" });
      }

      // Read and validate PDF
      const buffer = await data.toBuffer();
      const fileName = data.filename;
      const fileSize = buffer.length;

      validatePdfBuffer(buffer, 20 * 1024 * 1024); // 20MB max

      // Extract text from PDF
      const { text: pdfText, numPages } = await extractTextFromPdf(buffer);

      if (!pdfText || pdfText.length < 50) {
        return reply.status(400).send({
          error: "PDF text extraction failed or document is too short",
        });
      }

      fastify.log.info(
        { patientDid, fileName, fileSize, numPages, textLength: pdfText.length },
        "PDF extracted successfully",
      );

      // Get patient's T3N client
      const patientClient = await getPatientClient(
        credentials.encryptedPrivateKey,
        credentials.ethAddress,
      );

      // For MVP: Store health data in MongoDB (production: move to T3N profiles)
      await storePatientHealthData(patientClient, pdfText, fileName);

      fastify.log.info({ patientDid }, "Health records stored (MVP: MongoDB)");

      // Update metadata in MongoDB with health records
      const metadataCollection = getPatientMetadataCollection();
      await metadataCollection.updateOne(
        { patientDid },
        {
          $set: {
            uploadStatus: {
              hasHealthRecords: true,
              lastUploadedAt: new Date(),
              fileName,
              fileSize,
            },
            healthRecords: {
              pdfText,
              uploadedAt: new Date().toISOString(),
            },
          },
        },
        { upsert: true },
      );

      // Invalidate cached match results since patient data changed
      await invalidatePatientMatches(patientDid);
      fastify.log.info({ patientDid }, "Invalidated match cache after health record upload");

      return {
        success: true,
        message: "Health records uploaded and stored",
        patientDid,
        metadata: {
          fileName,
          fileSize,
          numPages,
          textLength: pdfText.length,
        },
      };
    } catch (error) {
      fastify.log.error(error, "PDF upload failed");

      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Get Patient Status (Metadata Only)
  // ──────────────────────────────────────────────────────────────────────────

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
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { patientDid } = request.query;

      const metadataCollection = getPatientMetadataCollection();
      const metadata = await metadataCollection.findOne({ patientDid });

      if (!metadata) {
        return reply.status(404).send({ error: "Patient not found" });
      }

      return {
        patientDid: metadata.patientDid,
        uploadStatus: metadata.uploadStatus,
      };
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Delete Patient Account
  // ──────────────────────────────────────────────────────────────────────────

  fastify.delete<{ Body: { email: string } }>(
    "/patients/account",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      if (!useDatabase) {
        return reply.status(503).send({ error: "Database not configured" });
      }

      const { email } = request.body;

      const credentialsCollection = getPatientCredentialsCollection();
      const credentials = await credentialsCollection.findOne({ email });

      if (!credentials) {
        return reply.status(404).send({ error: "Patient not found" });
      }

      const patientDid = credentials.patientDid;

      // Delete from MongoDB
      await credentialsCollection.deleteOne({ email });

      const metadataCollection = getPatientMetadataCollection();
      await metadataCollection.deleteOne({ patientDid });

      fastify.log.info({ email, patientDid }, "Patient account deleted");

      return {
        success: true,
        message: "Patient account deleted. Health records remain in T3N profile.",
      };
    },
  );
}
