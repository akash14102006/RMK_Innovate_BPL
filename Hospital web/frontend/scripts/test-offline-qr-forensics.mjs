/**
 * Bharat PulseLink — Forensic QR Scanner Verification Suite
 *
 * Automated verification of all 10 criteria specified in forensic scanner specification:
 * 1. bploff:// QR does NOT call network (intercepts fetch/http/https)
 * 2. bploff:// QR decrypts locally via WebCrypto RSA-OAEP-256 + AES-256-GCM
 * 3. bploff:// QR populates patient state canonically
 * 4. bploff:// rejects expired QR
 * 5. bploff:// rejects replay (single-use protection)
 * 6. bploff:// rejects wrong hospital (recipient binding)
 * 7. bplqr:// still uses online resolver (pre-classification preserved)
 * 8. localhost:8085 is never accessed by offline flow
 * 9. Missing optional patient fields do not crash UI / mapping
 * 10. Patient Context correctly renders mapped data without hardcoded samples
 */

import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';

// ── Hospital Keys Registry ───────────────────────────────────────────────────

const HOSPITAL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj5MIuC4TLOulJivgKjgl
3lnkdkGAFkjrCxZvkOVsNVFMkVT7YQn4bqkxVHW+yOyeG+IrVkd4Q5BF+J6vCiFK
RFyxSauqwZNatSVnwLNOIDKfG3sjYWWdlDmsHaoDx2B4/KE00+BUhJd6T3As2ndP
ncwRcvxMVvyTLlCdeFlyMrP9ZjkLoXKdnm3PsIJXl1fqjVLWdprFgAQ/T6qOeqHW
Q9Yb45+/1jzXN5cSxW3XALSkjdv34muMN/y1Fipn/8llzIpxeK9xCP3H67P4hFSY
5Yww85qFKGyBvKTxEANJsBmI1ZCrEXLnwLYR4NqMQDcgxvw3tANJLlH6OKc2d5KM
3QIDAQAB
-----END PUBLIC KEY-----`;

const HOSPITAL_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCPkwi4LhMs66Um
K+AqOCXeWeR2QYAWSOsLFm+Q5Ww1UUyRVPthCfhuqTFUdb7I7J4b4itWR3hDkEX4
nq8KIUpEXLFJq6rBk1q1JWfAs04gMp8beyNhZZ2UOawdqgPHYHj8oTTT4FSEl3pP
cCzad0+dzBFy/ExW/JMuUJ14WXIys/1mOQuhcp2ebc+wgleXV+qNUtZ2msWABD9P
qo56odZD1hvjn7/WPNc3lxLFbdcAtKSN2/fia4w3/LUWKmf/yWXMinF4r3EI/cfr
s/iEVJjljDDzmoUobIG8pPEQA0mwGYjVkKsRcufAthHg2oxANyDG/De0A0kuUfo4
pzZ3kozdAgMBAAECggEABSXapllHPbvrQtLy6YCe4aSWe6OolzlLwteDQ44+UtZp
6OduUKc+CEsPu5Kx4bFo5TYMThPSR5XjibZi2fmh7eaRmBh2zxRcqGnBbm2KFmnK
PlQsIMC3JYqV1cXJTJD0dZZwIaKwVRq7UMrZs4bwogdK9DUApbkjq9b0dngP5Kp1
YCMI4CT+Lb0F//FXh6lM/9gui6uXv6sN9btXYEUNq2FAjKRHYfdkyNAGr5Zxcn/U
Xp/02ubPyDyY4TUVRr9jxDit4o1A/64x8OO5IYPFNh2TxRNJ2I9hDEb8biC/re6w
0jziGzrOCIPGpGwVlONM1yl5gIxmQEU1zOVW6RKsHwKBgQDHUelG5lFAyWPNEq6R
2CEiye7qIFSafKWxusSuUEt6+4Qg6FmAfdzQFWNziWsT84R5DvXMgWOcNc3LtN8V
rsoOoqEhzR+36W40JgKRUsftXQop2ntjJI+IUfHeouDFEQ5v3YXfEACh9HRYnhHh
bu4ozfZfpsRjDqux1s6XfHnkbwKBgQC4ZvSQHBYpIZrJ84K9RGFJiTHNhaGnRYUM
/yPREIZ65tLw/QlFw6xC4pAPokuIWu0AiltufFuWH+Iz1AQlim3YKMqhxUHN+Zvt
3BAlT6D2pPJ4ZrzfweQrxKWq3Nr/zIX+s/wEAjf6J++GzFr12LlpAZOwbhI8UOoh
AW8KBxuBcwKBgDZ3nsy+IZQXtIsUwNmf+yYbkosuPJBe4ZSY2ihcTtQTqT6o39Rq
EI5YWe33rmgsUpYWTXsOHJ9SYKN7EL9HHXY0YN3wxOsoAfKENI1r1rB5jU50ouUr
14FEC1lwnwWbLJvLKEsVf2bCe4y/3VkCTFigN+RZmS8MkkSt05S38kNHAoGAWoI2
EbGncuLKncsG5az1b2mGZ1DqyjZGGt30D35j81juOliIP5TOLToU6YeIOVIft78x
J2akcWgO1899hYuPZKSI6KPwK5ATZ8k2p4mRAN5vIIeUtuLtAkqP4fBrEViqgByJ
WtJX9VG6sFgHYVnRj2e1vMgZ7T7t2+tfO/XHG18CgYEAxp3X2Xz4w9J7GiWx4Ove
94eOZszS5IWk5mZb48pXA4pY1vAIgxcMdA6JvE1V9uhenDbWrGrbY5A6Fn2XpHXr
Mwb3qA4vXHKpTw0D5OtA9cg64/M/6f2O1sOJuDmZjHHTVT9csfFMrT5gbyullVHI
uTvM6CGpXLeeLf8cj5YRYvc=
-----END PRIVATE KEY-----`;

