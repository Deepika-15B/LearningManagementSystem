import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiAward, FiArrowRight } from 'react-icons/fi';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Learn, Teach, Grow</h1>
            <p className="hero-subtitle">
              Your comprehensive SKILLUP platform for quality education
            </p>
            <div className="hero-buttons">
              <Link to="/courses" className="btn-primary">
                Browse Courses <FiArrowRight />
              </Link>
              <Link to="/register" className="btn-secondary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Our Platform?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FiBook className="feature-icon" />
              <h3>Wide Range of Courses</h3>
              <p>Access hundreds of courses across various categories and difficulty levels</p>
            </div>
            <div className="feature-card">
              <FiUsers className="feature-icon" />
              <h3>Expert Instructors</h3>
              <p>Learn from experienced instructors who are passionate about teaching</p>
            </div>
            <div className="feature-card">
              <FiAward className="feature-icon" />
              <h3>Certified Learning</h3>
              <p>Complete courses and enhance your skills with recognized certifications</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

