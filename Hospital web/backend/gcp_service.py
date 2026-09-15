"""
gcp_service.py — Google Cloud Platform Services Integration
============================================================
Bharat PulseLink | Team: Quiet-Coders

This module integrates the following Google Cloud services:
  1. Google OAuth 2.0  — Identity verification via google-auth-library
  2. Google Generative AI (Gemini 1.5 Flash) — Clinical LLM triage engine
  3. Google Cloud Storage (GCS) — EHR PDF report upload & retrieval

OAuth 2.0 Client ID : 16015111956-u63el706kb1h8fjlecf943vdrkdht4vf.apps.googleusercontent.com
GCP Project         : healthpulse-ai
GCS Bucket          : healthpulse-ehr-reports

Dependencies:
    pip install google-auth google-auth-oauthlib google-auth-httplib2
    pip install google-cloud-storage google-generativeai requests
"""

import os
import json
import requests
from datetime import datetime

# ── Google Auth ────────────────────────────────────────────────────────────────
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ── Google Generative AI (Gemini) ──────────────────────────────────────────────
import google.generativeai as genai

# ── Google Cloud Storage ───────────────────────────────────────────────────────
from google.cloud import storage

# ==============================================================================
#  CONFIGURATION
# ==============================================================================

GCP_CLIENT_ID   = os.getenv(
    "GOOGLE_CLIENT_ID",
    "16015111956-u63el706kb1h8fjlecf943vdrkdht4vf.apps.googleusercontent.com"
)
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "healthpulse-ehr-reports")
GCS_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")


# ==============================================================================
#  1. GOOGLE OAUTH 2.0 — ID TOKEN VERIFICATION
# ==============================================================================

class GoogleAuthService:
    """
    Verifies Google ID Tokens sent from the frontend after a user signs in
    with Google OAuth 2.0 (Web Client 1 — created 1 Dec 2025).

    Frontend sends: credential (JWT ID Token from Google Sign-In button)
    Backend verifies: audience must match GCP_CLIENT_ID
    """

    def __init__(self, client_id: str = GCP_CLIENT_ID):
        self.client_id = client_id
        self._request  = google_requests.Request()

    def verify_google_token(self, credential: str) -> dict:
        """
        Verify a Google ID Token (credential) from the frontend.

        Args:
            credential: The JWT token received from the Google Sign-In button.

        Returns:
            dict: Verified user payload containing email, name, picture, sub.

        Raises:
            ValueError: If the token is invalid or expired.
        """
        try:
            payload = id_token.verify_oauth2_token(
                credential,
                self._request,
                self.client_id
            )

            # Token is valid — extract user details
            user_info = {
                "google_id" : payload["sub"],
                "email"     : payload["email"],
                "name"      : payload.get("name", ""),
                "picture"   : payload.get("picture", ""),
                "verified"  : payload.get("email_verified", False),
                "issued_at" : datetime.utcfromtimestamp(payload["iat"]).isoformat(),
                "expires_at": datetime.utcfromtimestamp(payload["exp"]).isoformat(),
            }

            print(f"[GCP Auth] ✅ Token verified for: {user_info['email']}")
            return {"success": True, "user": user_info}

        except ValueError as e:
            print(f"[GCP Auth] ❌ Token verification failed: {e}")
            return {"success": False, "error": str(e)}

    def get_user_profile_from_token(self, access_token: str) -> dict:
        """
        Fetch user profile from Google People API using an OAuth 2.0 access token.
        Used for fetching additional profile data post-authentication.

        Args:
            access_token: OAuth 2.0 access token from the frontend.

        Returns:
            dict: User profile information from Google.
        """
        url    = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            profile = response.json()
            print(f"[GCP Auth] 👤 Profile fetched: {profile.get('email', 'unknown')}")
            return {"success": True, "profile": profile}
        except requests.RequestException as e:
            print(f"[GCP Auth] ❌ Profile fetch failed: {e}")
            return {"success": False, "error": str(e)}


# ==============================================================================
#  2. GOOGLE GENERATIVE AI — GEMINI 1.5 FLASH (CLINICAL TRIAGE ENGINE)
# ==============================================================================

