const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/enrollments
// @desc    Enroll in a course
// @access  Private (Student)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
    }

    // Check seat availability
    if (course.totalSeats > 0 && course.enrolledStudents >= course.totalSeats) {
      return res.status(400).json({
        success: false,
        message: 'Course is full',
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
    });

    // Update course enrollment count
    course.enrolledStudents += 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/enrollments/my-courses
// @desc    Get student's enrolled courses
// @access  Private (Student)
router.get('/my-courses', protect, authorize('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name email profilePhoto',
        },
      })
      .sort('-enrollmentDate');

    res.json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/enrollments/:courseId/check
// @desc    Check if student is enrolled
// @access  Private
router.get('/:courseId/check', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
    });

    res.json({
      success: true,
      isEnrolled: !!enrollment,
      enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

