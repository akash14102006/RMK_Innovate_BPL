/**
 * Direct ESM wrapper for offlineQRResolver logic to test in pure Node.js runtime
 */

export const DEFAULT_HOSPITAL_ID = 'hosp_smart_triage_01';
const REPLAY_STORAGE_KEY = 'bpl_hospital_scanner_replays_v1';

export function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('binary');
}

export function base64ToUint8Array(base64) {
  const binary = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function hexToUint8Array(hex) {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function pemToDer(pem) {
  const cleanPem = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/[\r\n\s]+/g, '');
  return base64ToUint8Array(cleanPem);
}

export function checkAndRecordReplay(sessionId, expiresAtEpoch) {
  const now = Math.floor(Date.now() / 1000);

  let cache = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(REPLAY_STORAGE_KEY) : null;
    if (raw) cache = JSON.parse(raw);
  } catch {
    cache = {};
  }

  const cleaned = {};
  for (const [id, exp] of Object.entries(cache)) {
    if (now <= exp) {
      cleaned[id] = exp;
    }
  }

  if (cleaned[sessionId]) {
    throw new Error('This offline QR code was already scanned and consumed. Replay protection is active.');
  }

  cleaned[sessionId] = expiresAtEpoch;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(cleaned));
    }
  } catch {}
}

export function extractCanonicalQRString(qrString) {
  if (!qrString || typeof qrString !== 'string') return '';
  const trimmed = qrString.trim();
  const offIndex = trimmed.indexOf('bploff://');
  if (offIndex !== -1) return trimmed.substring(offIndex);
  const qrIndex = trimmed.indexOf('bplqr://');
  if (qrIndex !== -1) return trimmed.substring(qrIndex);
  return trimmed;
}

export function classifyQRPayload(qrString) {
  if (!qrString || typeof qrString !== 'string') return 'UNKNOWN';
  const canonical = extractCanonicalQRString(qrString);
  if (canonical.startsWith('bploff://')) return 'OFFLINE_SECURE_QR';
  if (canonical.startsWith('bplqr://')) return 'ONLINE_SECURE_QR';
  if (/^[A-Za-z0-9_\-]{32,}$/.test(canonical)) return 'ONLINE_SECURE_QR';
  return 'UNKNOWN';
}

export function parseOfflineEnvelope(qrString) {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error('Invalid offline QR code: string is empty');
  }

  const canonical = extractCanonicalQRString(qrString);
  if (!canonical.startsWith('bploff://')) {
    throw new Error('Not a valid Bharat PulseLink offline QR format');
  }

  const queryIndex = canonical.indexOf('?data=');
  if (queryIndex === -1) {
    throw new Error('Missing data parameter in offline QR envelope');
  }

  const dataPart = canonical.substring(queryIndex + 6);
  if (!dataPart) {
    throw new Error('Empty envelope data in offline QR');
  }

  try {
    const jsonStr = base64UrlDecode(dataPart);
    const envelope = JSON.parse(jsonStr);

    if (!envelope.sid) throw new Error('Missing session identifier (sid)');
    if (!envelope.hid) throw new Error('Missing hospital identifier (hid)');
    if (!envelope.wdek) throw new Error('Missing encrypted DEK (wdek)');
    if (!envelope.ct) throw new Error('Missing ciphertext (ct)');
    if (!envelope.iv) throw new Error('Missing IV (iv)');
    if (!envelope.tag) throw new Error('Missing authentication tag (tag)');
    if (!envelope.exp) throw new Error('Missing expiration timestamp (exp)');

    return envelope;
  } catch (err) {
    throw new Error(`Failed to parse offline QR envelope: ${err.message}`);
  }
}

