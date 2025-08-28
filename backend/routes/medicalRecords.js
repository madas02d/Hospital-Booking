const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MedicalRecord = require('../models/MedicalRecord');

// Get all medical records for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical record by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Users can only access their own medical records unless they're admin
    if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new medical record
router.post('/', protect, async (req, res) => {
  try {
    const {
      diagnosis,
      treatment,
      medications,
      notes,
      doctorName,
      date
    } = req.body;
    
    const medicalRecord = new MedicalRecord({
      userId: req.user.id,
      diagnosis,
      treatment,
      medications,
      notes,
      doctorName,
      date: date || new Date()
    });
    
    await medicalRecord.save();
    res.status(201).json(medicalRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medical record
router.put('/:id', protect, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Users can only update their own medical records unless they're admin
    if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete medical record
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Users can only delete their own medical records unless they're admin
    if (record.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medical record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

