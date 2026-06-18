import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import cors from "@fastify/cors";
import env from "@fastify/env";
import { Orchestrator } from "../orchestrator";
import { LLMService } from "../llm";
import { MockTEEClient } from "../tee-client";
import { matchRoutes } from "../routes/match";

async function createTestApp() {
  const app = Fastify({ logger: false });

  await app.register(env, {
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
        GEMINI_API_KEY: { type: "string", default: "test_gemini_key" },
        GROQ_API_KEY: { type: "string", default: "test_groq_key" },
        PORT: { type: "string", default: "3001" },
      },
    },
  });

  await app.register(cors, { origin: true });

  const config = (app as unknown as { config: Record<string, string> }).config;

  const orchestrator = new Orchestrator(
    new LLMService(config.LLM_PROVIDER ?? "gemini"),
    new MockTEEClient(),
  );

  await app.register(matchRoutes, { prefix: "/api", orchestrator });
  await app.ready();

  return app;
}

describe("POST /api/match", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when query is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/match",
      payload: { patientDid: "did:t3n:patient-001" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when patientDid is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/match",
      payload: { query: "oncology phase III trials" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 200 with match results for a valid request", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/match",
      payload: {
        query: "Find phase III oncology trials for lung cancer in the US",
        patientDid: "did:t3n:patient-001",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("results");
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]).toHaveProperty("trial");
    expect(body.results[0]).toHaveProperty("eligibility");
    expect(body.results[0].eligibility).toHaveProperty("eligible");
  });

  it("returns eligible=true for patient-001 (all criteria met)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/match",
      payload: {
        query: "lung cancer",
        patientDid: "did:t3n:patient-001",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const lungTrial = body.results.find((r: any) => r.trial.id === "TRIAL-2026-001");
    expect(lungTrial).toBeDefined();
    expect(lungTrial.eligibility.eligible).toBe(true);
    expect(lungTrial.eligibility.confidence).toBeGreaterThan(0);
  });

  it("returns eligible=false for patient-002 (peanut allergy exclusion)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/match",
      payload: {
        query: "lung cancer",
        patientDid: "did:t3n:patient-002",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const lungTrial = body.results.find((r: any) => r.trial.id === "TRIAL-2026-001");
    expect(lungTrial).toBeDefined();
    expect(lungTrial.eligibility.eligible).toBe(false);
    expect(lungTrial.eligibility.failed_criteria).toContain("EXCLUDED: allergies");
  });
});

describe("POST /api/explain", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when trialId is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/explain",
      payload: { eligibilityResult: { eligible: true } },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 200 with explanation for valid request", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/explain",
      payload: {
        trialId: "TRIAL-2026-001",
        eligibilityResult: {
          trial_id: "TRIAL-2026-001",
          eligible: true,
          confidence: 0.94,
          matched_criteria: 3,
          total_criteria: 3,
          failed_criteria: [],
        },
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("explanation");
    expect(typeof body.explanation).toBe("string");
  });
});

describe("GET /api/trials", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when patientDid is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/trials",
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 200 with trial recommendations for valid request", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/trials",
      query: { patientDid: "did:t3n:patient-001" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("trials");
    expect(Array.isArray(body.trials)).toBe(true);
  });
});

describe("GET /health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(env, {
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
          GEMINI_API_KEY: { type: "string", default: "test_gemini_key" },
          GROQ_API_KEY: { type: "string", default: "test_groq_key" },
          PORT: { type: "string", default: "3001" },
        },
      },
    });

    app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with status ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});
