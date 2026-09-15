const { jsPDF } = require("jspdf");
const fs = require('fs');
const path = require('path');

/**
 * Generate a structured EHR PDF for a patient assessment
 * @param {Object} patientData Full patient data
 * @param {Object} assessment AI Triage result
 * @returns {Promise<string>} Path to the generated PDF file
 */
async function generateEHRPDF(patientData, assessment) {
    // Ensure the PDFs directory exists
    const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // 1. HOSPITAL HEADER
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Bharat PulseLink", 15, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Electronic Health Record & Triage Summary", 15, 25);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 32);

    y = 50;
    doc.setTextColor(0, 0, 0);

    // 2. PATIENT DETAILS
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. PATIENT IDENTITY", 15, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Patient ID:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientData.patientId}`, 45, y);

    doc.setFont("helvetica", "bold");
    doc.text(`Name:`, 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientData.name}`, 140, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.text(`Age/Gender:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientData.age} yr / ${patientData.gender}`, 45, y);

    doc.setFont("helvetica", "bold");
    doc.text(`Blood Group:`, 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientData.bloodGroup}`, 140, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.text(`Contact:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientData.phone || 'N/A'}`, 45, y);
    y += 12;

    // 3. CLINICAL VITALS
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. CLINICAL VITALS", 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 10;

    const vitals = [
        ["Temperature", `${patientData.temperature || patientData.vitals?.temperature}°F`],
        ["Heart Rate", `${patientData.heartRate || patientData.vitals?.heartRate} BPM`],
        ["Blood Pressure", `${patientData.bloodPressure || patientData.vitals?.bloodPressure} mmHg`],
        ["SpO2 (Oxygen)", `${patientData.oxygenLevel || patientData.vitals?.oxygenLevel}%`]
    ];

    doc.setFontSize(10);
    vitals.forEach((v, i) => {
        const xPos = i % 2 === 0 ? 15 : 110;
        doc.setFont("helvetica", "bold");
        doc.text(`${v[0]}:`, xPos, y);
        doc.setFont("helvetica", "normal");
        doc.text(v[1], xPos + 35, y);
        if (i % 2 !== 0) y += 7;
    });
    y += 10;

    // 4. SYMPTOMS & HISTORY
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. CLINICAL CONTEXT", 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Presenting Symptoms:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const symptomLines = doc.splitTextToSize(patientData.symptoms || "None reported", pageWidth - 30);
    doc.text(symptomLines, 15, y);
    y += (symptomLines.length * 5) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("Medical History:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const historyText = Array.isArray(patientData.history) ? patientData.history.join(", ") : (patientData.history || "No significant history");
    const historyLines = doc.splitTextToSize(historyText, pageWidth - 30);
    doc.text(historyLines, 15, y);
    y += (historyLines.length * 5) + 10;

    // 5. AI TRIAGE SUMMARY
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(10, y - 2, pageWidth - 20, 65, 'F');

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136);
    doc.text("4. AI TRIAGE ASSESSMENT", 15, y + 5);
    y += 12;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // Risk Level Box
    const riskColor = assessment.riskLevel === 'High' ? [220, 38, 38] : (assessment.riskLevel === 'Medium' ? [217, 119, 6] : [22, 163, 74]);
    doc.setDrawColor(...riskColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, y - 4, 40, 15, 2, 2, 'D');
    doc.setFont("helvetica", "bold");
    doc.text("RISK LEVEL", 18, y);
    doc.setTextColor(...riskColor);
    doc.setFontSize(12);
    doc.text(assessment.riskLevel.toUpperCase(), 18, y + 6);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Confidence:`, 65, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${(assessment.confidence * 100).toFixed(1)}%`, 90, y);

    doc.setFont("helvetica", "bold");
    doc.text(`Risk Score:`, 65, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(`${assessment.riskScore}/100`, 90, y + 7);

    doc.setFont("helvetica", "bold");
    doc.text(`Recommended Dept:`, 125, y);
    doc.setFont("helvetica", "normal");
    doc.text(assessment.department, 125, y + 6);
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.text("AI Explanation:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const explLines = doc.splitTextToSize(assessment.explanation, pageWidth - 35);
    doc.text(explLines, 15, y);
    y += (explLines.length * 4) + 8;

    // 6. ADMISSION RECOMMENDATION
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ADMISSION STATUS:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Admit to ${assessment.department} for further observation.`, 60, y);
    y += 15;

    // FOOTER
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Bharat PulseLink Hospital Intelligence System — India's Shared Memory", 15, footerY);
    doc.text("Page 1 of 1", pageWidth - 30, footerY);

    // Placeholder Signature
    doc.line(pageWidth - 70, footerY - 5, pageWidth - 15, footerY - 5);
    doc.text("Digital Signature (Verified)", pageWidth - 70, footerY);

    // Save PDF
    const fileName = `EHR_${patientData.patientId}_${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    // For Node.js, we get the output as a buffer
    const buffer = doc.output('arraybuffer');
    fs.writeFileSync(filePath, Buffer.from(buffer));

    console.log(`[PDF] Generated EHR for ${patientData.name} at ${filePath}`);
    return `/uploads/pdfs/${fileName}`;
}

module.exports = { generateEHRPDF };

/* updated */
