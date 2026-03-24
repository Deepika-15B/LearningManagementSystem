import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiUser, FiUpload } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    skills: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loginPassword, setLoginPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        skills: user.skills || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please select an image smaller than 5MB',
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('profilePhoto', file);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('bio', formData.bio);
    formDataToSend.append('phone', formData.phone);
    if (!isAdmin) {
      formDataToSend.append('skills', JSON.stringify(formData.skills));
    }

    setLoading(true);
    try {
      const res = await axios.put('/api/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        updateUser(res.data.user);
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Your profile has been updated successfully.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Remove profile photo?',
      text: 'Your profile picture will be removed.',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      let res;
      try {
        res = await axios.delete('/api/profile/photo');
      } catch (deleteError) {
        // Fallback for older backend instances that don't yet have DELETE /api/profile/photo
        if (deleteError.response?.status === 404) {
          const fallbackPayload = new FormData();
          fallbackPayload.append('name', formData.name);
          fallbackPayload.append('bio', formData.bio);
          fallbackPayload.append('phone', formData.phone);
          if (!isAdmin) {
            fallbackPayload.append('skills', JSON.stringify(formData.skills));
          }
          fallbackPayload.append('removeProfilePhoto', 'true');

          res = await axios.put('/api/profile', fallbackPayload, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          throw deleteError;
        }
      }

      if (res.data.success) {
        updateUser(res.data.user);
        Swal.fire({
          icon: 'success',
          title: 'Removed',
          text: 'Profile photo removed successfully.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Could not remove profile photo',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPasswordSave = async (e) => {
    e.preventDefault();
    if (loginPassword.new.length < 6) {
      Swal.fire({ icon: 'error', title: 'Invalid password', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (loginPassword.new !== loginPassword.confirm) {
      Swal.fire({ icon: 'error', title: 'Mismatch', text: 'New password and confirmation do not match.' });
      return;
    }
    const googleUser = !!user?.googleSub;
    const linked = user?.emailPasswordLinked;
    if ((googleUser && linked) || !googleUser) {
      if (!loginPassword.current) {
        Swal.fire({ icon: 'error', title: 'Required', text: 'Please enter your current password.' });
        return;
      }
    }
    setPasswordSaving(true);
    try {
      const payload = { password: loginPassword.new };
      if (loginPassword.current) payload.currentPassword = loginPassword.current;
      const res = await axios.put('/api/profile/login-password', payload);
      if (res.data.success) {
        updateUser(res.data.user);
        setLoginPassword({ current: '', new: '', confirm: '' });
        Swal.fire({
          icon: 'success',
          title: 'Password updated',
          text: res.data.message || 'You can sign in with email and password on the login page.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Could not update password',
        text: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('bio', formData.bio);
    formDataToSend.append('phone', formData.phone);
    if (!isAdmin) {
      formDataToSend.append('skills', JSON.stringify(formData.skills));
    }

    try {
      const res = await axios.put('/api/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        updateUser(res.data.user);
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Your profile has been updated successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title">Edit Profile</h1>

        <div className="profile-edit-card">
          <div className="profile-photo-section">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="profile-photo-large" />
            ) : (
              <div className="profile-photo-placeholder-large">
                <FiUser size={60} />
              </div>
            )}
            <label className="upload-btn">
              <FiUpload /> Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {user?.profilePhoto && (
              <button
                type="button"
                className="remove-photo-btn"
                onClick={handleRemoveProfilePhoto}
                disabled={loading}
              >
                Remove profile photo
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Tell us about yourself..."
                maxLength={500}
                rows={4}
              />
              <small style={{ color: '#6B7280', marginTop: '4px', display: 'block' }}>
                {formData.bio.length}/500 characters
              </small>
            </div>

            {!isAdmin && (
              <div className="form-group">
                <label className="form-label">Skills/Interests</label>
                <div className="skills-input-group">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="form-input"
                    placeholder="Add a skill (e.g., Java, DBMS, AI)"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="skills-list">
                    {formData.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="skill-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #e5eaf2' }}>
              <h3 className="form-label" style={{ fontSize: '18px', marginBottom: '8px' }}>
                Email login password
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                {user?.googleSub && !user?.emailPasswordLinked
                  ? 'You signed in with Google. Set a password here to also sign in with your email and password.'
                  : 'Change the password you use on the login page with email and password.'}
              </p>
              {((user?.googleSub && user?.emailPasswordLinked) || !user?.googleSub) && (
                <div className="form-group">
                  <label className="form-label">Current password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={loginPassword.current}
                    onChange={(e) => setLoginPassword((p) => ({ ...p, current: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">New password</label>
                <input
                  type="password"
                  className="form-input"
                  value={loginPassword.new}
                  onChange={(e) => setLoginPassword((p) => ({ ...p, new: e.target.value }))}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input
                  type="password"
                  className="form-input"
                  value={loginPassword.confirm}
                  onChange={(e) => setLoginPassword((p) => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleLoginPasswordSave}
                disabled={passwordSaving}
              >
                {passwordSaving ? 'Saving...' : 'Save login password'}
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

