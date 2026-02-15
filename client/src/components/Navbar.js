import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiLogOut, FiBook, FiHome, FiSettings } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <FiBook className="logo-icon" />
          <span>LMS</span>
        </Link>

        <div className="nav-menu">
          <Link to="/" className="nav-link">
            <FiHome /> Home
          </Link>
          <Link to="/courses" className="nav-link">
            Courses
          </Link>

          {isAuthenticated ? (
            <>
              {user.role === 'student' && (
                <Link to="/my-courses" className="nav-link">
                  My Courses
                </Link>
              )}
              
              {(user.role === 'instructor' || user.role === 'admin') && (
                <Link to="/instructor/dashboard" className="nav-link">
                  Instructor
                </Link>
              )}
              
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="nav-link">
                  Admin
                </Link>
              )}

              <Link to="/dashboard" className="nav-link">
                <FiUser /> Dashboard
              </Link>
              
              <Link to="/profile" className="nav-link">
                <FiSettings /> Profile
              </Link>

              <button onClick={handleLogout} className="nav-link btn-logout">
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

