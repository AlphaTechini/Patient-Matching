import type { LLMService } from "./llm";
import type { ITeeClient } from "./tee-client";

export interface StructuredQuery {
  condition?: string;
  phase?: string;
  location?: string;
  ageRange?: string;
}

export interface EligibilityResult {
  trial_id: string;
  eligible: boolean;
  confidence: number;
  matched_criteria: number;
  total_criteria: number;
  failed_criteria: string[];
}

export interface MatchResult {
  trial: { id: string; name: string; criteria: unknown };
  eligibility: EligibilityResult;
}

export interface OrchestratorDeps {
  llm: LLMService;
  tee: ITeeClient;
}

export class Orchestrator {
  constructor(
    private llm: LLMService,
    private tee: ITeeClient,
  ) {}

  async processMatch(query: string, patientDid: string) {
    const structuredQuery = await this.llm.parseQuery(query);

    const trials = await this.tee.getMatchingTrials(structuredQuery);

    const results: MatchResult[] = [];
    for (const trial of trials) {
      const eligibility = await this.tee.checkEligibility(trial.id, patientDid);
      results.push({ trial, eligibility });
    }

    const summary = await this.llm.generateMatchSummary(results);

    return { summary, results };
  }

  async explainMatch(trialId: string, eligibility: EligibilityResult) {
    return this.llm.generateExplanation(trialId, eligibility);
  }

  async recommendTrials(patientDid: string) {
    const eligible = await this.tee.getEligibleTrials(patientDid);
    return this.llm.rankTrials(eligible);
  }
}
