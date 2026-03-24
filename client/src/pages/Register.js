import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const { isAuthenticated, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchGoogleConfig = async () => {
      try {
        const res = await axios.get('/api/auth/google-config');
        if (res.data.success && res.data.clientId) {
          setGoogleClientId(res.data.clientId);
        }
      } catch (error) {
        setGoogleClientId('');
      }
    };
    fetchGoogleConfig();
  }, []);

  useEffect(() => {
    if (!googleClientId) return undefined;

    let attempts = 0;
    const initTimer = setInterval(() => {
      attempts += 1;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              setGoogleLoading(true);

              const roleResult = await Swal.fire({
                title: 'Choose your role',
                html: '<p style="margin:0 0 12px;color:#64748b;font-size:14px;">Select how you will use the platform. Instructors need admin approval before they can sign in.</p>',
                input: 'select',
                inputOptions: {
                  student: 'Student — access courses and learning right away',
                  instructor: 'Instructor — account created; wait for admin approval',
                },
                inputPlaceholder: 'Select role',
                showCancelButton: true,
                confirmButtonText: 'Continue',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                  if (!value) {
                    return 'Please select Student or Instructor';
                  }
                  return null;
                },
              });

              if (roleResult.isDismissed || !roleResult.value) {
                return;
              }

              const selectedRole = roleResult.value;

              const passResult = await Swal.fire({
                title: 'Create your login password',
                html: `
                  <p style="margin:0 0 14px;color:#64748b;font-size:14px;text-align:left">
                    Use the <strong>same email</strong> (from Google) and this password on the Login page.
                    You can still use <strong>Continue with Google</strong> anytime.
                  </p>
                  <input id="google-reg-pw" type="password" class="swal2-input" placeholder="Password (min 6 characters)" autocomplete="new-password" style="margin-bottom:10px;width:100%;box-sizing:border-box">
                  <input id="google-reg-pw2" type="password" class="swal2-input" placeholder="Confirm password" autocomplete="new-password" style="width:100%;box-sizing:border-box">
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Create account',
                cancelButtonText: 'Cancel',
                preConfirm: () => {
                  const p1 = document.getElementById('google-reg-pw')?.value || '';
                  const p2 = document.getElementById('google-reg-pw2')?.value || '';
                  if (p1.length < 6) {
                    Swal.showValidationMessage('Password must be at least 6 characters');
                    return false;
                  }
                  if (p1 !== p2) {
                    Swal.showValidationMessage('Passwords do not match');
                    return false;
                  }
                  return p1;
                },
              });

              if (passResult.isDismissed || passResult.value == null) {
                return;
              }

              const res = await axios.post('/api/auth/google', {
                credential: response.credential,
                role: selectedRole,
                password: passResult.value,
                mode: 'register',
              });

              if (res.data.success && res.data.token && res.data.user) {
                const u = res.data.user;
                // Never log in unapproved instructors (defense in depth; server should not return this)
                if (u.role === 'instructor' && u.isApproved === false) {
                  logout();
                  await Swal.fire({
                    icon: 'info',
                    title: 'Registration received',
                    text:
                      'Your instructor account is pending admin approval. You can sign in after an administrator approves your account.',
                    confirmButtonText: 'OK',
                  });
                  navigate('/login', { replace: true });
                  return;
                }

                login(res.data.user, res.data.token);
                Swal.fire({
                  icon: 'success',
                  title: 'Welcome!',
                  text: 'You are signed in. You can also log in later with your email and password.',
                  timer: 2200,
                  showConfirmButton: false,
                }).then(() => navigate('/dashboard'));
              }
            } catch (error) {
              const code = error.response?.data?.code;
              const message =
                error.response?.data?.message || 'Unable to register with Google';

              if (code === 'PENDING_INSTRUCTOR_APPROVAL') {
                logout();
                await Swal.fire({
                  icon: 'info',
                  title: 'Registration received',
                  text: message,
                  confirmButtonText: 'OK',
                });
                navigate('/login', { replace: true });
                return;
              }

              Swal.fire({
                icon: 'error',
                title: 'Google Signup Failed',
                text: message,
              });
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        setGoogleReady(true);
        clearInterval(initTimer);
      }

      if (attempts > 25) {
        clearInterval(initTimer);
      }
    }, 200);

    return () => clearInterval(initTimer);
  }, [googleClientId, login, navigate]);

  const handleContinueWithGoogle = () => {
    if (!googleReady || !window.google || !window.google.accounts || !window.google.accounts.id) {
      Swal.fire({
        icon: 'error',
        title: 'Google Auth Not Ready',
        text: 'Google sign-up is not configured yet. Please check client ID settings.',
      });
      return;
    }
    window.google.accounts.id.prompt();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fix the errors in the form',
      });
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      const res = await axios.post('/api/auth/register', submitData);

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          html: `
            <p>Your account has been created successfully!</p>
            <p>Please check your email (${formData.email}) to verify your account.</p>
            <p><strong>Note:</strong> If you registered as an instructor, your account needs admin approval.</p>
          `,
          confirmButtonText: 'Go to Login',
        }).then(() => {
          navigate('/login');
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Your Account</h2>
        <p className="auth-subtitle">Join us and start your learning journey today!</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
              placeholder="Enter your phone number"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
            <small style={{ color: '#6B7280', marginTop: '4px', display: 'block' }}>
              Note: Instructor accounts require admin approval
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password (min. 6 characters)"
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
              />
              <span className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </span>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider"><span>OR</span></div>
        <button
          type="button"
          className="btn-secondary btn-full google-continue-btn"
          onClick={handleContinueWithGoogle}
          disabled={!googleReady || googleLoading}
        >
          Continue with Google
        </button>
        {googleLoading && <p className="google-loading-text">Signing up with Google...</p>}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

