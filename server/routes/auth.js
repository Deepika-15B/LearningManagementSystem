const express = require('express');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const generateVerificationToken = require('../utils/generateVerificationToken');
const { protect } = require('../middleware/auth');
const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   GET /api/auth/google-config
// @desc    Provide Google OAuth client config to frontend
// @access  Public
router.get('/google-config', (req, res) => {
  return res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, password, phone, role } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Generate verification token
      const { token, hashedToken } = generateVerificationToken();

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        role: role || 'student',
        emailVerificationToken: hashedToken,
        emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        isApproved: role === 'student' ? true : false, // Students auto-approved, instructors need admin approval
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      try {
        await sendEmail({
          email: user.email,
          subject: 'Email Verification - SKILLUP',
          html: `
            <h2>Welcome to SKILLUP!</h2>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Check if user exists and get password
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Please contact admin.',
        });
      }

      // Check if instructor is approved
      if (user.role === 'instructor' && !user.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Your instructor account is pending approval from admin.',
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   POST /api/auth/google
// @desc    Login/Register user via Google OAuth token
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on server',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || 'Google User';
    const picture = payload?.picture || '';
    const emailVerified = !!payload?.email_verified;
    const googleSub = payload?.sub;

    if (!email || !googleSub) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token payload',
      });
    }

    let user = await User.findOne({ email }).select('+password');
    const selectedRole = role === 'instructor' ? 'instructor' : 'student';

    if (!user) {
      user = await User.create({
        name,
        email,
        password: `google_${googleSub}_${Date.now()}`,
        role: selectedRole,
        profilePhoto: picture,
        isEmailVerified: emailVerified,
        isApproved: selectedRole === 'student',
      });
    } else {
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Please contact admin.',
        });
      }

      if (!user.profilePhoto && picture) {
        user.profilePhoto = picture;
      }
      if (!user.isEmailVerified && emailVerified) {
        user.isEmailVerified = true;
      }
      await user.save();
    }

    if (user.role === 'instructor' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your instructor account is pending approval from admin.',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
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

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;

