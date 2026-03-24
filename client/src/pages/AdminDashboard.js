import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import {
  FiUser,
  FiBook,
  FiCheck,
  FiX,
  FiStar,
  FiUserX,
  FiTrash2,
  FiUsers,
  FiTrendingUp,
  FiSearch,
  FiRefreshCw,
} from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import { getMediaUrl } from '../utils/mediaUrl';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    pendingCourses: 0,
    pendingInstructors: 0,
    featuredCourses: 0,
    blockedUsers: 0,
  });

  const fetchUsers = useCallback(async (toggleLoading = true) => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
        // Calculate stats
        const pendingInstructors = res.data.users.filter(
          u => u.role === 'instructor' && !u.isApproved
        ).length;
        setStats(prev => ({
          ...prev,
          totalUsers: res.data.users.length,
          pendingInstructors,
          blockedUsers: res.data.users.filter((u) => u.isBlocked).length,
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      if (toggleLoading) setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async (toggleLoading = true) => {
    try {
      const res = await axios.get('/api/admin/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
        // Calculate stats
        const pendingCourses = res.data.courses.filter(
          c => c.status === 'pending'
        ).length;
        setStats(prev => ({
          ...prev,
          totalCourses: res.data.courses.length,
          pendingCourses,
          featuredCourses: res.data.courses.filter((c) => c.isFeatured).length,
        }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      if (toggleLoading) setLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchUsers(false), fetchCourses(false)]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [fetchUsers, fetchCourses]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleApproveUser = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/approve`);
      if (res.data.success) {
        Swal.fire('Approved!', 'User has been approved.', 'success');
        fetchUsers(false);
      }
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.message || 'Failed to approve user', 'error');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/block`);
      if (res.data.success) {
        Swal.fire('Success!', res.data.message, 'success');
        fetchUsers(false);
      }
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.message || 'Failed to block user', 'error');
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      const res = await axios.put(`/api/admin/courses/${courseId}/approve`);
      if (res.data.success) {
        Swal.fire('Approved!', 'Course has been approved.', 'success');
        fetchCourses(false);
      }
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.message || 'Failed to approve course', 'error');
    }
  };

  const handleRejectCourse = async (courseId) => {
    try {
      const res = await axios.put(`/api/admin/courses/${courseId}/reject`);
      if (res.data.success) {
        Swal.fire('Rejected!', 'Course has been rejected.', 'success');
        fetchCourses(false);
      }
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.message || 'Failed to reject course', 'error');
    }
  };

  const handleFeatureCourse = async (courseId) => {
    try {
      const res = await axios.put(`/api/admin/courses/${courseId}/feature`);
      if (res.data.success) {
        Swal.fire('Success!', res.data.message, 'success');
        fetchCourses(false);
      }
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.message || 'Failed to feature course', 'error');
    }
  };

  const handleDeleteCourse = async (courseId) => {
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
        const res = await axios.delete(`/api/admin/courses/${courseId}`);
        if (res.data.success) {
          Swal.fire('Deleted!', 'Course has been deleted.', 'success');
          fetchCourses(false);
        }
      } catch (error) {
        Swal.fire('Error!', error.response?.data?.message || 'Failed to delete course', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'badge badge-warning' },
      approved: { text: 'Approved', class: 'badge badge-success' },
      rejected: { text: 'Rejected', class: 'badge badge-danger' },
    };
    return badges[status] || badges.pending;
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = `${course.title} ${course.category} ${course.instructor?.name || ''}`
      .toLowerCase()
      .includes(courseSearch.toLowerCase());
    const matchesStatus = courseStatusFilter === 'all' || course.status === courseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch = `${u.name} ${u.email} ${u.phone || ''}`.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header fade-in">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage users and courses</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="admin-stats fade-in">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={FiUsers}
            gradient="gradient-card-blue"
          />
          <StatsCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={FiBook}
            gradient="gradient-card-green"
          />
          <StatsCard
            title="Pending Courses"
            value={stats.pendingCourses}
            icon={FiTrendingUp}
            gradient="gradient-card-orange"
          />
          <StatsCard
            title="Pending Instructors"
            value={stats.pendingInstructors}
            icon={FiUser}
            gradient="gradient-card-orange"
          />
          <StatsCard
            title="Featured Courses"
            value={stats.featuredCourses}
            icon={FiStar}
            gradient="gradient-card-blue"
          />
          <StatsCard
            title="Blocked Users"
            value={stats.blockedUsers}
            icon={FiUserX}
            gradient="gradient-card-orange"
          />
        </div>

        <div className="admin-toolbar">
          <button type="button" className="btn-secondary refresh-btn" onClick={fetchAllData} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <FiBook /> Courses ({filteredCourses.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUser /> Users ({filteredUsers.length})
          </button>
        </div>

        {activeTab === 'courses' && (
          <div className="admin-content">
            <div className="admin-filters">
              <div className="filter-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by course, category, instructor..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>
              <select
                className="form-select"
                value={courseStatusFilter}
                onChange={(e) => setCourseStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => {
                    const statusBadge = getStatusBadge(course.status);
                    return (
                      <tr key={course._id}>
                        <td>
                          <div className="course-cell">
                            {course.thumbnail && (
                              <img
                                src={getMediaUrl(course.thumbnail)}
                                alt={course.title}
                                className="course-thumbnail-small"
                              />
                            )}
                            <div>
                              <div className="course-title">{course.title}</div>
                              {course.isFeatured && (
                                <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{course.instructor?.name || 'Unknown'}</td>
                        <td>{course.category}</td>
                        <td>
                          <span className={statusBadge.class}>{statusBadge.text}</span>
                        </td>
                        <td>{course.enrolledStudents}</td>
                        <td>
                          <div className="action-buttons">
                            {course.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveCourse(course._id)}
                                  className="btn-icon btn-icon-success"
                                  title="Approve"
                                >
                                  <FiCheck />
                                </button>
                                <button
                                  onClick={() => handleRejectCourse(course._id)}
                                  className="btn-icon btn-icon-danger"
                                  title="Reject"
                                >
                                  <FiX />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleFeatureCourse(course._id)}
                              className="btn-icon"
                              title={course.isFeatured ? 'Unfeature' : 'Feature'}
                            >
                              <FiStar />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
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
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-content">
            <div className="admin-filters">
              <div className="filter-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <select
                className="form-select"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            {/* Pending Instructors Section */}
            {filteredUsers.filter(u => u.role === 'instructor' && !u.isApproved).length > 0 && (
              <div className="pending-instructors-section">
                <h3 className="section-title">Pending Instructor Approvals</h3>
                <div className="pending-instructors-grid">
                  {filteredUsers
                    .filter(u => u.role === 'instructor' && !u.isApproved)
                    .map((user) => (
                      <div key={user._id} className="instructor-card">
                        <div className="instructor-header">
                          <div>
                            <h4>{user.name}</h4>
                            <p className="instructor-email">{user.email}</p>
                          </div>
                          <span className="badge badge-warning">Pending</span>
                        </div>
                        <div className="instructor-details">
                          <div className="detail-row">
                            <strong>Login Email:</strong>
                            <span className="login-email">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="detail-row">
                              <strong>Phone:</strong>
                              <span>{user.phone}</span>
                            </div>
                          )}
                          <div className="detail-row">
                            <strong>Registered:</strong>
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          {user.bio && (
                            <div className="detail-row bio-row">
                              <strong>Bio:</strong>
                              <span>{user.bio.substring(0, 100)}...</span>
                            </div>
                          )}
                        </div>
                        <div className="instructor-actions">
                          <button
                            onClick={() => handleApproveUser(user._id)}
                            className="btn-primary btn-sm"
                          >
                            <FiCheck /> Approve Instructor
                          </button>
                          <button
                            onClick={() => handleBlockUser(user._id)}
                            className="btn-secondary btn-sm"
                          >
                            <FiUserX /> Block
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* All Users Table */}
            <div className="table-container">
              <h3 className="section-title">All Users</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Login Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td><strong>{user.name}</strong></td>
                      <td>
                        <span className="login-email-cell">{user.email}</span>
                      </td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`badge badge-${user.role === 'admin' ? 'warning' : user.role === 'instructor' ? 'success' : 'info'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="status-cell">
                          {!user.isApproved && user.role === 'instructor' && (
                            <span className="badge badge-warning">Pending Approval</span>
                          )}
                          {user.isBlocked && (
                            <span className="badge badge-danger">Blocked</span>
                          )}
                          {user.isApproved && !user.isBlocked && (
                            <span className="badge badge-success">Active</span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          {!user.isApproved && user.role === 'instructor' && (
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="btn-icon btn-icon-success"
                              title="Approve"
                            >
                              <FiCheck />
                            </button>
                          )}
                          <button
                            onClick={() => handleBlockUser(user._id)}
                            className="btn-icon btn-icon-danger"
                            title={user.isBlocked ? 'Unblock' : 'Block'}
                          >
                            <FiUserX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

