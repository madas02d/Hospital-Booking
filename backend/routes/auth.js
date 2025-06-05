const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  login,
  getMe,
  googleAuth,
  updateProfile
} = require('../controllers/auth');
const { protect, verifyFirebaseToken, handleCors } = require('../middleware/auth');

// Apply CORS handler to all routes
router.use(handleCors);

// Local auth routes
router.post('/register', verifyFirebaseToken, register);
router.post('/login', verifyFirebaseToken, login);
router.get('/me', protect, getMe);
router.post('/google', verifyFirebaseToken, googleAuth);
router.patch('/profile', protect, updateProfile);

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