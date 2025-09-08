const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  insurance: {
    type: String,
    required: false
  },
  consultationFee: {
    type: Number,
    required: false,
    default: 0
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  clinicAddress: {
    type: String
  },
  clinicType: {
    type: String
  },
  clinicPhone: {
    type: String
  },
  clinicWebsite: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
