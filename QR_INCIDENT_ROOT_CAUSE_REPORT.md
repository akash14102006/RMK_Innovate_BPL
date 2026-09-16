# BHARAT PULSELINK — ENTERPRISE QR INTEGRATION FORENSIC AUDIT & ROOT CAUSE REPORT
**Incident Reference:** BPL-INC-QR-8085-001  
**Classification:** Major Integration & Availability Failure  
**Target Systems:** Bharat PulseLink Patient App (React Native / Expo) ↔ Hospital Intelligence Web (React / Vite + Express)  
**Security Level:** Protected Health Information (PHI) / Cryptographic Envelope Architecture  
**Date:** September 16, 2026  

---

## 1. Incident

Hospital operators attempting to intake patients via the **Bharat PulseLink Secure QR Scanner** on Hospital Web (`http://localhost:5173` / production domain) experience an immediate scan failure. The camera viewfinder or manual input modal terminates scanning and presents the error:
> *"Hospital server unavailable. Please ensure hospital backend is active or ask patient to switch to an Offline QR."*

In backend diagnostic logs and network traces, the underlying exception is recorded as:
```text
connect ECONNREFUSED 127.0.0.1:8085
```
Consequently:
1. No patient clinical data is populated into the Hospital Web **Patient Assessment**, **Patient Context**, or **Smart Clinical Triage** modules.
2. The user is misled into believing the Hospital Backend is offline (when in fact Hospital Backend on `:3001` is alive and healthy).
3. The prompt to "switch to an Offline QR" is displayed indiscriminately, including when scanning malformed QRs or offline QRs with scanner prefixes.
4. Both online and offline QR resolution paths are impacted by architectural flaws and unhandled protocol edge cases.

---

## 2. Observed Symptom

| Trigger | Observed User Symptom | Technical Failure Point | Error Code |
|---|---|---|---|
| Scan `bplqr://...` (Online QR) | Modal error banner: *"Hospital server unavailable. Please ensure hospital backend is active or ask patient to switch to an Offline QR."* | Hospital Backend (`:3001`) attempts Axios POST to `http://127.0.0.1:8085/api/v1/integrations/hospital/qr/resolve` | `ECONNREFUSED` |
| Scan with scanner prefix (e.g. `iconbploff://...`) | Fallthrough to online network resolution despite being an offline envelope, yielding identical `:8085` failure | `classifyQRPayload()` returns `UNKNOWN` because of strict `startsWith('bploff://')`, which falls into online network resolver | `ECONNREFUSED` |
| Scan unsupported / non-BPL string | Fallthrough to online resolver instead of immediate validation rejection | Unclassified payload sent to backend API resolver | `ECONNREFUSED` / `400` |
| Patient App online default | Generates `bplqr://` by default when device is connected to network | Attempts server minting; if backend reachable, generates online token which hospital cannot resolve without `:8085` bridge | N/A |
| Offline resolution via backend API | Cryptographic decryption failure (`AUTHENTICATION_TAG_MISMATCH` / `RECIPIENT_MISMATCH`) | Backend offline resolver used Base64 instead of Hex for IV/Tag, mismatched AAD, and rejected valid hospital IDs | `AUTHENTICATION_TAG_MISMATCH` |

---

## 3. Runtime Topology

The system comprises two independent software packages interacting over standardized cryptographic protocols:

```
+---------------------------------------------------------------------------------------+
|                                    RUNTIME TOPOLOGY                                   |
+---------------------------------------------------------------------------------------+

  [ PROJECT A: BHARAT PULSELINK PATIENT APP ]
    ├── Platform: React Native (Expo SDK 54, React Native 0.81.5)
    ├── Local Port: 8081 (Metro Bundler)
    ├── Target Endpoints:
    │     ├── Web / Local Dev: http://localhost:8085/api/v1
    │     ├── Android Emulator: http://10.0.2.2:8085/api/v1
    │     └── Physical Device: LAN IP / Production API URL
    └── Upstream Service: BPL Fastify Backend (Node.js/TypeScript, Port: 8085)
          ├── PostgreSQL (Port: 5432)
          ├── Redis (Port: 6379, optional)
          └── Descope Authentication Gateway

                                    |
                       Scanned QR Payload via Camera / Manual Input
                       Protocols: bplqr:// (Online) | bploff:// (Offline)
                                    v

  [ PROJECT B: HOSPITAL WEB PLATFORM ]
    ├── B1. Frontend: React + Vite SPA
    │     ├── Local Port: 5173 (Vite Dev Server)
    │     ├── Target API: http://localhost:3001/api (Hospital Backend)
    │     └── In-Browser Cryptography: WebCrypto SubtleCrypto (RSA-OAEP-256 + AES-256-GCM)
    │
    └── B2. Backend: Express.js API Server
          ├── Local Port: 3001
          ├── Database: MongoDB (Port: 27017)
          ├── Downstream Integration: BPL Integration Bridge
          │     └── Target: BPL_INTEGRATION_BASE_URL (Default: http://127.0.0.1:8085/api/v1)
          └── Integration Auth: X-Service-Key, X-Hospital-Id, X-Facility-Id
```

