import { getDatabase } from "./database";

export interface MatchResult {
  trialId: string;
  patientDid: string;
  eligible: boolean;
  confidence: number;
  matchedCriteria: number;
  totalCriteria: number;
  details?: string; // AI-generated explanation
  checkedAt: Date;
  expiresAt: Date; // Cache expiry (e.g., 7 days)
}

function getMatchResultsCollection() {
  const db = getDatabase();
  return db.collection<MatchResult>("match_results");
}

/**
 * Store match result in cache
 */
export async function cacheMatchResult(result: Omit<MatchResult, "checkedAt" | "expiresAt">): Promise<void> {
  const matchResultsCollection = getMatchResultsCollection();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const matchResult: MatchResult = {
    ...result,
    checkedAt: now,
    expiresAt,
  };

  // Upsert: update if exists, insert if not
  await matchResultsCollection.updateOne(
    { trialId: result.trialId, patientDid: result.patientDid },
    { $set: matchResult },
    { upsert: true },
  );
}

/**
 * Get cached match result
 */
export async function getCachedMatchResult(
  trialId: string,
  patientDid: string,
): Promise<MatchResult | null> {
  const matchResultsCollection = getMatchResultsCollection();

  const now = new Date();

  // Find non-expired result
  const result = await matchResultsCollection.findOne({
    trialId,
    patientDid,
    expiresAt: { $gt: now },
  });

  return result;
}

/**
 * Get all cached matches for a patient
 */
export async function getPatientMatches(patientDid: string): Promise<MatchResult[]> {
  const matchResultsCollection = getMatchResultsCollection();

  const now = new Date();

  const results = await matchResultsCollection
    .find({
      patientDid,
      expiresAt: { $gt: now },
    })
    .toArray();

  return results;
}

/**
 * Get all eligible patients for a trial (used by pharma to see matches)
 */
export async function getTrialMatches(trialId: string): Promise<MatchResult[]> {
  const matchResultsCollection = getMatchResultsCollection();

  const now = new Date();

  const results = await matchResultsCollection
    .find({
      trialId,
      eligible: true,
      expiresAt: { $gt: now },
    })
    .toArray();

  return results;
}

/**
 * Get all eligible matches across all trials (used by pharma dashboard)
 */
export async function getAllEligibleMatches(): Promise<MatchResult[]> {
  const matchResultsCollection = getMatchResultsCollection();

  const now = new Date();

  const results = await matchResultsCollection
    .find({
      eligible: true,
      expiresAt: { $gt: now },
    })
    .toArray();

  return results;
}

/**
 * Invalidate match result (e.g., when patient updates their health records)
 */
export async function invalidatePatientMatches(patientDid: string): Promise<void> {
  const matchResultsCollection = getMatchResultsCollection();

  await matchResultsCollection.deleteMany({ patientDid });
}

/**
 * Invalidate trial matches (e.g., when trial criteria changes)
 */
export async function invalidateTrialMatches(trialId: string): Promise<void> {
  const matchResultsCollection = getMatchResultsCollection();

  await matchResultsCollection.deleteMany({ trialId });
}

/**
 * Clean up expired matches (can be run periodically)
 */
export async function cleanupExpiredMatches(): Promise<number> {
  const matchResultsCollection = getMatchResultsCollection();

  const now = new Date();

  const result = await matchResultsCollection.deleteMany({
    expiresAt: { $lt: now },
  });

  return result.deletedCount;
}