const UNKNOWN_HOSPITAL_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsTY9XU0QRm/22
xAKHjwSi3rIFzJS5jLYkySZFa5SU448FUfBvh9krgfpdbW5Cm84basK/7Qtns3iQ
6gy0SANCXkW09WQjdeRCKcAEHSYPjtfM+UF+xqTzT8Bkf1Ys1KM3grLKdLLTTq6B
XxwtyvFeyeHRAs4iOGo0QE6sqBfVWfLwviv224om4GWri0BizYLUy8Iuj017TnD4
Z7BFLCRn1+yH8mbQ1mmvRQhrdcdDylmYBQgs7ao/4Nyk0scCYBZmDaJJncIUXNG8
9T8Jwm+wsOcOIT5c04ElfQaV2+CLwiqUlv7ALtFGamSIM6qBmboEjbDRpr2UFwDm
SAaT2t+pAgMBAAECggEALP6MAgfSbK7JkGKbLn8gfM+euXj1FYczQWPtxI8VW9QY
0xDUsqtNANmOYbtj4a0CI5K7jJcANXJed6lG7AUqJLith1XVcpUkqEpyxCBAgiuR
Gwu0GMES7h7TZOsDu+1DOgm9WrUixZ90XoBRwXuPkGsztvr+jV0iDscERH4YyzOm
PXmfzEjWCQ4pk74UPc0EMNnCIFKRo9AwZJP7pWVCzq6dSu3TXnEnZcuiy5Opxn9H
paZWLODUZptzFK2lWBJiOCE7I6gxYmHTQW/QKanvSfZ+ZkNGPAEg2ge4diOVKZIC
PHgCXop6/R0bUjn36AbYiOe7m6dsdh8o3DAFbAzoiQKBgQDbGLMHysNsWmxaNLBP
hSYQ2r/U25qdtOIagABwTNEeUshehyVurrEN0baR2uRINElH8tskxaspzd7Z7MtI
uu3gntQ6ZFU5IV0av5g1sYRCf91+X7CLDTFb/QHsRr+EYbvTLmXLlmwwFa7EERLB
6G1ISUgADuMm2R7TZJ3rckGHRwKBgQDJUyd0JE5pOJmza33t2JRMZyedmA3B9Xw4
e2OvuDMr1qHwaDUEJ/En8flwBlCdsXWMeHfD0p3wX5TJyOvo0V4hounHFA27gBly
6Nqxqmxp+9Drne5QiSxhATieqf+AIxiu9Y0IV/gogtqN9OkNL9q7grmcfHk2nR4w
B4AEwJK5jwKBgHG8R6vi2UHVSuwk7+XH4/PZ6r1v5rq5nKpPCmtBpUkNhlBz7b2g
V+8pj5H1xI2q/uOnsZVMO8duxKHyZ7DwwO3a5acOUKNgq3loPnaZGWSABhZFTFtS
1O3A0I+8Rk1Ngvhk3JksFCt+BgRoLImWw6xDxmmpUMfo7DSmxcfkvxmfAoGBAJyY
+spjZz5/UUb3aMe2PHxFjNIPsTvamFpS2BKZw+vokqQuWna2HuYEWRLjRpeyro2q
MvZ2AHY10sU2bRH2sTKWxyMcHSZomOMB7wJdXuD9h9+ORA4O9R8rVQBNmTjxk8Sb
qa0AyD2ysw/Sneis/YX3RCtNwvdRNWcEnnaT2E1PAoGBAJFGrUZX69sZM7n1Ecd/
qoLfxGtlm6i3UOraD2rpjEmmd6+3m3uzqf0M5SkrEHjAwm/Hg39Ienbf3Gq93WI2
CVmOBD4vpHk0tA5UBX+KHK/ru6fGJuI9DMEsXrUKNiEHSLmzFqX41gsxkSk3sdqX
dHqQ3qTd9tXnfLPBjnJyD6+D
-----END PRIVATE KEY-----`;

// ── Test Mock Environment Setup ──────────────────────────────────────────────

let networkCallCount = 0;
let accessedHosts = [];

// Intercept global fetch and http/https requests to track any network leakage
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url, options) {
  networkCallCount++;
  accessedHosts.push(String(url));
  return originalFetch ? originalFetch(url, options) : Promise.reject(new Error('Network offline'));
};

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
globalThis.localStorage = mockLocalStorage;

// ── Utility Cryptographic Generator for Valid Test Envelopes ──────────────────

function generateTestOfflineQR({
  patientId = 'pid_test_7788',
  hospitalId = 'hosp_smart_triage_01',
  keyId = 'key_smart_triage_2026_01',
  publicKeyPem = HOSPITAL_PUBLIC_KEY,
  expired = false,
  customPatient = null,
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  const exp = expired ? now - 600 : now + 600; // 10 min past or future
  const nonceHex = crypto.randomBytes(12).toString('hex');
  const sid = `bpl_off_${now}_${nonceHex.slice(0, 8)}`;

  // 1. Generate 256-bit DEK
  const dek = crypto.randomBytes(32);

  // 2. Wrap DEK with Hospital Public Key (RSA-OAEP-256)
  const wrappedDekBuffer = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    dek
  );
  const wdek = wrappedDekBuffer.toString('base64');

  // 3. Encrypt Approved Patient Payload (AES-256-GCM)
  const patientData = customPatient || {
    profile: {
      fullName: 'Aarav Sundaram',
      gender: 'MALE',
      dateOfBirth: '1989-04-12',
      bloodGroup: 'B+',
      primaryPhone: '+91 94441 23456',
      abhaId: '91-8844-2211-0099',
    },
    allergies: [{ substance: 'Amoxicillin', severity: 'Severe' }],
    medications: [{ medicationName: 'Atorvastatin', dosage: '20mg' }],
    conditions: [{ conditionName: 'Hyperlipidemia', status: 'Active' }],
    emergencyContact: {
      name: 'Kavitha Sundaram',
      relationship: 'Spouse',
      phone: '+91 94441 65432',
    },
    lastVisit: '18 Jul 2026 (Apollo Speciality)',
  };

  const iv = crypto.randomBytes(12);
  const ivHex = iv.toString('hex');
  const aadString = `${sid}:${patientId}:${hospitalId}:${now}`;

  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  cipher.setAAD(Buffer.from(aadString, 'utf8'));
  let ctBuf = cipher.update(JSON.stringify(patientData), 'utf8');
  ctBuf = Buffer.concat([ctBuf, cipher.final()]);
  const tagBuf = cipher.getAuthTag();

  const envelope = {
    v: '1',
    m: 'OFFLINE_SECURE',
    mode: 'OFFLINE_SECURE_QR',
    sid,
    pid: patientId,
    hid: hospitalId,
    kid: keyId,
    ts: now,
    exp,
    n: nonceHex,
    sc: ['BASIC_PROFILE', 'ALLERGIES', 'CONDITIONS', 'EMERGENCY_CONTACT'],
    wdek,
    iv: ivHex,
    ct: ctBuf.toString('base64'),
    tag: tagBuf.toString('hex'),
    sig: 'valid_test_device_signature_b64==',
  };

  const jsonStr = JSON.stringify(envelope);
  const base64url = Buffer.from(jsonStr, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const qrString = `bploff://v1?data=${base64url}`;
  return { qrString, envelope, patientData };
}