class GeminiTriageService:
    """
    Uses Google Gemini 1.5 Flash (via Google Generative AI API) as the
    primary clinical triage engine for Bharat PulseLink.

    API Key: Configured in GCP Console → Credentials → API Key 1
             Restricted to HTTP referrers + Generative Language API only.

    Workflow:
        Patient vitals/symptoms → Gemini prompt → Structured JSON triage result
    """

    MODELS = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.0-pro",
    ]

    def __init__(self, api_key: str = GEMINI_API_KEY):
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY is not set. "
                "Configure it in GCP Console → APIs & Services → Credentials."
            )
        genai.configure(api_key=api_key)
        self.api_key = api_key
        print(f"[GCP Gemini] ✅ Initialized with key: {api_key[:8]}...")

    def perform_llm_triage(self, patient_data: dict) -> dict:
        """
        Run AI triage for a patient using Google Gemini 1.5 Flash.

        Args:
            patient_data: dict containing vitals and clinical context:
                {
                    "age": 45, "gender": "Male",
                    "temperature": 102.4, "heartRate": 108,
                    "bloodPressure": "160/100", "oxygenLevel": 94,
                    "symptoms": "chest pain, shortness of breath",
                    "history": ["Hypertension", "Diabetes"]
                }

        Returns:
            dict: Triage assessment:
                {
                    "riskLevel": "High",
                    "riskScore": 82,
                    "confidence": 0.97,
                    "department": "Cardiology",
                    "explanation": "...",
                    "keyRiskFactors": ["Chest pain", "SpO2 < 95%"]
                }
        """
        prompt = f"""
ROLE: Senior Emergency Medicine Specialist & Clinical Decision Support AI.
TASK: Perform emergency medical triage based on ESI (Emergency Severity Index) v4.0.

PATIENT VITALS:
- Age           : {patient_data.get('age', 'N/A')}
- Gender        : {patient_data.get('gender', 'N/A')}
- Temperature   : {patient_data.get('temperature', 'N/A')} °F
- Heart Rate    : {patient_data.get('heartRate', 'N/A')} BPM
- Blood Pressure: {patient_data.get('bloodPressure', 'N/A')} mmHg
- SpO2          : {patient_data.get('oxygenLevel', 'N/A')} %

CLINICAL CONTEXT:
- Symptoms : {patient_data.get('symptoms', 'N/A')}
- History  : {json.dumps(patient_data.get('history', []))}

STRICT MEDICAL CRITERIA:
1. LEVEL 1 (CRITICAL)  : SpO2 < 88%, Systolic BP > 200, HR > 140
2. LEVEL 2 (EMERGENT)  : Systolic BP > 180, chest pain, stroke signs
3. LEVEL 3 (URGENT)    : Mild vitals changes, requires multiple resources

OUTPUT: Respond in valid JSON ONLY. No markdown. No preamble.
{{
    "riskLevel"      : "Low | Medium | High",
    "riskScore"      : 0-100,
    "confidence"     : 0.0-1.0,
    "department"     : "Specialized Hospital Department",
    "explanation"    : "Professional clinical rationale.",
    "keyRiskFactors" : ["Factor A", "Factor B"]
}}
"""
        last_error = None
        for model_name in self.MODELS:
            try:
                print(f"[GCP Gemini] 🔄 Attempting triage with {model_name}...")
                model  = genai.GenerativeModel(
                    model_name,
                    generation_config={"response_mime_type": "application/json"}
                )
                result = model.generate_content(prompt)
                text   = result.text.replace("```json", "").replace("```", "").strip()
                data   = json.loads(text)

                print(f"[GCP Gemini] ✅ Triage complete — Risk: {data.get('riskLevel')}, "
                      f"Confidence: {data.get('confidence')}")
                return {"success": True, "engine": model_name, **data}

            except Exception as e:
                print(f"[GCP Gemini] ⚠️  {model_name} failed: {e}")
                last_error = e

        return {
            "success": False,
            "error"  : str(last_error),
            "engine" : "Gemini — all models failed, using fallback"
        }

    def parse_ehr_document(self, raw_text: str) -> dict:
        """
        Use Gemini to parse unstructured EHR/medical document text
        and extract structured patient data fields.

        Args:
            raw_text: Raw extracted text from a PDF/DOCX medical record.

        Returns:
            dict: Structured patient fields (name, age, vitals, history, etc.)
        """
        if not raw_text or len(raw_text.strip()) < 10:
            return {}

        prompt = f"""
You are a medical data extraction assistant.
Extract the following fields from the raw medical record text below.
Return valid JSON ONLY. No markdown.

FIELDS: name, age, gender, phone, bloodGroup, temperature, heartRate,
        bloodPressure, oxygenLevel, symptoms, history (array of conditions)

RAW TEXT:
\"\"\"
{raw_text}
\"\"\"

If a field is not found, use null. For history, use [].
"""
        try:
            model  = genai.GenerativeModel("gemini-1.5-flash")
            result = model.generate_content(prompt)
            text   = result.text.replace("```json", "").replace("```", "").strip()
            data   = json.loads(text)
            print("[GCP Gemini] ✅ EHR document parsed successfully")
            return data
        except Exception as e:
            print(f"[GCP Gemini] ❌ EHR parse failed: {e}")
            return {}


