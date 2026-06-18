import Fastify from "fastify";
import cors from "@fastify/cors";
import env from "@fastify/env";
import { Orchestrator } from "./orchestrator";
import { LLMService } from "./llm";
import { TEEClient, MockTEEClient } from "./tee-client";
import { matchRoutes } from "./routes/match";

const fastify = Fastify({ logger: true });

await fastify.register(env, {
  dotenv: true,
  schema: {
    type: "object",
    required: ["EHR_API_KEY", "TRIALS_API_KEY"],
    properties: {
      T3N_API_KEY: { type: "string", default: "" },
      AGENT_KEY: { type: "string", default: "" },
      EHR_API_KEY: { type: "string" },
      TRIALS_API_KEY: { type: "string" },
      PHARMA_TENANT_DID: { type: "string", default: "" },
      HOSPITAL_TENANT_DID: { type: "string", default: "" },
      LLM_PROVIDER: { type: "string", default: "gemini" },
      GEMINI_API_KEY: { type: "string", default: "" },
      GROQ_API_KEY: { type: "string", default: "" },
      PORT: { type: "string", default: "3008" },
    },
  },
});

await fastify.register(cors, { origin: true });

const config = (fastify as unknown as { config: Record<string, string> }).config;

// Use real TEE client when T3N keys are configured; otherwise fall back to mock
// so the server and integration tests work without testnet credentials.
const hasTeeConfig = config.T3N_API_KEY && config.AGENT_KEY && config.PHARMA_TENANT_DID && config.HOSPITAL_TENANT_DID;
const teeClient = hasTeeConfig ? new TEEClient() : new MockTEEClient();
if (!hasTeeConfig) {
  fastify.log.warn("T3N credentials incomplete — running with MockTEEClient for local development");
}

const orchestrator = new Orchestrator(
  new LLMService(config.LLM_PROVIDER ?? "gemini"),
  teeClient,
);

await fastify.register(matchRoutes, { prefix: "/api", orchestrator });

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
  process.exit(0);
});
