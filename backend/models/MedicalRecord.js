const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordType: {
    type: String,
    enum: ['test_result', 'diagnosis', 'prescription', 'vaccination', 'procedure'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  // For test results
  testResults: {
    testName: String,
    result: String,
    unit: String,
    referenceRange: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical'],
      default: 'normal'
    },
    notes: String,
    attachments: [{
      name: String,
      url: String,
      type: String
    }]
  },
  // For prescriptions
  prescription: {
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    refills: Number
  },
  // For procedures
  procedure: {
    name: String,
    description: String,
    anesthesia: String,
    complications: String,
    followUpDate: Date
  },
  // For vaccinations
  vaccination: {
    name: String,
    manufacturer: String,
    lotNumber: String,
    nextDueDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
MedicalRecordSchema.index({ patient: 1, date: -1 });
MedicalRecordSchema.index({ recordType: 1 });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema); 