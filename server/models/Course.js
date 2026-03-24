const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    default: '',
  },
  fileName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed'],
    default: 'submitted',
  },
  score: {
    type: Number,
    min: 0,
    default: null,
  },
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  maxMarks: {
    type: Number,
    default: 100,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  submissions: {
    type: [assignmentSubmissionSchema],
    default: [],
  },
});

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function validator(value) {
        return Array.isArray(value) && value.length >= 2;
      },
      message: 'Each quiz question must have at least two options',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: {
    type: [Number],
    default: [],
  },
  score: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  endedByTabSwitch: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  durationMinutes: {
    type: Number,
    default: 30,
    min: 1,
  },
  questions: {
    type: [quizQuestionSchema],
    default: [],
  },
  attempts: {
    type: [quizAttemptSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const liveMeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  meetingUrl: {
    type: String,
    required: true,
    trim: true,
  },
  scheduledAt: {
    type: Date,
    default: null,
  },
  durationMinutes: {
    type: Number,
    default: 60,
    min: 1,
  },
  notes: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  isFree: {
    type: Boolean,
    default: true,
  },
  totalSeats: {
    type: Number,
    default: 0,
  },
  enrolledStudents: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'pending',
  },
  syllabus: {
    type: String,
    default: '',
  },
  materials: [{
    type: {
      type: String,
      enum: ['video', 'pdf', 'ppt', 'assignment', 'reading'],
    },
    title: String,
    url: String,
    order: Number,
    isPreview: {
      type: Boolean,
      default: false,
    },
  }],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  assignments: {
    type: [assignmentSchema],
    default: [],
  },
  quizzes: {
    type: [quizSchema],
    default: [],
  },
  liveMeetings: {
    type: [liveMeetingSchema],
    default: [],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Course', courseSchema);

