const express = require('express');
const router = express.Router();
const {
  getMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getUpcomingTests
} = require('../controllers/medicalRecords');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Patient routes
router.get('/my-records', getMedicalRecords);
router.get('/upcoming-tests', getUpcomingTests);
router.get('/:id', getMedicalRecord);

// Doctor routes
router.post('/', authorize('doctor', 'admin'), createMedicalRecord);
router.put('/:id', authorize('doctor', 'admin'), updateMedicalRecord);
router.delete('/:id', authorize('doctor', 'admin'), deleteMedicalRecord);

module.exports = router; 