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

const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const assignmentUploadDir = path.join(__dirname, '../uploads/assignments/');
    if (!fs.existsSync(assignmentUploadDir)) {
      fs.mkdirSync(assignmentUploadDir, { recursive: true });
    }
    cb(null, assignmentUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
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

const assignmentUpload = multer({
  storage: assignmentStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG, and WEBP files are allowed'));
  },
});

const hasCourseAccess = async (courseId, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const course = await Course.findById(courseId);
  if (!course) return false;
  if (user.role === 'instructor' && course.instructor.toString() === user._id.toString()) {
    return true;
  }
  if (user.role === 'student') {
    const enrollment = await Enrollment.findOne({ student: user._id, course: courseId });
    return !!enrollment;
  }
  return false;
};


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
    const courseDoc = await Course.findById(req.params.id)
      .populate('instructor', 'name email profilePhoto bio');

    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    let role = null;
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const authUser = await User.findById(decoded.id);
        if (authUser) {
          role = authUser.role;
          userId = authUser._id.toString();
        }
      } catch (error) {
        role = null;
      }
    }

    const course = courseDoc.toObject();
    const isOwnerInstructor = role === 'instructor' && courseDoc.instructor?._id?.toString() === userId;
    const isAdmin = role === 'admin';
    const isStudent = role === 'student';
    let isEnrolledStudent = false;

    if (isStudent && userId) {
      const enrollment = await Enrollment.findOne({ student: userId, course: req.params.id });
      isEnrolledStudent = !!enrollment;
    }

    if (!(isOwnerInstructor || isAdmin || isEnrolledStudent)) {
      course.assignments = [];
      course.quizzes = [];
      course.liveMeetings = [];
    } else if (isStudent) {
      course.quizzes = (course.quizzes || []).map((quiz) => ({
        ...quiz,
        questions: (quiz.questions || []).map((question) => ({
          question: question.question,
          options: question.options,
        })),
        attempts: (quiz.attempts || []).filter((attempt) => attempt.student?.toString() === userId),
      }));
      course.assignments = (course.assignments || []).map((assignment) => ({
        ...assignment,
        submissions: (assignment.submissions || []).filter((submission) => submission.student?.toString() === userId),
      }));
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

// @route   POST /api/courses/:id/assignments
// @desc    Create assignment for course
// @access  Private (Instructor/Admin)
router.post('/:id/assignments', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, dueDate, maxMarks } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to add assignments' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assignment title is required' });
    }

    course.assignments.push({
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: dueDate || null,
      maxMarks: maxMarks ? parseInt(maxMarks, 10) : 100,
    });

    await course.save();
    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: course.assignments[course.assignments.length - 1],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/courses/:id/assignments