# ==============================================================================
#  3. GOOGLE CLOUD STORAGE — EHR PDF REPORT UPLOAD & RETRIEVAL
# ==============================================================================

class GCSStorageService:
    """
    Uploads and retrieves EHR PDF reports to/from Google Cloud Storage.

    Bucket  : healthpulse-ehr-reports  (private, IAM-controlled)
    Auth    : GOOGLE_APPLICATION_CREDENTIALS (service account JSON)
    Usage   : After AI triage, a PDF is auto-generated and stored in GCS
              for secure long-term access by authorized medical staff.
    """

    def __init__(self, bucket_name: str = GCS_BUCKET_NAME):
        try:
            if GCS_CREDENTIALS:
                self.client = storage.Client.from_service_account_json(GCS_CREDENTIALS)
            else:
                # Uses Application Default Credentials (ADC)
                self.client = storage.Client()

            self.bucket = self.client.bucket(bucket_name)
            print(f"[GCP Storage] ✅ Connected to bucket: {bucket_name}")
        except Exception as e:
            print(f"[GCP Storage] ❌ Init failed: {e}")
            self.client = None
            self.bucket = None

    def upload_ehr_pdf(self, pdf_bytes: bytes, patient_id: str) -> dict:
        """
        Upload a generated EHR PDF report to Google Cloud Storage.

        Args:
            pdf_bytes  : Binary PDF content to upload.
            patient_id : Unique patient identifier (e.g., "P-4821").

        Returns:
            dict: Upload result with GCS URI and public/signed URL.
        """
        if not self.bucket:
            return {"success": False, "error": "GCS not initialized"}

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        blob_name = f"ehr_reports/{patient_id}_{timestamp}.pdf"

        try:
            blob = self.bucket.blob(blob_name)
            blob.upload_from_string(pdf_bytes, content_type="application/pdf")

            # Generate a signed URL valid for 1 hour (for secure doctor access)
            signed_url = blob.generate_signed_url(
                expiration=3600,
                method="GET"
            )

            gcs_uri = f"gs://{self.bucket.name}/{blob_name}"
            print(f"[GCP Storage] ✅ EHR uploaded: {gcs_uri}")

            return {
                "success"   : True,
                "gcs_uri"   : gcs_uri,
                "signed_url": signed_url,
                "blob_name" : blob_name,
                "patient_id": patient_id,
                "uploaded_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"[GCP Storage] ❌ Upload failed: {e}")
            return {"success": False, "error": str(e)}

    def download_ehr_pdf(self, blob_name: str) -> bytes:
        """
        Download an EHR PDF from Google Cloud Storage.

        Args:
            blob_name: The GCS object path (e.g., "ehr_reports/P-4821_20260308.pdf")

        Returns:
            bytes: PDF content, or empty bytes on failure.
        """
        if not self.bucket:
            return b""
        try:
            blob = self.bucket.blob(blob_name)
            data = blob.download_as_bytes()
            print(f"[GCP Storage] ✅ Downloaded: {blob_name} ({len(data)} bytes)")
            return data
        except Exception as e:
            print(f"[GCP Storage] ❌ Download failed: {e}")
            return b""

    def list_patient_reports(self, patient_id: str) -> list:
        """
        List all EHR reports stored in GCS for a specific patient.

        Args:
            patient_id: The patient ID to search for (e.g., "P-4821").

        Returns:
            list: List of dicts with blob_name, size, created_at for each report.
        """
        if not self.bucket:
            return []
        prefix = f"ehr_reports/{patient_id}_"
        blobs  = list(self.client.list_blobs(self.bucket, prefix=prefix))

        reports = [
            {
                "blob_name" : b.name,
                "size_bytes": b.size,
                "created_at": b.time_created.isoformat() if b.time_created else None,
            }
            for b in blobs
        ]
        print(f"[GCP Storage] 📋 Found {len(reports)} reports for {patient_id}")
        return reports


# ==============================================================================
#  UNIFIED GCP SERVICE — SINGLE ENTRY POINT
# ==============================================================================

class BharatPulseLinkGCPService:
    """
    Unified entry point for all Google Cloud Platform services used in
    Bharat PulseLink. Initialized once and reused across the application.

    Services:
        .auth     → Google OAuth 2.0 token verification
        .gemini   → Gemini 1.5 Flash clinical triage & EHR parsing
        .storage  → Cloud Storage EHR PDF upload/retrieval
    """

    def __init__(self):
        print("\n[GCP] 🚀 Initializing Bharat PulseLink Google Cloud Services...")

        # 1. OAuth 2.0
        self.auth = GoogleAuthService(client_id=GCP_CLIENT_ID)
        print("[GCP] ✅ Google OAuth 2.0 ready")

        # 2. Gemini AI
        try:
            self.gemini = GeminiTriageService(api_key=GEMINI_API_KEY)
        except EnvironmentError as e:
            print(f"[GCP] ⚠️  Gemini not available: {e}")
            self.gemini = None

        # 3. Cloud Storage
        try:
            self.storage = GCSStorageService(bucket_name=GCS_BUCKET_NAME)
        except Exception as e:
            print(f"[GCP] ⚠️  Cloud Storage not available: {e}")
            self.storage = None

        print("[GCP] ✅ All GCP services initialized\n")

    def triage_patient(self, patient_data: dict, pdf_bytes: bytes = None) -> dict:
        """
        Full triage pipeline using GCP services:
          1. Gemini AI → generate triage assessment
          2. Cloud Storage → upload EHR PDF report

        Args:
            patient_data : Patient vitals and clinical info dict.
            pdf_bytes    : Optional generated EHR PDF to store in GCS.

        Returns:
            dict: Combined triage result + storage reference.
        """
        result = {}

        # Step 1: AI Triage via Gemini
        if self.gemini:
            triage = self.gemini.perform_llm_triage(patient_data)
            result.update(triage)
        else:
            result["warning"] = "Gemini unavailable — using local fallback"

        # Step 2: Upload EHR PDF to GCS
        if pdf_bytes and self.storage:
            patient_id  = patient_data.get("patientId", f"P-{datetime.utcnow().timestamp():.0f}")
            upload_info = self.storage.upload_ehr_pdf(pdf_bytes, patient_id)
            result["gcs_upload"] = upload_info

        return result


# ==============================================================================
#  STANDALONE TEST
# ==============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  Bharat PulseLink — GCP Services Integration Test")
    print("  Team: Quiet-Coders")
    print("=" * 60)

    # Initialize all GCP services
    gcp = BharatPulseLinkGCPService()

    # ── Test 1: Gemini AI Triage ───────────────────────────────────────────────
    if gcp.gemini:
        print("\n[Test 1] Running AI triage via Google Gemini 1.5 Flash...")
        sample_patient = {
            "patientId"    : "P-4821",
            "age"          : 58,
            "gender"       : "Male",
            "temperature"  : 102.8,
            "heartRate"    : 112,
            "bloodPressure": "175/105",
            "oxygenLevel"  : 91,
            "symptoms"     : "Chest pain radiating to left arm, shortness of breath, sweating",
            "history"      : ["Hypertension", "Diabetes", "Heart Disease"]
        }
        triage_result = gcp.gemini.perform_llm_triage(sample_patient)
        print(f"\n  Risk Level  : {triage_result.get('riskLevel')}")
        print(f"  Risk Score  : {triage_result.get('riskScore')}")
        print(f"  Confidence  : {triage_result.get('confidence')}")
        print(f"  Department  : {triage_result.get('department')}")
        print(f"  Explanation : {triage_result.get('explanation', '')[:80]}...")

    # ── Test 2: OAuth Token Verification (mock) ────────────────────────────────
    print("\n[Test 2] Google OAuth 2.0 service initialized:")
    print(f"  Client ID   : {GCP_CLIENT_ID[:30]}...")
    print(f"  Auth Service: Ready ✅")

    # ── Test 3: Cloud Storage ──────────────────────────────────────────────────
    if gcp.storage:
        print("\n[Test 3] Google Cloud Storage:")
        print(f"  Bucket      : {GCS_BUCKET_NAME}")
        print(f"  Status      : {'Connected ✅' if gcp.storage.bucket else 'Not connected ❌'}")

    print("\n[GCP] ✅ Integration test complete")
    print("=" * 60)
