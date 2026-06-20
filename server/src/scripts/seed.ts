/**
 * Database Seeding Script
 * 
 * Seeds the database with:
 * - 3 additional pharmaceutical trials (total 5 trials)
 * - 10 comprehensive patient records
 * - Strategically distributed to match trial criteria
 */

import "dotenv/config";
import { connectDatabase, getDatabase } from "../services/database";
import { getTrialsStore, type ParsedTrial, type TrialCriteria } from "../routes/trials";
import { createPatientAccount } from "../services/patient-onboarding";
import type { PatientAccount } from "../services/patient-onboarding";

/**
 * TRIAL 3: Type 2 Diabetes with Cardiovascular Risk Reduction Study
 * 
 * NOTE: sponsor will be set to Ray Pharma's name from database
 */
const trial3Template: Omit<ParsedTrial, "sponsor"> = {
  id: "TRIAL-2026-003",
  name: "SGLT2 Inhibitor for Diabetic Nephropathy Prevention",
  phase: "III",
  indication: "Type 2 Diabetes with High Cardiovascular Risk",
  description: "A multicenter, randomized, double-blind, placebo-controlled trial evaluating the efficacy of a novel SGLT2 inhibitor in reducing progression of diabetic kidney disease and cardiovascular events in patients with type 2 diabetes mellitus.",
  startDate: "2026-09-01",
  enrollmentCount: 450,
  criteria: {
    inclusion: [
      { field: "diagnosis_codes", expected: "E11.9", description: "Confirmed diagnosis of type 2 diabetes mellitus (ICD-10: E11.9)" },
      { field: "age", expected: null, description: "Age 18 to 75 years" },
      { field: "hba1c", expected: "7.0-10.5", description: "HbA1c between 7.0% and 10.5%" },
      { field: "egfr", expected: "30-90", description: "eGFR between 30 and 90 mL/min/1.73m²" },
      { field: "uacr", expected: ">30", description: "Urine albumin-to-creatinine ratio (UACR) >30 mg/g" },
      { field: "bmi", expected: "25-45", description: "BMI between 25 and 45 kg/m²" },
      { field: "cardiovascular_risk", expected: "high", description: "History of cardiovascular disease or ≥2 cardiovascular risk factors" },
      { field: "blood_pressure", expected: "<160/100", description: "Blood pressure controlled (<160/100 mmHg) on stable medication" },
    ],
    exclusion: [
      { field: "diagnosis_codes", expected: "E10", description: "Type 1 diabetes mellitus" },
      { field: "egfr", expected: "<25", description: "Severe renal impairment (eGFR <25 mL/min/1.73m²)" },
      { field: "medications", expected: "dialysis", description: "Current dialysis or kidney transplantation" },
      { field: "liver_disease", expected: "severe", description: "Severe hepatic impairment (Child-Pugh Class C)" },
      { field: "recent_event", expected: "mi_stroke_3mo", description: "Myocardial infarction or stroke within past 3 months" },
    ],
  },
};

/**
 * TRIAL 4: Heart Failure with Reduced Ejection Fraction (HFrEF)
 */
