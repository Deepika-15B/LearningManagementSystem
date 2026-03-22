const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Ensure uploads directory exists
const profilesUploadDir = path.join(__dirname, '../uploads/profiles/');
if (!fs.existsSync(profilesUploadDir)) {
  fs.mkdirSync(profilesUploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', protect, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, bio, skills, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (phone) user.phone = phone;
    if (skills) {
      // Parse skills if it's a string (from form data)
      user.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    }
    if (req.file) {
      user.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/profile/login-password
// @desc    Set or change password for email login (e.g. after Google sign-up)
// @access  Private
router.put('/login-password', protect, async (req, res) => {
  try {
    const { password, currentPassword } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Email-registered users always need current password to change
    if (!user.googleSub) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your current password',
        });
      }
      const ok = await user.comparePassword(currentPassword);
      if (!ok) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    } else if (user.emailPasswordLinked) {
      // Google user changing password again
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your current password to change it',
        });
      }
      const ok = await user.comparePassword(currentPassword);
      if (!ok) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    }
    // Google user, first time setting email password: no current required

    user.password = password;
    user.emailPasswordLinked = true;
    await user.save();

    const userOut = await User.findById(req.user._id);
    res.json({
      success: true,
      message: 'Login password saved. You can now sign in with email and password.',
      user: userOut,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

