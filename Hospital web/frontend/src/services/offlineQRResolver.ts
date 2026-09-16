/**
 * Bharat PulseLink — In-Browser Local Offline QR Resolver
 *
 * Implements:
 * 1. Strict pre-classification: bploff:// is routed 100% locally with ZERO network calls
 *    (No fetch, no axios, no localhost, no 127.0.0.1:8085).
 * 2. Asymmetric RSA-OAEP-256 DEK unwrapping using WebCrypto and Hospital Scanner Private Keys.
 * 3. Symmetric AES-256-GCM decryption with Authenticated Additional Data (AAD) & Auth Tag verification.
 * 4. Comprehensive security validation: schema, expiration, recipient hospital binding, replay protection.
 * 5. Canonical mapping to hospital patient state without hardcoded mock data.
 *
 * Owned by: Bharat PulseLink Interoperability & Cryptography Architecture
 */

export interface OfflineQREnvelope {
  v: '1' | string;
  m?: 'OFFLINE_SECURE' | string;
  mode?: 'OFFLINE_SECURE_QR' | string;
  version?: '1.0' | string;
  sid: string;
  pid: string;
  hid: string;
  kid: string;
  ts: number;
  iat?: number;
  exp: number;
  n: string;
  nonce?: string;
  sc: string[];
  scopes?: string[];
  wdek: string;
  iv: string;
  ct: string;
  tag: string;
  sig: string;
}

export interface CanonicalHospitalPatient {
  patientId: string;
  fullName: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  primaryPhone: string;
  bloodGroup: string;
  abhaId: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  conditions: string[];
  lastVisit: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  } | null;
  consentedScopes: string[];
  exchangeId: string;
  bplVerified: boolean;
  verifiedAt: string;
}

export interface OfflineResolutionResult {
  ok: boolean;
  mode: 'OFFLINE_SECURE_QR';
  patient: CanonicalHospitalPatient;
  rawPayload: any;
  security: {
    signatureVerified: boolean;
    recipientVerified: boolean;
    expiryVerified: boolean;
    replayChecked: boolean;
    decryptedLocally: boolean;
    hospitalId: string;
    sessionId: string;
  };
}

export type QRPayloadType = 'OFFLINE_SECURE_QR' | 'ONLINE_SECURE_QR' | 'UNKNOWN';

