/**
 * End-to-End Test Flow
 * 
 * This script tests the complete TrialMatch flow without using a test framework.
 * Run with: tsx src/tests/e2e-flow.ts
 */

import { config } from "dotenv";
import { connectDatabase, closeDatabase, getPatientCredentialsCollection, getPatientMetadataCollection, getTrialsCollection, getAgentsCollection } from "../services/database";
import { createPatientAccount } from "../services/patient-onboarding";
import { deployAgent, runAgent } from "../services/agent-deployment";

// Load environment variables
config();

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_TRIAL_ID = `TEST-TRIAL-${Date.now()}`;
const TEST_TRIAL_NAME = "E2E Test Lung Cancer Trial";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("TrialMatch End-to-End Test Flow");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: Connect to database
    console.log("📦 Step 1: Connecting to MongoDB...");
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not configured. Please set it in .env file.");
    }
    await connectDatabase(mongoUri);
    console.log("   ✅ Connected to MongoDB\n");

    // Step 2: Register patient
    console.log("👤 Step 2: Registering patient...");
    const account = await createPatientAccount();
    console.log(`   ✅ Patient DID: ${account.patientDid}`);
    console.log(`   ✅ Ethereum Address: ${account.ethAddress}`);

    // Store patient credentials
    const credentialsCollection = getPatientCredentialsCollection();
    await credentialsCollection.insertOne({
      email: TEST_EMAIL,
      patientDid: account.patientDid,
      ethAddress: account.ethAddress,
      encryptedPrivateKey: account.encryptedPrivateKey,
      createdAt: account.createdAt,
    });

    // Initialize metadata
    const metadataCollection = getPatientMetadataCollection();
    await metadataCollection.insertOne({
      patientDid: account.patientDid,
      uploadStatus: {
        hasHealthRecords: false,
      },
    });
    console.log(`   ✅ Patient registered with email: ${TEST_EMAIL}\n`);

    // Step 3: Upload health records
    console.log("📄 Step 3: Uploading health records to database...");
    const mockHealthRecord = `
      PATIENT HEALTH RECORD - TEST DATA
      
      Patient Name: Test Patient ${Date.now()}
      Date of Birth: 1975-06-15
      Gender: Female
      Age: 48 years
      
      DIAGNOSIS:
      - Non-Small Cell Lung Cancer (NSCLC) - ICD-10: C34.9
      - Stage IIIA Adenocarcinoma
      - Histologically confirmed
      
      BIOMARKERS:
      - PD-L1 Expression: 65% (High)
      - EGFR: Wild type
      - ALK: Negative
      
      CLINICAL STATUS:
      - ECOG Performance Status: 1
      - Weight: 68 kg
      - No prior systemic therapy for lung cancer
      
      MEDICAL HISTORY:
      - No autoimmune disease
      - No active infections
      - Controlled hypertension
      
      ALLERGIES: None
      
      MEDICATIONS:
      - Lisinopril 10mg daily
      - Atorvastatin 20mg daily
      
      LAB RESULTS (Recent):
      - Hemoglobin: 12.5 g/dL
      - WBC: 6800 cells/mcL
      - Platelet: 220,000 cells/mcL
      - Creatinine: 0.9 mg/dL (normal renal function)
      - Liver function: Within normal limits
    `;

    // Store health records directly in MongoDB (MVP approach)
    await metadataCollection.updateOne(
      { patientDid: account.patientDid },
      {
        $set: {
          uploadStatus: {
            hasHealthRecords: true,
            lastUploadedAt: new Date(),
            fileName: "test-health-record.pdf",
            fileSize: mockHealthRecord.length,
          },
          healthRecords: {
            pdfText: mockHealthRecord,
            uploadedAt: new Date().toISOString(),
          },
        },
      },
      { upsert: true },
    );
    console.log(`   ✅ Health records stored in database (${mockHealthRecord.length} chars)\n`);

    // Step 4: Create trial
    console.log("🧪 Step 4: Creating clinical trial...");
    const trialData = {
      id: TEST_TRIAL_ID,
      name: TEST_TRIAL_NAME,
      phase: "III",
      indication: "Non-Small Cell Lung Cancer",
      sponsor: "E2E Test Pharma Inc.",
      description: "Testing immunotherapy for NSCLC patients with high PD-L1 expression",
      criteria: {
        inclusion: [
          { field: "diagnosis_codes", expected: "C34.9", description: "Histologically confirmed NSCLC" },
          { field: "age", expected: null, description: "Age 18-75 years" },
          { field: "gender", expected: "female", description: "Female patients" },
          { field: "pdl1_expression", expected: "high", description: "PD-L1 Expression ≥50%" },
        ],
        exclusion: [
          { field: "autoimmune_disease", expected: "yes", description: "No active autoimmune disease" },
        ],
      },
      createdAt: new Date(),
    };

    const trialsCollection = getTrialsCollection();
    await trialsCollection.insertOne(trialData);
    console.log(`   ✅ Trial ID: ${TEST_TRIAL_ID}`);
    console.log(`   ✅ Trial Name: ${TEST_TRIAL_NAME}`);
    console.log(`   ✅ Inclusion Criteria: ${trialData.criteria.inclusion.length}`);
    console.log(`   ✅ Exclusion Criteria: ${trialData.criteria.exclusion.length}\n`);

    // Step 5: Deploy agent
    console.log("🤖 Step 5: Deploying matching agent...");
    const deployResult = await deployAgent(TEST_TRIAL_ID, TEST_TRIAL_NAME);
    console.log(`   ✅ Agent DID: ${deployResult.agentDid}`);
    console.log(`   ✅ Agent Name: ${deployResult.agentName}`);
    console.log(`   ✅ Agent Status: ${deployResult.status}`);
    console.log(`   ✅ Patients authorized: ${deployResult.patientsAuthorized}\n`);

    // Step 6: Run agent matching
    console.log("🔍 Step 6: Running agent matching...");
    const runResult = await runAgent(deployResult.agentDid);
    console.log(`   ✅ Matching completed at: ${runResult.ranAt.toISOString()}`);
    console.log(`   ✅ Total patients screened: ${runResult.summary.screened}`);
    console.log(`   ✅ Eligible patients found: ${runResult.summary.eligible}`);
    console.log(`   ✅ Eligibility rate: ${runResult.summary.eligibilityRate}`);
    console.log(`   ✅ Average confidence: ${(runResult.summary.averageConfidence * 100).toFixed(1)}%`);

    if (runResult.eligiblePatients.length > 0) {
      console.log("\n   📊 Match Details:");
      runResult.eligiblePatients.forEach((match, idx) => {
        console.log(`      ${idx + 1}. Patient: ${match.patientDid}`);
        console.log(`         Confidence: ${(match.confidence * 100).toFixed(1)}%`);
        console.log(`         Matched: ${match.matchedCriteria}/${match.totalCriteria} criteria`);
      });
    }

    // Step 7: Verify agent stats
    console.log("\n📈 Step 7: Verifying agent statistics...");
    const agentsCollection = getAgentsCollection();
    const updatedAgent = await agentsCollection.findOne({ agentDid: deployResult.agentDid });

    if (updatedAgent) {
      console.log(`   ✅ Total runs: ${updatedAgent.stats?.totalRuns || 0}`);
      console.log(`   ✅ Total screened: ${updatedAgent.stats?.patientsScreened || 0}`);
      console.log(`   ✅ Total matched: ${updatedAgent.stats?.patientsMatched || 0}`);
      console.log(`   ✅ Last run: ${updatedAgent.lastRunAt?.toISOString() || "N/A"}`);
    }

    // Step 8: Cleanup (optional)
    console.log("\n🧹 Step 8: Cleaning up test data...");
    await credentialsCollection.deleteOne({ email: TEST_EMAIL });
    await metadataCollection.deleteOne({ patientDid: account.patientDid });
    await trialsCollection.deleteOne({ id: TEST_TRIAL_ID });
    await agentsCollection.deleteOne({ agentDid: deployResult.agentDid });
    console.log("   ✅ Test data cleaned up\n");

    console.log("=".repeat(70));
    console.log("✅ END-TO-END TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
