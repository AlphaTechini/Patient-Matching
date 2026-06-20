/**
 * Test Agent Run Script
 * Manually test the agent matching logic
 */

import "dotenv/config";
import { connectDatabase, getDatabase, getPatientCredentialsCollection } from "../services/database";

async function testAgentRun() {
  console.log("🧪 Testing Agent Run Logic\n");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }

    await connectDatabase(mongoUri, "trialmatch");
    const db = getDatabase();

    // 1. Check what's in patient_credentials
    console.log("1️⃣ Checking patient_credentials collection:");
    const credentialsCollection = getPatientCredentialsCollection();
    const allCredentials = await credentialsCollection.find({}).toArray();
    
    console.log(`   Total credentials: ${allCredentials.length}\n`);
    
    allCredentials.forEach((cred, idx) => {
      console.log(`   [${idx + 1}] ${cred.patientDid?.slice(0, 30)}...`);
      console.log(`       Email: ${cred.email || 'N/A'}`);
      console.log(`       Has ethAddress: ${!!cred.ethAddress}`);
      console.log(`       Has encryptedKey: ${!!cred.encryptedPrivateKey}`);
    });

    // 2. Check what's in patients collection
    console.log("\n2️⃣ Checking patients collection:");
    const patientsCollection = db.collection("patients");
    const allPatients = await patientsCollection.find({}).toArray();
    
    console.log(`   Total patients: ${allPatients.length}\n`);
    
    allPatients.slice(0, 3).forEach((patient, idx) => {
      console.log(`   [${idx + 1}] ${patient.email}`);
      console.log(`       DID: ${patient.patientDid?.slice(0, 30)}...`);
      console.log(`       Has healthRecord: ${!!patient.healthRecord}`);
      if (patient.healthRecord) {
        console.log(`       Diagnosis codes: ${patient.healthRecord.diagnosis_codes?.join(', ')}`);
      }
    });

    // 3. Find DIDs that exist in patients but NOT in patient_credentials
    console.log("\n3️⃣ Checking DID mismatch:");
    const patientDIDsInCredentials = new Set(allCredentials.map(c => c.patientDid));
    const patientDIDsInPatients = allPatients.map(p => p.patientDid);
    
    console.log(`   DIDs in credentials: ${patientDIDsInCredentials.size}`);
    console.log(`   DIDs in patients: ${patientDIDsInPatients.length}`);
    
    const missingInCredentials = patientDIDsInPatients.filter(did => !patientDIDsInCredentials.has(did));
    
    if (missingInCredentials.length > 0) {
      console.log(`\n   ⚠️  ${missingInCredentials.length} patients have NO credentials!`);
      console.log(`   These patients won't be processed by the agent:\n`);
      
      missingInCredentials.slice(0, 5).forEach(did => {
        const patient = allPatients.find(p => p.patientDid === did);
        console.log(`   - ${patient?.email || 'Unknown'} (${did?.slice(0, 25)}...)`);
      });
    } else {
      console.log(`   ✅ All patients have credentials`);
    }

    // 4. Test matching logic manually
    console.log("\n4️⃣ Testing MockTEEClient matching:");
    
    const trial = {
      id: "TRIAL-2026-003",
      criteria: {
        inclusion: [
          { field: "diagnosis_codes", expected: "E11.9" }
        ],
        exclusion: []
      }
    };
    
    const patient = allPatients.find(p => p.email === "patient001@test.com");
    
    if (patient && patient.healthRecord) {
      console.log(`\n   Trial: ${trial.id}`);
      console.log(`   Looking for: diagnosis_codes = E11.9`);
      console.log(`   Patient has: ${patient.healthRecord.diagnosis_codes}`);
      console.log(`   Match: ${patient.healthRecord.diagnosis_codes?.includes("E11.9") ? '✅ YES' : '❌ NO'}`);
    }

    console.log("\n✅ Test complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testAgentRun();
