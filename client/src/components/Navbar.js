import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiLogOut, FiBook, FiHome, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', closeOnResize);
    return () => window.removeEventListener('resize', closeOnResize);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={handleNavClick}>
          <FiBook className="logo-icon" />
          <span>SKILLUP</span>
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={handleNavClick}>
            <FiHome /> Home
          </Link>
          <Link to="/courses" className="nav-link" onClick={handleNavClick}>
            Courses
          </Link>

          {isAuthenticated ? (
            <>
              {user.role === 'student' && (
                <>
                  <Link to="/my-courses" className="nav-link" onClick={handleNavClick}>
                    My Courses
                  </Link>
                  <Link to="/student/prerequisites" className="nav-link" onClick={handleNavClick}>
                    Prerequisites
                  </Link>
                </>
              )}
              
              {(user.role === 'instructor' || user.role === 'admin') && (
                <Link to="/instructor/dashboard" className="nav-link" onClick={handleNavClick}>
                  Instructor
                </Link>
              )}
              
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="nav-link" onClick={handleNavClick}>
                  Admin
                </Link>
              )}

              <Link to="/dashboard" className="nav-link" onClick={handleNavClick}>
                <FiUser /> Dashboard
              </Link>
              
              <Link to="/profile" className="nav-link" onClick={handleNavClick}>
                <FiSettings /> Profile
              </Link>

              <button onClick={handleLogout} className="nav-link btn-logout">
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={handleNavClick}>
                Login
              </Link>
              <Link to="/register" className="btn-primary" onClick={handleNavClick}>
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

