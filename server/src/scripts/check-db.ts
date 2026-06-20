/**
 * Database Diagnostic Script
 * Checks all collections and their contents
 */

import "dotenv/config";
import { connectDatabase, getDatabase } from "../services/database";

async function checkDatabase() {
  console.log("🔍 Database Diagnostic Report\n");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }

    await connectDatabase(mongoUri, "trialmatch");
    const db = getDatabase();

    // List all collections
    console.log("📚 Collections in database:");
    const collections = await db.listCollections().toArray();
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });
    console.log("");

    // Check trials collection
    console.log("📋 Trials Collection:");
    const trialsCollection = db.collection("trials");
    const trials = await trialsCollection.find({}).toArray();
    console.log(`   Count: ${trials.length}`);
    if (trials.length > 0) {
      trials.forEach((trial) => {
        console.log(`   ✓ ${trial.id}: ${trial.name} (${trial.sponsor})`);
      });
    } else {
      console.log("   ⚠ No trials found in database");
    }
    console.log("");

    // Check patients collection
    console.log("👥 Patients Collection:");
    const patientsCollection = db.collection("patients");
    const patients = await patientsCollection.find({}).toArray();
    console.log(`   Count: ${patients.length}`);
    if (patients.length > 0) {
      patients.slice(0, 5).forEach((patient) => {
        console.log(`   ✓ ${patient.email} (${patient.patientDid?.slice(0, 25)}...)`);
      });
      if (patients.length > 5) {
        console.log(`   ... and ${patients.length - 5} more`);
      }
    }
    console.log("");

    // Check patient_credentials collection
    console.log("🔑 Patient Credentials Collection:");
    const credentialsCollection = db.collection("patient_credentials");
    const credentials = await credentialsCollection.find({}).toArray();
    console.log(`   Count: ${credentials.length}`);
    console.log("");

    // Check pharma_organizations collection
    console.log("🏢 Pharma Organizations Collection:");
    const pharmaCollection = db.collection("pharma_organizations");
    const pharmas = await pharmaCollection.find({}).toArray();
    console.log(`   Count: ${pharmas.length}`);
    if (pharmas.length > 0) {
      pharmas.forEach((pharma) => {
        console.log(`   ✓ ${pharma.name} (${pharma.did})`);
      });
    }
    console.log("");

    // Check agents collection
    console.log("🤖 Agents Collection:");
    const agentsCollection = db.collection("agents");
    const agents = await agentsCollection.find({}).toArray();
    console.log(`   Count: ${agents.length}`);
    console.log("");

    // Check match_results collection
    console.log("🎯 Match Results Collection:");
    const matchResultsCollection = db.collection("match_results");
    const matchResults = await matchResultsCollection.find({}).toArray();
    console.log(`   Count: ${matchResults.length}`);
    console.log("");

    // Check access_logs collection
    console.log("📝 Access Logs Collection:");
    const logsCollection = db.collection("access_logs");
    const logs = await logsCollection.find({}).toArray();
    console.log(`   Count: ${logs.length}`);
    console.log("");

    console.log("✅ Diagnostic complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkDatabase();
