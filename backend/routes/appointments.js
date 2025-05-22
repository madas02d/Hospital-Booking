const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// Get all appointments for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id })
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new appointment
router.post('/', protect, async (req, res) => {
  try {
    const {
      doctorId,
      doctorName,
      specialty,
      consultationFee,
      date,
      time,
      reason,
      notes
    } = req.body;

    const appointment = new Appointment({
      userId: req.user.id,
      doctorId,
      doctorName,
      specialty,
      consultationFee,
      date,
      time,
      reason,
      notes
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel an appointment
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 