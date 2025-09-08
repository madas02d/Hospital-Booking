const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    console.log('Registration attempt:', { firstName, lastName, email, role, passwordLength: password ? password.length : 0 });

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'patient'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: messages 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('GetMe function - req.user:', req.user);
    console.log('GetMe function - req.user.id:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('GetMe function - user found:', user);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth, gender, bloodGroup, profilePicture } = req.body;
    
    // Build update object with only provided fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateFields.gender = gender;
    if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: messages 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload profile picture via Cloudinary
// @route   POST /api/auth/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing:', {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      });
      return res.status(503).json({ message: 'Image service not configured. Please try again later.' });
    }

    console.log('Starting profile picture upload for user:', req.user.id);
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Create a promise to handle the Cloudinary upload
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-pictures',
          public_id: `user_${req.user.id}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else {
            console.log('Cloudinary upload successful:', {
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format
            });
            resolve(result);
          }
        }
      );

      // Pipe the buffer to Cloudinary
      uploadStream.end(req.file.buffer);
    });

    // Wait for upload to complete
    const result = await uploadPromise;
    
    console.log('Updating user profile in database...');
    
    // Update user profile in database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Store the old profile picture URL for potential cleanup
    const oldProfilePicture = user.profilePicture;
    
    // Update the profile picture URL
    user.profilePicture = result.secure_url;
    await user.save();
    
    console.log('Database update successful. User profile picture updated.');
    
    // Return success response with the new URL and updated user data
    res.json({ 
      success: true, 
      url: result.secure_url,
      user: user,
      message: 'Profile picture uploaded successfully'
    });
    
    // Optional: Clean up old profile picture from Cloudinary if it exists
    if (oldProfilePicture && oldProfilePicture.includes('cloudinary.com')) {
      try {
        // Extract public_id from old URL for cleanup
        const oldPublicId = oldProfilePicture.split('/').pop().split('.')[0];
        if (oldPublicId && oldPublicId !== result.public_id) {
          cloudinary.uploader.destroy(oldPublicId, (error, result) => {
            if (error) {
              console.log('Failed to cleanup old profile picture:', error);
            } else {
              console.log('Old profile picture cleaned up successfully');
            }
          });
        }
      } catch (cleanupError) {
        console.log('Error during old profile picture cleanup:', cleanupError);
      }
    }
    
  } catch (error) {
    console.error('Upload profile picture error:', error);
    
    if (error.message.includes('Failed to upload image')) {
      res.status(502).json({ message: 'Failed to upload image to cloud service. Please try again.' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Invalid file data. Please try again.' });
    } else {
      res.status(500).json({ message: 'Server error during upload. Please try again later.' });
    }
  }
};

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
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        bloodGroup: user.bloodGroup
      }
    });
};

exports.googleAuth = (req, res) => { res.send('Not implemented'); }; 