const express = require('express');
const multer = require('multer');
const path = require('path');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Ensure uploads directory exists
const fs = require('fs');
const coursesUploadDir = path.join(__dirname, '../uploads/courses/');
if (!fs.existsSync(coursesUploadDir)) {
  fs.mkdirSync(coursesUploadDir, { recursive: true });
}

// Configure multer for course thumbnails
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coursesUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)!'));
    }
  },
});


// @route   GET /api/courses
// @desc    Get all courses (approved only for students, all for instructors/admins)
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Students see only approved courses
    if (!req.headers.authorization) {
      query.status = 'approved';
    } else {
      // For authenticated users, check role
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const User = require('../models/User');
          const user = await User.findById(decoded.id);
          
          if (user && user.role === 'student') {
            query.status = 'approved';
          }
        } catch (err) {
          query.status = 'approved';
        }
      } else {
        query.status = 'approved';
      }
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email profilePhoto')
      .sort('-createdAt');

    res.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email profilePhoto bio');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Instructor)
router.post('/', protect, authorize('instructor', 'admin'), (req, res, next) => {
  upload.single('thumbnail')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Course creation request received');
    console.log('User:', req.user ? { id: req.user._id || req.user.id, role: req.user.role, isApproved: req.user.isApproved } : 'No user');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file');

    const { title, description, category, difficulty, price, isFree, totalSeats, syllabus } = req.body;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Check if instructor is approved
    if (req.user.role === 'instructor' && !req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your instructor account is pending approval. Please wait for admin approval before creating courses.',
      });
    }

    // Get instructor ID (handle both _id and id)
    const instructorId = req.user._id || req.user.id;
    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      difficulty: difficulty || 'beginner',
      instructor: instructorId,
      price: price ? parseFloat(price) : 0,
      isFree: isFree === 'true' || isFree === true || isFree === 'True' || isFree === '1',
      totalSeats: totalSeats ? parseInt(totalSeats) : 0,
      syllabus: syllabus ? syllabus.trim() : '',
      status: 'pending', // Needs admin approval
    };

    if (req.file) {
      courseData.thumbnail = `/uploads/courses/${req.file.filename}`;
    }

    console.log('Course data to create:', courseData);

    const course = await Course.create(courseData);

    console.log('Course created successfully:', course._id);

    res.status(201).json({
      success: true,
      message: 'Course created successfully. Waiting for admin approval.',
      course,
    });
  } catch (error) {
    console.error('Course creation error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Instructor/Owner or Admin)
router.put('/:id', protect, upload.single('thumbnail'), async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user is the instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
      });
    }

    const { title, description, category, difficulty, price, isFree, totalSeats, syllabus, materials } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (difficulty) course.difficulty = difficulty;
    if (price !== undefined) course.price = parseFloat(price);
    if (isFree !== undefined) course.isFree = isFree === 'true' || isFree === true;
    if (totalSeats !== undefined) course.totalSeats = parseInt(totalSeats);
    if (syllabus) course.syllabus = syllabus;
    if (materials) {
      course.materials = typeof materials === 'string' ? JSON.parse(materials) : materials;
    }
    if (req.file) {
      course.thumbnail = `/uploads/courses/${req.file.filename}`;
    }

    // If admin updates, keep status; if instructor updates, set to pending
    if (req.user.role !== 'admin') {
      course.status = 'pending';
    }

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Instructor/Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user is the instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course',
      });
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/courses/:id/materials
// @desc    Add material to course
// @access  Private (Instructor)
router.post('/:id/materials', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { type, title, url, order, isPreview } = req.body;

    course.materials.push({
      type,
      title,
      url,
      order: order || course.materials.length + 1,
      isPreview: isPreview || false,
    });

    await course.save();

    res.json({
      success: true,
      message: 'Material added successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

