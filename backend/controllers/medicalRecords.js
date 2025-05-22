const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get all medical records for a patient
// @route   GET /api/medical-records/my-records
// @access  Private
exports.getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user.id })
      .populate('doctor', 'name')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
exports.getMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('doctor', 'name')
      .populate('patient', 'name');

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Make sure user is record owner or doctor
    if (record.patient._id.toString() !== req.user.id && req.user.role !== 'doctor') {
      return res.status(401).json({ message: 'Not authorized to access this record' });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new medical record
// @route   POST /api/medical-records
// @access  Private (Doctor)
exports.createMedicalRecord = async (req, res) => {
  try {
    // Add doctor to req.body
    req.body.doctor = req.user.id;

    const record = await MedicalRecord.create(req.body);

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctor)
exports.updateMedicalRecord = async (req, res) => {
  try {
    let record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Make sure user is doctor who created the record
    if (record.doctor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this record' });
    }

    record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Doctor)
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Make sure user is doctor who created the record
    if (record.doctor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this record' });
    }

    await record.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get upcoming tests
// @route   GET /api/medical-records/upcoming-tests
// @access  Private
exports.getUpcomingTests = async (req, res) => {
  try {
    const now = new Date();
    const records = await MedicalRecord.find({
      patient: req.user.id,
      recordType: 'test_result',
      followUpRequired: true,
      followUpDate: { $gte: now }
    })
    .sort('followUpDate')
    .populate('doctor', 'name');

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}; 