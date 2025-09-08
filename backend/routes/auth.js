const express = require('express');
const router = express.Router();
const passport = require('passport');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  } else if (error) {
    return res.status(415).json({ message: error.message });
  }
  next();
};

const {
  register,
  login,
  getMe,
  googleAuth,
  updateProfile,
  changePassword,
  uploadProfilePicture
} = require('../controllers/auth');
const { protect, verifyFirebaseToken } = require('../middleware/auth.js');
const User = require('../models/User.js');
const bcrypt = require("bcryptjs"); 
const jwt = require('jsonwebtoken');

// // Apply CORS handler to all routes
// router.use(handleCors);

// Local auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/google', verifyFirebaseToken, googleAuth);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/profile/picture', protect, upload.single('file'), handleMulterError, uploadProfilePicture);

// Google auth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home
    const token = req.user.getSignedJwtToken();
    res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${token}`);
  }
);

module.exports = router; 