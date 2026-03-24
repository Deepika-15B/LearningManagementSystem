import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiBook, FiUser, FiArrowRight } from 'react-icons/fi';
import { getMediaUrl } from '../utils/mediaUrl';
import './MyCourses.css';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const res = await axios.get('/api/enrollments/my-courses');
      if (res.data.success) {
        setEnrollments(res.data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-courses-page">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="container">
        <div className="my-courses-header">
          <h1>My Courses</h1>
          <p>Continue your learning journey</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="no-courses">
            <FiBook size={64} />
            <h3>You haven't enrolled in any courses yet</h3>
            <p>Browse our courses and start learning!</p>
            <Link to="/courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="enrollments-grid">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              return (
                <div key={enrollment._id} className="enrollment-card">
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
                    </div>
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">
                      {course.description.substring(0, 100)}...
                    </p>
                    <div className="course-footer">
                      <div className="course-instructor">
                        <FiUser /> {course.instructor?.name || 'Unknown'}
                      </div>
                      <div className="enrollment-date">
                        Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      to={`/courses/${course._id}`}
                      className="btn-primary btn-full"
                    >
                      Continue Learning <FiArrowRight />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;