### Component Topology Matrix

| Component | Actual Host | Actual Port | Purpose | Caller | Called Service | Environment |
|---|---|---|---|---|---|---|
| **Patient App** (`Bharat PulseLink App`) | Device / Metro (`localhost`) | `8081` | Patient healthcare wallet, QR generation | Patient User | BPL Backend (`:8085`) | Dev / LAN / Prod APK |
| **BPL Backend** (`Bharat PulseLink App/backend`) | `127.0.0.1` / `0.0.0.0` | `8085` | Fastify REST API, QR session issuance & token consumption | Patient App & Hospital Backend | PostgreSQL (`:5432`), Redis (`:6379`) | Dev / Staging / Prod |
| **Hospital Web Frontend** (`Hospital web/frontend`) | `localhost` | `5173` | Clinical dashboard, Triage, QR Scanner Modal | Hospital Clinician | Hospital Backend (`:3001`), Local WebCrypto | Dev / Staging / Prod |
| **Hospital Backend** (`Hospital web/backend`) | `127.0.0.1` | `3001` | Express API, auto-triage, BPL bridge proxy | Hospital Web Frontend (`:5173`) | BPL Backend (`:8085`), MongoDB (`:27017`) | Dev / Staging / Prod |
| **Local WebCrypto Resolver** (`offlineQRResolver.ts`) | Browser Client | N/A (In-Memory) | Zero-network RSA-OAEP + AES-GCM decryption of offline envelopes | `BPLQRScannerModal.tsx` | None (Zero Network) | All Environments |

---

## 4. QR Protocols Found

Forensic inspection of the codebase identified two distinct protocols:

### Protocol 1: `bplqr://` (Online Secure Dynamic Session)
- **URI Structure:** `bplqr://v1/s?sid=<sessionId>&t=<token>&p=<purpose>&exp=<epoch>`
- **Characteristics:**
  - Contains **Zero Protected Health Information (PHI)**.
  - Contains an ephemeral, single-use, 64-character cryptographic token (`t`) generated on BPL Backend.
  - Has a strict 90–300 second Time-To-Live (`exp`).
  - Requires active network connectivity from Hospital Backend to BPL Integration Gateway (`POST /api/v1/integrations/hospital/qr/resolve`).
  - Server verifies facility identity, consumer authorization, consent scopes, and consumes the token in database (single-use replay prevention).

### Protocol 2: `bploff://` (Offline Secure Asymmetric Envelope)
- **URI Structure:** `bploff://v1?data=<base64url_envelope>`
- **Characteristics:**
  - Completely self-contained; **Zero Network Calls permitted**.
  - Generated on patient device using recipient hospital's provisioned public key (`RSA-OAEP-256`).
  - Contains:
    - `wdek`: RSA-OAEP-256 encrypted Data Encryption Key (DEK).
    - `ct`: AES-256-GCM ciphertext of consented patient demographic & clinical fields.
    - `iv`: 12-byte initialization vector (Hex encoded).
    - `tag`: 16-byte authentication tag (Hex encoded).
    - `aad`: Authenticated Additional Data binding: `${sid}:${pid}:${hid}:${ts}`.
    - `sig`: Patient device digital signature.
    - `sid`, `pid`, `hid`, `kid`, `ts`, `exp`, `scopes`.
  - Must be decrypted **strictly in-browser** using Hospital Scanner Private Key via WebCrypto SubtleCrypto.

