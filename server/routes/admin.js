const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve user (mainly for instructors)
// @access  Private (Admin)
router.put('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isApproved = true;
    await user.save();

    res.json({
      success: true,
      message: 'User approved successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/admin/users/:id/block
// @desc    Block/Unblock user
// @access  Private (Admin)
router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/admin/courses
// @desc    Get all courses (including pending)
// @access  Private (Admin)
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
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

// @route   PUT /api/admin/courses/:id/approve
// @desc    Approve course
// @access  Private (Admin)
router.put('/courses/:id/approve', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.status = 'approved';
    await course.save();

    res.json({
      success: true,
      message: 'Course approved successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/admin/courses/:id/reject
// @desc    Reject course
// @access  Private (Admin)
router.put('/courses/:id/reject', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.status = 'rejected';
    await course.save();

    res.json({
      success: true,
      message: 'Course rejected',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/admin/courses/:id/feature
// @desc    Feature/Unfeature course
// @access  Private (Admin)
router.put('/courses/:id/feature', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.isFeatured = !course.isFeatured;
    await course.save();

    res.json({
      success: true,
      message: course.isFeatured ? 'Course featured successfully' : 'Course unfeatured',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Private (Admin)
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
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

module.exports = router;