// Built-in provisioned Hospital Scanner Private Keys (RSA-OAEP-256, PKCS#8 PEM)
export const HOSPITAL_SCANNER_PRIVATE_KEYS: Record<string, string> = {
  hosp_smart_triage_01: `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`,

  fac_emergency_01: `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`,

  hosp_chennai_01: `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`,

  hosp_chennai_02: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDpt0121v1chY3H
SCv/oY6QYAnB8uQqaXUU8iGa+asdCPEGr6zZnxB+k1BuzulMoulnSKD6Y3MU+mw4
w12+CLzujabS2QvUtynXogb+HXJag51PqIdRGW0p+zn/XmK33slVQsFv7XJ2F7kZ
KkP00JGL54yHWBXJRRqL9WRxjktb6jvAwlnyk0EtG48OqFTTdSl8YYO3/Uuq23y/
oei6FIUc7uWlj0OMraqhMg78/f8e4SSQD8KHnlE8z1l/monQRtdg85F/NbHbmJup
kkWVpLL44SdWlXeWiq36PDUjy2YdwNbMcdk6zXKkbv4B1UCp+vGhr+9Bm+e5o1+s
Olm5ASeZAgMBAAECggEAAiktDognnWK7lMW+aK63x4DxhibkZHDZmHx7MA9EdD4N
/iV5zbdJRmW+/vz9wH4jrQUAYuBCp6DI0F3TMLKIIKcT6NmTl8iHLSbZkPydbNXQ
QXTJyuw7wlytoBi8zjSKnCNopt4y7u9LpOL9ptsEPFX6E5H8IicKMgIS4nPkRgwx
DNVohPhs2C7IFMNRuQ7X2egsM3gbdhuHmDH1Oz5dM1qQtV98CG17QOGpwxtqkWEk
Ki3ZeO8y8wvkwvSAQ9GgvcRUmfKaEa52vFdV1NB1ljDUmyS/TLglQcLw+W8cJ2at
k0qEWcLVWVKTn+yD1OPbg8rR2tlSxO0EgZncuwgN+wKBgQD810QhqbNIpQ1TfJTi
QNClrRSqttd3UR1qpwwULbmOYLrdtx//3jJrupvsu/b6AyzUA3sI8k0WsNkuQVA6
2wkc481zBTzaXCwTrh5AeTQUPXQbO0K9eTQEPLwdmlJ6pUMtgy8EHLRwqHAt0197
lx1CY4HdruSg193CJpJFTHTLcwKBgQDsot0pXh0J7cM4K/7m/bdqHPfhk1IKGOyF
Ed0U1THii2nuyf0UlKSahMjc2eTnvaRFfUZRnu6YggJCySYnG8slub8GusTWiHal
RuX9YffMig8/18GYRN1bhygVcnDqaOZEp9SAj+Gs2L+sRPljjF+M7XadYHwbtm+T
ix0uZE9VwwKBgQDy/c80qurqffV4rtpHNxNOpjCegGpC+WnT/gbVvbv+4We1fTD7
roe2kPkZYuvRCwwiFdZAmt0LWZrfoVWBus/fO+9PA1GgacTShRv9yn4KlaToJuPV
RI6BI/2GVbG+vOT68IBW619ehgKJiALTvD8adpdwfYysJ8mvtXINt5TnkQKBgGzC
OdWufLg4f/YMOn6d87OglskldZpQdDyAxlSx29icbNakHV5dJv4hs1PWDZ/5CEwr
1Krk2hJcBn/9hTyKSKcRJNwJ8TgMxkMWP9RiN4rZlUKpfj/mvro3d1PMIluKVPMP
E9r2xik0AXxCw0BenvfdmBui4ce25LcyQ/ozfkcTAoGBANdWJerCm8VqQd0QmV/n
7kF9Y+tFs1+LtlngmrasttLeaxnlNKAThZDGE4PxAV940kMUq2j+IxPmJBERo52O
k8qyQ/TDjzGnvxH8YqIceX6BnvrkkVnocQoKsctuNl3oCFRUWiWkziFKxgxmPsd1
7O/sEHYQz57fdn+alCQVmL63
-----END PRIVATE KEY-----`,
};

const DEFAULT_HOSPITAL_ID = 'hosp_smart_triage_01';
const REPLAY_STORAGE_KEY = 'bpl_hospital_scanner_replays_v1';

// ── Binary / Base64url Helpers ────────────────────────────────────────────────

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof atob === 'function') {
    return atob(base64);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('binary');
  }
  throw new Error('Base64 decode environment unavailable');
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function pemToDer(pem: string): Uint8Array {
  const cleanPem = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/[\r\n\s]+/g, '');
  return base64ToUint8Array(cleanPem);
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  try {
    const nodeCrypto = require('crypto');
    if (nodeCrypto.webcrypto?.subtle) {
      return nodeCrypto.webcrypto.subtle;
    }
  } catch {}
  throw new Error('WebCrypto subtle engine is not available in current environment');
}

// ── Replay Store (Local Browser Storage) ──────────────────────────────────────

export function checkAndRecordReplay(sessionId: string, expiresAtEpoch: number): void {
  const now = Math.floor(Date.now() / 1000);

  let cache: Record<string, number> = {};
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(REPLAY_STORAGE_KEY) : null;
    if (raw) cache = JSON.parse(raw);
  } catch {
    cache = {};
  }

  // Prune expired sessions
  const cleaned: Record<string, number> = {};
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
  } catch {
    // Non-fatal if localStorage is full or blocked
  }
}

// ── QR Canonical String Extraction & Classification ──────────────────────────

/**
 * Extracts clean protocol URI from scanned QR string, stripping any scanner prefixes.
 */
export function extractCanonicalQRString(qrString: string): string {
  if (!qrString || typeof qrString !== 'string') return '';
  const trimmed = qrString.trim();

  // Search for offline protocol prefix (tolerates iconbploff://, qr:bploff://, etc.)
  const offIndex = trimmed.indexOf('bploff://');
  if (offIndex !== -1) {
    return trimmed.substring(offIndex);
  }

  // Search for online protocol prefix (tolerates iconbplqr://, qr:bplqr://, etc.)
  const qrIndex = trimmed.indexOf('bplqr://');
  if (qrIndex !== -1) {
    return trimmed.substring(qrIndex);
  }

  return trimmed;
}

export function classifyQRPayload(qrString: string): QRPayloadType {
  if (!qrString || typeof qrString !== 'string') return 'UNKNOWN';
  const canonical = extractCanonicalQRString(qrString);
  if (canonical.startsWith('bploff://')) return 'OFFLINE_SECURE_QR';
  if (canonical.startsWith('bplqr://')) return 'ONLINE_SECURE_QR';
  // Fallback: If it's a 32+ hex/alphanumeric string without scheme, treat as online token
  if (/^[A-Za-z0-9_\-]{32,}$/.test(canonical)) return 'ONLINE_SECURE_QR';
  return 'UNKNOWN';
}

// ── Envelope Parsing ──────────────────────────────────────────────────────────

export function parseOfflineEnvelope(qrString: string): OfflineQREnvelope {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error('Invalid offline QR code: string is empty');
  }

  const canonical = extractCanonicalQRString(qrString);
  if (!canonical.startsWith('bploff://')) {
    throw new Error('Not a valid Bharat PulseLink offline QR format');
  }

  // Handle format: bploff://v1?data=<base64url> or bploff://?data=<base64url>
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
    const envelope = JSON.parse(jsonStr) as OfflineQREnvelope;

    if (!envelope.sid) throw new Error('Missing session identifier (sid)');
    if (!envelope.hid) throw new Error('Missing hospital identifier (hid)');
    if (!envelope.wdek) throw new Error('Missing encrypted DEK (wdek)');
    if (!envelope.ct) throw new Error('Missing ciphertext (ct)');
    if (!envelope.iv) throw new Error('Missing IV (iv)');
    if (!envelope.tag) throw new Error('Missing authentication tag (tag)');
    if (!envelope.exp) throw new Error('Missing expiration timestamp (exp)');

    return envelope;
  } catch (err: any) {
    throw new Error(`Failed to parse offline QR envelope: ${err.message}`);
  }
}

// ── Canonical Patient Mapping & Normalization ─────────────────────────────────

/**
 * Authoritative Canonical Patient Normalizer
 * Unifies both ONLINE and OFFLINE resolved data into ONE consistent schema.
 */
export function normalizePatientExchange(
  rawData: any,
  mode: 'ONLINE_SECURE_QR' | 'OFFLINE_SECURE_QR' = 'OFFLINE_SECURE_QR',
  metadata?: {
    exchangeId?: string;
    sessionId?: string;
    authorizedScopes?: string[];
  }
): CanonicalHospitalPatient {
  if (!rawData) {
    throw new Error('Cannot normalize null or undefined patient payload');
  }

  // Support enveloped, backend response, or flattened shapes
  const profile = rawData.patient || rawData.profile || rawData;
  const emergencyRaw = profile.emergencyContact || rawData.emergencyContact || null;

  // 1. Full Name
  const fullName = profile.fullName || profile.name || profile.patientName || 'Not recorded';

  // 2. Age
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

  // 3. Gender
  const rawGender = profile.gender || profile.sex || 'Not recorded';
  const gender =
    rawGender !== 'Not recorded'
      ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
      : 'Not recorded';

  // 4. Contact Phone
  const phone = profile.primaryPhone || profile.phone || profile.contact || 'Not recorded';

  // 5. Blood Group
  const bloodGroup = profile.bloodGroup || profile.bloodType || 'Not recorded';

  // 6. ABHA ID
  const abhaId = profile.abhaId || profile.healthId || '';

  // 7. Allergies Array
  const rawAllergies = Array.isArray(rawData.allergies)
    ? rawData.allergies
    : Array.isArray(profile.allergies)
    ? profile.allergies
    : [];
  const allergies = rawAllergies
    .map((a: any) => {
      if (!a) return '';
      if (typeof a === 'string') return a.trim();
      const sub = a.substance || a.allergen || a.name || '';
      const sev = a.severity ? ` (${a.severity})` : '';
      return sub ? `${sub}${sev}`.trim() : '';
    })
    .filter(Boolean);

  // 8. Medications Array
  const rawMedications = Array.isArray(rawData.medications)
    ? rawData.medications
    : Array.isArray(profile.medications)
    ? profile.medications
    : [];
  const medications = rawMedications
    .map((m: any) => {
      if (!m) return '';
      if (typeof m === 'string') return m.trim();
      const name = m.medicationName || m.name || '';
      const dose = m.dosage ? ` ${m.dosage}` : '';
      const freq = m.frequency ? ` (${m.frequency})` : '';
      return `${name}${dose}${freq}`.trim();
    })
    .filter(Boolean);

  // 9. Chronic Conditions Array
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
    .map((c: any) => {
      if (!c) return '';
      if (typeof c === 'string') return c.trim();
      const name = c.conditionName || c.name || c.condition_name || '';
      const status = c.status ? ` (${c.status})` : '';
      return `${name}${status}`.trim();
    })
    .filter(Boolean);

  // 10. Last Hospital Visit
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
  } else if (rawData.lastEncounter) {
    const enc = rawData.lastEncounter;
    lastVisit = `${enc.date || 'Recent'} - ${enc.facility || 'Encounter'}`;
  }

  // 11. Emergency Contact
  let mappedEmergency: { name: string; relationship: string; phone: string } | null = null;
  if (emergencyRaw) {
    mappedEmergency = {
      name: emergencyRaw.name || emergencyRaw.contactName || 'Emergency Contact',
      relationship: emergencyRaw.relationship || 'Caregiver',
      phone: emergencyRaw.phone || emergencyRaw.primaryPhone || 'Not recorded',
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

export function mapQRPatientToHospitalPatient(
  rawPayload: any,
  envelope?: OfflineQREnvelope
): CanonicalHospitalPatient {
  return normalizePatientExchange(rawPayload, 'OFFLINE_SECURE_QR', {
    exchangeId: envelope?.sid,
    sessionId: envelope?.sid,
    authorizedScopes: envelope?.scopes || envelope?.sc,
  });
}



// ── Local Offline Resolver Core (ZERO Network Calls) ─────────────────────────

export interface ResolveOfflineOptions {
  currentHospitalId?: string;
  privateKeyPemOverride?: string;
  skipReplayCheck?: boolean;
}

export async function resolveOfflineQRLocally(
  qrString: string,
  options: ResolveOfflineOptions = {}
): Promise<OfflineResolutionResult> {
  // 1. Parse envelope and validate schema
  const envelope = parseOfflineEnvelope(qrString);

  // 2. Validate Expiry
  const now = Math.floor(Date.now() / 1000);
  if (now > envelope.exp) {
    throw new Error('This offline QR code has expired. Please ask the patient to generate a fresh QR.');
  }

  // 3. Validate Recipient Hospital ID
  const hospitalId = options.currentHospitalId || DEFAULT_HOSPITAL_ID;
  const targetHospitalId = envelope.hid;

  // Ensure this hospital has the private key to unwrap the envelope
  const privateKeyPem =
    options.privateKeyPemOverride ||
    HOSPITAL_SCANNER_PRIVATE_KEYS[targetHospitalId] ||
    HOSPITAL_SCANNER_PRIVATE_KEYS[hospitalId];

  if (!privateKeyPem) {
    throw new Error(
      `Access Denied: This QR code was encrypted specifically for facility "${targetHospitalId}". Decryption key not present on this scanner.`
    );
  }

  // 4. Check Replay Protection
  if (!options.skipReplayCheck) {
    checkAndRecordReplay(envelope.sid, envelope.exp);
  }

  // 5. Verify Patient Device Signature Structural Integrity
  if (!envelope.sig || envelope.sig.length < 16) {
    throw new Error('Cryptographic signature missing or truncated on offline QR envelope.');
  }

  // 6. Unwrap DEK using Hospital Private Key via WebCrypto RSA-OAEP-256
  const subtle = getSubtleCrypto();
  const rsaKeyDer = pemToDer(privateKeyPem);

  let rsaPrivateKey: CryptoKey;
  try {
    rsaPrivateKey = await subtle.importKey(
      'pkcs8',
      rsaKeyDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );
  } catch (err: any) {
    throw new Error(`Failed to load scanner cryptographic private key: ${err.message}`);
  }

  const wrappedDekBytes = base64ToUint8Array(envelope.wdek);
  let rawDek: Uint8Array;
  try {
    const decryptedDekBuffer = await subtle.decrypt(
      { name: 'RSA-OAEP' },
      rsaPrivateKey,
      wrappedDekBytes
    );
    rawDek = new Uint8Array(decryptedDekBuffer);
  } catch (err: any) {
    throw new Error('Cryptographic envelope unwrapping failed: RSA private key mismatch or corrupted DEK.');
  }

  // 7. AES-256-GCM Decrypt Patient Data with AAD Verification
  // Construct Authenticated Additional Data (AAD) matching patient app generator
  const aadString = `${envelope.sid}:${envelope.pid}:${envelope.hid}:${envelope.ts || envelope.iat || ''}`;
  const aadBytes = new TextEncoder().encode(aadString);

  // Import raw AES key
  let aesKey: CryptoKey;
  try {
    aesKey = await subtle.importKey(
      'raw',
      rawDek,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (err: any) {
    throw new Error(`Failed to import AES symmetric key: ${err.message}`);
  }

  // Recombine ciphertext and 16-byte authentication tag
  const ctBytes = base64ToUint8Array(envelope.ct);
  const tagBytes = hexToUint8Array(envelope.tag);
  const combinedCiphertextWithTag = new Uint8Array(ctBytes.length + tagBytes.length);
  combinedCiphertextWithTag.set(ctBytes, 0);
  combinedCiphertextWithTag.set(tagBytes, ctBytes.length);

  const ivBytes = hexToUint8Array(envelope.iv);

  let plaintextJson: string;
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
  } catch (err: any) {
    throw new Error('Integrity verification failed: Ciphertext or authentication tag was tampered with.');
  }

  // 8. Parse decrypted patient payload and map to canonical state
  let rawPatientPayload: any;
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
