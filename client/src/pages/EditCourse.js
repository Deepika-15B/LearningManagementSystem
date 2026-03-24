import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FiUpload } from 'react-icons/fi';
import './CourseForm.css';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const fetchCourse = useCallback(async () => {
    try {
      const res = await axios.get(`/api/courses/${id}`);
      if (res.data.success) {
        const course = res.data.course;
        setFormData({
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          difficulty: course.difficulty || 'beginner',
          price: course.price?.toString() || '',
          isFree: course.isFree !== false,
          totalSeats: course.totalSeats?.toString() || '',
          syllabus: course.syllabus || '',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Course not found',
      });
      navigate('/instructor/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

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
    setSubmitting(true);

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('difficulty', formData.difficulty);
    submitData.append('price', formData.price || '0');
    submitData.append('isFree', formData.isFree);
    submitData.append('totalSeats', formData.totalSeats || '0');
    submitData.append('syllabus', formData.syllabus);
    if (formData.thumbnailFile) {
      submitData.append('thumbnail', formData.thumbnailFile);
    }

    try {
      const res = await axios.put(`/api/courses/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Course Updated!',
          text: 'Your course has been updated successfully.',
          confirmButtonText: 'Go to Dashboard',
        }).then(() => {
          navigate('/instructor/dashboard');
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update course',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="course-form-page">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-form-page">
      <div className="container">
        <h1 className="page-title">Edit Course</h1>

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
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Course'}
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

export default EditCourse;

