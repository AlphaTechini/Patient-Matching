/**
 * Clean Patients Script
 * Removes test patients and keeps only the 10 seeded ones
 */

import "dotenv/config";
import { connectDatabase, getDatabase } from "../services/database";

async function cleanPatients() {
  console.log("🧹 Cleaning Patient Data\n");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }

    await connectDatabase(mongoUri, "trialmatch");
    const db = getDatabase();

    const patientsCollection = db.collection("patients");
    const credentialsCollection = db.collection("patient_credentials");

    // Keep only the 10 seeded patients (patient001@test.com to patient010@test.com)
    const seededEmails = Array.from({ length: 10 }, (_, i) => `patient${String(i + 1).padStart(3, '0')}@test.com`);

    console.log("📧 Keeping these patients:");
    seededEmails.forEach(email => console.log(`   - ${email}`));
    console.log("");

    // Delete all other patients
    const patientsDeleteResult = await patientsCollection.deleteMany({
      email: { $nin: seededEmails }
    });
    console.log(`✅ Deleted ${patientsDeleteResult.deletedCount} non-seeded patient records\n`);

    // Delete credentials that don't match the seeded patient emails
    const credentialsDeleteResult = await credentialsCollection.deleteMany({
      email: { $nin: seededEmails }
    });
    console.log(`✅ Deleted ${credentialsDeleteResult.deletedCount} non-seeded credentials\n`);

    // Show remaining counts
    const remainingPatients = await patientsCollection.countDocuments({});
    const remainingCredentials = await credentialsCollection.countDocuments({});

    console.log(`📊 Remaining:`);
    console.log(`   Patients: ${remainingPatients}`);
    console.log(`   Credentials: ${remainingCredentials}\n`);

    console.log("✅ Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanPatients();
