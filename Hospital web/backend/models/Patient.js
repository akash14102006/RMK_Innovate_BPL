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
    assessment: {
        riskLevel: String,
        riskScore: Number,
        confidence: Number,
        department: String,
        explanation: String,
        riskFactors: [String],
        riskMarkers: [String],
        engine: String
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

/* updated */
