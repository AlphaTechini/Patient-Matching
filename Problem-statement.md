# Problem Statement: Clinical Trial Patient Matching

## The Crisis

Clinical trial patient recruitment is the single largest bottleneck in drug development. Despite billions spent annually on recruitment, the system is failing at scale — delaying life-saving treatments, inflating drug costs, and leaving patients without access to potentially transformative therapies.

---

## Key Statistics

| Metric | Statistic | Source |
|---|---|---|
| **Trial enrollment failure rate** | ~80% of clinical trials fail to meet their original enrollment timelines | [Clinical Leader (2025)](https://www.clinicalleader.com/doc/trends-in-patient-recruitment-from-disruption-to-precision-0001) · [Antidote](https://www.antidote.me/blog/25-useful-clinical-trial-recruitment-statistics-for-better-results) · [Kapsule](https://kapsuletech.com/blog/patient-recruitment-clinical-trials) |
| **Zero-enrollment sites** | Nearly 30% of activated trial sites enroll zero patients | [Clinical Leader (2025)](https://www.clinicalleader.com/doc/trends-in-patient-recruitment-from-disruption-to-precision-0001) |
| **Cancer trial failure** | ~25% of cancer trials never accrue enough patients; up to 18% close with <50% of target enrollment | [IntuitionLabs](https://intuitionlabs.ai/articles/patient-recruitment-services-software) |
| **Patient unawareness** | 85% of cancer patients were either unaware or unsure that participation in clinical trials was an option | [LLU Clinical Trials (Harris Interactive Poll)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf) |
| **Willingness to enroll** | ~75% of unaware patients said they would have been willing to enroll had they known it was possible | [LLU Clinical Trials (Harris Interactive Poll)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf) |
| **Oncology enrollment rate** | Only ~3% of oncology patients in the United States enroll in clinical trials | [LLU Clinical Trials (Harris Interactive Poll)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf) |
| **Recruitment time cost** | Patient recruitment alone consumes approximately 30% of a trial's total duration | [IntuitionLabs](https://intuitionlabs.ai/articles/patient-recruitment-services-software) |
| **Physician referral failure** | More than 1/3 of doctors declined to refer patients to clinical trials, mistakenly believing no trials were available or that their patients were too sick | [LLU Clinical Trials (UC Davis Cancer Center Study)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf) |
| **Patient preference** | 92.7% of oncology patients say it's "important" or "very important" to talk with doctors involved in clinical research before joining | [Antidote](https://www.antidote.me/blog/25-useful-clinical-trial-recruitment-statistics-for-better-results) |
| **ASCO top barrier** | Intensity of paperwork collection, filing, and extra time needed to train staff are the most significant barriers to patient enrollment | [LLU Clinical Trials (ASCO Survey)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf) |

---

## How Patient Matching Works Today

### The Current Workflow

1. **Protocol Design** — Pharma sponsor defines inclusion/exclusion criteria (often 50-100+ conditions)
2. **CRO Engagement** — Sponsor hires Contract Research Organizations and/or recruitment-advertising agencies
3. **Site Recruitment** — CROs recruit trial sites (hospitals, clinics) through company databases, word-of-mouth, and clinical research associate networks
4. **Manual Screening** — Physicians and site staff manually review patient medical records against trial criteria
5. **Patient Outreach** — Advertising campaigns (newspaper, radio, TV), physician referrals, or direct site contact
6. **Informed Consent** — In-person consent process explaining procedures, risks, and voluntary participation
7. **Enrollment** — Qualified patients are enrolled and begin the trial

*Source: [LLU Clinical Trials — Current Challenges in Patient Recruitment](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)*

---

## The Problems

### 1. Manual Screening Bottleneck

Doctors review patient medical records **by hand** against complex inclusion/exclusion criteria. A single trial protocol may contain 50-100+ conditions. The process is slow, error-prone, and scales poorly.

> "Frequently, a suitable patient population initially appears to be available for a target indication. Recruitment and enrollment difficulty ensues when detailed protocol inclusion/exclusion criteria drastically narrow the population qualified to participate."
>
> — [LLU Clinical Trials](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)

### 2. Patient Data Exposure Across Trust Boundaries

Patient health records (PHI) flow through multiple organizations — sponsors, CROs, recruitment agencies, trial sites — each handoff creating a HIPAA compliance risk. There is **no confidential computation layer** ensuring that sensitive data is processed without being exposed to unauthorized parties.

> "HIPAA was publicized on national news media during the week of April 14, 2003. From this date onward, informed consent forms containing a HIPAA clause or a separate HIPAA form must be signed by the volunteer prior to the initiation of any study procedure."
>
> — [LLU Clinical Trials](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)

### 3. No Verifiable Identity or Audit Trail

There is no neutral, cryptographically verifiable identity layer for the parties involved (pharma sponsors, CROs, hospitals, patients). Regulators cannot independently verify that matching was performed fairly, that eligibility criteria were applied correctly, or that patient data was handled appropriately.

### 4. Cross-Boundary Data Silos

Hospitals hold patient EHRs. Sponsors hold trial protocols. CROs hold site networks. None of these systems interoperate confidentially. Federated matching solutions exist (e.g., TriNetX, Tempus AI) but operate within their own ecosystems — no neutral layer for cross-platform verification.

> "TriNetX acquired Clinerion, combining federated EHR networks into the most-cited real-world data source in peer-reviewed research with over 2,000 citations."
>
> — [IntuitionLabs](https://intuitionlabs.ai/articles/patient-recruitment-services-software)

### 5. Underrepresented Populations

Historical distrust (Tuskegee syphilis study), language barriers, access issues, and cultural differences make diverse enrollment nearly impossible. This leads to trial results that don't generalize across populations.

> "Long-standing fear, apprehension, and skepticism exist among some minority populations about medical research because of abuses that have happened in the past... Many feel that they do not want to give up rights or lose power in order to be 'experimented on.'"
>
> — [LLU Clinical Trials (NCI)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)

### 6. Administrative Burden

> "According to a study survey conducted in 2000 by the American Society of Clinical Oncology (ASCO), the most significant barriers to patient enrollment included the intensity of paperwork collection and filing, and the extra time needed to train staff in the completion of enrollment and data collection forms."
>
> — [LLU Clinical Trials (ASCO)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)

### 7. Physician Awareness Gap

> "Previous research by UC Davis Cancer Center investigators, published in the March 13, 2001 issue of the Journal of Clinical Oncology, found that both doctors and patients sometimes hold misconceptions that can discourage enrollment in clinical trials. In that study, more than a third of the doctors declined to refer patients to clinical trials, mistakenly believing that no trials were available or that their patients were too sick to be accepted. In reality, more than 150 clinical trials were available during the study period."
>
> — [LLU Clinical Trials (UC Davis)](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)

---

## Regulatory Context

The regulatory landscape for AI in healthcare is accelerating, and any patient matching solution must satisfy multiple regimes simultaneously:

| Regulation | Relevance | Source |
|---|---|---|
| **HIPAA** | Protects patient health information; any data sharing must comply | [LLU Clinical Trials](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf) |
| **EU AI Act** | AI systems for healthcare are high-risk; transparency and traceability required | [Terminal 3 Manifesto](https://blog.terminal3.io/the-agentic-ai-security-governance-manifesto/) |
| **Singapore IMDA Agentic AI Framework** | Voluntary framework for bounding risk, technical controls, end-user responsibility | [Terminal 3 Manifesto](https://blog.terminal3.io/the-agentic-ai-security-governance-manifesto/) |
| **Hong Kong GenA.I. Sandbox++** | Covers banking, securities, insurance — expanding to healthcare | [Terminal 3 Manifesto](https://blog.terminal3.io/the-agentic-ai-security-governance-manifesto/) |

---

## Why Agents Make This Different

The [Terminal 3 Agentic AI Security & Governance Manifesto](https://blog.terminal3.io/the-agentic-ai-security-governance-manifesto/) identifies healthcare as a domain where "agents that act autonomously... will become capable of error or misuse at a scale and speed that exceeds human intervention after the fact." The answer is "cryptographic, hardware-rooted governance that binds the agent *before* it acts."

A TEE-governed patient matching agent solves the core problems that current solutions cannot:

| Problem | Current Solutions | TEE Agent Solution |
|---|---|---|
| Manual screening | LLM-based matching (exposes patient data to model) | Confidential computation inside Intel TDX — patient data never leaves enclave |
| Data exposure | De-identification (reversible, error-prone) | `http-with-placeholders` — PII resolved host-side, never enters contract |
| No verifiable audit | Internal logs (editable by sponsor) | Tamper-resistant, third-party-verifiable audit trail on T3N ledger |
| Cross-boundary silos | Federated networks (walled-garden) | Cross-tenant calls with verifiable identity for all parties |
| Regulatory compliance | Asserted compliance | Demonstrable compliance via cryptographic attestation |

---

## Market Validation

The market is already moving toward AI-powered matching, confirming the problem is real and urgent:

- **Tempus AI acquired Deep 6 AI** (March 2025) — integrating its 30+ million patient EHR matching engine into the Tempus TIME Precision Network [[IntuitionLabs](https://intuitionlabs.ai/articles/patient-recruitment-services-software)]
- **TriNetX acquired Clinerion** — combining federated EHR networks [[IntuitionLabs](https://intuitionlabs.ai/articles/patient-recruitment-services-software)]
- **Nature paper** (Nov 2024) — "Matching patients to clinical trials with large language models" demonstrates LLM-based matching outperforms traditional methods [[Nature Communications](https://www.nature.com/articles/s41467-024-53081-z)]

The gap: none of these solutions provide **confidential computation**, **verifiable identity**, or **tamper-resistant audit** — the three pillars that regulators and counterparties will require as agentic AI scales in healthcare.

---

## Competitive Landscape

The market has invested heavily in **faster matching**. No one has built **trusted matching**. Below is a breakdown of existing players and what they are missing.

### Deep 6 AI (acquired by Tempus AI, March 2025)

**What they do:** AI engine that scans 30+ million patient EHRs to find patients matching trial criteria. Uses NLP to parse unstructured clinical notes and map them to trial inclusion/exclusion conditions.

**What they don't have:**
- Patient data processed in the clear inside Tempus's own cloud infrastructure
- No confidential computation — the platform, its engineers, and its cloud provider can all access raw PHI
- No verifiable identity for the parties involved (sponsor, CRO, hospital, patient)
- Internal audit logs that are editable by the platform — not independently verifiable by regulators
- Operates as a walled-garden within the Tempus ecosystem

*Source: [IntuitionLabs — Tempus AI acquired Deep 6 AI](https://intuitionlabs.ai/articles/patient-recruitment-services-software)*

### TriNetX / Clinerion (acquired 2025)

**What they do:** Federated EHR network connecting hospitals and research institutions. Researchers query patient data across participating sites without centralizing records. The most-cited real-world data source in peer-reviewed research with 2,000+ citations.

**What they don't have:**
- Federated ≠ confidential — data is still shared between parties without hardware-enforced isolation
- No TEE layer — query logic and results are visible to the platform and participating institutions
- Logs are internal and editable by the platform
- No cryptographic identity layer — trust is based on institutional relationships, not verifiable credentials
- Walled-garden — you must be part of the TriNetX network to participate

*Source: [IntuitionLabs — TriNetX acquired Clinerion](https://intuitionlabs.ai/articles/patient-recruitment-services-software)*

### LLM-Based Matching (Academic / Research)

**What they do:** Research papers (e.g., [Nature Communications, Nov 2024](https://www.nature.com/articles/s41467-024-53081-z)) demonstrate that LLMs can parse trial protocols and match against patient records with higher accuracy than traditional rule-based systems.

**What they don't have:**
- LLM sees raw patient data — no hardware-enforced isolation between the model and PHI
- No cryptographic identity for the parties involved
- No tamper-resistant audit trail — matching decisions are not independently verifiable
- Academic prototypes, not production systems with regulatory compliance baked in

*Source: [Nature Communications — Matching patients to clinical trials with large language models](https://www.nature.com/articles/s41467-024-53081-z)*

### Traditional CRO / Site-Based Matching

**What they do:** Contract Research Organizations (IQVIA, PPD, Parexel) recruit trial sites, and site staff manually screen patients against trial criteria using paper or electronic forms.

**What they don't have:**
- Manual, slow, error-prone — the root cause of the 80% trial enrollment failure rate
- Patient records shared via email, fax, or unencrypted portals — major HIPAA risk
- No automation, no AI, no confidential computation
- Audit trails are paper-based or stored in editable internal systems

*Source: [LLU Clinical Trials — Current Challenges in Patient Recruitment](https://clinicaltrials.llu.edu/sites/clinicaltrials.llu.edu/files/docs/current-challenges-in-clinical-trial-patient-recruitment-and-enrollment.pdf)*

---

### The Gap: Faster Matching vs. Trusted Matching

| Capability | Deep 6 AI | TriNetX | LLM Research | CRO / Manual | **Our TEE Agent** |
|---|---|---|---|---|---|
| AI-powered matching | Yes | Partial | Yes | No | Yes |
| Confidential computation (TEE) | No | No | No | No | **Yes** |
| PII never enters matching logic | No | No | No | No | **Yes** (placeholders) |
| Verifiable identity (DID) | No | No | No | No | **Yes** |
| Tamper-resistant audit | No | No | No | No | **Yes** (T3N ledger) |
| Cross-boundary interoperability | No (walled-garden) | No (walled-garden) | N/A | No | **Yes** (cross-tenant calls) |
| Regulatory attestation | Asserted | Asserted | N/A | Asserted | **Demonstrable** |

**Our position:** We are not competing with Deep 6 AI or TriNetX on matching accuracy. We are the **governance layer** they are missing. A hospital could use Deep 6 AI for initial candidate identification but still need our TEE contract to:

1. Execute the final match confidentially inside an Intel TDX enclave
2. Ensure patient PII never leaves the hospital's trust boundary
3. Produce a cryptographically sealed audit trail that FDA, EMA, and other regulators can independently verify
4. Enable cross-tenant data sharing between the hospital and pharma sponsor without either party seeing the other's raw data

As the [Terminal 3 Manifesto](https://blog.terminal3.io/the-agentic-ai-security-governance-manifesto/) states: *"The only durable answer is cryptographic, hardware-rooted governance that binds the agent before it acts — identity, permission, and audit primitives enforced at the point of action rather than reviewed in the aftermath."*
