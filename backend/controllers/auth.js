const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const admin = require('../config/firebase-admin');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, firebaseUid } = req.body;

  // Verify Firebase token
  try {
    await admin.auth().getUser(firebaseUid);
  } catch (error) {
    return next(new ErrorResponse('Invalid Firebase token', 401));
  }

  // Check if user exists
  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorResponse('User already exists', 400));
  }

  // Create user
  user = await User.create({
    name,
    email,
    firebaseUid
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Check for user
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Google auth
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = asyncHandler(async (req, res, next) => {
  const { googleId, email, name } = req.body;

  // Check for user
  let user = await User.findOne({ email });

  if (!user) {
    // Create user
    user = await User.create({
      name,
      email,
      googleId
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    dateOfBirth: req.body.dateOfBirth,
    gender: req.body.gender,
    bloodGroup: req.body.bloodGroup,
    phone: req.body.phone,
    address: req.body.address,
    emergencyContact: req.body.emergencyContact
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
}; 