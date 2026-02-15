import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiBook, FiAward, FiTrendingUp } from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    courses: 0,
    enrollments: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      if (user?.role === 'student') {
        const res = await axios.get('/api/enrollments/my-courses');
        if (res.data.success) {
          setStats({ enrollments: res.data.count });
        }
      } else if (user?.role === 'instructor') {
        const res = await axios.get('/api/courses');
        if (res.data.success) {
          const myCourses = res.data.courses.filter(c => 
            c.instructor?._id === user._id || c.instructor === user._id
          );
          const totalStudents = myCourses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);
          setStats({ 
            courses: myCourses.length,
            students: totalStudents 
          });
        }
      } else if (user?.role === 'admin') {
        const [coursesRes, usersRes] = await Promise.all([
          axios.get('/api/admin/courses'),
          axios.get('/api/admin/users'),
        ]);
        if (coursesRes.data.success && usersRes.data.success) {
          const students = usersRes.data.users.filter(u => u.role === 'student').length;
          setStats({
            courses: coursesRes.data.count,
            students: students,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      student: { text: 'Student', class: 'badge-info' },
      instructor: { text: 'Instructor', class: 'badge-success' },
      admin: { text: 'Admin', class: 'badge-warning' },
    };
    return badges[role] || badges.student;
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header fade-in">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.name}! 👋</p>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="dashboard-stats fade-in">
            {user?.role === 'student' && stats.enrollments > 0 && (
              <StatsCard
                title="Enrolled Courses"
                value={stats.enrollments}
                icon={FiBook}
                gradient="gradient-card-blue"
              />
            )}
            {user?.role === 'instructor' && (
              <>
                <StatsCard
                  title="My Courses"
                  value={stats.courses}
                  icon={FiBook}
                  gradient="gradient-card-blue"
                />
                <StatsCard
                  title="Total Students"
                  value={stats.students}
                  icon={FiUser}
                  gradient="gradient-card-green"
                />
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <StatsCard
                  title="Total Courses"
                  value={stats.courses}
                  icon={FiBook}
                  gradient="gradient-card-blue"
                />
                <StatsCard
                  title="Total Students"
                  value={stats.students}
                  icon={FiUser}
                  gradient="gradient-card-green"
                />
              </>
            )}
          </div>
        )}

        <div className="dashboard-content">
          <div className="dashboard-card profile-card">
            <div className="profile-header">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="profile-photo" />
              ) : (
                <div className="profile-photo-placeholder">
                  <FiUser size={40} />
                </div>
              )}
              <div className="profile-info">
                <h2>{user?.name}</h2>
                <span className={`badge ${badge.class}`}>{badge.text}</span>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <FiMail /> <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="detail-item">
                  <FiPhone /> <span>{user.phone}</span>
                </div>
              )}
              {user?.bio && (
                <div className="detail-item bio">
                  <p>{user.bio}</p>
                </div>
              )}
              {user?.skills && user.skills.length > 0 && (
                <div className="detail-item skills">
                  <strong>Skills:</strong>
                  <div className="skills-list">
                    {user.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="btn-primary">
              Edit Profile
            </Link>
          </div>

          <div className="dashboard-actions">
            {user?.role === 'student' && (
              <Link to="/my-courses" className="action-card">
                <FiBook className="action-icon" />
                <h3>My Courses</h3>
                <p>View your enrolled courses</p>
              </Link>
            )}

            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <Link to="/instructor/dashboard" className="action-card">
                <FiAward className="action-icon" />
                <h3>Instructor Dashboard</h3>
                <p>Manage your courses</p>
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="action-card">
                <FiUser className="action-icon" />
                <h3>Admin Panel</h3>
                <p>Manage users and courses</p>
              </Link>
            )}

            <Link to="/courses" className="action-card">
              <FiBook className="action-icon" />
              <h3>Browse Courses</h3>
              <p>Explore all available courses</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

