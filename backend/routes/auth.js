const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Local auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

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