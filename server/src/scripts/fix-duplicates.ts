/**
 * Fix Duplicate Patients Script
 * Finds and removes duplicate patient records, keeping only one per email
 */

import "dotenv/config";
import { connectDatabase, getDatabase } from "../services/database";

async function fixDuplicates() {
  console.log("🔧 Fixing Duplicate Patient Records\n");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }

    await connectDatabase(mongoUri, "trialmatch");
    const db = getDatabase();

    const patientsCollection = db.collection("patients");

    // Find all patients
    const allPatients = await patientsCollection.find({}).toArray();
    console.log(`📊 Total patient records: ${allPatients.length}\n`);

    // Group by email
    const patientsByEmail = new Map();
    allPatients.forEach(patient => {
      if (!patientsByEmail.has(patient.email)) {
        patientsByEmail.set(patient.email, []);
      }
      patientsByEmail.get(patient.email).push(patient);
    });

    console.log(`📧 Unique emails: ${patientsByEmail.size}\n`);

    // Find duplicates
    let totalDeleted = 0;
    for (const [email, patients] of patientsByEmail.entries()) {
      if (patients.length > 1) {
        console.log(`⚠️  Found ${patients.length} records for ${email}`);
        
        // Keep the first one, delete the rest
        const toKeep = patients[0];
        const toDelete = patients.slice(1);
        
        console.log(`   Keeping: ${toKeep.patientDid?.slice(0, 30)}...`);
        
        for (const dup of toDelete) {
          console.log(`   Deleting: ${dup.patientDid?.slice(0, 30)}...`);
          await patientsCollection.deleteOne({ _id: dup._id });
          totalDeleted++;
        }
        console.log("");
      }
    }

    console.log(`✅ Deleted ${totalDeleted} duplicate records\n`);

    const remainingPatients = await patientsCollection.countDocuments({});
    console.log(`📊 Remaining patients: ${remainingPatients}\n`);

    console.log("✅ Fix complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixDuplicates();
