// Test script to check course creation setup
const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');
require('dotenv').config();

async function testCourseCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');

    // Check if we can find an instructor
    const instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      console.log('⚠️  No instructor found in database');
    } else {
      console.log('✅ Instructor found:', instructor.email, 'Approved:', instructor.isApproved);
    }

    // Test course data
    const testCourseData = {
      title: 'Test Course',
      description: 'This is a test course',
      category: 'Programming',
      difficulty: 'beginner',
      instructor: instructor ? instructor._id : new mongoose.Types.ObjectId(),
      price: 0,
      isFree: true,
      totalSeats: 0,
      syllabus: '',
      status: 'pending',
    };

    console.log('Testing course creation with data:', testCourseData);

    // Try to create a course
    const course = await Course.create(testCourseData);
    console.log('✅ Course created successfully:', course._id);

    // Clean up - delete test course
    await Course.findByIdAndDelete(course._id);
    console.log('✅ Test course deleted');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCourseCreation();