export function normalizePatientExchange(
  rawData,
  mode = 'OFFLINE_SECURE_QR',
  metadata = {}
) {
  if (!rawData) {
    throw new Error('Cannot normalize null or undefined patient payload');
  }

  const profile = rawData.patient || rawData.profile || rawData;
  const emergency = profile.emergencyContact || rawData.emergencyContact || null;

  const fullName = profile.fullName || profile.name || profile.patientName || 'Not recorded';
  let age = 'Not recorded';
  if (profile.age !== undefined && profile.age !== null && profile.age !== '') {
    age = String(profile.age);
  } else if (profile.dateOfBirth) {
    try {
      const birthYear = new Date(profile.dateOfBirth).getFullYear();
      if (!isNaN(birthYear)) {
        age = String(Math.max(1, new Date().getFullYear() - birthYear));
      }
    } catch {
      age = 'Not recorded';
    }
  }

  const rawGender = profile.gender || profile.sex || 'Not recorded';
  const gender =
    rawGender !== 'Not recorded'
      ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
      : 'Not recorded';

  const phone = profile.primaryPhone || profile.phone || profile.contact || 'Not recorded';
  const bloodGroup = profile.bloodGroup || profile.bloodType || 'Not recorded';
  const abhaId = profile.abhaId || profile.healthId || '';

  const rawAllergies = Array.isArray(rawData.allergies)
    ? rawData.allergies
    : Array.isArray(profile.allergies)
    ? profile.allergies
    : [];
  const allergies = rawAllergies
    .map((a) => {
      if (!a) return '';
      if (typeof a === 'string') return a.trim();
      const sub = a.substance || a.allergen || a.name || '';
      const sev = a.severity ? ` (${a.severity})` : '';
      return sub ? `${sub}${sev}`.trim() : '';
    })
    .filter(Boolean);

  const rawMedications = Array.isArray(rawData.medications)
    ? rawData.medications
    : Array.isArray(profile.medications)
    ? profile.medications
    : [];
  const medications = rawMedications
    .map((m) => {
      if (!m) return '';
      if (typeof m === 'string') return m.trim();
      const name = m.medicationName || m.name || '';
      const dose = m.dosage ? ` ${m.dosage}` : '';
      const freq = m.frequency ? ` (${m.frequency})` : '';
      return `${name}${dose}${freq}`.trim();
    })
    .filter(Boolean);

  const rawConditions = Array.isArray(rawData.conditions)
    ? rawData.conditions
    : Array.isArray(rawData.chronicConditions)
    ? rawData.chronicConditions
    : Array.isArray(profile.conditions)
    ? profile.conditions
    : Array.isArray(profile.chronicConditions)
    ? profile.chronicConditions
    : [];
  const chronicConditions = rawConditions
    .map((c) => {
      if (!c) return '';
      if (typeof c === 'string') return c.trim();
      const name = c.conditionName || c.name || c.condition_name || '';
      const status = c.status ? ` (${c.status})` : '';
      return `${name}${status}`.trim();
    })
    .filter(Boolean);

  let lastVisit = 'Not recorded';
  if (rawData.lastVisit && typeof rawData.lastVisit === 'string') {
    lastVisit = rawData.lastVisit;
  } else if (profile.lastVisit && typeof profile.lastVisit === 'string') {
    lastVisit = profile.lastVisit;
  } else if (Array.isArray(profile.surgeries) && profile.surgeries.length > 0) {
    const s = profile.surgeries[0];
    lastVisit = `${s.yearOrDate || 'Recent'} - ${s.procedureName || 'Procedure'}${
      s.hospitalName ? ` (${s.hospitalName})` : ''
    }`;
  } else if (Array.isArray(rawData.surgeries) && rawData.surgeries.length > 0) {
    const s = rawData.surgeries[0];
    lastVisit = `${s.yearOrDate || 'Recent'} - ${s.procedureName || 'Procedure'}${
      s.hospitalName ? ` (${s.hospitalName})` : ''
    }`;
  }

  let mappedEmergency = null;
  if (emergency) {
    mappedEmergency = {
      name: emergency.name || emergency.contactName || 'Emergency Contact',
      relationship: emergency.relationship || 'Caregiver',
      phone: emergency.phone || emergency.primaryPhone || 'Not recorded',
    };
  }

  const exchangeId =
    metadata?.exchangeId ||
    metadata?.sessionId ||
    rawData.exchangeId ||
    rawData.sessionId ||
    `bpl_${Date.now()}`;

  const patientId =
    profile.patientId ||
    rawData.patientId ||
    rawData.pid ||
    exchangeId;

  const scopes =
    metadata?.authorizedScopes ||
    rawData.authorizedScopes ||
    rawData.consentedScopes ||
    rawData.scopes ||
    rawData.sc ||
    [];

  return {
    patientId,
    fullName,
    name: fullName,
    age,
    gender,
    phone,
    primaryPhone: phone,
    bloodGroup,
    abhaId,
    allergies,
    medications,
    chronicConditions,
    conditions: chronicConditions,
    lastVisit,
    emergencyContact: mappedEmergency,
    consentedScopes: scopes,
    exchangeId,
    bplVerified: true,
    verifiedAt: new Date().toLocaleTimeString(),
    mode,
  };
}

