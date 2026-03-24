import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FiBook, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get('/api/courses');
      if (res.data.success) {
        // Filter courses for current instructor (or show all for admin)
        if (user?.role === 'admin') {
          setCourses(res.data.courses);
        } else {
          setCourses(res.data.courses.filter(course => 
            course.instructor?._id === user?._id || course.instructor === user?._id
          ));
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user, fetchCourses]);

  const handleDelete = async (courseId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`/api/courses/${courseId}`);
        if (res.data.success) {
          Swal.fire('Deleted!', 'Course has been deleted.', 'success');
          fetchCourses();
        }
      } catch (error) {
        Swal.fire('Error!', error.response?.data?.message || 'Failed to delete course', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { text: 'Draft', class: 'badge badge-info' },
      pending: { text: 'Pending Approval', class: 'badge badge-warning' },
      approved: { text: 'Approved', class: 'badge badge-success' },
      rejected: { text: 'Rejected', class: 'badge badge-danger' },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="instructor-dashboard">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Instructor Dashboard</h1>
            <p>Manage your courses and content</p>
          </div>
          <Link to="/instructor/courses/create" className="btn-primary">
            <FiPlus /> Create New Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="no-courses">
            <FiBook size={64} />
            <h3>You haven't created any courses yet</h3>
            <p>Create your first course and start teaching!</p>
            <Link to="/instructor/courses/create" className="btn-primary">
              Create Course
            </Link>
          </div>
        ) : (
          <div className="courses-table-container">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const statusBadge = getStatusBadge(course.status);
                  return (
                    <tr key={course._id}>
                      <td>
                        <div className="course-cell">
                          {course.thumbnail && (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="course-thumbnail-small"
                            />
                          )}
                          <div>
                            <div className="course-title">{course.title}</div>
                            <div className="course-meta">
                              {course.difficulty} • {course.isFree ? 'Free' : `$${course.price}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{course.category}</td>
                      <td>
                        <span className={statusBadge.class}>{statusBadge.text}</span>
                      </td>
                      <td>{course.enrolledStudents}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/courses/${course._id}`}
                            className="btn-icon"
                            title="View"
                          >
                            <FiBook />
                          </Link>
                          <Link
                            to={`/instructor/courses/edit/${course._id}`}
                            className="btn-icon"
                            title="Edit"
                          >
                            <FiEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(course._id)}
                            className="btn-icon btn-icon-danger"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;

