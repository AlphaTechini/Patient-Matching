/**
 * Integration Tests for TrialMatch Agent System
 * 
 * Tests the complete flow:
 * 1. Patient registration (custodial wallet creation)
 * 2. Patient health record upload (PDF to T3N profile)
 * 3. Trial creation
 * 4. Agent deployment (auto-authorization)
 * 5. Agent execution (batch matching)
 * 6. Results verification
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { connectDatabase, closeDatabase, getPatientCredentialsCollection, getTrialsCollection, getAgentsCollection } from "../services/database";
import { createPatientAccount, getPatientClient, storePatientHealthData } from "../services/patient-onboarding";
import { deployAgent, runAgent } from "../services/agent-deployment";
import { readFile } from "fs/promises";
import { join } from "path";

// Test configuration
const TEST_EMAIL = "test-patient@example.com";
const TEST_TRIAL_ID = "TEST-TRIAL-2026-001";
const TEST_TRIAL_NAME = "Test Lung Cancer Trial";

describe("TrialMatch Integration Tests", () => {
  let patientDid: string;
  let patientEncryptedKey: string;
  let patientEthAddress: string;
  let agentDid: string;

  before(async () => {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not configured. Please set it in .env file.");
    }

    await connectDatabase(mongoUri);
    console.log("✓ MongoDB connected");

    // Clean up test data from previous runs
    const credentialsCollection = getPatientCredentialsCollection();
    await credentialsCollection.deleteMany({ email: TEST_EMAIL });

    const trialsCollection = getTrialsCollection();
    await trialsCollection.deleteMany({ id: TEST_TRIAL_ID });

    const agentsCollection = getAgentsCollection();
    await agentsCollection.deleteMany({ trialId: TEST_TRIAL_ID });

    console.log("✓ Test data cleaned up");
  });

  after(async () => {
    await closeDatabase();
    console.log("✓ MongoDB connection closed");
  });

  it("should register a new patient with custodial wallet", async () => {
    console.log("\n🧪 Test 1: Patient Registration");

    const account = await createPatientAccount();

    assert.ok(account.patientDid.startsWith("did:t3n:"), "Patient DID should be valid");
    assert.ok(account.ethAddress.startsWith("0x"), "Ethereum address should be valid");
    assert.ok(account.encryptedPrivateKey, "Private key should be encrypted");
    assert.ok(account.createdAt instanceof Date, "Created timestamp should be present");

    // Store in MongoDB
    const credentialsCollection = getPatientCredentialsCollection();
    await credentialsCollection.insertOne({
      email: TEST_EMAIL,
      patientDid: account.patientDid,
      ethAddress: account.ethAddress,
      encryptedPrivateKey: account.encryptedPrivateKey,
      createdAt: account.createdAt,
    });

    // Save for next tests
    patientDid = account.patientDid;
    patientEncryptedKey = account.encryptedPrivateKey;
    patientEthAddress = account.ethAddress;

    console.log(`  ✓ Patient registered: ${patientDid}`);
    console.log(`  ✓ Ethereum address: ${patientEthAddress}`);
  });

  it("should upload patient health records to T3N profile", async () => {
    console.log("\n🧪 Test 2: Health Records Upload");

    // Create mock PDF text (simulating extracted PDF content)
    const mockHealthRecord = `
      PATIENT HEALTH RECORD
      
      Patient Name: Test Patient
      Date of Birth: 1975-06-15
      Gender: Female
      
      DIAGNOSIS:
      - Non-Small Cell Lung Cancer (NSCLC) - ICD-10: C34.9
      - Stage IIIA
      - Histologically confirmed adenocarcinoma
      
      BIOMARKERS:
      - PD-L1 Expression: 65% (High)
      - EGFR: Wild type
      - ALK: Negative
      
      DEMOGRAPHICS:
      - Age: 48 years
      - Weight: 68 kg
      - Height: 165 cm
      - ECOG Performance Status: 1
      
      MEDICAL HISTORY:
      - No prior systemic therapy for lung cancer
      - No history of autoimmune disease
      - No active infections
      
      ALLERGIES:
      - No known drug allergies
      
      CURRENT MEDICATIONS:
      - Lisinopril 10mg daily
      - Atorvastatin 20mg daily
      
      LAB RESULTS:
      - Hemoglobin: 12.5 g/dL
      - WBC: 6800 cells/mcL
      - Platelet: 220,000 cells/mcL
      - Creatinine: 0.9 mg/dL
      - AST: 28 U/L
      - ALT: 32 U/L
    `;

    // Get patient client
    const patientClient = await getPatientClient(patientEncryptedKey, patientEthAddress);

    // Store in T3N profile
    await storePatientHealthData(patientClient, mockHealthRecord, "test-health-record.pdf");

    console.log(`  ✓ Health records stored in T3N profile for ${patientDid}`);
    console.log(`  ✓ Record length: ${mockHealthRecord.length} characters`);
  });

  it("should create a new clinical trial", async () => {
    console.log("\n🧪 Test 3: Trial Creation");

    const trialData = {
      id: TEST_TRIAL_ID,
      name: TEST_TRIAL_NAME,
      phase: "III",
      indication: "Non-Small Cell Lung Cancer",
      sponsor: "Test Pharma Inc.",
      description: "Testing immunotherapy for NSCLC patients",
      criteria: {
        inclusion: [
          { field: "diagnosis_codes", expected: "C34.9", description: "NSCLC diagnosis" },
          { field: "age", expected: null, description: "Age 18-75 years" },
          { field: "gender", expected: "female", description: "Female patients" },
          { field: "pdl1_expression", expected: "high", description: "PD-L1 ≥50%" },
        ],
        exclusion: [
          { field: "autoimmune_disease", expected: "yes", description: "No autoimmune disease" },
        ],
      },
      createdAt: new Date(),
    };

    const trialsCollection = getTrialsCollection();
    await trialsCollection.insertOne(trialData);

    console.log(`  ✓ Trial created: ${TEST_TRIAL_ID}`);
    console.log(`  ✓ Criteria: ${trialData.criteria.inclusion.length} inclusion, ${trialData.criteria.exclusion.length} exclusion`);
  });

  it("should deploy agent for trial with auto-authorization", async () => {
    console.log("\n🧪 Test 4: Agent Deployment");

    const deployResult = await deployAgent(TEST_TRIAL_ID, TEST_TRIAL_NAME);

    assert.ok(deployResult.agentDid.startsWith("did:t3n:"), "Agent DID should be valid");
    assert.strictEqual(deployResult.trialId, TEST_TRIAL_ID, "Agent should be linked to trial");
    assert.strictEqual(deployResult.status, "active", "Agent should be active");
    assert.ok(deployResult.patientsAuthorized >= 0, "Should have patient authorization count");

    // Save for next test
    agentDid = deployResult.agentDid;

    console.log(`  ✓ Agent deployed: ${agentDid}`);
    console.log(`  ✓ Agent status: ${deployResult.status}`);
    console.log(`  ✓ Patients authorized: ${deployResult.patientsAuthorized}`);
  });

  it("should run agent matching and return results", async () => {
    console.log("\n🧪 Test 5: Agent Execution");

    const runResult = await runAgent(agentDid);

    assert.ok(Array.isArray(runResult.eligiblePatients), "Results should contain eligible patients array");
    assert.ok(typeof runResult.summary.screened === "number", "Results should contain total screened count");
    assert.ok(typeof runResult.summary.eligible === "number", "Results should contain eligible count");
    assert.ok(runResult.ranAt instanceof Date, "Results should have completion timestamp");

    console.log(`  ✓ Matching completed`);
    console.log(`  ✓ Total patients screened: ${runResult.summary.screened}`);
    console.log(`  ✓ Eligible patients: ${runResult.summary.eligible}`);
    console.log(`  ✓ Eligibility rate: ${runResult.summary.eligibilityRate}`);

    if (runResult.summary.eligible > 0 && runResult.eligiblePatients[0]) {
      console.log(`  ✓ Sample match:`);
      console.log(`    - Patient DID: ${runResult.eligiblePatients[0].patientDid}`);
      console.log(`    - Confidence: ${(runResult.eligiblePatients[0].confidence * 100).toFixed(1)}%`);
      console.log(`    - Matched criteria: ${runResult.eligiblePatients[0].matchedCriteria}/${runResult.eligiblePatients[0].totalCriteria}`);
    }
  });

  it("should verify agent stats are updated", async () => {
    console.log("\n🧪 Test 6: Agent Stats Verification");

    const agentsCollection = getAgentsCollection();
    const agent = await agentsCollection.findOne({ agentDid });

    assert.ok(agent, "Agent should exist in database");
    assert.strictEqual(agent?.status, "active", "Agent should still be active");
    assert.ok(agent?.stats, "Agent should have stats object");
    assert.ok((agent?.stats?.totalRuns || 0) > 0, "Agent should have run count");
    assert.ok((agent?.stats?.patientsScreened || 0) >= 0, "Agent should have screened count");
    assert.ok(agent?.lastRunAt instanceof Date, "Agent should have last run timestamp");

    console.log(`  ✓ Agent stats updated:`);
    console.log(`    - Total runs: ${agent?.stats?.totalRuns || 0}`);
    console.log(`    - Total screened: ${agent?.stats?.patientsScreened || 0}`);
    console.log(`    - Total matched: ${agent?.stats?.patientsMatched || 0}`);
  });

  it("should retrieve agent record from database", async () => {
    console.log("\n🧪 Test 7: Agent Record Verification");

    const agentsCollection = getAgentsCollection();
    const agent = await agentsCollection.findOne({ agentDid });

    assert.ok(agent, "Agent should exist");
    assert.strictEqual(agent?.agentDid, agentDid, "Agent DID should match");
    assert.strictEqual(agent?.trialId, TEST_TRIAL_ID, "Trial ID should match");
    assert.strictEqual(agent?.status, "active", "Agent should be active");
    assert.ok(agent?.encryptedPrivateKey, "Agent should have encrypted private key");
    assert.ok(agent?.ethAddress.startsWith("0x"), "Agent should have Ethereum address");

    console.log(`  ✓ Agent record verified in database`);
    console.log(`  ✓ Agent DID: ${agent?.agentDid}`);
    console.log(`  ✓ Trial ID: ${agent?.trialId}`);
  });
});

console.log("\n" + "=".repeat(60));
console.log("TrialMatch Integration Test Suite");
console.log("=".repeat(60) + "\n");
