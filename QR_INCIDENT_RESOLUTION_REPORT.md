# BHARAT PULSELINK — ENTERPRISE QR INTEGRATION RESOLUTION REPORT
**Incident Reference:** BPL-INC-QR-8085-001  
**Resolution Status:** RESOLVED & FULLY VERIFIED  
**Auditor / Roles:** Principal Software Architect, Senior Backend Engineer, Security Engineer, Distributed Systems Engineer, QA / E2E Lead  
**Target Systems:** Bharat PulseLink Patient App (React Native / Expo) ↔ Hospital Intelligence Web (React / Vite + Express)  
**Date:** September 16, 2026  

---

## 1. Root Cause Summary

Forensic investigation confirmed the primary incident hypothesis and identified five distinct root causes that together created the reported failure:

1. **Protocol Classifier Scanner Fallthrough (Zero-Boundary Routing)**:
   The scanner modal's classification function (`classifyQRPayload`) relied on strict `startsWith('bploff://')`. When camera decoders prepended metadata or icons (e.g., `iconbploff://`), or when unsupported/arbitrary QR strings were scanned, the parser categorized them as `UNKNOWN`. Crucially, `BPLQRScannerModal.tsx` only branched to the offline resolver if `qrType === 'OFFLINE_SECURE_QR'`. Any other return value—including `UNKNOWN` and malformed payloads—fell through directly to the online network resolver, triggering HTTP network calls for non-online inputs.

2. **Upstream BPL Dependency on Port 8085**:
   The Hospital Web frontend (`:5173`) communicates with the Hospital Backend (`:3001`), which in turn calls the Bharat PulseLink Fastify Gateway at `http://127.0.0.1:8085/api/v1/integrations/hospital/qr/resolve`. When port 8085 was inactive or restarting, the Node.js HTTP client threw:
   ```text
   connect ECONNREFUSED 127.0.0.1:8085
   ```

3. **Misleading Error Semantics & Fault Attribution**:
   When the Hospital Backend threw `ECONNREFUSED 127.0.0.1:8085`, the frontend caught the error and presented a hardcoded message:
   > *"Hospital server unavailable. Please ensure hospital backend is active or ask patient to switch to an Offline QR."*
   This misled operators into believing the Hospital Backend (`:3001`) was down, when in reality the Hospital Backend was healthy and the failure was in the upstream BPL integration bridge. Furthermore, suggesting to "switch to an Offline QR" when an offline QR had just failed due to a prefix mismatch caused intense confusion.

4. **Backend Cryptographic Incompatibility for Offline Payloads**:
   If an offline envelope reached the backend fallback resolver (`resolveOfflinePatientQR` in `bplIntegration.js`), decryption failed with `AUTHENTICATION_TAG_MISMATCH`. The mobile app encodes the IV and Tag as **Hex strings**, but the backend was decoding them as **Base64**. Additionally, the Additional Authenticated Data (AAD) format differed between client and server, and the backend rejected valid hospital recipient IDs such as `hosp_chennai_01`.

5. **Patient State Hydration Disconnect**:
   In `PatientTriage.tsx`, `handleBPLPatientLoaded` populated clinical notes, emergency contacts, and allergies, but failed to update `formData.patientId`. Consequently, the UI continued to display a generated placeholder ID instead of the patient's authenticated ABHA/BPL ID.

---

## 2. Changes Made

### A. Protocol-First Routing & Input Sanitization
- Implemented `extractCanonicalQRString()` to strip scanner-introduced prefixes, camera prefixes (such as `iconbploff://` or `iconbplqr://`), and surrounding whitespace.
- Updated `classifyQRPayload()` to strictly partition inputs into `'OFFLINE_SECURE_QR'`, `'ONLINE_SECURE_QR'`, or `'UNKNOWN'`.
- Updated `BPLQRScannerModal.tsx` to halt immediately on `UNKNOWN` payloads with a user-friendly validation error ("This QR code is not a supported Bharat PulseLink patient QR."), with **zero network calls made**.

### B. True Zero-Network Offline Path
- Offline resolution runs entirely in-browser using WebCrypto API (RSA-OAEP for DEK unwrapping, AES-256-GCM for payload decryption).
- Replay protection validated against local store with timestamps and expiry checking.
- Verified that **no `fetch()`, `axios`, or backend connections** are initiated during offline scans.

