/**
 * Debug Matching Script
 * Checks why agent matching isn't finding eligible patients
 */

import "dotenv/config";
import { connectDatabase, getDatabase } from "../services/database";

async function debugMatching() {
  console.log("🔍 Debugging Agent Matching\n");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }

    await connectDatabase(mongoUri, "trialmatch");
    const db = getDatabase();

    // Check match_results collection
    console.log("📊 Match Results Collection:");
    const matchResultsCollection = db.collection("match_results");
    const matchResults = await matchResultsCollection.find({}).toArray();
    console.log(`   Count: ${matchResults.length}`);
    
    if (matchResults.length > 0) {
      console.log("\n   Recent matches:");
      matchResults.slice(0, 5).forEach((result) => {
        console.log(`   - Trial: ${result.trialId}`);
        console.log(`     Patient: ${result.patientDid?.slice(0, 25)}...`);
        console.log(`     Eligible: ${result.eligible}`);
        console.log(`     Confidence: ${result.confidence}`);
        console.log(`     Matched: ${result.matchedCriteria}/${result.totalCriteria}`);
        console.log(`     Checked: ${result.checkedAt}`);
        console.log("");
      });
    } else {
      console.log("   ⚠ No match results found!\n");
    }

    // Check agents collection
    console.log("🤖 Agents Collection:");
    const agentsCollection = db.collection("agents");
    const agents = await agentsCollection.find({}).toArray();
    console.log(`   Count: ${agents.length}`);
    
    if (agents.length > 0) {
      agents.forEach((agent) => {
        console.log(`\n   Agent: ${agent.agentName}`);
        console.log(`   - DID: ${agent.agentDid?.slice(0, 30)}...`);
        console.log(`   - Trial: ${agent.trialId}`);
        console.log(`   - Status: ${agent.status}`);
        console.log(`   - Total Runs: ${agent.stats?.totalRuns || 0}`);
        console.log(`   - Patients Screened: ${agent.stats?.patientsScreened || 0}`);
        console.log(`   - Patients Matched: ${agent.stats?.patientsMatched || 0}`);
        console.log(`   - Last Run: ${agent.lastRunAt || 'Never'}`);
      });
    }
    console.log("");

    // Check trial criteria structure
    console.log("📋 Trial Criteria Check:");
    const trialsCollection = db.collection("trials");
    const trials = await trialsCollection.find({ 
      id: { $in: ["TRIAL-2026-003", "TRIAL-2026-004", "TRIAL-2026-005"] }
    }).toArray();
    
    console.log(`   Found ${trials.length} seeded trials\n`);
    
    trials.forEach((trial) => {
      console.log(`   ${trial.id}: ${trial.name}`);
      console.log(`   - Sponsor: ${trial.sponsor}`);
      console.log(`   - Inclusion criteria: ${trial.criteria?.inclusion?.length || 0}`);
      console.log(`   - Exclusion criteria: ${trial.criteria?.exclusion?.length || 0}`);
      
      if (trial.criteria?.inclusion && trial.criteria.inclusion.length > 0) {
        console.log(`   - First inclusion: ${JSON.stringify(trial.criteria.inclusion[0])}`);
      }
      console.log("");
    });

    // Check patient data structure
    console.log("👥 Patient Data Structure Check:");
    const patientsCollection = db.collection("patients");
    const samplePatient = await patientsCollection.findOne({
      email: "patient001@test.com"
    });
    
    if (samplePatient) {
      console.log(`   Sample Patient: ${samplePatient.email}`);
      console.log(`   - DID: ${samplePatient.patientDid}`);
      console.log(`   - Has healthRecord: ${!!samplePatient.healthRecord}`);
      
      if (samplePatient.healthRecord) {
        console.log(`   - Demographics: ${!!samplePatient.healthRecord.demographics}`);
        console.log(`   - Vitals: ${!!samplePatient.healthRecord.vitals}`);
        console.log(`   - Diagnosis codes: ${samplePatient.healthRecord.diagnosis_codes?.length || 0}`);
        console.log(`   - Lab results: ${Object.keys(samplePatient.healthRecord.lab_results || {}).length} fields`);
        console.log(`   - Medications: ${samplePatient.healthRecord.medications?.length || 0}`);
        
        console.log(`\n   Sample data:`);
        console.log(`   - Age: ${samplePatient.healthRecord.demographics?.age}`);
        console.log(`   - Diagnosis codes: ${JSON.stringify(samplePatient.healthRecord.diagnosis_codes)}`);
        console.log(`   - HbA1c: ${samplePatient.healthRecord.lab_results?.hba1c}`);
        console.log(`   - eGFR: ${samplePatient.healthRecord.lab_results?.egfr}`);
      }
    } else {
      console.log("   ⚠ Patient not found!\n");
    }

    // Check patient_credentials collection
    console.log("\n🔑 Patient Credentials Check:");
    const credentialsCollection = db.collection("patient_credentials");
    const credentials = await credentialsCollection.find({}).toArray();
    console.log(`   Count: ${credentials.length}`);
    
    if (credentials.length > 0) {
      console.log(`   Sample: ${credentials[0].patientDid?.slice(0, 30)}...`);
      console.log(`   - Has encrypted key: ${!!credentials[0].encryptedPrivateKey}`);
      console.log(`   - Has eth address: ${!!credentials[0].ethAddress}`);
    }

    console.log("\n✅ Debug complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

debugMatching();
