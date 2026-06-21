/**
 * Backend Eligibility Checker
 * 
 * Fallback eligibility checking when TEE is unavailable.
 * Implements the same logic as the TEE contract but runs in backend.
 */

import type { ParsedTrial, TrialCriteria } from "../routes/trials";

export interface EligibilityResult {
  eligible: boolean;
  confidence: number;
  matched_criteria: number;
  total_criteria: number;
}

interface PatientHealthRecord {
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
}

/**
 * Check if patient meets trial eligibility criteria
 */
export function checkEligibility(
  trial: ParsedTrial,
  healthRecord: PatientHealthRecord
): EligibilityResult {
  const inclusionCriteria = trial.criteria.inclusion;
  const exclusionCriteria = trial.criteria.exclusion;
  const totalCriteria = inclusionCriteria.length + exclusionCriteria.length;

  let matchedCriteria = 0;
  let eligible = true;

  // Check inclusion criteria
  for (const criterion of inclusionCriteria) {
    if (matchesCriterion(criterion, healthRecord)) {
      matchedCriteria++;
    } else {
      eligible = false;
    }
  }

  // Check exclusion criteria (must NOT match)
  for (const criterion of exclusionCriteria) {
    if (!matchesCriterion(criterion, healthRecord)) {
      matchedCriteria++;
    } else {
      eligible = false;
    }
  }

  const confidence = totalCriteria > 0 ? matchedCriteria / totalCriteria : 0;

  return {
    eligible,
    confidence,
    matched_criteria: matchedCriteria,
    total_criteria: totalCriteria,
  };
}

/**
 * Check if a patient matches a single criterion
 */
function matchesCriterion(criterion: TrialCriteria, healthRecord: PatientHealthRecord): boolean {
  const { field, expected } = criterion;

  // Null expected means any value is acceptable (e.g., age 18+)
  if (expected === null) {
    return true;
  }

  switch (field) {
    case "diagnosis_codes":
      return healthRecord.diagnosis_codes.some(code => 
        code === expected || code.startsWith(expected.replace(/\.\d+$/, ""))
      );

    case "age": {
      const age = healthRecord.demographics.age;
      if (expected.includes("-")) {
        const [min, max] = expected.split("-").map(Number);
        return age >= (min ?? 0) && age <= (max ?? 999);
      }
      return age >= parseInt(expected);
    }

    case "gender":
      return healthRecord.demographics.gender.toLowerCase() === expected.toLowerCase();

    case "bmi": {
      const bmi = healthRecord.vitals.bmi;
      if (expected.includes("-")) {
        const [min, max] = expected.split("-").map(Number);
        return bmi >= (min ?? 0) && bmi <= (max ?? 999);
      }
      return bmi >= parseFloat(expected);
    }

    case "blood_pressure": {
      const bp = healthRecord.vitals.blood_pressure;
      if (expected.startsWith("<")) {
        const [maxSys, maxDia] = expected.slice(1).split("/").map(Number);
        const [sys, dia] = bp.split("/").map(Number);
        return (sys ?? 999) < (maxSys ?? 0) && (dia ?? 999) < (maxDia ?? 0);
      }
      return true;
    }

    case "medications":
      return healthRecord.medications.some(med => 
        med.toLowerCase().includes(expected.toLowerCase())
      );

    case "allergies":
      return healthRecord.allergies.some(allergy => 
        allergy.toLowerCase().includes(expected.toLowerCase())
      );

    case "smoking_status":
      return healthRecord.smoking_status === expected;

    // Lab results
    case "hba1c":
    case "egfr":
    case "uacr":
    case "ldl":
    case "hdl":
    case "lvef":
    case "bnp":
    case "nt_probnp":
    case "msi_status": {
      const value = healthRecord.lab_results[field];
      if (value === undefined) return false;

      if (expected.includes("-")) {
        const [min, max] = expected.split("-").map(Number);
        return value >= (min ?? 0) && value <= (max ?? 999999);
      }
      if (expected.startsWith(">")) {
        return value > parseFloat(expected.slice(1));
      }
      if (expected.startsWith("<")) {
        return value < parseFloat(expected.slice(1));
      }
      if (expected.startsWith("≥")) {
        return value >= parseFloat(expected.slice(1));
      }
      if (expected.startsWith("≤")) {
        return value <= parseFloat(expected.slice(1));
      }
      
      // Exact match for strings like MSI-H
      return String(value) === expected;
    }

    case "cardiovascular_risk":
      return healthRecord.medical_history.some(h => 
        h.includes("cardiovascular") || 
        h.includes("coronary") || 
        h.includes("cardio") ||
        h.includes("hypertension")
      );

    case "nyha_class":
    case "ecog_ps":
    case "stage":
    case "prior_therapy":
    case "measurable_disease":
    case "organ_function":
    case "life_expectancy":
      // These require more complex logic - for MVP, check medical history
      return healthRecord.medical_history.some(h => 
        h.toLowerCase().includes(field.toLowerCase())
      );

    default:
      // Unknown field - assume doesn't match
      return false;
  }
}
