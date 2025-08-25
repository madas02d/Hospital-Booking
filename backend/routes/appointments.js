const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect, handleCors, authorize } = require('../middleware/auth');

// Apply CORS handler to all routes
router.use(handleCors);

// Helper: Check if date is weekend
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday=0, Saturday=6
}

// Helper: List of German public holidays (example for 2024, can be improved)
const GERMAN_PUBLIC_HOLIDAYS_2024 = [
  '2024-01-01', // New Year's Day
  '2024-03-29', // Good Friday
  '2024-04-01', // Easter Monday
  '2024-05-01', // Labour Day
  '2024-05-09', // Ascension Day
  '2024-05-20', // Whit Monday
  '2024-10-03', // German Unity Day
  '2024-12-25', // Christmas Day
  '2024-12-26', // 2nd Christmas Day
];
function isGermanHoliday(date) {
  const d = date.toISOString().slice(0, 10);
  return GERMAN_PUBLIC_HOLIDAYS_2024.includes(d);
}

// Helper: Check if time is between 7:00 and 18:00
function isWithinWorkingHours(time) {
  const [hour, minute] = time.split(':').map(Number);
  return (hour > 7 || (hour === 7 && minute >= 0)) && (hour < 18 || (hour === 18 && minute === 0));
}

// Helper: Parse time string to minutes
function timeToMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

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
      date,
      time,
      reason,
      notes
    } = req.body;

    const appointmentDate = new Date(date);
    if (isWeekend(appointmentDate)) {
      return res.status(400).json({ message: 'Cannot book appointments on weekends.' });
    }
    if (isGermanHoliday(appointmentDate)) {
      return res.status(400).json({ message: 'Cannot book appointments on German public holidays.' });
    }
    if (!isWithinWorkingHours(time)) {
      return res.status(400).json({ message: 'Appointments must be between 07:00 and 18:00.' });
    }

    // Check for 30 min gap for the same doctor (block against pending and confirmed)
    const existingAppointments = await Appointment.find({
      doctorId,
      date: appointmentDate,
      status: { $in: ['pending', 'confirmed'] }
    });
    const requestedTime = timeToMinutes(time);
    for (const appt of existingAppointments) {
      const apptTime = timeToMinutes(appt.time);
      if (Math.abs(apptTime - requestedTime) < 30) {
        return res.status(409).json({ message: 'There must be at least 30 minutes between appointments for the same doctor.' });
      }
    }

    // Check for double booking (same doctor, date, time)
    const existing = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      time,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked for this doctor.' });
    }

    const appointment = new Appointment({
      userId: req.user.id,
      doctorId,
      doctorName,
      specialty,
      date,
      time,
      reason,
      notes
      // status defaults to 'pending'
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm an appointment (doctor or admin)
router.patch('/:id/confirm', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be confirmed' });
    }
    appointment.status = 'confirmed';
    appointment.confirmedAt = new Date();
    await appointment.save();
    res.json(appointment);
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