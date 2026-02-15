import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FiUpload } from 'react-icons/fi';
import './CourseForm.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    price: '',
    isFree: true,
    totalSeats: '',
    syllabus: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      thumbnailFile: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('difficulty', formData.difficulty);
    submitData.append('price', formData.price || '0');
    submitData.append('isFree', formData.isFree ? 'true' : 'false');
    submitData.append('totalSeats', formData.totalSeats || '0');
    submitData.append('syllabus', formData.syllabus || '');
    if (formData.thumbnailFile) {
      submitData.append('thumbnail', formData.thumbnailFile);
    }

    try {
      // Don't set Content-Type header - let axios set it automatically with boundary
      const res = await axios.post('/api/courses', submitData);

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Course Created!',
          text: 'Your course has been created and is pending admin approval.',
          confirmButtonText: 'Go to Dashboard',
        }).then(() => {
          navigate('/instructor/dashboard');
        });
      }
    } catch (error) {
      console.error('Course creation error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create course. Please check all required fields and try again.';
      
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        html: `<p>${errorMessage}</p>${error.response?.data?.errors ? 
          '<ul style="text-align: left; margin-top: 10px;">' + 
          error.response.data.errors.map(e => `<li>${e.msg || e}</li>`).join('') + 
          '</ul>' : ''}`,
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-form-page">
      <div className="container">
        <h1 className="page-title">Create New Course</h1>

        <form onSubmit={handleSubmit} className="course-form-card">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Enter course title"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="e.g., Programming, Design, Business"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              required
              rows={6}
              placeholder="Describe your course in detail..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Difficulty Level *</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Course Type</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                  />
                  Free Course
                </label>
              </div>
            </div>
          </div>

          {!formData.isFree && (
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Total Seats (0 for unlimited)</label>
            <input
              type="number"
              name="totalSeats"
              value={formData.totalSeats}
              onChange={handleChange}
              className="form-input"
              min="0"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Syllabus</label>
            <textarea
              name="syllabus"
              value={formData.syllabus}
              onChange={handleChange}
              className="form-textarea"
              rows={4}
              placeholder="Course syllabus and learning objectives..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course Thumbnail</label>
            <label className="upload-btn">
              <FiUpload /> Choose Thumbnail Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {formData.thumbnailFile && (
              <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '14px' }}>
                Selected: {formData.thumbnailFile.name}
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/instructor/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;