// @desc    Get course assignments for allowed users
// @access  Private (Instructor/Admin/Enrolled Student)
router.get('/:id/assignments', protect, async (req, res) => {
  try {
    const allowed = await hasCourseAccess(req.params.id, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not authorized to view assignments' });
    }

    const course = await Course.findById(req.params.id).select('assignments title');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.json({
      success: true,
      courseTitle: course.title,
      assignments: course.assignments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/courses/:id/assignments/:assignmentId/submissions
// @desc    Submit assignment file
// @access  Private (Student)
router.post('/:id/assignments/:assignmentId/submissions', protect, authorize('student'), (req, res, next) => {
  assignmentUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Enroll in this course before submitting assignments' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const assignment = course.assignments.id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const existingIndex = assignment.submissions.findIndex(
      (submission) => submission.student.toString() === req.user._id.toString()
    );

    const submissionPayload = {
      student: req.user._id,
      filePath: `/uploads/assignments/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      remarks: req.body.remarks || '',
      submittedAt: new Date(),
      status: 'submitted',
    };

    if (existingIndex > -1) {
      assignment.submissions[existingIndex] = submissionPayload;
    } else {
      assignment.submissions.push(submissionPayload);
    }

    await course.save();

    return res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      submission: submissionPayload,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/courses/:id/assignments/:assignmentId/submissions
// @desc    Get submissions for an assignment
// @access  Private (Instructor/Admin)
router.get('/:id/assignments/:assignmentId/submissions', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('assignments.submissions.student', 'name email')
      .select('assignments instructor title');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view submissions' });
    }

    const assignment = course.assignments.id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    return res.json({
      success: true,
      assignment,
      submissions: assignment.submissions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/courses/:id/quizzes
// @desc    Create quiz for a course
// @access  Private (Instructor/Admin)
router.post('/:id/quizzes', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, durationMinutes, questions } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to create quizzes' });
    }

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Title and at least one question are required' });
    }

    const normalizedQuestions = questions.map((q) => ({
      question: (q.question || '').trim(),
      options: Array.isArray(q.options) ? q.options.map((opt) => (opt || '').trim()).filter(Boolean) : [],
      correctOptionIndex: Number(q.correctOptionIndex),
    })).filter((q) => q.question && q.options.length >= 2 && q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length);

    if (normalizedQuestions.length === 0) {
      return res.status(400).json({ success: false, message: 'Quiz questions are invalid' });
    }

    course.quizzes.push({
      title: title.trim(),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 30,
      questions: normalizedQuestions,
    });

    await course.save();
    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: course.quizzes[course.quizzes.length - 1],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/courses/:id/quizzes/:quizId/attempts
// @desc    Submit quiz attempt (auto-end supported)
// @access  Private (Student)
router.post('/:id/quizzes/:quizId/attempts', protect, authorize('student'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Enroll in this course before attending quiz' });
    }

    const { answers = [], endedByTabSwitch = false } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const quiz = course.quizzes.id(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const malpracticeAttempt = quiz.attempts.find(
      (attempt) =>
        attempt.student.toString() === req.user._id.toString() && attempt.endedByTabSwitch
    );
    if (malpracticeAttempt) {
      return res.status(403).json({
        success: false,
        code: 'MALPRACTICE_LOCKED',
        message: 'Malpracticed: You are blocked from retaking this test.',
      });
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (Number(answers[index]) === question.correctOptionIndex) {
        score += 1;
      }
    });

    const attempt = {
      student: req.user._id,
      answers: Array.isArray(answers) ? answers.map((value) => Number(value)) : [],
      score,
      total: quiz.questions.length,
      endedByTabSwitch: !!endedByTabSwitch,
      submittedAt: new Date(),
    };

    quiz.attempts.push(attempt);
    await course.save();

    return res.status(201).json({
      success: true,
      message: endedByTabSwitch ? 'Quiz ended due to tab switch' : 'Quiz submitted successfully',
      attempt: {
        score: attempt.score,
        total: attempt.total,
        endedByTabSwitch: attempt.endedByTabSwitch,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/courses/:id/live-meetings
// @desc    Add live meeting (Jitsi URL) for course
// @access  Private (Instructor/Admin)
router.post('/:id/live-meetings', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, meetingUrl, scheduledAt, durationMinutes, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting title is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to add meetings' });
    }

    const slugify = (value) => (value || '')
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let normalizedUrl = (meetingUrl || '').trim();
    if (!normalizedUrl) {
      const roomSlug = `${slugify(course.title)}-${slugify(title)}-${Date.now().toString().slice(-6)}`.replace(/--+/g, '-');
      normalizedUrl = `https://meet.jit.si/${roomSlug}`;
    }

    if (!/^https?:\/\/(meet\.jit\.si|8x8\.vc)\//i.test(normalizedUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Jitsi meeting URL',
      });
    }

    course.liveMeetings.push({
      title: title.trim(),
      meetingUrl: normalizedUrl,
      scheduledAt: scheduledAt || null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      notes: notes ? notes.trim() : '',
      createdBy: req.user._id,
    });

    await course.save();

    return res.status(201).json({
      success: true,
      message: 'Live meeting added successfully',
      liveMeeting: course.liveMeetings[course.liveMeetings.length - 1],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