---

## 5. Current Online Flow

```
[Patient App]
      │ Generates bplqr://v1/s?sid=...&t=... via POST /me/qr-sessions on :8085
      ▼
[Hospital Web Camera Scanner]
      │ Html5Qrcode decodes text -> handleResolveQR(payload)
      │ classifyQRPayload(payload) -> ONLINE_SECURE_QR
      ▼
[Hospital Frontend backendApi.ts]
      │ POST http://localhost:3001/api/integration/bpl/resolve-qr
      ▼
[Hospital Backend routes/integration.js]
      │ router.post('/bpl/resolve-qr') -> resolvePatientQR()
      ▼
[Hospital Backend services/bplIntegration.js]
      │ parseBPLQRPayload() -> mode: ONLINE_SECURE_QR
      │ axios.post(`${BPL_API_BASE_URL}/integrations/hospital/qr/resolve`, requestBody)
      │   where BPL_API_BASE_URL = 'http://127.0.0.1:8085/api/v1'
      ▼
[BPL Backend :8085] (IF OFFLINE OR UNREACHABLE: ECONNREFUSED 127.0.0.1:8085)
      ▼
[Hospital Backend Catch Block]
      │ Returns 500 { success: false, error: 'connect ECONNREFUSED 127.0.0.1:8085', code: 'ECONNREFUSED' }
      ▼
[Hospital Frontend Catch Block]
      │ Sees 'ECONNREFUSED' / '8085' in err.message
      │ Sets error banner: "Hospital server unavailable. Please ensure hospital backend is active or ask patient to switch to an Offline QR."
      │ Patient data is NOT populated.
```

---

## 6. Current Offline Flow

```
[Patient App]
      │ Generates bploff://v1?data=... via OfflineCryptoService (RSA-OAEP-256 + AES-256-GCM)
      ▼
[Hospital Web Camera Scanner]
      │ Html5Qrcode decodes text -> handleResolveQR(payload)
      │ classifyQRPayload(payload)
      │
      ├── IF classifyQRPayload returns OFFLINE_SECURE_QR:
      │     │ Calls resolveOfflineQRLocally(payload)
      │     │ Checks expiry, hospital binding, replay cache
      │     │ WebCrypto RSA-OAEP decrypts DEK
      │     │ WebCrypto AES-GCM decrypts ciphertext with AAD
      │     │ Maps patient object -> setResolvedData()
      │     │ Requires user to click "Apply to Triage" -> onPatientLoaded()
      │
      └── IF classifyQRPayload returns UNKNOWN (e.g. prefix, formatting irregularity):
            │ FALLS THROUGH TO ONLINE RESOLVER!
            │ Calls backendApi.resolveBPLQR(payload)
            │ Hits :3001 -> Hits :8085 -> ECONNREFUSED 127.0.0.1:8085
            │ UI displays "Hospital server unavailable..."
```

---

## 7. Actual Request Trace

The call stack and execution flow causing the incident:

