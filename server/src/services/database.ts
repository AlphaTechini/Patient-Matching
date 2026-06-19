import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(uri: string, dbName: string = "trialmatch"): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectDatabase() first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection closed");
  }
}

// Patient credentials (encrypted wallet) - stored in MongoDB
export interface PatientCredentials {
  email: string;
  patientDid: string; // did:t3n:xxx
  ethAddress: string; // 0x...
  encryptedPrivateKey: string; // Encrypted with WALLET_ENCRYPTION_KEY
  createdAt: Date;
  lastLogin?: Date;
}

// Patient metadata and health records - stored in MongoDB
// NOTE: For MVP, we're storing health records here. In production, move to T3N profiles.
export interface PatientMetadata {
  patientDid: string;
  uploadStatus: {
    hasHealthRecords: boolean;
    lastUploadedAt?: Date;
    fileName?: string;
    fileSize?: number;
  };
  healthRecords?: {
    pdfText: string;           // Extracted PDF text (for MVP - move to T3N in production)
    uploadedAt: string;
  };
  preferences?: {
    notifications: boolean;
    language: string;
  };
}

// Agent credentials and state - stored in MongoDB
export interface Agent {
  agentName: string;           // "NSCLC Immunotherapy Trial Agent"
  agentDid: string;            // "did:t3n:abc123xyz" (SDK-generated)
  trialId: string;             // "TRIAL-2026-001"
  ethAddress: string;          // "0x..."
  encryptedPrivateKey: string; // Encrypted with WALLET_ENCRYPTION_KEY
  status: "active" | "paused" | "deleted";
  createdAt: Date;
  lastRunAt?: Date;
  stats?: {
    totalRuns: number;
    patientsScreened: number;
    patientsMatched: number;
  };
}

// Trial data - can be stored in MongoDB for persistence (currently in-memory in trials.ts)
export interface Trial {
  id: string;
  name: string;
  phase: string;
  indication: string;
  sponsor: string;
  description: string;
  startDate?: string;
  enrollmentCount?: number;
  criteria: {
    inclusion: Array<{
      field: string;
      expected: string | null;
      description?: string;
    }>;
    exclusion: Array<{
      field: string;
      expected: string | null;
      description?: string;
    }>;
  };
  createdAt: Date;
}

export function getPatientCredentialsCollection(): Collection<PatientCredentials> {
  const database = getDatabase();
  return database.collection<PatientCredentials>("patient_credentials");
}

export function getPatientMetadataCollection(): Collection<PatientMetadata> {
  const database = getDatabase();
  return database.collection<PatientMetadata>("patient_metadata");
}

export function getAgentsCollection(): Collection<Agent> {
  const database = getDatabase();
  return database.collection<Agent>("agents");
}

export function getTrialsCollection(): Collection<Trial> {
  const database = getDatabase();
  return database.collection<Trial>("trials");
}