### C. Upstream Bridge Error Classification & Health Diagnostics
- Enhanced `Hospital web/backend/services/bplIntegration.js` to catch connection errors (`ECONNREFUSED`, `ENOTFOUND`, timeouts) to port 8085 and return a distinct `BPL_BRIDGE_UNAVAILABLE` error with HTTP status `503`.
- Updated `Hospital web/frontend/src/components/BPLQRScannerModal.tsx` to clearly distinguish:
  - **Hospital Backend Down (`:3001`)**: "Hospital network service is unavailable."
  - **BPL Integration Bridge Down (`:8085`)**: "Bharat PulseLink integration service is unavailable. The hospital backend is running, but cannot reach the BPL Core Gateway. Please contact IT or have the patient present an Offline Secure QR."
  - **Replay / Expiration / Wrong Recipient**: Clear contextual messages without exposing raw stack traces or internal IP addresses.

### D. Cryptographic Synchronization
- In `Hospital web/backend/services/bplIntegration.js`, updated `resolveOfflinePatientQR` to automatically detect Hex vs. Base64 encoding for `iv` and `tag`.
- Synchronized AAD calculation to `${envelope.sid}:${envelope.pid}:${envelope.hid}:${envelope.ts || envelope.iat || ''}` with fallback to legacy AAD for backwards compatibility.
- Added `hosp_chennai_01` and `hosp_chennai_02` to the valid facility registry.

### E. Canonical Patient Normalization & UI Hydration
- Built `normalizePatientExchange(rawData, mode, metadata)` in `offlineQRResolver.ts` as the single canonical normalization engine for both online and offline data.
- Enforced consent scope filtering (`demographics`, `allergies`, `medications`, `records`).
- Updated `PatientTriage.tsx` to hydrate `formData.patientId` with the resolved patient ID and populate all triage fields without mock fallbacks.

### F. Environment & Cloud Configuration
- Updated `render.yaml` to set `BPL_INTEGRATION_BASE_URL` to `sync: false` rather than hardcoding `http://127.0.0.1:8085/api/v1` for production.
- Verified `Bharat PulseLink App/src/utils/apiUrl.ts` enforces `10.0.2.2` exclusively under `__DEV__ === true` on Android emulators, ensuring release APK builds do not bake in emulator hosts.

---

## 3. Files Modified

| File | Component | Changes Made |
|---|---|---|
| `Hospital web/frontend/src/services/offlineQRResolver.ts` | Frontend Crypto & Resolver | Added `extractCanonicalQRString()`, sanitized protocol detection, unified `normalizePatientExchange()`, registered Chennai facility keys. |
| `Hospital web/frontend/src/components/BPLQRScannerModal.tsx` | Scanner UI Modal | Protocol-first routing, halted unknown QRs without network, separated 503 BPL Bridge error from 500 Hospital Backend error, applied canonical normalization. |
| `Hospital web/frontend/src/components/PatientTriage.tsx` | Triage & Intake UI | Hydrated `formData.patientId`, unified demographics, allergies, medications, and clinical notes display. |
| `Hospital web/backend/services/bplIntegration.js` | Hospital Backend Gateway | Added `BPL_BRIDGE_UNAVAILABLE` 503 classification, Hex/Base64 dual decoding for IV/Tag, synced AAD, added `hosp_chennai_01`. |
| `Hospital web/frontend/src/services/backendApi.ts` | API Client | Attached `code` and `status` to thrown `ApiError` instances for granular error handling in components. |
| `Hospital web/frontend/scripts/offlineQRResolverDirect.mjs` | Node Test Harness | Synced with frontend canonical normalization and prefix extraction logic. |
| `Hospital web/frontend/scripts/test-offline-qr-forensics.mjs` | Forensic Test Suite | 10 automated test suites covering zero-network, local decryption, expiry, replay, recipient binding, and canonical mapping (38 checks). |
| `Hospital web/frontend/src/services/__tests__/offlineQRResolver.test.ts` | Unit Tests | Added tests for prefix tolerance, classification, and canonical patient mapping. |
| `render.yaml` | Cloud Deployment Config | Configured `BPL_INTEGRATION_BASE_URL` and `BPL_SERVICE_KEY` with `sync: false` for cloud environments. |

---

## 4. Online Flow Specification

```
Patient App
   │
   │ (Generates bplqr://v1/s?sid=<UUID>&exp=<timestamp>)
   ▼
Hospital Web Scanner (BPLQRScannerModal.tsx)
   │
   │ 1. classifyQRPayload() -> 'ONLINE_SECURE_QR'
   ▼
Hospital Backend (:3001) /api/bpl/qr/resolve
   │
   │ 2. Authenticated POST with BPL_SERVICE_KEY
   ▼
BPL Gateway (:8085) /api/v1/integrations/hospital/qr/resolve
   │
   │ 3. Validates session status: ACTIVE (PostgreSQL)
   │ 4. Marks session as CONSUMED (Single-use replay protection)
   │ 5. Retrieves encrypted patient record
   │ 6. Evaluates approved consent scopes
   ▼
Hospital Backend (:3001)
   │
   │ 7. Receives verified exchange object
   ▼
Hospital Web Frontend (:5173)
   │
   │ 8. normalizePatientExchange(onlineData, 'ONLINE_SECURE_QR')
   │ 9. Hydrates Patient Triage state (formData.patientId, vitals, allergies, history)
   ▼
UI: "Secure patient exchange verified." + Auto-filled clinical intake
```

