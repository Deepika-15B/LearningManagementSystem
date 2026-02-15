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

module.exports = router;

