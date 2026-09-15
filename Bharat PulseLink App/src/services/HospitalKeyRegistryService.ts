/**
 * Bharat PulseLink — Hospital Public Key Registry Service
 *
 * Implements:
 * 1. Enterprise Public Key Registry for verified healthcare facilities
 * 2. Asymmetric Key Provisioning: Caches RSA-OAEP-256 public keys for offline envelope encryption
 * 3. Offline Key Resolution: Allows offline encryption only when trusted key is locally cached
 * 4. Fail-Closed Security: Explicitly rejects offline QR generation if hospital key is not available
 * 5. Hospital Scanner Private Key management for test & hospital intake environments
 *
 * Owned by: Cryptography & Hospital Identity Architecture (Prompt 107 Master Rework)
 */

import SecureStoreService from './secureStore';

export interface HospitalKeyEntry {
  facilityId: string;
  hospitalName: string;
  keyId: string;
  algorithm: 'RSA-OAEP-256';
  publicKeyPem: string;
  createdAtISO: string;
  expiresAtISO: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

const HOSPITAL_KEY_CACHE_PREFIX = 'bpl_hosp_pubkey_';

// Built-in trusted national hospital public keys provisioned for offline use
export const TRUSTED_NATIONAL_HOSPITAL_KEYS: HospitalKeyEntry[] = [
  {
    facilityId: 'hosp_chennai_01',
    hospitalName: 'Rajiv Gandhi Government General Hospital',
    keyId: 'key_rggh_2026_01',
    algorithm: 'RSA-OAEP-256',
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArE2PV1NEEZv9tsQCh48E
ot6yBcyUuYy2JMkmRWuUlOOPBVHwb4fZK4H6XW1uQpvOG2rCv+0LZ7N4kOoMtEgD
Ql5FtPVkI3XkQinABB0mD47XzPlBfsak80/AZH9WLNSjN4KyynSy006ugV8cLcrx
Xsnh0QLOIjhqNEBOrKgX1Vny8L4r9tuKJuBlq4tAYs2C1MvCLo9Ne05w+GewRSwk
Z9fsh/Jm0NZpr0UIa3XHQ8pZmAUILO2qP+DcpNLHAmAWZg2iSZ3CFFzRvPU/CcJv
sLDnDiE+XNOBJX0Gldvgi8IqlJb+wC7RRmpkiDOqgZm6BI2w0aa9lBcA5kgGk9rf
qQIDAQAB
-----END PUBLIC KEY-----`,
    createdAtISO: '2026-01-01T00:00:00Z',
    expiresAtISO: '2030-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    facilityId: 'hosp_chennai_02',
    hospitalName: 'Apollo Specialty Hospital',
    keyId: 'key_apollo_2026_01',
    algorithm: 'RSA-OAEP-256',
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6bdNdtb9XIWNx0gr/6GO
kGAJwfLkKml1FPIhmvmrHQjxBq+s2Z8QfpNQbs7pTKLpZ0ig+mNzFPpsOMNdvgi8
7o2m0tkL1Lcp16IG/h1yWoOdT6iHURltKfs5/15it97JVULBb+1ydhe5GSpD9NCR
i+eMh1gVyUUai/VkcY5LW+o7wMJZ8pNBLRuPDqhU03UpfGGDt/1Lqtt8v6HouhSF
HO7lpY9DjK2qoTIO/P3/HuEkkA/Ch55RPM9Zf5qJ0EbXYPORfzWx25ibqZJFlaSy
+OEnVpV3loqt+jw1I8tmHcDWzHHZOs1ypG7+AdVAqfrxoa/vQZvnuaNfrDpZuQEn
mQIDAQAB
-----END PUBLIC KEY-----`,
    createdAtISO: '2026-01-01T00:00:00Z',
    expiresAtISO: '2030-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    facilityId: 'hosp_smart_triage_01',
    hospitalName: 'Smart Triage Facility',
    keyId: 'key_smart_triage_2026_01',
    algorithm: 'RSA-OAEP-256',
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj5MIuC4TLOulJivgKjgl
3lnkdkGAFkjrCxZvkOVsNVFMkVT7YQn4bqkxVHW+yOyeG+IrVkd4Q5BF+J6vCiFK
RFyxSauqwZNatSVnwLNOIDKfG3sjYWWdlDmsHaoDx2B4/KE00+BUhJd6T3As2ndP
ncwRcvxMVvyTLlCdeFlyMrP9ZjkLoXKdnm3PsIJXl1fqjVLWdprFgAQ/T6qOeqHW
Q9Yb45+/1jzXN5cSxW3XALSkjdv34muMN/y1Fipn/8llzIpxeK9xCP3H67P4hFSY
5Yww85qFKGyBvKTxEANJsBmI1ZCrEXLnwLYR4NqMQDcgxvw3tANJLlH6OKc2d5KM
3QIDAQAB
-----END PUBLIC KEY-----`,
    createdAtISO: '2026-01-01T00:00:00Z',
    expiresAtISO: '2030-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    facilityId: 'fac_emergency_01',
    hospitalName: 'Emergency Triage Counter',
    keyId: 'key_fac_emerg_2026_01',
    algorithm: 'RSA-OAEP-256',
    publicKeyPem: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj5MIuC4TLOulJivgKjgl
3lnkdkGAFkjrCxZvkOVsNVFMkVT7YQn4bqkxVHW+yOyeG+IrVkd4Q5BF+J6vCiFK
RFyxSauqwZNatSVnwLNOIDKfG3sjYWWdlDmsHaoDx2B4/KE00+BUhJd6T3As2ndP
ncwRcvxMVvyTLlCdeFlyMrP9ZjkLoXKdnm3PsIJXl1fqjVLWdprFgAQ/T6qOeqHW
Q9Yb45+/1jzXN5cSxW3XALSkjdv34muMN/y1Fipn/8llzIpxeK9xCP3H67P4hFSY
5Yww85qFKGyBvKTxEANJsBmI1ZCrEXLnwLYR4NqMQDcgxvw3tANJLlH6OKc2d5KM
3QIDAQAB
-----END PUBLIC KEY-----`,
    createdAtISO: '2026-01-01T00:00:00Z',
    expiresAtISO: '2030-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
];

// Hospital Private Keys (used ONLY on hospital scanners / hospital backend environments)
export const HOSPITAL_PRIVATE_KEYS_REGISTRY: Record<string, string> = {
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
};

export class HospitalKeyRegistryService {
  private static _memoryCache = new Map<string, HospitalKeyEntry>();

  static {
    // Populate built-in national keys
    for (const key of TRUSTED_NATIONAL_HOSPITAL_KEYS) {
      this._memoryCache.set(key.facilityId, key);
    }
  }

  /**
   * Checks whether a trusted hospital public key is locally available for offline encryption.
   */
  public static async isHospitalKeyAvailable(facilityId: string): Promise<boolean> {
    const entry = await this.getHospitalPublicKey(facilityId);
    return !!entry && entry.status === 'ACTIVE';
  }

  /**
   * Retrieves the trusted public key for a hospital facility.
   * Checks memory cache, persistent SecureStore cache, and built-in directory.
   */
  public static async getHospitalPublicKey(facilityId: string): Promise<HospitalKeyEntry | null> {
    if (!facilityId) return null;

    // 1. Memory check
    if (this._memoryCache.has(facilityId)) {
      const entry = this._memoryCache.get(facilityId)!;
      if (entry.status === 'ACTIVE' && new Date(entry.expiresAtISO).getTime() > Date.now()) {
        return entry;
      }
    }

    // 2. Persistent storage check
    try {
      const raw = await SecureStoreService.get(`${HOSPITAL_KEY_CACHE_PREFIX}${facilityId}`);
      if (raw) {
        const entry: HospitalKeyEntry = JSON.parse(raw);
        if (entry && entry.status === 'ACTIVE' && new Date(entry.expiresAtISO).getTime() > Date.now()) {
          this._memoryCache.set(facilityId, entry);
          return entry;
        }
      }
    } catch {
      // Fallback
    }

    // 3. Built-in list check
    const builtin = TRUSTED_NATIONAL_HOSPITAL_KEYS.find((k) => k.facilityId === facilityId);
    if (builtin && builtin.status === 'ACTIVE') {
      this._memoryCache.set(facilityId, builtin);
      return builtin;
    }

    return null;
  }

  /**
   * Stores a freshly synced hospital public key in memory and persistent storage.
   */
  public static async registerOrUpdateKey(entry: HospitalKeyEntry): Promise<void> {
    this._memoryCache.set(entry.facilityId, entry);
    try {
      await SecureStoreService.set(
        `${HOSPITAL_KEY_CACHE_PREFIX}${entry.facilityId}`,
        JSON.stringify(entry)
      );
    } catch (e) {
      console.warn('[KEY_REGISTRY] Failed to persist hospital public key', e);
    }
  }

  /**
   * Retrieves private key for a facility (STRICTLY FOR HOSPITAL SCANNER SYSTEM).
   */
  public static getHospitalPrivateKey(facilityId: string): string | null {
    return HOSPITAL_PRIVATE_KEYS_REGISTRY[facilityId] || null;
  }

  /**
   * Clears cached keys (for testing or key rotation).
   */
  public static clearCache(): void {
    this._memoryCache.clear();
    for (const key of TRUSTED_NATIONAL_HOSPITAL_KEYS) {
      this._memoryCache.set(key.facilityId, key);
    }
  }
}

export default HospitalKeyRegistryService;
