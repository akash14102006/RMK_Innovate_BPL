const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    age: Number,
    gender: String,
    phone: String,
    bloodGroup: String,
    vitals: {
        temperature: String,
        heartRate: String,
        bloodPressure: String,
        oxygenLevel: String
    },
    symptoms: String,
    history: [String],
    allergies: [String],
    medications: [String],
    chronicConditions: [String],
    lastVisit: String,
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    patientContext: mongoose.Schema.Types.Mixed,
    assessment: {
        priority: String,
        priorityScore: Number,
        riskLevel: String,
        riskScore: Number,
        confidence: Number,
        department: String,
        departmentReason: String,
        clinicalSummary: String,
        explanation: mongoose.Schema.Types.Mixed,
        keyRiskFactors: [String],
        riskFactors: [String],
        riskMarkers: [String],
        recommendedNextStep: String,
        modelUsed: String,
        modelStatus: String,
        modelPath: [String],
        engine: String,
        disclaimer: String
    },
    status: {
        type: String,
        enum: ['Waiting', 'Admitted', 'Completed'],
        default: 'Waiting'
    },
    assignedDepartment: String,
    routingReason: String,
    routingPriorityScore: Number,
    departmentQueueStatus: {
        type: String,
        enum: ['Waiting', 'In Progress', 'Completed'],
        default: 'Waiting'
    },
    ownerEmail: {
        type: String,
        required: true,
        index: true
    },
    pdfPath: String
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