const trial4Template: Omit<ParsedTrial, "sponsor"> = {
  id: "TRIAL-2026-004",
  name: "Novel Angiotensin Receptor-Neprilysin Inhibitor for HFrEF",
  phase: "III",
  indication: "Heart Failure with Reduced Ejection Fraction",
  description: "A phase III, randomized, double-blind study evaluating the safety and efficacy of a next-generation ARNI in reducing cardiovascular death and heart failure hospitalization in patients with chronic heart failure and reduced ejection fraction.",
  startDate: "2026-10-15",
  enrollmentCount: 380,
  criteria: {
    inclusion: [
      { field: "diagnosis_codes", expected: "I50.1", description: "Symptomatic chronic heart failure (ICD-10: I50.1, I50.2)" },
      { field: "age", expected: null, description: "Age 18 years or older" },
      { field: "lvef", expected: "≤40", description: "Left ventricular ejection fraction (LVEF) ≤40%" },
      { field: "nyha_class", expected: "II-III", description: "NYHA functional class II or III" },
      { field: "bnp", expected: ">150", description: "NT-proBNP >600 pg/mL or BNP >150 pg/mL" },
      { field: "medications", expected: "stable_hf_therapy", description: "On stable guideline-directed medical therapy for ≥4 weeks" },
      { field: "hospitalization", expected: "hf_12mo", description: "HF hospitalization within past 12 months or elevated natriuretic peptides" },
      { field: "egfr", expected: "≥30", description: "eGFR ≥30 mL/min/1.73m²" },
    ],
    exclusion: [
      { field: "blood_pressure", expected: "<100", description: "Systolic blood pressure <100 mmHg" },
      { field: "recent_event", expected: "acs_3mo", description: "Acute coronary syndrome within past 3 months" },
      { field: "valvular_disease", expected: "severe", description: "Hemodynamically significant valvular disease requiring intervention" },
      { field: "cardiomyopathy", expected: "hypertrophic", description: "Hypertrophic or restrictive cardiomyopathy" },
      { field: "pregnancy", expected: "true", description: "Pregnancy or breastfeeding" },
    ],
  },
};

/**
 * TRIAL 5: Advanced Colorectal Cancer Immunotherapy
 */
const trial5Template: Omit<ParsedTrial, "sponsor"> = {
  id: "TRIAL-2026-005",
  name: "PD-1/CTLA-4 Dual Checkpoint Inhibitor for MSI-H CRC",
  phase: "II",
  indication: "Microsatellite Instability-High Colorectal Cancer",
  description: "A phase II, open-label, single-arm study evaluating the efficacy and safety of combination PD-1 and CTLA-4 checkpoint inhibition in patients with advanced microsatellite instability-high or mismatch repair-deficient colorectal cancer who have progressed on prior therapy.",
  startDate: "2026-11-01",
  enrollmentCount: 120,
  criteria: {
    inclusion: [
      { field: "diagnosis_codes", expected: "C18-C20", description: "Histologically confirmed colorectal adenocarcinoma (ICD-10: C18-C20)" },
      { field: "age", expected: null, description: "Age 18 years or older" },
      { field: "msi_status", expected: "MSI-H", description: "Microsatellite instability-high (MSI-H) or mismatch repair deficient (dMMR)" },
      { field: "stage", expected: "advanced", description: "Metastatic or unresectable locally advanced disease" },
      { field: "prior_therapy", expected: "1-2_lines", description: "Progression after 1-2 prior lines of systemic therapy" },
      { field: "ecog_ps", expected: "0-1", description: "ECOG performance status 0 or 1" },
      { field: "measurable_disease", expected: "recist", description: "Measurable disease per RECIST v1.1 criteria" },
      { field: "organ_function", expected: "adequate", description: "Adequate hematologic, hepatic, and renal function" },
      { field: "life_expectancy", expected: "≥3mo", description: "Life expectancy ≥3 months" },
    ],
    exclusion: [
      { field: "prior_therapy", expected: "checkpoint_inhibitor", description: "Prior treatment with PD-1, PD-L1, or CTLA-4 inhibitors" },
      { field: "autoimmune_disease", expected: "active", description: "Active autoimmune disease requiring systemic therapy" },
      { field: "brain_metastases", expected: "untreated", description: "Untreated or symptomatic brain metastases" },
      { field: "immunosuppression", expected: "active", description: "Chronic immunosuppressive therapy (except physiologic doses of corticosteroids)" },
      { field: "infection", expected: "active", description: "Active infection requiring systemic therapy" },
    ],
  },
};

/**
 * Patient profiles strategically designed to match trial criteria
 * 
 * Distribution:
 * - Patients 1-4: Match Trial 3 (Diabetes)
 * - Patients 5-7: Match Trial 4 (Heart Failure)
 * - Patients 8-10: Match Trial 5 (Colorectal Cancer)
 */