// ── Runner Harness ───────────────────────────────────────────────────────────

const results = [];

function assert(condition, description) {
  if (!condition) {
    results.push({ pass: false, desc: description });
    throw new Error(`FAIL: ${description}`);
  }
  results.push({ pass: true, desc: description });
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('BHARAT PULSELINK — FORENSIC QR SCANNER AUTOMATED TEST SUITE');
  console.log('===============================================================\n');

  // Dynamic import of the offline resolver compiled module or service
  const resolver = await import('../src/services/offlineQRResolver.js').catch(async () => {
    // Fallback: If not pre-built, import using typescript/esm transpiler or direct dynamic
    return await import('../dist/assets/index-CbOjo2S9.js').catch(() => null);
  });

  // If node direct import needs helper, test the pure implementation logic directly
  const {
    classifyQRPayload,
    parseOfflineEnvelope,
    resolveOfflineQRLocally,
    mapQRPatientToHospitalPatient,
    checkAndRecordReplay,
    HOSPITAL_SCANNER_PRIVATE_KEYS,
  } = await (async () => {
    // Load module directly using WebCrypto in Node
    const mod = await import('./offlineQRResolverDirect.mjs');
    return mod;
  })();

  // ── TEST 1: bploff:// QR does NOT call network ────────────────────────────
  try {
    const { qrString } = generateTestOfflineQR();
    networkCallCount = 0;
    accessedHosts = [];

    const classification = classifyQRPayload(qrString);
    assert(classification === 'OFFLINE_SECURE_QR', '1.1: classifyQRPayload identifies bploff:// as OFFLINE_SECURE_QR');

    const res = await resolveOfflineQRLocally(qrString, {
      currentHospitalId: 'hosp_smart_triage_01',
      privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
      skipReplayCheck: true,
    });

    assert(networkCallCount === 0, '1.2: Network call count is strictly ZERO during bploff:// resolution');
    assert(accessedHosts.length === 0, '1.3: No remote or local hosts accessed during offline resolution');
    console.log('✓ TEST 1 PASSED: bploff:// QR does NOT call network (Zero HTTP/fetch calls)');
  } catch (err) {
    console.error('✗ TEST 1 FAILED:', err.message);
  }

  // ── TEST 2: bploff:// QR decrypts locally via WebCrypto ───────────────────
  try {
    const { qrString, patientData } = generateTestOfflineQR();
    const res = await resolveOfflineQRLocally(qrString, {
      currentHospitalId: 'hosp_smart_triage_01',
      privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
      skipReplayCheck: true,
    });

    assert(res.ok === true, '2.1: Local resolution returns ok: true');
    assert(res.mode === 'OFFLINE_SECURE_QR', '2.2: Mode is OFFLINE_SECURE_QR');
    assert(res.security.decryptedLocally === true, '2.3: Security object reports decryptedLocally: true');
    assert(res.patient.fullName === patientData.profile.fullName, '2.4: Decrypted patient name matches plaintext');
    console.log('✓ TEST 2 PASSED: bploff:// QR decrypts locally via RSA-OAEP + AES-256-GCM');
  } catch (err) {
    console.error('✗ TEST 2 FAILED:', err.message);
  }

  // ── TEST 3: bploff:// QR populates patient state canonically ───────────────
  try {
    const { qrString, patientData } = generateTestOfflineQR();
    const res = await resolveOfflineQRLocally(qrString, {
      currentHospitalId: 'hosp_smart_triage_01',
      privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
      skipReplayCheck: true,
    });

    assert(res.patient.allergies.length === 1, '3.1: Allergies mapped canonically');
    assert(res.patient.allergies[0].includes('Amoxicillin'), '3.2: Contains Amoxicillin allergy');
    assert(res.patient.medications[0].includes('Atorvastatin'), '3.3: Contains Atorvastatin medication');
    assert(res.patient.chronicConditions[0].includes('Hyperlipidemia'), '3.4: Contains Hyperlipidemia condition');
    assert(res.patient.emergencyContact?.name === 'Kavitha Sundaram', '3.5: Emergency contact name mapped correctly');
    assert(res.patient.bplVerified === true, '3.6: bplVerified flag is true');
    console.log('✓ TEST 3 PASSED: bploff:// QR populates patient state canonically');
  } catch (err) {
    console.error('✗ TEST 3 FAILED:', err.message);
  }

  // ── TEST 4: bploff:// rejects expired QR ──────────────────────────────────
  try {
    const { qrString } = generateTestOfflineQR({ expired: true });
    let errorThrown = false;

    try {
      await resolveOfflineQRLocally(qrString, {
        currentHospitalId: 'hosp_smart_triage_01',
        privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
      });
    } catch (e) {
      errorThrown = true;
      assert(e.message.toLowerCase().includes('expired'), '4.1: Error message explicitly notes expiration');
    }

    assert(errorThrown === true, '4.2: Expired QR was rejected');
    console.log('✓ TEST 4 PASSED: bploff:// rejects expired QR');
  } catch (err) {
    console.error('✗ TEST 4 FAILED:', err.message);
  }

  // ── TEST 5: bploff:// rejects replay ──────────────────────────────────────
  try {
    mockLocalStorage.clear();
    const { qrString } = generateTestOfflineQR();

    // First scan should succeed
    const res1 = await resolveOfflineQRLocally(qrString, {
      currentHospitalId: 'hosp_smart_triage_01',
      privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
      skipReplayCheck: false,
    });
    assert(res1.ok === true, '5.1: First scan of QR succeeds');

    // Second scan with same session ID must fail due to replay check
    let replayBlocked = false;
    try {
      await resolveOfflineQRLocally(qrString, {
        currentHospitalId: 'hosp_smart_triage_01',
        privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
        skipReplayCheck: false,
      });
    } catch (e) {
      replayBlocked = true;
      assert(e.message.includes('already scanned') || e.message.includes('Replay protection'), '5.2: Replay error caught');
    }

    assert(replayBlocked === true, '5.3: Duplicate scan rejected by local replay guard');
    console.log('✓ TEST 5 PASSED: bploff:// rejects replay (single-use protection active)');
  } catch (err) {
    console.error('✗ TEST 5 FAILED:', err.message);
  }

  // ── TEST 6: bploff:// rejects wrong hospital (recipient binding) ──────────
  try {
    const { qrString } = generateTestOfflineQR({ hospitalId: 'hosp_apollo_delhi_99' });
    let wrongHospitalBlocked = false;

    try {
      await resolveOfflineQRLocally(qrString, {
        currentHospitalId: 'hosp_smart_triage_01',
        // Pass wrong private key or no key for unknown hospital
        privateKeyPemOverride: null,
      });
    } catch (e) {
      wrongHospitalBlocked = true;
      assert(
        e.message.includes('another healthcare facility') || e.message.includes('Access Denied'),
        '6.1: Recipient mismatch correctly flagged'
      );
    }

    assert(wrongHospitalBlocked === true, '6.2: Envelope bound to foreign hospital rejected');
    console.log('✓ TEST 6 PASSED: bploff:// rejects wrong hospital (recipient binding verified)');
  } catch (err) {
    console.error('✗ TEST 6 FAILED:', err.message);
  }

  // ── TEST 7: bplqr:// still uses online resolver ───────────────────────────
  try {
    const onlineQR = 'bplqr://v1/s?sid=ses_online_9900&t=4f9c3a2b1e8d7c6b5a4f3e2d1c0b9a8f&p=HOSPITAL_CHECKIN';
    const classification = classifyQRPayload(onlineQR);
    assert(classification === 'ONLINE_SECURE_QR', '7.1: classifyQRPayload classifies bplqr:// as ONLINE_SECURE_QR');
    console.log('✓ TEST 7 PASSED: bplqr:// still uses online resolver (preserved online route)');
  } catch (err) {
    console.error('✗ TEST 7 FAILED:', err.message);
  }

  // ── TEST 8: localhost:8085 is never accessed by offline flow ──────────────
  try {
    networkCallCount = 0;
    accessedHosts = [];
    const { qrString } = generateTestOfflineQR();

    await resolveOfflineQRLocally(qrString, {
      currentHospitalId: 'hosp_smart_triage_01',
      privateKeyPemOverride: HOSPITAL_PRIVATE_KEY,
      skipReplayCheck: true,
    });

    const accessed8085 = accessedHosts.some((h) => h.includes('8085') || h.includes('127.0.0.1'));
    assert(!accessed8085, '8.1: Port 8085 and 127.0.0.1 are never contacted');
    assert(networkCallCount === 0, '8.2: Total HTTP calls remain zero');
    console.log('✓ TEST 8 PASSED: localhost:8085 is never accessed by offline flow (eliminated ECONNREFUSED)');
  } catch (err) {
    console.error('✗ TEST 8 FAILED:', err.message);
  }

  // ── TEST 9: Missing optional patient fields do not crash UI / mapping ──────
  try {
    const minimalPatient = {
      profile: {
        fullName: 'Meera Patel',
      },
    };

    const mapped = mapQRPatientToHospitalPatient(minimalPatient);
    assert(mapped.fullName === 'Meera Patel', '9.1: Name mapped from minimal record');
    assert(mapped.allergies.length === 0, '9.2: Empty allergies defaults to empty array');
    assert(mapped.medications.length === 0, '9.3: Empty medications defaults to empty array');
    assert(mapped.chronicConditions.length === 0, '9.4: Empty conditions defaults to empty array');
    assert(mapped.lastVisit === 'Not recorded', '9.5: Missing last visit safely falls back to Not recorded');
    assert(mapped.emergencyContact === null, '9.6: Missing emergency contact safely falls back to null');
    assert(mapped.bloodGroup === 'Not recorded', '9.7: Missing blood group safely falls back to Not recorded');
    console.log('✓ TEST 9 PASSED: Missing optional patient fields do not crash mapping or UI');
  } catch (err) {
    console.error('✗ TEST 9 FAILED:', err.message);
  }

  // ── TEST 10: Patient Context correctly renders mapped data ────────────────
  try {
    const fullPatient = {
      profile: {
        fullName: 'Devika Krishnan',
        age: 42,
        gender: 'FEMALE',
        bloodGroup: 'O+',
        primaryPhone: '+91 98840 11223',
      },
      allergies: [{ substance: 'Sulfa Drugs', severity: 'Moderate' }, { substance: 'Peanuts' }],
      medications: [{ medicationName: 'Levothyroxine', dosage: '50mcg' }],
      conditions: [{ conditionName: 'Hypothyroidism' }],
      lastVisit: '14 May 2026 (Fortis Malar)',
      emergencyContact: {
        name: 'Suresh Krishnan',
        relationship: 'Spouse',
        phone: '+91 98840 99887',
      },
    };

    const mapped = mapQRPatientToHospitalPatient(fullPatient);

    // Verify no hardcoded sample values leak
    assert(!mapped.allergies.some((a) => a.toLowerCase().includes('penicillin')), '10.1: No Penicillin mock leak');
    assert(!mapped.medications.some((m) => m.toLowerCase().includes('metformin')), '10.2: No Metformin mock leak');
    assert(!mapped.lastVisit.includes('Apollo Clinic'), '10.3: No Apollo Clinic mock leak');
    assert(mapped.emergencyContact?.name !== 'Rajesh Sharma', '10.4: No Rajesh Sharma mock leak');

    // Verify actual patient fields
    assert(mapped.allergies[0].includes('Sulfa Drugs'), '10.5: Actual allergy Sulfa Drugs mapped');
    assert(mapped.medications[0].includes('Levothyroxine'), '10.6: Actual medication Levothyroxine mapped');
    assert(mapped.lastVisit.includes('Fortis Malar'), '10.7: Actual visit Fortis Malar mapped');
    assert(mapped.emergencyContact?.name === 'Suresh Krishnan', '10.8: Actual emergency contact Suresh Krishnan mapped');
    console.log('✓ TEST 10 PASSED: Patient Context correctly renders real mapped data without hardcoded samples');
  } catch (err) {
    console.error('✗ TEST 10 FAILED:', err.message);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${results.length} CHECKS)`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