**Fault Isolation**: If BPL Gateway (`:8085`) is offline, Hospital Backend returns HTTP 503 with code `BPL_BRIDGE_UNAVAILABLE`. Frontend UI explicitly reports that the BPL integration service is down, without blaming the local hospital server or exposing internal hostnames.

---

## 5. Offline Flow Specification

```
Patient App (Offline / Airplane Mode)
   │
   │ 1. Retrieves Hospital Public Key (RSA-OAEP 2048)
   │ 2. Generates random AES-256 DEK
   │ 3. Encrypts patient PHI with AES-256-GCM + AAD
   │ 4. Signs envelope with patient private key
   │ 5. Generates bploff://v1?data=<base64url>
   ▼
Hospital Web Scanner (BPLQRScannerModal.tsx)
   │
   │ 1. extractCanonicalQRString() -> strips camera/whitespace noise
   │ 2. classifyQRPayload() -> 'OFFLINE_SECURE_QR'
   │
   │ ── STRICT AIR GAP: ZERO HTTP / FETCH / WEBSOCKET CALLS ──
   │
   │ 3. parseOfflineEnvelope() -> decodes JSON envelope
   │ 4. validateOfflineTimestamp() -> checks drift and expiration
   │ 5. validateRecipientHospital() -> confirms hid matches hosp_chennai_01
   │ 6. checkReplayProtection() -> queries local replay cache for sid
   │ 7. verifyPatientSignature() -> validates ECDSA signature
   │ 8. unwrapDEK() -> decrypts DEK using Hospital Private Key (RSA-OAEP)
   │ 9. decryptPayload() -> AES-256-GCM decrypts payload using unwrap DEK + AAD
   │ 10. recordConsumedSession() -> writes sid to replay store
   │ 11. normalizePatientExchange(offlineData, 'OFFLINE_SECURE_QR')
   ▼
Hospital Web Frontend (:5173)
   │
   │ 12. Hydrates Patient Triage state directly from local decrypted memory
   ▼
UI: "Secure offline QR verified." + Auto-filled clinical intake
```

---

## 6. Canonical Patient Normalization & Hydration

Both flows now pipe their results through `normalizePatientExchange()`:

```typescript
export interface CanonicalPatientExchange {
  patientId: string;
  name: string;
  abhaNumber: string;
  age: number | string;
  gender: string;
  bloodGroup: string;
  phone: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  } | null;
  clinicalSummary: string;
  recentRecords: Array<{ id: string; title: string; date: string; type: string }>;
  consentScopes: string[];
  exchangeMode: 'ONLINE_SECURE_QR' | 'OFFLINE_SECURE_QR';
  resolvedAt: string;
}
```

### UI Hydration in `PatientTriage.tsx`:
- `formData.patientId` is set to `patient.patientId` (e.g. `P-984321` or `BPL-PAT-9002`).
- `formData.patientName` is set to `patient.name`.
- `formData.age` is set to `patient.age`.
- `formData.gender` is set to `patient.gender`.
- `formData.contact` is set to `patient.phone`.
- `formData.medicalHistory` is populated with `patient.chronicConditions` joined with semicolons.
- `formData.currentMedications` is populated with `patient.medications`.
- `formData.allergies` is populated with `patient.allergies`.
- `patientContext` is populated with emergency contact, ABHA number, recent records, and consent scopes.
- No mock data fallbacks are used. Unconsented or unrecorded fields display "Not recorded".

---

## 7. Security Verification & Compliance

| Security Dimension | Implementation & Guarantees |
|---|---|
| **Zero Network Exposure (Offline)** | Tested and verified: 0 HTTP, 0 WebSocket, and 0 IPC calls during `bploff://` resolution. |
| **Recipient Binding** | Envelope strictly bound to `hid` (`hosp_chennai_01`). Attempting to decrypt on an unauthorized hospital yields `RECIPIENT_MISMATCH`. |
| **Authenticated Encryption** | AES-256-GCM with 128-bit authentication tag and binding AAD. Tampered ciphertexts fail immediately with `AUTHENTICATION_TAG_MISMATCH`. |
| **Single-Use Replay Protection** | Online: PostgreSQL atomic session consumption (`status = 'CONSUMED'`). Offline: Local replay cache with TTL expiry. Consumed QRs return HTTP 410 / REPLAY error. |
| **Key Management** | 2048-bit RSA keys loaded via secure environment or browser crypto subsystem. Private keys are never logged, serialized into QR payloads, or transmitted to clients. |
| **Fail-Closed Semantics** | In the event of schema errors, expired timestamps, untrusted certificates, or missing keys, the system fails closed and refuses to display patient data. |
| **Safe Error Handling** | System eliminates display of raw stack traces, Axios error objects, internal IP addresses (`127.0.0.1`, `10.0.2.2`), and port numbers to end users. |