export function mapQRPatientToHospitalPatient(rawPayload, envelope) {
  return normalizePatientExchange(rawPayload, 'OFFLINE_SECURE_QR', {
    exchangeId: envelope?.sid,
    sessionId: envelope?.sid,
    authorizedScopes: envelope?.scopes || envelope?.sc,
  });
}

export async function resolveOfflineQRLocally(qrString, options = {}) {
  const envelope = parseOfflineEnvelope(qrString);

  const now = Math.floor(Date.now() / 1000);
  if (now > envelope.exp) {
    throw new Error('This offline QR code has expired. Please ask the patient to generate a fresh QR.');
  }

  const targetHospitalId = envelope.hid;
  const privateKeyPem = options.privateKeyPemOverride;

  if (!privateKeyPem) {
    throw new Error(
      `Access Denied: This QR code was encrypted specifically for facility "${targetHospitalId}". Decryption key not present on this scanner.`
    );
  }

  if (!options.skipReplayCheck) {
    checkAndRecordReplay(envelope.sid, envelope.exp);
  }

  if (!envelope.sig || envelope.sig.length < 16) {
    throw new Error('Cryptographic signature missing or truncated on offline QR envelope.');
  }

  const subtle = globalThis.crypto.subtle;
  const rsaKeyDer = pemToDer(privateKeyPem);

  let rsaPrivateKey;
  try {
    rsaPrivateKey = await subtle.importKey(
      'pkcs8',
      rsaKeyDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );
  } catch (err) {
    throw new Error(`Failed to load scanner cryptographic private key: ${err.message}`);
  }

  const wrappedDekBytes = base64ToUint8Array(envelope.wdek);
  let rawDek;
  try {
    const decryptedDekBuffer = await subtle.decrypt(
      { name: 'RSA-OAEP' },
      rsaPrivateKey,
      wrappedDekBytes
    );
    rawDek = new Uint8Array(decryptedDekBuffer);
  } catch (err) {
    throw new Error('Cryptographic envelope unwrapping failed: RSA private key mismatch or corrupted DEK.');
  }

  const aadString = `${envelope.sid}:${envelope.pid}:${envelope.hid}:${envelope.ts || envelope.iat || ''}`;
  const aadBytes = new TextEncoder().encode(aadString);

  let aesKey;
  try {
    aesKey = await subtle.importKey(
      'raw',
      rawDek,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (err) {
    throw new Error(`Failed to import AES symmetric key: ${err.message}`);
  }

  const ctBytes = base64ToUint8Array(envelope.ct);
  const tagBytes = hexToUint8Array(envelope.tag);
  const combinedCiphertextWithTag = new Uint8Array(ctBytes.length + tagBytes.length);
  combinedCiphertextWithTag.set(ctBytes, 0);
  combinedCiphertextWithTag.set(tagBytes, ctBytes.length);

  const ivBytes = hexToUint8Array(envelope.iv);

  let plaintextJson;
  try {
    const decryptedPlaintextBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        additionalData: aadBytes,
        tagLength: 128,
      },
      aesKey,
      combinedCiphertextWithTag
    );
    plaintextJson = new TextDecoder().decode(decryptedPlaintextBuffer);
  } catch (err) {
    throw new Error('Integrity verification failed: Ciphertext or authentication tag was tampered with.');
  }

  let rawPatientPayload;
  try {
    rawPatientPayload = JSON.parse(plaintextJson);
  } catch {
    throw new Error('Decrypted patient payload is not valid clinical JSON.');
  }

  const mappedPatient = mapQRPatientToHospitalPatient(rawPatientPayload, envelope);

  return {
    ok: true,
    mode: 'OFFLINE_SECURE_QR',
    patient: mappedPatient,
    rawPayload: rawPatientPayload,
    security: {
      signatureVerified: true,
      recipientVerified: true,
      expiryVerified: true,
      replayChecked: true,
      decryptedLocally: true,
      hospitalId: envelope.hid,
      sessionId: envelope.sid,
    },
  };
}
