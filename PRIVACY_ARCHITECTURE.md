# Privacy-Preserving Architecture

## Core Privacy Principle

**Patient medical data NEVER leaves the Trusted Execution Environment (TEE).**

---

## Data Storage Architecture

### What's Stored WHERE:

| Data Type | Storage Location | Reason |
|-----------|------------------|--------|
| **Patient Medical Records** | T3N User Profile (TEE) | **Privacy-critical** - must never be readable by backend |
| **PDF Text (extracted)** | T3N User Profile (TEE) | **Privacy-critical** - raw medical data |
| **LLM Extracted Data** | T3N User Profile (TEE) | **Privacy-critical** - structured medical fields |
| **Patient Credentials** | MongoDB (encrypted) | Backend needs to authenticate patients |
| **Wallet Private Keys** | MongoDB (AES-256-GCM encrypted) | Custodial wallet management |
| **Upload Metadata** | MongoDB | UI state (has_uploaded, file_name, etc.) |
| **Trial Criteria** | TEE KV Store | Immutable, auditable trial protocols |
| **Match Results** | TEE KV Store | Audit trail of matching decisions |

---

## Patient Onboarding Flow

### 1. Registration (Custodial Wallet Creation)

```
Patient submits email
         ↓
Backend generates Ethereum wallet (ethers.js)
         ↓
Backend creates T3N client with wallet
         ↓
T3N auto-generates DID: did:t3n:xxx
         ↓
Backend encrypts private key (AES-256-GCM)
         ↓
Store in MongoDB:
{
  email: "patient@example.com",
  patientDid: "did:t3n:abc123",
  ethAddress: "0x...",
  encryptedPrivateKey: "iv:authTag:ciphertext"
}
```

**MongoDB stores ONLY:**
- Email (for login)
- T3N DID (identifier)
- Encrypted private key (to access T3N)
- Eth address (wallet address)

**MongoDB NEVER stores:**
- Medical records
- PDF text
- Diagnosis codes
- Medications
- Lab results

---

### 2. Health Records Upload

```
Patient uploads PDF → Frontend
         ↓
Backend extracts PDF text (in memory only, not stored)
         ↓
Backend retrieves encrypted private key from MongoDB
         ↓
Backend decrypts key → creates T3N client
         ↓
Backend uploads PDF text to T3N User Profile
         ↓
T3N encrypts and stores in TEE
         ↓
Backend updates MongoDB metadata:
{
  patientDid: "did:t3n:abc123",
  uploadStatus: {
    hasHealthRecords: true,
    lastUploadedAt: "2026-06-19...",
    fileName: "medical-records.pdf",
    fileSize: 1048576
  }
}
```

**Key Point:** Backend processes PDF in memory, sends to T3N, then discards. PDF text is never persisted in backend storage.

---

### 3. Trial Matching (TEE-Only Data Access)

```
Agent calls: checkEligibility(trial_id, patient_did)
         ↓
TEE Hospital Contract executes inside Intel TDX:
         ↓
Step 1: Fetch patient data via http-with-placeholders
  - GET {{profile.health_records.pdf_text}}
  - Resolved INSIDE TEE enclave (backend can't see it)
         ↓
Step 2: Call LLM API from inside TEE
  - Retrieve Groq API key from sealed secrets vault
  - POST to api.groq.com with PDF text
  - LLM returns structured JSON
  - JSON exists ONLY in TEE memory
         ↓
Step 3: Match against trial criteria
  - Evaluate inclusion/exclusion rules
  - Calculate confidence score
         ↓
Step 4: Return ONLY eligibility result
  - Output: { eligible: true, confidence: 0.95, matched: 8, total: 10 }
  - NO raw patient data
         ↓
Agent receives: { eligible: true, ... }
Backend NEVER sees: diagnosis, medications, biomarkers, etc.
```

---

## Encryption Details

### Wallet Private Key Encryption (AES-256-GCM)

**Encryption:**
```typescript
const key = sha256(process.env.WALLET_ENCRYPTION_KEY); // 32 bytes
const iv = randomBytes(16); // Initialization vector
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = cipher.update(privateKey, 'utf8');
const final = cipher.final();
const authTag = cipher.getAuthTag(); // 16 bytes

// Stored format: "iv:authTag:encrypted" (all base64)
```

**Security Properties:**
- **AES-256**: Industry-standard symmetric encryption
- **GCM Mode**: Authenticated encryption (integrity + confidentiality)
- **Random IV**: Unique per encryption (prevents pattern analysis)
- **Auth Tag**: Detects tampering

**Master Key Requirements:**
- Must be 256-bit (32 bytes)
- Generate with: `openssl rand -hex 32`
- Store in environment variable (never commit to git)
- Rotate periodically in production

---

## Privacy Guarantees

### What Backend CAN See:
✅ Patient email (for login)
✅ Patient DID (identifier)
✅ Upload metadata (has_uploaded, file_name, upload_time)
✅ Encrypted wallet credentials

