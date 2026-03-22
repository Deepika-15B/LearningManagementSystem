const User = require('../models/User');

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@skillup.com' });
    
    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@skillup.com',
        password: 'admin123', // Default password
        role: 'admin',
        isApproved: true,
        isEmailVerified: true,
        isBlocked: false,
        emailPasswordLinked: true,
      });
      
      console.log('✅ Default admin created successfully!');
      console.log('📧 Email: admin@skillup.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('ℹ️  Default admin already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
};

module.exports = createDefaultAdmin;

