/**
 * Stage 1: Mock Identity Store
 * 
 * Simple state management for patient identity without complex auth.
 * Allows user to input their DID for demo purposes.
 */

interface PatientIdentity {
  did: string;
  role: 'patient' | 'pharma' | 'hospital';
}

class IdentityStore {
  private _identity = $state<PatientIdentity | null>(null);

  get identity() {
    return this._identity;
  }

  get isAuthenticated() {
    return this._identity !== null;
  }

  get patientDid() {
    return this._identity?.did || null;
  }

  setPatient(did: string) {
    this._identity = {
      did,
      role: 'patient',
    };
    // Persist to localStorage for demo
    if (typeof window !== 'undefined') {
      localStorage.setItem('trialmatch_identity', JSON.stringify(this._identity));
    }
  }

  restore() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trialmatch_identity');
      if (stored) {
        try {
          this._identity = JSON.parse(stored);
        } catch {
          // Invalid stored data, ignore
        }
      }
    }
  }

  clear() {
    this._identity = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trialmatch_identity');
    }
  }
}

export const identityStore = new IdentityStore();
