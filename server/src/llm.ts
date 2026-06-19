import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import type { StructuredQuery, EligibilityResult, MatchResult } from "./orchestrator";

export interface LLMProvider {
  name: string;
  generate(prompt: string, schema?: object): Promise<unknown>;
}

class GeminiProvider implements LLMProvider {
  name = "gemini";
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string, schema?: object): Promise<unknown> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      ...(schema ? { generationConfig: { responseMimeType: "application/json", responseSchema: schema as any } } : {}),
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (schema) {
      return JSON.parse(text);
    }
    return text;
  }
}

class GroqProvider implements LLMProvider {
  name = "groq";
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async generate(prompt: string, schema?: object): Promise<unknown> {
    const params: Record<string, unknown> = {
      model: "qwen/qwen3.6-27b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      top_p: 0.80,
    };
    if (schema) {
      params.response_format = { type: "json_object" };
    }
    const response = await this.client.chat.completions.create(params as any);
    const text = response.choices[0]?.message?.content ?? "";
    if (schema) {
      return JSON.parse(text);
    }
    return text;
  }
}

class MockProvider implements LLMProvider {
  name = "mock";
  async generate(_prompt: string, schema?: object): Promise<unknown> {
    if (schema) {
      if ((schema as any).type === "array") return [];
      return {};
    }
    return "Mock response — LLM API key not configured.";
  }
}

export class LLMService {
  public provider: LLMProvider;

  constructor(providerName: string) {
    const apiKey = providerName === "groq"
      ? process.env.GROQ_API_KEY
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      this.provider = new MockProvider();
      return;
    }

    this.provider = providerName === "groq"
      ? new GroqProvider(apiKey)
      : new GeminiProvider(apiKey);
  }

  async parseQuery(query: string): Promise<StructuredQuery> {
    return this.provider.generate(
      `Parse this clinical trial search query into structured criteria. Return only JSON.\n\nQuery: "${query}"`,
      {
        type: "object",
        properties: {
          condition: { type: "string" },
          phase: { type: "string", enum: ["I", "II", "III", "IV"] },
          location: { type: "string" },
          ageRange: { type: "string" },
        },
      },
    ) as Promise<StructuredQuery>;
  }

  async generateMatchSummary(results: MatchResult[]) {
    return this.provider.generate(
      `Summarize these clinical trial match results for a healthcare professional. Be concise.\n\n${JSON.stringify(results, null, 2)}`,
    ) as Promise<string>;
  }

  async generateExplanation(trialId: string, eligibility: EligibilityResult) {
    const status = eligibility.eligible ? "matches" : "does not match";
    const failed = eligibility.failed_criteria.length > 0
      ? eligibility.failed_criteria.join(", ")
      : "none";

    return this.provider.generate(
      `Explain why this patient ${status} trial ${trialId}. ` +
      `Confidence: ${eligibility.confidence}. ` +
      `Matched ${eligibility.matched_criteria}/${eligibility.total_criteria} criteria. ` +
      `Failed criteria: ${failed}. ` +
      `Use clear, non-technical language suitable for a patient.`,
    ) as Promise<string>;
  }

  async rankTrials(trials: EligibilityResult[]) {
    return this.provider.generate(
      `Rank these eligible trials by clinical relevance and urgency. Return a JSON array of trial IDs in ranked order.\n\n${JSON.stringify(trials, null, 2)}`,
      {
        type: "array",
        items: { type: "string" },
      },
    ) as Promise<string[]>;
  }

  async parseTrialProtocol(protocolText: string) {
    return this.provider.generate(
      `Parse this clinical trial protocol into structured inclusion and exclusion criteria. 
      Extract specific medical criteria that can be evaluated against patient data.
      Return JSON matching this schema:
      {
        "trialName": "string",
        "phase": "string (I, II, III, or IV)",
        "indication": "string",
        "description": "string (brief summary)",
        "inclusion": [{"field": "string", "expected": "string|null", "description": "string"}],
        "exclusion": [{"field": "string", "expected": "string|null", "description": "string"}]
      }
      
      Important: Use standard medical field names like "diagnosis_codes", "age", "gender", "allergies", "medications", "pdl1_expression", "braf_mutation", "prior_therapy".
      
      Protocol text:
      ${protocolText}`,
      {
        type: "object",
        properties: {
          trialName: { type: "string" },
          phase: { type: "string" },
          indication: { type: "string" },
          description: { type: "string" },
          inclusion: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                expected: { type: ["string", "null"] },
                description: { type: "string" },
              },
            },
          },
          exclusion: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                expected: { type: ["string", "null"] },
                description: { type: "string" },
              },
            },
          },
        },
      },
    );
  }
}
