import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiBook, FiUser, FiStar } from 'react-icons/fi';
import { getMediaUrl } from '../utils/mediaUrl';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = () => {
    const categories = new Set(courses.map((course) => course.category));
    return Array.from(categories);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || course.category === categoryFilter;
    const matchesDifficulty =
      difficultyFilter === 'all' || course.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="courses-page">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="container">
        <div className="courses-header">
          <h1>All Courses</h1>
          <p>Explore our wide range of courses</p>
        </div>

        <div className="courses-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Categories</option>
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="no-courses">
            <FiBook size={64} />
            <h3>No courses found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="course-card"
              >
                {course.thumbnail ? (
                  <img
                    src={getMediaUrl(course.thumbnail)}
                    alt={course.title}
                    className="course-thumbnail"
                  />
                ) : (
                  <div className="course-thumbnail-placeholder">
                    <FiBook size={48} />
                  </div>
                )}
                <div className="course-content">
                  <div className="course-badges">
                    <span className={`badge badge-${course.difficulty}`}>
                      {course.difficulty}
                    </span>
                    {course.isFree && (
                      <span className="badge badge-success">Free</span>
                    )}
                    {course.isFeatured && (
                      <span className="badge badge-warning">Featured</span>
                    )}
                  </div>
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">
                    {course.description.substring(0, 100)}...
                  </p>
                  <div className="course-footer">
                    <div className="course-instructor">
                      <FiUser /> {course.instructor?.name || 'Unknown'}
                    </div>
                    <div className="course-stats">
                      <FiStar /> {course.enrolledStudents} enrolled
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;

