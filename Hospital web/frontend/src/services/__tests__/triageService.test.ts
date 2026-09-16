import { describe, it, expect } from "vitest";
import { normalizeTriageResult, getDepartmentLocation, TriageResult } from "../triageService";

describe("Triage Service & Normalization Logic", () => {
  it("normalizes a raw response where explanation is an array of objects without crashing", () => {
    const rawBackendResponse = {
      priority: "HIGH",
      priorityScore: 68,
      riskLevel: "High",
      confidence: 96,
      department: "Cardiology",
      departmentReason: "Assigned to Cardiology based on chest pain and severe hypertension.",
      clinicalSummary: "Multiple physiological signals indicate HIGH acuity.",
      keyRiskFactors: ["Hypertensive Crisis", "Potential Acute Coronary Syndrome"],
      explanation: [
        { factor: "Blood Pressure", finding: "185/115 mmHg (Hypertensive Crisis)", impact: "HIGH" },
        { factor: "Cardiac Presentation", finding: "Reported crushing chest pain", impact: "HIGH" }
      ],
      modelUsed: "Clinical Decision Support Rules",
      modelStatus: "LOCAL ENGINE",
      isSimulated: true
    };

    const patientData = {
      patientId: "PID-101",
      name: "Ramesh Patel",
      age: "58",
      gender: "Male",
      bloodPressure: "185/115",
      heartRate: "112",
      oxygenLevel: "94",
      temperature: "99.1",
      symptoms: "crushing chest pain radiating to left arm",
      history: ["Hypertension", "Diabetes"]
    };

    const normalized: TriageResult = normalizeTriageResult(rawBackendResponse, patientData);

    expect(normalized).toBeDefined();
    expect(typeof normalized.explanation).toBe("string");
    expect(normalized.priority).toBe("HIGH");
    expect(normalized.riskScore).toBe(68);
    expect(normalized.confidence).toBe(96);
    expect(normalized.department).toBe("Cardiology");
    expect(normalized.departmentLocation).toContain("Cardiac Care Unit");
    expect(normalized.riskFactors).toHaveLength(2);
    expect(normalized.clinicalEvidence.findings).toHaveLength(2);
    expect(normalized.clinicalEvidence.findings[0].impact).toBe("HIGH");
  });

  it("handles Case 1: Normal Vitals (Low Acuity)", () => {
    const raw = {
      priority: "LOW",
      priorityScore: 18,
      confidence: 98,
      department: "General Medicine",
      departmentReason: "Vitals within standard physiological ranges.",
      explanation: "Standard outpatient evaluation recommended.",
      riskFactors: []
    };

    const normalized = normalizeTriageResult(raw, { patientId: "PID-001", name: "Ananya", age: "25" });
    expect(normalized.priority).toBe("LOW");
    expect(normalized.riskLevel).toBe("Low");
    expect(normalized.riskScore).toBe(18);
    expect(normalized.department).toBe("General Medicine");
    expect(normalized.departmentLocation).toContain("General OPD");
  });

  it("handles Case 2: Moderate Abnormality (Moderate Acuity)", () => {
    const raw = {
      priority: "MODERATE",
      priorityScore: 42,
      confidence: 92,
      department: "General Medicine",
      departmentReason: "Mild pyrexia and elevated pulse.",
      explanation: "Moderate acuity observed. Bedside monitoring indicated.",
      keyRiskFactors: ["Mild Pyrexia", "Sinus Tachycardia"]
    };

    const normalized = normalizeTriageResult(raw, { patientId: "PID-002", name: "Suresh", age: "34" });
    expect(normalized.priority).toBe("MODERATE");
    expect(normalized.riskScore).toBe(42);
    expect(normalized.riskFactors).toContain("Mild Pyrexia");
    expect(normalized.departmentLocation).toContain("General OPD");
  });

  it("handles Case 3: Critical Acuity Pattern", () => {
    const raw = {
      priority: "CRITICAL",
      priorityScore: 92,
      confidence: 99,
      department: "Emergency Medicine",
      departmentReason: "Critical hypoxia requiring immediate resuscitation bay admission.",
      clinicalSummary: "Critical physiological compromise.",
      keyRiskFactors: ["Critical Hypoxia (<88%)", "Altered Mental Status"],
      explanation: [
        { factor: "Oxygen Saturation", finding: "SpO2 84%", impact: "HIGH" },
        { factor: "Consciousness Level", finding: "Patient unresponsive", impact: "HIGH" }
      ]
    };

    const normalized = normalizeTriageResult(raw, { patientId: "PID-003", name: "Elderly Patient", age: "76" });
    expect(normalized.priority).toBe("CRITICAL");
    expect(normalized.riskScore).toBe(92);
    expect(normalized.department).toBe("Emergency Medicine");
    expect(normalized.departmentLocation).toContain("Ground Floor - Emergency Wing");
  });

  it("maps department locations accurately across specialties", () => {
    expect(getDepartmentLocation("Emergency Medicine")).toContain("Ground Floor - Emergency Wing");
    expect(getDepartmentLocation("Cardiology")).toContain("Cardiac Care Unit (CCU)");
    expect(getDepartmentLocation("Pulmonology")).toContain("Respiratory Care Ward");
    expect(getDepartmentLocation("Neurology")).toContain("Neurovascular Unit");
    expect(getDepartmentLocation("Gastroenterology")).toContain("Gastroenterology Clinic");
    expect(getDepartmentLocation("Orthopedics")).toContain("Musculoskeletal & Ortho OPD");
    expect(getDepartmentLocation("Oncology")).toContain("Cancer Care Pavilion");
    expect(getDepartmentLocation("General Medicine")).toContain("General OPD");
  });
});