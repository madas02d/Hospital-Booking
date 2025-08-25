const express = require('express');
const router = express.Router();
const passport = require('passport');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const {
  register,
  login,
  getMe,
  googleAuth,
  updateProfile,
  changePassword,
  uploadProfilePicture
} = require('../controllers/auth');
const { protect, verifyFirebaseToken, handleCors } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Apply CORS handler to all routes
router.use(handleCors);

// Local auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/google', verifyFirebaseToken, googleAuth);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/profile/picture', protect, upload.single('file'), uploadProfilePicture);

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