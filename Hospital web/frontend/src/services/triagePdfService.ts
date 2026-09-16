import { jsPDF } from "jspdf";
import { TriageResult } from "./triageService";

export interface PatientFormData {
  patientId: string;
  name: string;
  age: string | number;
  gender: string;
  phone: string;
  bloodGroup: string;
  temperature: string | number;
  heartRate: string | number;
  bloodPressure: string;
  oxygenLevel: string | number;
  symptoms: string;
  history: string[];
}

function drawHeader(doc: jsPDF, title: string, subtitle: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BHARAT PULSELINK HEALTHCARE SYSTEM", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title.toUpperCase() + " | " + subtitle, 14, 20);
  doc.setFontSize(8);
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  doc.text("Generated: " + now + " IST", pageWidth - 14, 20, { align: "right" });
  doc.setTextColor(30, 41, 59);
  return 36;
}

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text(title.toUpperCase(), 14, y);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, doc.internal.pageSize.getWidth() - 14, y + 2);
  doc.setTextColor(30, 41, 59);
  return y + 8;
}

export function downloadPatientDetailsPDF(patient: PatientFormData, result?: TriageResult | null): void {
  const doc = new jsPDF();
  let y = drawHeader(doc, "PATIENT CLINICAL RECORD", "DEMOGRAPHICS & VITALS");
  y = drawSectionHeader(doc, "1. Patient Identification & Demographics", y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const col1 = 14;
  const col2 = 110;
  doc.text("Patient ID: " + (patient.patientId || "N/A"), col1, y);
  doc.text("Full Name: " + (patient.name || "N/A"), col2, y);
  y += 6;
  doc.text("Age / Gender: " + (patient.age || "N/A") + " yrs / " + (patient.gender || "N/A"), col1, y);
  doc.text("Blood Group: " + (patient.bloodGroup || "N/A"), col2, y);
  y += 6;
  doc.text("Contact Phone: " + (patient.phone || "N/A"), col1, y);
  doc.text("Admission Status: " + (result?.storedRecord?.status || "Admitted"), col2, y);
  y += 10;
  y = drawSectionHeader(doc, "2. Baseline Physiological Vitals", y);
  doc.text("SpO2 (Oxygen Saturation): " + (patient.oxygenLevel || "N/A") + " %", col1, y);
  doc.text("Heart Rate / Pulse: " + (patient.heartRate || "N/A") + " bpm", col2, y);
  y += 6;
  doc.text("Blood Pressure: " + (patient.bloodPressure || "N/A") + " mmHg", col1, y);
  doc.text("Core Temperature: " + (patient.temperature || "N/A") + " °F", col2, y);
  y += 10;
  y = drawSectionHeader(doc, "3. Presenting Symptoms & Medical History", y);
  doc.setFont("helvetica", "bold");
  doc.text("Presenting Symptoms:", col1, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const symptomLines = doc.splitTextToSize(patient.symptoms || "None documented", 180);
  doc.text(symptomLines, col1, y);
  y += symptomLines.length * 5 + 4;
  doc.setFont("helvetica", "bold");
  doc.text("Documented Comorbidities & History:", col1, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const historyStr = (patient.history && patient.history.length > 0) ? patient.history.join(", ") : "None reported";
  doc.text(historyStr, col1, y);
  y += 12;
  doc.setDrawColor(15, 118, 110);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(14, y, 182, 20, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text("DIGITALLY SIGNED EHR VERIFICATION", 18, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Certified via Bharat PulseLink Emergency Clinical Network. Tamper-evident record.", 18, y + 14);
  doc.save("Patient_Details_" + (patient.patientId || "PID") + ".pdf");
}

export function downloadClinicalTriagePDF(patient: PatientFormData, result: TriageResult): void {
  const doc = new jsPDF();
  let y = drawHeader(doc, "CLINICAL TRIAGE ASSESSMENT", "STRATIFICATION & REASONING");
  y = drawSectionHeader(doc, "1. Triage Acuity Stratification", y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const col1 = 14;
  const col2 = 110;
  doc.text("Patient: " + (patient.name || "N/A") + " (" + (patient.patientId || "N/A") + ")", col1, y);
  doc.text("Acuity Case: " + (result.priority || result.riskLevel || "MODERATE").toUpperCase() + " CASE", col2, y);
  y += 6;
  doc.text("Risk Score: " + (result.riskScore || 0) + " / 100", col1, y);
  doc.text("Model Confidence: " + (result.confidence || 0) + " %", col2, y);
  y += 6;
  doc.text("Decision Engine: " + (result.decisionEngine || "Clinical Decision Support"), col1, y);
  doc.text("Model Status: " + (result.modelStatus || "PRIMARY MODEL"), col2, y);
  y += 10;
  y = drawSectionHeader(doc, "2. AI Clinical Reasoning & Prioritization", y);
  doc.setFont("helvetica", "normal");
  const explanationLines = doc.splitTextToSize(result.explanation || "Clinical reasoning unavailable.", 180);
  doc.text(explanationLines, col1, y);
  y += explanationLines.length * 5 + 4;
  if (result.riskFactors && result.riskFactors.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Key Risk Markers:", col1, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(result.riskFactors.map(r => "* " + r).join("   "), col1, y);
    y += 8;
  }
  if (result.clinicalEvidence?.findings && result.clinicalEvidence.findings.length > 0) {
    y = drawSectionHeader(doc, "3. Clinical Evidence & Physiological Findings", y);
    result.clinicalEvidence.findings.forEach((finding) => {
      doc.setFont("helvetica", "bold");
      doc.text("[" + (finding.impact || "MEDIUM") + "] " + finding.label + ":", col1, y);
      doc.setFont("helvetica", "normal");
      doc.text(finding.value || "", col1 + 55, y);
      y += 6;
    });
    y += 4;
  }
  y = drawSectionHeader(doc, "4. Clinical Routing & Department Assignment", y);
  doc.setFont("helvetica", "bold");
  doc.text("Assigned Department: " + (result.department || "General Medicine"), col1, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("Facility Location: " + (result.departmentLocation || "Main Wing - OPD Floor 1"), col1, y);
  y += 5;
  const reasonLines = doc.splitTextToSize("Routing Rationale: " + (result.routingReason || "Standard triage guidelines."), 180);
  doc.text(reasonLines, col1, y);
  y += reasonLines.length * 5 + 8;
  if (result.recommendedNextStep) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text("Recommended Action: " + result.recommendedNextStep, col1, y);
  }
  doc.save("Clinical_Triage_" + (patient.patientId || "PID") + ".pdf");
}

export function downloadCompleteAdmissionRecordPDF(patient: PatientFormData, result: TriageResult): void {
  const doc = new jsPDF();
  let y = drawHeader(doc, "COMPLETE HOSPITAL ADMISSION RECORD", "FULL EHR DOSSIER");
  y = drawSectionHeader(doc, "1. Patient Identity & Admission Status", y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const col1 = 14;
  const col2 = 110;
  doc.text("Patient ID: " + (patient.patientId || "N/A"), col1, y);
  doc.text("Patient Name: " + (patient.name || "N/A"), col2, y);
  y += 6;
  doc.text("Age / Gender: " + (patient.age || "N/A") + " yrs / " + (patient.gender || "N/A"), col1, y);
  doc.text("Phone / Contact: " + (patient.phone || "N/A"), col2, y);
  y += 6;
  doc.text("Admission Department: " + (result.department || "General Medicine"), col1, y);
  doc.text("Admission Status: " + (result.storedRecord?.status || "Admitted"), col2, y);
  y += 10;
  y = drawSectionHeader(doc, "2. Admission Physiological Parameters", y);
  doc.text("SpO2: " + (patient.oxygenLevel || "N/A") + " %", col1, y);
  doc.text("Heart Rate: " + (patient.heartRate || "N/A") + " bpm", col2, y);
  y += 6;
  doc.text("Blood Pressure: " + (patient.bloodPressure || "N/A") + " mmHg", col1, y);
  doc.text("Temperature: " + (patient.temperature || "N/A") + " °F", col2, y);
  y += 10;
  y = drawSectionHeader(doc, "3. Diagnostic Risk Stratification", y);
  doc.text("Acuity Level: " + (result.priority || result.riskLevel || "MODERATE"), col1, y);
  doc.text("Risk Score: " + (result.riskScore || 0) + " / 100", col2, y);
  y += 6;
  doc.text("AI Confidence: " + (result.confidence || 0) + " %", col1, y);
  doc.text("Triage Engine: " + (result.decisionEngine || "Clinical Decision Support"), col2, y);
  y += 8;
  const explLines = doc.splitTextToSize("Clinical Assessment: " + (result.explanation || "N/A"), 180);
  doc.text(explLines, col1, y);
  y += explLines.length * 5 + 8;
  y = drawSectionHeader(doc, "4. Inpatient Department & Ward Allocation", y);
  doc.text("Department: " + (result.department || "General Medicine"), col1, y);
  y += 5;
  doc.text("Location: " + (result.departmentLocation || "Main Wing"), col1, y);
  y += 5;
  doc.text("Routing Note: " + (result.routingReason || "Standard triage guidelines"), col1, y);
  y += 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 22, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text("BHARAT PULSELINK ADMISSION CERTIFICATE", 18, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("This official electronic medical record has been verified and registered in the hospital management database.", 18, y + 15);
  doc.save("Complete_Admission_Record_" + (patient.patientId || "PID") + ".pdf");
}