1. **Trigger:** Clinician clicks "Scan Bharat PulseLink QR" in `PatientTriage.tsx` ([L1482](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/components/PatientTriage.tsx#L1482)).
2. **Scanner Callback:** `Html5Qrcode` invokes `onScanSuccess` in `BPLQRScannerModal.tsx` ([L389](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/components/BPLQRScannerModal.tsx#L389)):
   ```typescript
   handleResolveQR(decodedText);
   ```
3. **Classification:** `BPLQRScannerModal.tsx` ([L204](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/components/BPLQRScannerModal.tsx#L204)):
   ```typescript
   const qrType = classifyQRPayload(payload);
   ```
4. **Failure Point 1 (Fallthrough):** In `BPLQRScannerModal.tsx` ([L206-276](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/components/BPLQRScannerModal.tsx#L206-L276)), only `if (qrType === 'OFFLINE_SECURE_QR')` is routed to offline. Any other return value (`ONLINE_SECURE_QR`, `UNKNOWN`, or malformed) executes lines 276–280:
   ```typescript
   setWorkflowState('ONLINE_RESOLUTION');
   const response = await backendApi.resolveBPLQR(payload);
   ```
5. **Network Dispatch:** `backendApi.ts` ([L213](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/services/backendApi.ts#L213)):
   ```typescript
   return callApi('/integration/bpl/resolve-qr', { method: 'POST', body: JSON.stringify({ qrPayload }) });
   ```
   Sent to `http://localhost:3001/api/integration/bpl/resolve-qr`.
6. **Backend Router:** `Hospital web/backend/routes/integration.js` ([L30](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/backend/routes/integration.js#L30)):
   ```javascript
   const intakeResult = await resolvePatientQR({ qrPayload, hospitalId, facilityId, requestedScopes });
   ```
7. **Failure Point 2 (Origin of 127.0.0.1:8085):** In `Hospital web/backend/services/bplIntegration.js` ([L17-20](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/backend/services/bplIntegration.js#L17-L20) and [L431](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/backend/services/bplIntegration.js#L431)):
   ```javascript
   const BPL_API_BASE_URL =
     process.env.BPL_INTEGRATION_BASE_URL ||
     process.env.BPL_API_URL ||
     'http://127.0.0.1:8085/api/v1';

   const response = await axios.post(`${BPL_API_BASE_URL}/integrations/hospital/qr/resolve`, requestBody, { ... });
   ```
   When BPL backend (:8085) is down or unreachable, Axios throws:
   `connect ECONNREFUSED 127.0.0.1:8085`
8. **Catch & Error Propagation:** `bplIntegration.js` ([L504](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/backend/services/bplIntegration.js#L504)) re-throws the error message. `routes/integration.js` ([L43](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/backend/routes/integration.js#L43)) returns HTTP 500 `{ success: false, error: 'connect ECONNREFUSED 127.0.0.1:8085' }`.
9. **UI Error Masking:** `BPLQRScannerModal.tsx` ([L300-309](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/components/BPLQRScannerModal.tsx#L300-L309)):
   ```typescript
   if (rawError.includes('ECONNREFUSED') || rawError.includes('127.0.0.1') || rawError.includes('8085') ...) {
     errorMsg = 'Hospital server unavailable. Please ensure hospital backend is active or ask patient to switch to an Offline QR.';
   }
   ```

---

## 8. Origin of 127.0.0.1:8085

- **File:** `Hospital web/backend/services/bplIntegration.js`
- **Function:** Top-level constant & `resolvePatientQR()`
- **Lines:** 17–20, 431
- **Caller:** `routes/integration.js` (`POST /api/integration/bpl/resolve-qr`)
- **Callee:** Bharat PulseLink Integration API (`POST /api/v1/integrations/hospital/qr/resolve`)
- **Why it exists:** It is the architectural server-to-server bridge connecting Hospital Backend (:3001) to Bharat PulseLink Core Gateway (:8085) for live online token resolution with zero PHI in the QR.
- **Whether it is correct:** For **online** mode, communicating with the BPL gateway is conceptually correct. However, hardcoding fallback to `http://127.0.0.1:8085/api/v1` in production files (e.g. `render.yaml` [L30](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/render.yaml#L30)) breaks any deployment where BPL backend is hosted on a separate container or domain.
- **Whether it should exist in offline mode:** **ABSOLUTELY NOT.** In offline mode, no network request (to `:8085`, `:3001`, or any remote API) may occur.

---

## 9. Configuration Findings

1. **`render.yaml` Line 30:**
   ```yaml
   - key: BPL_INTEGRATION_BASE_URL
     value: http://127.0.0.1:8085/api/v1
   ```
   Hardcodes `127.0.0.1:8085` in cloud deployment configuration for Render. In a multi-service cloud architecture, `127.0.0.1` inside a container resolves to the container's own localhost, not other services.
2. **`Hospital web/backend/.env` Line 8:**
   ```bash
   BPL_INTEGRATION_BASE_URL=http://127.0.0.1:8085/api/v1
   ```
   Assumes BPL Backend is always running on local development port 8085.
3. **`Hospital web/frontend/src/services/backendApi.ts` Line 7:**
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
   ```
   Correctly points to Hospital Backend, but lacks explicit integration health diagnostics.

---

## 10. State / Hydration Findings

1. **Patient ID Disconnect:**
   In `PatientTriage.tsx` ([L486-497](file:///c:/Users/akash/Downloads/Bharat%20PulseLink/Hospital%20web/frontend/src/components/PatientTriage.tsx#L486-L497)), when `handleBPLPatientLoaded` receives verified patient data, it sets `name`, `age`, `gender`, `phone`, `bloodGroup`, and `history`, but **leaves `formData.patientId` unchanged** (retaining the random placeholder `PID-xxx-xxx`), despite the QR having `patientId` / `abhaId` / `exchangeId`.
2. **Asymmetric Data Formats (Online vs Offline):**
   - Offline flow produces `CanonicalHospitalPatient` via `mapQRPatientToHospitalPatient()`.
   - Online flow produces the raw Fastify response `{ exchangeId, status, authorizedScopes, patient: { fullName, gender, ... } }`.
   - `BPLQRScannerModal.tsx` stores both under `resolvedData.patient`, but with different field names (`primaryPhone` vs `phone`, `chronicConditions` vs `conditions`, `surgeries` vs `lastVisit`).
   - There is no single canonical `normalizePatientExchange()` pipeline unifying both flows.

---

## 11. Security Findings

1. **Credential Exposure in Codebase:**
   - `Hospital web/backend/services/bplIntegration.js` lines 27–142 contains three embedded RSA 2048-bit Private Keys (`hosp_chennai_01`, `hosp_chennai_02`, `hosp_smart_triage_01`).
   - `Hospital web/frontend/src/services/offlineQRResolver.ts` lines 83–170 contains identical embedded RSA Private Keys in client-side code.
   - *Assessment:* For client-side WebCrypto in-browser offline decryption, a scanner kiosk or hospital workstation requires the facility's private key to unwrap envelopes. However, storing multiple facility private keys bundled in frontend assets is a security liability if deployed outside an authorized hospital scanner terminal.
2. **Fail-Closed Verification Integrity:**
   - Replay protection in `offlineQRResolver.ts` is client-side (`localStorage`). If cleared, replayed envelopes might re-decrypt.
   - In `bplIntegration.js` (backend), the offline resolver did not properly match the client-side AES-GCM AAD or Hex encodings, meaning backend offline validation fails closed with decryption errors.
3. **Information Disclosure in Error Handling:**
   - The UI masks `ECONNREFUSED` with `"Hospital server unavailable"`, which confuses clinicians and leads them to believe the hospital backend is down when the hospital backend is actually reachable.

---

## 12. Root Cause

The incident stems from **three compounding root causes**:

1. **Protocol-First Routing Failure in QR Scanner Modal:**
   `BPLQRScannerModal.tsx` only guarded `if (qrType === 'OFFLINE_SECURE_QR')`. Any payload that was not strictly matching this (such as an unclassified QR, malformed payload, or a QR with a scanner prefix) defaulted directly into the online network resolver (`backendApi.resolveBPLQR`), triggering network calls that should never occur.
2. **Fragile Prefix Matching in QR Classifier:**
   `classifyQRPayload()` in `offlineQRResolver.ts` checked only `trimmed.startsWith('bploff://')`. Real hardware scanners, camera decoders, and mobile inputs frequently include URL wrappers or prefixes (e.g. `iconbploff://`, `qr:bploff://`, `https://...bploff://`). Because it did not parse prefixes robustly, valid offline envelopes were classified as `UNKNOWN` and routed straight to `:8085`, causing the reported failure.
3. **Hardcoded Tight Coupling between Hospital Backend (:3001) and BPL Backend (:8085):**
   When an online QR (`bplqr://`) or misrouted QR was scanned, Hospital Backend (:3001) attempted an immediate Axios connection to `http://127.0.0.1:8085`. If the developer or hospital facility ran only the Hospital Web stack without the BPL Fastify backend actively running on port 8085, the request failed with `connect ECONNREFUSED 127.0.0.1:8085`. The frontend caught this technical error and erroneously reported that the *hospital* server was unavailable.

---

## 13. Contributing Causes

1. **Incompatible Offline Cryptographic Logic in Hospital Backend:**
   In `Hospital web/backend/services/bplIntegration.js`, the offline decryption implementation assumed Base64 encoding for `iv` and `tag` and a differing AAD string format, while the mobile Patient App generated Hex-encoded `iv` and `tag`.
2. **Missing Normalization Pipeline:**
   Lack of a unified `normalizePatientExchange()` layer meant the frontend and backend had divergent patient object schemas.
3. **Misleading Error UI Semantics:**
   Generic error mapping prevented operators from understanding whether the issue was an invalid QR, an unreachable BPL gateway, an expired session, or a recipient facility mismatch.

---

## 14. Exact Files Involved

| File Path | Role | Issue |
|---|---|---|
| `Hospital web/frontend/src/components/BPLQRScannerModal.tsx` | QR Scanner UI & Routing | Fails to reject `UNKNOWN` before network; misleading error semantics; lack of auto-hydration |
| `Hospital web/frontend/src/services/offlineQRResolver.ts` | Local WebCrypto Resolver & Classifier | Rigid `startsWith` prefix detection; lacks canonical normalization export |
| `Hospital web/frontend/src/services/backendApi.ts` | Hospital API Client | Missing health probe and structured error mapping |
| `Hospital web/backend/services/bplIntegration.js` | Hospital-to-BPL Integration Bridge | Hardcoded `127.0.0.1:8085`; broken offline IV/Tag encoding (Base64 vs Hex); wrong AAD |
| `Hospital web/backend/routes/integration.js` | Integration Route Controller | Passes raw 500 without granular service distinction |
| `Hospital web/frontend/src/components/PatientTriage.tsx` | Clinical UI & State Hydration | Does not populate `patientId`; uses fragmented patient mapping |
| `render.yaml` | Production Deployment Config | Hardcoded `http://127.0.0.1:8085/api/v1` |

---

## 15. Remediation Plan

1. **Protocol-First Classifier (`classifyQRPayload`):**
   - Extract protocol regardless of scanner prefixes (`bploff://` or `bplqr://` anywhere in input or standard URI format).
   - Classify strictly into `OFFLINE_SECURE_QR`, `ONLINE_SECURE_QR`, or `INVALID_UNSUPPORTED_QR`.
   - Enforce immediate rejection of `INVALID_UNSUPPORTED_QR` with a clear, localized message before any network call.
2. **Zero-Network Offline Path:**
   - Guarantee that `bploff://` executes 100% locally via WebCrypto SubtleCrypto.
   - Assert zero calls to `fetch`, `axios`, `:3001`, or `:8085`.
   - Support `hosp_smart_triage_01`, `fac_emergency_01`, `hosp_chennai_01`, and `hosp_chennai_02`.
3. **Resilient Online Bridge & Error Semantics:**
   - Ensure Hospital Backend handles upstream BPL connectivity gracefully.
   - Replace misleading `"Hospital server unavailable"` with precise layer identification:
     - Online BPL Gateway Down: *"Bharat PulseLink integration service is currently offline or unreachable. Please ask the patient to generate an Offline Secure QR."*
     - Hospital Backend Down: *"Hospital network service is unavailable."*
     - Invalid QR: *"This QR code is not a supported Bharat PulseLink patient QR."*
     - Expired: *"This secure QR has expired. Please generate a new QR."*
     - Replay: *"This QR code was already consumed. Single-use replay protection is active."*
4. **Canonical Normalization Layer (`normalizePatientExchange`):**
   - Create a single, shared canonical patient normalizer that maps both online and offline data into identical schema.
   - Hydrate all fields: `patientId`, `name`, `age`, `gender`, `phone`, `bloodGroup`, `allergies`, `medications`, `chronicConditions`, `lastVisit`, `emergencyContact`.
5. **State Hydration into Patient Triage:**
   - Update `PatientTriage.tsx` to populate `formData.patientId` and all clinical fields cleanly.
6. **Automated Verification:**
   - Add automated unit and integration tests verifying offline zero-network execution and online bridge handling.

---

## 16. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Regressing existing online integration | Low | High | Preserve `POST /integrations/hospital/qr/resolve` contract on BPL backend; verify with acceptance suite |
| Inadvertent network calls during offline resolution | Medium | Critical | Mock/intercept `fetch` & `XMLHttpRequest` in automated tests to prove 0 network requests |
| Cryptographic tag mismatches across platforms | Medium | High | Standardize IV (12-byte hex), Tag (16-byte hex), and AAD string (`${sid}:${pid}:${hid}:${ts}`) across React Native, Node.js, and Browser WebCrypto |
| Unhandled camera scanner prefixes | Low | Medium | Normalize payload using regex extraction for `bploff://[^\s]+` and `bplqr://[^\s]+` |
