import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import env from "@fastify/env";
import multipart from "@fastify/multipart";
import { Orchestrator } from "./orchestrator";
import { LLMService } from "./llm";
import { TEEClient } from "./tee-client";
import { connectDatabase, closeDatabase } from "./services/database";
import { matchRoutes } from "./routes/match";
import { trialsRoutes } from "./routes/trials";
import { patientsRoutes } from "./routes/patients-new";
import { agentsRoutes } from "./routes/agents";
import { pharmaRoutes } from "./routes/pharma";
import { accessLogsRoutes } from "./routes/access-logs";
import { messagesRoutes } from "./routes/messages";

console.log("🔍 Environment check:");
console.log("  - NODE_ENV:", process.env.NODE_ENV || "development");
console.log("  - WALLET_ENCRYPTION_KEY:", process.env.WALLET_ENCRYPTION_KEY ? "✅ Set" : "❌ Missing");
console.log("  - MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing");
console.log("  - T3N_API_KEY:", process.env.T3N_API_KEY ? "✅ Set" : "❌ Missing");
console.log("  - LLM_PROVIDER:", process.env.LLM_PROVIDER || "gemini");
console.log("");

const fastify = Fastify({
  logger: process.env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
            singleLine: false,
          },
        },
      }
    : true, // Production: structured JSON logs for GCP Cloud Logging
});

await fastify.register(env, {
  dotenv: true,
  schema: {
    type: "object",
    required: [],
    properties: {
      T3N_API_KEY: { type: "string", default: "" },
      AGENT_KEY: { type: "string", default: "" },
      EHR_API_KEY: { type: "string", default: "" },
      TRIALS_API_KEY: { type: "string", default: "" },
      PHARMA_TENANT_DID: { type: "string", default: "" },
      HOSPITAL_TENANT_DID: { type: "string", default: "" },
      LLM_PROVIDER: { type: "string", default: "gemini" },
      GEMINI_API_KEY: { type: "string", default: "" },
      GROQ_API_KEY: { type: "string", default: "" },
      MONGODB_URI: { type: "string", default: "" },
      WALLET_ENCRYPTION_KEY: { type: "string", default: "" },
      PORT: { type: "string", default: "3008" },

    },
  },
});

const config = (fastify as unknown as { config: Record<string, string> }).config;

await fastify.register(cors, { origin: true });
await fastify.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
});

// Connect to MongoDB if URI is provided
let useDatabase = false;
if (config.MONGODB_URI) {
  try {
    await connectDatabase(config.MONGODB_URI);
    useDatabase = true;
    fastify.log.info("MongoDB connected successfully");
  } catch (error) {
    fastify.log.error(error, "MongoDB connection failed — patient onboarding will not work");
  }
} else {
  fastify.log.warn("MONGODB_URI not configured — patient onboarding will not work without database");
}

// Always use real TEE client - contracts are deployed
const teeClient = new TEEClient();
fastify.log.info("Using TEEClient for secure contract execution");

const llmService = new LLMService(config.LLM_PROVIDER ?? "gemini");
const orchestrator = new Orchestrator(llmService, teeClient);

await fastify.register(matchRoutes, { prefix: "/api", orchestrator });
await fastify.register(trialsRoutes, { prefix: "/api", llm: llmService, teeClient, useDatabase });
await fastify.register(patientsRoutes, { prefix: "/api", useDatabase });
await fastify.register(agentsRoutes, { prefix: "/api", useDatabase });
await fastify.register(pharmaRoutes, { prefix: "/api", useDatabase });
await fastify.register(accessLogsRoutes, { prefix: "/api", useDatabase });
await fastify.register(messagesRoutes, { prefix: "/api", useDatabase });

const port = Number(config.PORT);

fastify.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});

// Graceful shutdown for Cloud Run / container orchestrators
process.on("SIGTERM", async () => {
  fastify.log.info("SIGTERM received, closing server...");
  await fastify.close();
  await closeDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  fastify.log.info("SIGINT received, closing server...");
  await fastify.close();
  await closeDatabase();
  process.exit(0);
});
