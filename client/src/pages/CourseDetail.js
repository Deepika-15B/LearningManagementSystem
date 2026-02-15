import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiUser, FiBook, FiStar, FiCheck } from 'react-icons/fi';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  useEffect(() => {
    fetchCourse();
    if (isAuthenticated && user?.role === 'student') {
      checkEnrollment();
    }
  }, [id, isAuthenticated, user]);

  const fetchCourse = async () => {
    try {
      const res = await axios.get(`/api/courses/${id}`);
      if (res.data.success) {
        setCourse(res.data.course);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Course not found',
      });
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      setCheckingEnrollment(true);
      const res = await axios.get(`/api/enrollments/${id}/check`);
      if (res.data.success) {
        setIsEnrolled(res.data.isEnrolled);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please login to enroll in this course',
        confirmButtonText: 'Go to Login',
      }).then(() => {
        navigate('/login');
      });
      return;
    }

    if (user.role !== 'student') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only students can enroll in courses',
      });
      return;
    }

    try {
      const res = await axios.post('/api/enrollments', { courseId: id });
      if (res.data.success) {
        setIsEnrolled(true);
        Swal.fire({
          icon: 'success',
          title: 'Enrolled Successfully!',
          text: 'You have been enrolled in this course',
          confirmButtonText: 'View My Courses',
        }).then(() => {
          navigate('/my-courses');
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Enrollment Failed',
        text: error.response?.data?.message || 'Failed to enroll in course',
      });
    }
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="course-detail-page">
      <div className="container">
        <div className="course-detail-content">
          <div className="course-main">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="course-detail-thumbnail"
              />
            ) : (
              <div className="course-detail-thumbnail-placeholder">
                <FiBook size={64} />
              </div>
            )}

            <div className="course-info">
              <div className="course-badges">
                <span className={`badge badge-${course.difficulty}`}>
                  {course.difficulty}
                </span>
                {course.isFree && (
                  <span className="badge badge-success">Free</span>
                )}
                {!course.isFree && (
                  <span className="badge badge-info">${course.price}</span>
                )}
                {course.isFeatured && (
                  <span className="badge badge-warning">Featured</span>
                )}
              </div>

              <h1 className="course-detail-title">{course.title}</h1>

              <div className="course-meta">
                <div className="meta-item">
                  <FiUser /> Instructor: {course.instructor?.name || 'Unknown'}
                </div>
                <div className="meta-item">
                  <FiStar /> {course.enrolledStudents} students enrolled
                </div>
                <div className="meta-item">
                  <FiBook /> Category: {course.category}
                </div>
              </div>

              <div className="course-description-full">
                <h3>Description</h3>
                <p>{course.description}</p>
              </div>

              {course.syllabus && (
                <div className="course-syllabus">
                  <h3>Syllabus</h3>
                  <p>{course.syllabus}</p>
                </div>
              )}

              {course.materials && course.materials.length > 0 && (
                <div className="course-materials">
                  <h3>Course Materials</h3>
                  <div className="materials-list">
                    {course.materials
                      .sort((a, b) => a.order - b.order)
                      .map((material, index) => (
                        <div key={index} className="material-item">
                          <FiCheck /> {material.title} ({material.type})
                          {material.isPreview && (
                            <span className="badge badge-info">Preview</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="course-sidebar">
            <div className="sidebar-card">
              <h3>Course Details</h3>
              <div className="detail-item">
                <strong>Difficulty:</strong> {course.difficulty}
              </div>
              <div className="detail-item">
                <strong>Category:</strong> {course.category}
              </div>
              <div className="detail-item">
                <strong>Price:</strong>{' '}
                {course.isFree ? 'Free' : `$${course.price}`}
              </div>
              {course.totalSeats > 0 && (
                <div className="detail-item">
                  <strong>Seats Available:</strong>{' '}
                  {course.totalSeats - course.enrolledStudents} /{' '}
                  {course.totalSeats}
                </div>
              )}

              {isAuthenticated && user?.role === 'student' && (
                <button
                  onClick={handleEnroll}
                  className={`btn-primary btn-full ${
                    isEnrolled ? 'btn-success' : ''
                  }`}
                  disabled={isEnrolled || checkingEnrollment}
                >
                  {checkingEnrollment
                    ? 'Checking...'
                    : isEnrolled
                    ? 'Enrolled ✓'
                    : course.isFree
                    ? 'Enroll for Free'
                    : `Enroll for $${course.price}`}
                </button>
              )}

              {!isAuthenticated && (
                <button
                  onClick={handleEnroll}
                  className="btn-primary btn-full"
                >
                  {course.isFree ? 'Enroll for Free' : `Enroll for $${course.price}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