interface PatientRecord {
  email: string;
  healthRecord: {
    demographics: {
      age: number;
      gender: string;
      ethnicity: string;
    };
    vitals: {
      height_cm: number;
      weight_kg: number;
      bmi: number;
      blood_pressure: string;
      heart_rate: number;
    };
    diagnosis_codes: string[];
    lab_results: Record<string, any>;
    medications: string[];
    medical_history: string[];
    allergies: string[];
    smoking_status: string;
    alcohol_use: string;
  };
  createdAt: Date;
}

const patients: PatientRecord[] = [
  // PATIENT 1 - Matches Trial 3 (Diabetes)
  {
    email: "patient001@test.com",
    healthRecord: {
      demographics: { age: 58, gender: "male", ethnicity: "Caucasian" },
      vitals: { height_cm: 175, weight_kg: 92, bmi: 30.0, blood_pressure: "142/88", heart_rate: 78 },
      diagnosis_codes: ["E11.9", "E11.22", "I25.10", "E78.5"],
      lab_results: {
        hba1c: 8.2,
        fasting_glucose: 156,
        egfr: 62,
        uacr: 85,
        creatinine: 1.3,
        ldl: 128,
        hdl: 38,
        triglycerides: 210,
      },
      medications: ["metformin", "glipizide", "atorvastatin", "lisinopril", "aspirin"],
      medical_history: ["hypertension", "dyslipidemia", "coronary_artery_disease", "diabetic_nephropathy"],
      allergies: ["sulfa"],
      smoking_status: "former_smoker",
      alcohol_use: "occasional",
    },
    createdAt: new Date("2025-08-15"),
  },

  // PATIENT 2 - Matches Trial 3 (Diabetes)
  {
    email: "patient002@test.com",
    healthRecord: {
      demographics: { age: 62, gender: "female", ethnicity: "African American" },
      vitals: { height_cm: 162, weight_kg: 88, bmi: 33.5, blood_pressure: "138/84", heart_rate: 72 },
      diagnosis_codes: ["E11.9", "E11.21", "I10", "E78.2"],
      lab_results: {
        hba1c: 7.8,
        fasting_glucose: 142,
        egfr: 58,
        uacr: 125,
        creatinine: 1.2,
        ldl: 145,
        hdl: 42,
        triglycerides: 188,
      },
      medications: ["metformin", "insulin_glargine", "amlodipine", "rosuvastatin"],
      medical_history: ["hypertension", "diabetic_nephropathy", "peripheral_neuropathy", "retinopathy"],
      allergies: [],
      smoking_status: "never",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-09-03"),
  },

  // PATIENT 3 - Matches Trial 3 (Diabetes)
  {
    email: "patient003@test.com",
    healthRecord: {
      demographics: { age: 54, gender: "male", ethnicity: "Hispanic" },
      vitals: { height_cm: 168, weight_kg: 95, bmi: 33.7, blood_pressure: "145/92", heart_rate: 80 },
      diagnosis_codes: ["E11.9", "E11.65", "I25.10", "I10"],
      lab_results: {
        hba1c: 9.1,
        fasting_glucose: 178,
        egfr: 48,
        uacr: 210,
        creatinine: 1.6,
        ldl: 152,
        hdl: 35,
        triglycerides: 245,
      },
      medications: ["metformin", "sitagliptin", "insulin_detemir", "losartan", "metoprolol"],
      medical_history: ["coronary_artery_disease", "hypertension", "obesity", "diabetic_nephropathy"],
      allergies: ["penicillin"],
      smoking_status: "current_smoker",
      alcohol_use: "moderate",
    },
    createdAt: new Date("2025-10-12"),
  },

  // PATIENT 4 - Matches Trial 3 (Diabetes)
  {
    email: "patient004@test.com",
    healthRecord: {
      demographics: { age: 67, gender: "female", ethnicity: "Asian" },
      vitals: { height_cm: 158, weight_kg: 72, bmi: 28.8, blood_pressure: "152/90", heart_rate: 76 },
      diagnosis_codes: ["E11.9", "E11.22", "I50.9", "I10"],
      lab_results: {
        hba1c: 7.5,
        fasting_glucose: 138,
        egfr: 52,
        uacr: 95,
        creatinine: 1.4,
        ldl: 118,
        hdl: 48,
        triglycerides: 165,
      },
      medications: ["metformin", "empagliflozin", "ramipril", "carvedilol", "furosemide"],
      medical_history: ["heart_failure", "hypertension", "diabetic_nephropathy", "atrial_fibrillation"],
      allergies: [],
      smoking_status: "never",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-11-20"),
  },

  // PATIENT 5 - Matches Trial 4 (Heart Failure)
  {
    email: "patient005@test.com",
    healthRecord: {
      demographics: { age: 71, gender: "male", ethnicity: "Caucasian" },
      vitals: { height_cm: 180, weight_kg: 88, bmi: 27.2, blood_pressure: "118/72", heart_rate: 68 },
      diagnosis_codes: ["I50.1", "I50.22", "I25.10", "I10"],
      lab_results: {
        lvef: 32,
        bnp: 680,
        nt_probnp: 1850,
        egfr: 58,
        creatinine: 1.3,
        sodium: 138,
        potassium: 4.2,
        troponin: 0.02,
      },
      medications: ["sacubitril_valsartan", "carvedilol", "furosemide", "spironolactone", "atorvastatin"],
      medical_history: ["ischemic_cardiomyopathy", "coronary_artery_disease", "hypertension", "hf_hospitalization_6mo"],
      allergies: [],
      smoking_status: "former_smoker",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-07-22"),
  },

  // PATIENT 6 - Matches Trial 4 (Heart Failure)
  {
    email: "patient006@test.com",
    healthRecord: {
      demographics: { age: 65, gender: "female", ethnicity: "African American" },
      vitals: { height_cm: 165, weight_kg: 78, bmi: 28.7, blood_pressure: "110/68", heart_rate: 72 },
      diagnosis_codes: ["I50.1", "I50.23", "I42.0", "E11.9"],
      lab_results: {
        lvef: 28,
        bnp: 420,
        nt_probnp: 2200,
        egfr: 48,
        creatinine: 1.4,
        sodium: 136,
        potassium: 4.5,
      },
      medications: ["entresto", "bisoprolol", "torsemide", "eplerenone", "empagliflozin"],
      medical_history: ["dilated_cardiomyopathy", "diabetes_type2", "hf_hospitalization_4mo", "icd_placement"],
      allergies: ["ace_inhibitors"],
      smoking_status: "never",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-09-08"),
  },

  // PATIENT 7 - Matches Trial 4 (Heart Failure)
  {
    email: "patient007@test.com",
    healthRecord: {
      demographics: { age: 58, gender: "male", ethnicity: "Hispanic" },
      vitals: { height_cm: 172, weight_kg: 92, bmi: 31.1, blood_pressure: "124/78", heart_rate: 64 },
      diagnosis_codes: ["I50.1", "I50.22", "I25.5", "E66.9"],
      lab_results: {
        lvef: 35,
        bnp: 310,
        nt_probnp: 1420,
        egfr: 62,
        creatinine: 1.2,
        sodium: 140,
        potassium: 4.0,
      },
      medications: ["valsartan", "metoprolol", "furosemide", "dapagliflozin", "apixaban"],
      medical_history: ["heart_failure_nyha_ii", "old_myocardial_infarction", "obesity", "atrial_fibrillation"],
      allergies: [],
      smoking_status: "current_smoker",
      alcohol_use: "occasional",
    },
    createdAt: new Date("2025-10-30"),
  },

  // PATIENT 8 - Matches Trial 5 (Colorectal Cancer)
  {
    email: "patient008@test.com",
    healthRecord: {
      demographics: { age: 56, gender: "female", ethnicity: "Caucasian" },
      vitals: { height_cm: 168, weight_kg: 65, bmi: 23.0, blood_pressure: "128/82", heart_rate: 74 },
      diagnosis_codes: ["C18.7", "C78.7", "Z51.11"],
      lab_results: {
        msi_status: "MSI-H",
        mmr_status: "dMMR",
        cea: 45,
        wbc: 6.8,
        hemoglobin: 11.2,
        platelets: 220,
        alt: 32,
        ast: 28,
        creatinine: 0.9,
        egfr: 82,
      },
      medications: ["ondansetron", "loperamide", "oxycodone", "multivitamin"],
      medical_history: ["colorectal_cancer_stage_iv", "liver_metastases", "prior_folfox", "prior_bevacizumab", "ecog_ps_1"],
      allergies: [],
      smoking_status: "never",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-08-28"),
  },

  // PATIENT 9 - Matches Trial 5 (Colorectal Cancer)
  {
    email: "patient009@test.com",
    healthRecord: {
      demographics: { age: 62, gender: "male", ethnicity: "Asian" },
      vitals: { height_cm: 174, weight_kg: 72, bmi: 23.8, blood_pressure: "132/78", heart_rate: 70 },
      diagnosis_codes: ["C19", "C78.7", "C78.0", "Z51.11"],
      lab_results: {
        msi_status: "MSI-H",
        mmr_status: "dMMR",
        cea: 128,
        wbc: 5.4,
        hemoglobin: 10.8,
        platelets: 185,
        alt: 48,
        ast: 42,
        creatinine: 1.0,
        egfr: 76,
      },
      medications: ["prochlorperazine", "gabapentin", "fentanyl_patch"],
      medical_history: ["rectal_cancer_stage_iv", "liver_metastases", "lung_metastases", "prior_folfiri", "ecog_ps_1"],
      allergies: ["iodine_contrast"],
      smoking_status: "former_smoker",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-09-15"),
  },

  // PATIENT 10 - Matches Trial 5 (Colorectal Cancer)
  {
    email: "patient010@test.com",
    healthRecord: {
      demographics: { age: 48, gender: "female", ethnicity: "African American" },
      vitals: { height_cm: 162, weight_kg: 58, bmi: 22.1, blood_pressure: "118/76", heart_rate: 68 },
      diagnosis_codes: ["C18.2", "C78.7", "Z51.11"],
      lab_results: {
        msi_status: "MSI-H",
        mmr_status: "dMMR",
        cea: 72,
        wbc: 7.2,
        hemoglobin: 11.8,
        platelets: 245,
        alt: 28,
        ast: 24,
        creatinine: 0.8,
        egfr: 95,
      },
      medications: ["aprepitant", "dexamethasone", "tramadol"],
      medical_history: ["colon_cancer_ascending", "liver_metastases", "prior_capecitabine", "lynch_syndrome", "ecog_ps_0"],
      allergies: ["latex"],
      smoking_status: "never",
      alcohol_use: "none",
    },
    createdAt: new Date("2025-11-05"),
  },
];

/**
 * Main seeding function
 */
export async function seedDatabase() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable not set");
    }
    
    await connectDatabase(mongoUri, "trialmatch");
    const db = getDatabase();
    const trialsStore = getTrialsStore();

    // 1. Fetch RayPharma from database
    console.log("🔍 Fetching pharma organization...");
    
    const pharmaCollection = db.collection("pharma_organizations");
    let rayPharma = await pharmaCollection.findOne({ name: "RayPharma" });
    
    let pharmaName = "RayPharma";
    
    if (rayPharma) {
      pharmaName = rayPharma.name;
      console.log(`   ✓ Found: ${pharmaName}`);
    } else {
      console.log(`   ⚠ Pharma organization not found, using default: ${pharmaName}`);
    }
    console.log("");

    // 2. Create trials with Ray Pharma as sponsor
    const trial3: ParsedTrial = { ...trial3Template, sponsor: pharmaName };
    const trial4: ParsedTrial = { ...trial4Template, sponsor: pharmaName };
    const trial5: ParsedTrial = { ...trial5Template, sponsor: pharmaName };

    // 3. Seed Trials (both in-memory store AND MongoDB)
    console.log("📋 Seeding pharmaceutical trials...");
    
    const trialsCollection = db.collection("trials");
    
    // Trial 3
    trialsStore.set(trial3.id, trial3);
    await trialsCollection.updateOne(
      { id: trial3.id },
      { $set: trial3 },
      { upsert: true }
    );
    console.log(`   ✓ ${trial3.id}: ${trial3.name}`);
    
    // Trial 4
    trialsStore.set(trial4.id, trial4);
    await trialsCollection.updateOne(
      { id: trial4.id },
      { $set: trial4 },
      { upsert: true }
    );
    console.log(`   ✓ ${trial4.id}: ${trial4.name}`);
    
    // Trial 5
    trialsStore.set(trial5.id, trial5);
    await trialsCollection.updateOne(
      { id: trial5.id },
      { $set: trial5 },
      { upsert: true }
    );
    console.log(`   ✓ ${trial5.id}: ${trial5.name}`);
    
    console.log(`   Trials in memory: ${trialsStore.size}`);
    const dbTrialsCount = await trialsCollection.countDocuments({});
    console.log(`   Trials in MongoDB: ${dbTrialsCount}\n`);

    // 4. Seed Patients (both patients collection AND patient_credentials)
    console.log("👥 Seeding patient records...");
    console.log("   Creating patient accounts with T3N SDK (this may take a moment)...\n");
    
    const patientsCollection = db.collection("patients");
    const credentialsCollection = db.collection("patient_credentials");
    
    for (const patientTemplate of patients) {
      // Check if patient already exists by email
      const existing = await patientsCollection.findOne({ email: patientTemplate.email });
      
      let patientAccount: PatientAccount;
      
      if (existing) {
        // Use existing patient's account
        patientAccount = {
          patientDid: existing.patientDid,
          ethAddress: existing.ethAddress,
          encryptedPrivateKey: existing.encryptedPrivateKey,
          createdAt: existing.createdAt,
        };
        console.log(`   ↻ ${patientTemplate.email} (already exists, keeping DID: ${patientAccount.patientDid.substring(0, 30)}...)`);
        
        // Update health record but keep account info
        await patientsCollection.updateOne(
          { email: patientTemplate.email },
          { 
            $set: { 
              healthRecord: patientTemplate.healthRecord,
              createdAt: patientTemplate.createdAt 
            } 
          }
        );
      } else {
        // Create new patient account using T3N SDK (proper way!)
        console.log(`   🔑 Creating wallet and DID for ${patientTemplate.email}...`);
        patientAccount = await createPatientAccount();
        console.log(`   ✅ ${patientTemplate.email}`);
        console.log(`      DID: ${patientAccount.patientDid}`);
        console.log(`      Eth Address: ${patientAccount.ethAddress}`);
        
        // Insert new patient with proper DID
        await patientsCollection.insertOne({
          email: patientTemplate.email,
          patientDid: patientAccount.patientDid,
          ethAddress: patientAccount.ethAddress,
          encryptedPrivateKey: patientAccount.encryptedPrivateKey,
          healthRecord: patientTemplate.healthRecord,
          createdAt: patientTemplate.createdAt,
        });
      }
      
      // Always ensure credentials exist with matching DID
      await credentialsCollection.updateOne(
        { patientDid: patientAccount.patientDid },
        { 
          $set: {
            patientDid: patientAccount.patientDid,
            email: patientTemplate.email,
            encryptedPrivateKey: patientAccount.encryptedPrivateKey,
            ethAddress: patientAccount.ethAddress,
            createdAt: patientTemplate.createdAt,
          }
        },
        { upsert: true }
      );
    }
    
    const totalPatients = await patientsCollection.countDocuments({});
    const totalCredentials = await credentialsCollection.countDocuments({});
    console.log(`\n   Total patients in DB: ${totalPatients}`);
    console.log(`   Total credentials in DB: ${totalCredentials}\n`);

    // 5. Summary
    console.log("📊 Seeding Summary:");
    console.log(`   Sponsor: ${pharmaName}`);
    console.log("   Trials:");
    console.log(`     - Trial 3 (Diabetes): 4 matching patients (001-004)`);
    console.log(`     - Trial 4 (Heart Failure): 3 matching patients (005-007)`);
    console.log(`     - Trial 5 (Colorectal Cancer): 3 matching patients (008-010)`);
    console.log("\n✅ Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// Run seeding if executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