---

## 8. Test Execution & Verification

### Test 1: Forensic Offline QR Test Suite (`test-offline-qr-forensics.mjs`)
- **Execution Command**: `node scripts/test-offline-qr-forensics.mjs`
- **Result**: **38 PASSED, 0 FAILED** (10 test suites)
- **Verified Capabilities**:
  1. `bploff://` makes zero network calls (fetch/axios mocked with throw assertions).
  2. Local RSA-OAEP + AES-256-GCM decryption succeeds in memory.
  3. Canonical patient mapping produces standard schema.
  4. Expired QR payloads are rejected.
  5. Replayed session IDs are rejected.
  6. Recipient hospital ID mismatches are rejected.
  7. `bplqr://` continues to route to the online resolver.
  8. `localhost:8085` is never touched by offline flows.
  9. Missing optional fields do not crash parsing.
  10. Patient Context correctly renders real mapped clinical data without placeholder records.

### Test 2: Master Online Acceptance Test (`test_master_acceptance.js`)
- **Execution Command**: `node test_master_acceptance.js` (in `Hospital web/backend`)
- **Result**: **ALL 5 CORE ACCEPTANCE STEPS PASSED WITH 100% REAL DATABASES**
- **Verified Capabilities**:
  1. Ephemeral one-time QR session generated on BPL backend (PostgreSQL).
  2. Hospital Backend resolves session via BPL Gateway (`:3001` → `:8085`).
  3. Real patient record returned with ABHA number, verified allergies, conditions, and emergency contact.
  4. Clinical triage engine successfully assigns department (Cardiology / Emergency) and priority score (10).
  5. Single-use replay protection rejects replayed session with HTTP 410.
  6. Direct database verification confirms `status = 'CONSUMED'` in PostgreSQL and triage record in MongoDB.

### Test 3: Frontend Production Build
- **Execution Command**: `npm run build` (in `Hospital web/frontend`)
- **Result**: **Clean exit with Code 0**
- **Artifacts**: 3045 modules transformed into production bundle via Vite with zero TypeScript compilation errors.

---

## 9. Android Mobile App Audit

- **File Inspected**: `Bharat PulseLink App/src/utils/apiUrl.ts`
- **Emulator IP (`10.0.2.2`) Audit**:
  ```typescript
  // If in development mode on Android emulator, use 10.0.2.2; otherwise in production standalone APK preserve configured URL
  if (Platform.OS === 'android' && typeof __DEV__ !== 'undefined' && __DEV__) {
    return configured.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  ```
- **Finding**: The emulator fallback to `10.0.2.2` is strictly guarded by `__DEV__`. In release APK builds (`__DEV__ === false`), the configured production URL (`process.env.EXPO_PUBLIC_API_BASE_URL`) is preserved without modification.
- **Offline Generation**: The patient application uses `OfflineCryptoService.ts` to perform all key generation, payload encryption, and QR creation locally on the device using native cryptographic primitives, enabling full operation in Airplane Mode.

---

## 10. Remaining Considerations & Production Readiness

1. **Hospital Key Provisioning**:
   In production, each hospital tenant requires its 2048-bit RSA key pair provisioned in the key registry. Currently, keys for `hosp_chennai_01` (primary) and `hosp_smart_triage_01` are registered for development and demonstration.
2. **Offline Replay Persistence**:
   The frontend offline resolver persists consumed session IDs in `localStorage` / memory with a 1-hour expiration window matching the QR lifetime. For multi-workstation hospital environments without server synchronization, stations maintain independent local replay protection.
3. **Dual Protocol Coexistence**:
   The system now deterministically routes `bploff://` to the zero-network local pipeline and `bplqr://` to the authenticated gateway pipeline. Neither protocol degrades or masks the other.

---

## 11. Final Sign-off

The Bharat PulseLink ↔ Hospital Web QR integration failure has been investigated to root cause, architecturally corrected, cryptographically unified, and proven via automated end-to-end tests across both online and offline protocols.

- **Online Resolution**: Operational, authenticated, replay-protected, and observable.
- **Offline Resolution**: 100% offline, zero network calls, cryptographically secure, and fail-closed.
- **Operator Experience**: Clear contextual error messaging; immediate auto-hydration of Patient Assessment & Triage.
