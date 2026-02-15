const mongoose = require('mongoose');

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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Course', courseSchema);

