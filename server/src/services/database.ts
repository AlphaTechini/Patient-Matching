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

export interface PatientRecord {
  did: string;
  rawText: string;
  extractedData: Record<string, unknown>;
  metadata: {
    uploadedAt: Date;
    fileName: string;
    fileSize: number;
    processingStatus: "pending" | "completed" | "failed";
    processingError?: string;
  };
}

export function getPatientsCollection(): Collection<PatientRecord> {
  const database = getDatabase();
  return database.collection<PatientRecord>("patients");
}