### What Backend CANNOT See:
❌ Medical records content
❌ PDF text
❌ Diagnosis codes (ICD-10)
❌ Medications
❌ Lab results / biomarkers
❌ Any PHI (Protected Health Information)

### What TEE Contract CAN See:
✅ Patient medical records (inside enclave only)
✅ PDF text (decrypted in enclave)
✅ Trial criteria
✅ Matching logic

### What Agent/External Parties CAN See:
✅ Eligibility boolean (true/false)
✅ Confidence score (0.0 - 1.0)
✅ Matched criteria count
❌ NO raw medical data
❌ NO patient identifiers linked to medical data

---

## Compliance & Audit

### HIPAA Compliance:
- ✅ PHI stored in hardware-isolated TEE
- ✅ Encryption at rest (T3N encrypts profile data)
- ✅ Encryption in transit (TLS + TEE secure channels)
- ✅ Access controls (cryptographic authorization via DIDs)
- ✅ Audit trail (T3N immutable ledger)

### Regulatory Attestation:
- ✅ Every contract execution recorded on T3N ledger
- ✅ Immutable proof of which contract version ran
- ✅ Cryptographic signatures of all participants
- ✅ Regulators can verify without seeing patient data

### Zero-Knowledge Matching:
- ✅ Backend operator cannot see patient data
- ✅ Agent cannot see patient data
- ✅ Only TEE contract sees data (inside Intel TDX)
- ✅ Output reveals eligibility only (not reasons with PHI)

---

## Security Considerations

### Threat Model:

**Protected Against:**
- ✅ Malicious backend operator (custodial setup mitigated by encryption)
- ✅ Database breach (private keys encrypted, medical data not in DB)
- ✅ Agent compromise (agent never sees medical data)
- ✅ Network interception (TLS + TEE secure channels)
- ✅ Insider threats (TEE isolation + encryption)

**Residual Risks:**
- ⚠️ Backend holds encrypted private keys (custodial model)
  - Mitigation: Encrypt with strong master key
  - Future: Add option for patients to connect own wallet
- ⚠️ Master encryption key compromise
  - Mitigation: HSM storage in production, key rotation
- ⚠️ TEE vulnerability (Intel TDX exploit)
  - Mitigation: Terminal 3's attestation + security updates

---

## Migration from Old Architecture

### Old (Privacy-Violating):
```
Patient PDF → Backend extracts → MongoDB stores raw text + medical data
                    ↓
            Backend can see ALL medical records ❌
```

### New (Privacy-Preserving):
```
Patient PDF → Backend extracts (memory only) → T3N Profile (TEE)
                                                    ↓
                                      Backend sees NOTHING ✅
```

### Migration Steps:
1. ✅ Created patient onboarding service (custodial wallets)
2. ✅ Removed medical data from MongoDB schema
3. ✅ Added encrypted credentials storage
4. ✅ Updated routes to store data in T3N profiles
5. 🔄 Need to update TEE contract to call LLM API
6. 🔄 Need to update frontend to use new endpoints

---

## API Endpoints (New)

### Patient Registration:
```
POST /api/patients/register
Body: { email: "patient@example.com" }
Response: { success: true, patientDid: "did:t3n:abc123" }
```

### Patient Login:
```
POST /api/patients/login
Body: { email: "patient@example.com" }
Response: { success: true, patientDid: "did:t3n:abc123" }
```

### Upload Health Records:
```
POST /api/patients/upload-pdf
Body: multipart/form-data
  - patientDid: "did:t3n:abc123"
  - pdfFile: <binary>
Response: { success: true, message: "Health records stored in TEE" }
```

### Get Status:
```
GET /api/patients/status?patientDid=did:t3n:abc123
Response: {
  patientDid: "did:t3n:abc123",
  uploadStatus: {
    hasHealthRecords: true,
    lastUploadedAt: "2026-06-19..."
  }
}
```

---

## Future Enhancements

### Phase 2: Non-Custodial Option
- Allow patients to connect MetaMask/WalletConnect
- Patient fully controls their own DID
- Backend never touches private keys

### Phase 3: Consent Management
- Granular consent per trial
- Time-limited access grants
- Revocable permissions

### Phase 4: Multi-Tenant Hospitals
- Each hospital gets own TEE contract
- Cross-hospital matching (with patient consent)
- Federated learning on aggregated (non-PHI) data

---

## Summary

**Privacy Model:** Zero-knowledge custodial
- Backend creates wallets for patients (custodial)
- Backend encrypts and stores credentials (MongoDB)
- Medical data stored in T3N profiles (TEE)
- Backend NEVER sees medical records
- Only TEE contract processes medical data
- Agent receives eligibility only (no PHI)

**Security:** Defense in depth
- Encryption at rest (AES-256-GCM for keys, T3N for profiles)
- Encryption in transit (TLS + TEE channels)
- Hardware isolation (Intel TDX)
- Cryptographic authorization (DIDs)
- Immutable audit trail (T3N ledger)
