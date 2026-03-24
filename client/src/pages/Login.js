import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const { login, isAuthenticated } = useContext(AuthContext);
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
              const res = await axios.post('/api/auth/google', {
                credential: response.credential,
                mode: 'login',
              });
              if (res.data.success) {
                login(res.data.user, res.data.token);
                Swal.fire({
                  icon: 'success',
                  title: 'Login Successful!',
                  text: `Welcome, ${res.data.user.name}!`,
                  timer: 2000,
                  showConfirmButton: false,
                }).then(() => navigate('/dashboard'));
              }
            } catch (error) {
              const code = error.response?.data?.code;
              const message =
                error.response?.data?.message || 'Unable to login with Google';
              if (code === 'PENDING_INSTRUCTOR_APPROVAL') {
                Swal.fire({
                  icon: 'info',
                  title: 'Approval pending',
                  text: message,
                });
                return;
              }
              if (code === 'GOOGLE_ACCOUNT_NOT_FOUND') {
                Swal.fire({
                  icon: 'warning',
                  title: 'Sign up required',
                  text: message,
                });
                return;
              }
              Swal.fire({
                icon: 'error',
                title: 'Google Login Failed',
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
        text: 'Google sign-in is not configured yet. Please check client ID settings.',
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
      const res = await axios.post('/api/auth/login', formData);

      if (res.data.success) {
        login(res.data.user, res.data.token);
        
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: `Welcome back, ${res.data.user.name}!`,
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate('/dashboard');
        });
      }
    } catch (error) {
      const code = error.response?.data?.code;
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      if (code === 'PENDING_INSTRUCTOR_APPROVAL') {
        Swal.fire({
          icon: 'info',
          title: 'Admin approval required',
          text: message,
          confirmButtonText: 'OK',
        });
        return;
      }
      if (code === 'USE_GOOGLE_LOGIN') {
        Swal.fire({
          icon: 'info',
          title: 'Use Google sign-in',
          text: message,
          confirmButtonText: 'OK',
        });
        return;
      }
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login to Your Account</h2>
        <p className="auth-subtitle">Welcome back! Please login to continue.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
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
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
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
        {googleLoading && <p className="google-loading-text">Signing in with Google...</p>}

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

