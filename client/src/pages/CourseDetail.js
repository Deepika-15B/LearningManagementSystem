import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiUser, FiBook, FiStar, FiCheck, FiUpload, FiClock, FiPlayCircle, FiVideo, FiExternalLink } from 'react-icons/fi';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxMarks, setAssignmentMaxMarks] = useState(100);
  const [assignmentFiles, setAssignmentFiles] = useState({});
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState(30);
  const [quizQuestions, setQuizQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctOptionIndex: 0 },
  ]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingScheduledAt, setMeetingScheduledAt] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesUpdatedAt, setNotesUpdatedAt] = useState(null);

  const canManageCourse = useMemo(() => {
    if (!user || !course) return false;
    const currentUserId = (user._id || user.id || '').toString();
    const instructorId = (course.instructor?._id || course.instructor || '').toString();
    if (user.role === 'admin') return true;
    return user.role === 'instructor' && instructorId === currentUserId;
  }, [user, course]);

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
        if (res.data.enrollment?.notes !== undefined) {
          setStudentNotes(res.data.enrollment.notes || '');
          setNotesUpdatedAt(res.data.enrollment.notesUpdatedAt || null);
        }
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const saveStudentNotes = async () => {
    try {
      setNotesSaving(true);
      const res = await axios.post(`/api/enrollments/${id}/notes`, {
        notes: studentNotes,
      });
      if (res.data.success) {
        setNotesUpdatedAt(res.data.notesUpdatedAt || new Date().toISOString());
        Swal.fire({
          icon: 'success',
          title: 'Notes Saved',
          text: 'Your notes have been saved for this course.',
          timer: 1400,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save notes', 'error');
    } finally {
      setNotesSaving(false);
    }
  };

  useEffect(() => {
    if (!activeQuiz) return undefined;

    const countdown = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          submitQuizAttempt(false, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        submitQuizAttempt(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(countdown);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeQuiz]);

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

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: assignmentTitle,
        description: assignmentDescription,
        dueDate: assignmentDueDate || null,
        maxMarks: assignmentMaxMarks,
      };
      const res = await axios.post(`/api/courses/${id}/assignments`, payload);
      if (res.data.success) {
        Swal.fire('Success', 'Assignment posted successfully', 'success');
        setAssignmentTitle('');
        setAssignmentDescription('');
        setAssignmentDueDate('');
        setAssignmentMaxMarks(100);
        fetchCourse();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to post assignment', 'error');
    }
  };

  const handleAssignmentSubmission = async (assignmentId) => {
    const file = assignmentFiles[assignmentId];
    if (!file) {
      Swal.fire('Warning', 'Please choose a file first', 'warning');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(
        `/api/courses/${id}/assignments/${assignmentId}/submissions`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) {
        Swal.fire('Submitted', 'Assignment submitted successfully', 'success');
        setAssignmentFiles((prev) => ({ ...prev, [assignmentId]: null }));
        fetchCourse();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Submission failed', 'error');
    }
  };

  const addQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      { question: '', options: ['', '', '', ''], correctOptionIndex: 0 },
    ]);
  };

  const updateQuestion = (index, key, value) => {
    setQuizQuestions((prev) =>
      prev.map((q, qIndex) => (qIndex === index ? { ...q, [key]: value } : q))
    );
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setQuizQuestions((prev) =>
      prev.map((q, qIndex) =>
        qIndex === questionIndex
          ? { ...q, options: q.options.map((opt, oIndex) => (oIndex === optionIndex ? value : opt)) }
          : q
      )
    );
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: quizTitle,
        durationMinutes: quizDuration,
        questions: quizQuestions,
      };
      const res = await axios.post(`/api/courses/${id}/quizzes`, payload);
      if (res.data.success) {
        Swal.fire('Success', 'Quiz created successfully', 'success');
        setQuizTitle('');
        setQuizDuration(30);
        setQuizQuestions([{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
        fetchCourse();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to create quiz', 'error');
    }
  };

  const startQuiz = (quiz) => {
    const malpracticeDetected = (quiz.attempts || []).some(
      (attempt) => attempt.endedByTabSwitch
    );
    if (malpracticeDetected) {
      Swal.fire({
        icon: 'error',
        title: 'Malpracticed',
        text: 'You switched tabs in a previous attempt. This test is permanently blocked for your account.',
      });
      return;
    }

    setActiveQuiz(quiz);
    setQuizAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizTimeLeft((quiz.durationMinutes || 30) * 60);
  };

  const submitQuizAttempt = async (endedByTabSwitch = false, silent = false) => {
    if (!activeQuiz || quizSubmitting) return;
    try {
      setQuizSubmitting(true);
      const res = await axios.post(`/api/courses/${id}/quizzes/${activeQuiz._id}/attempts`, {
        answers: quizAnswers,
        endedByTabSwitch,
      });
      if (res.data.success && !silent) {
        Swal.fire(
          endedByTabSwitch ? 'Test Ended' : 'Quiz Submitted',
          endedByTabSwitch
            ? 'Your test ended because tab switching was detected.'
            : `Score: ${res.data.attempt.score}/${res.data.attempt.total}`,
          endedByTabSwitch ? 'warning' : 'success'
        );
      }
      setActiveQuiz(null);
      setQuizAnswers([]);
      setQuizTimeLeft(0);
      fetchCourse();
    } catch (error) {
      if (error.response?.data?.code === 'MALPRACTICE_LOCKED') {
        Swal.fire({
          icon: 'error',
          title: 'Malpracticed',
          text: 'You are blocked from opening this test due to malpractice.',
        });
        setActiveQuiz(null);
        setQuizAnswers([]);
        setQuizTimeLeft(0);
        return;
      }
      if (!silent) {
        Swal.fire('Error', error.response?.data?.message || 'Quiz submission failed', 'error');
      }
    } finally {
      setQuizSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/courses/${id}/live-meetings`, {
        title: meetingTitle,
        meetingUrl: generatedMeetingUrl,
        scheduledAt: meetingScheduledAt || null,
        durationMinutes: meetingDuration,
        notes: meetingNotes,
      });

      if (res.data.success) {
        Swal.fire('Success', 'Live meeting added successfully', 'success');
        setMeetingTitle('');
        setMeetingScheduledAt('');
        setMeetingDuration(60);
        setMeetingNotes('');
        fetchCourse();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to add live meeting', 'error');
    }
  };

  const generatedMeetingUrl = useMemo(() => {
    const slugify = (value) => (value || '')
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const courseSlug = slugify(course?.title || 'course');
    const titleSlug = slugify(meetingTitle || 'live-meeting');
    return `https://meet.jit.si/${courseSlug}-${titleSlug}`;
  }, [course?.title, meetingTitle]);

  const isMeetingEnded = (meeting) => {
    if (!meeting?.scheduledAt) return false;
    const startTime = new Date(meeting.scheduledAt).getTime();
    if (Number.isNaN(startTime)) return false;
    const durationMs = (meeting.durationMinutes || 60) * 60 * 1000;
    return Date.now() > (startTime + durationMs);
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

              {isAuthenticated && user?.role === 'student' && isEnrolled && (
                <div className="course-section-block">
                  <h3>My Notes</h3>
                  <textarea
                    className="form-textarea"
                    placeholder="Write your personal notes for this course..."
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    style={{ minHeight: '180px' }}
                  />
                  <div className="notes-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={saveStudentNotes}
                      disabled={notesSaving}
                    >
                      {notesSaving ? 'Saving...' : 'Save Notes'}
                    </button>
                    {notesUpdatedAt && (
                      <small>Last updated: {new Date(notesUpdatedAt).toLocaleString()}</small>
                    )}
                  </div>
                </div>
              )}

              {(course.assignments?.length > 0 || canManageCourse) && (
                <div className="course-section-block">
                  <h3>Assignments</h3>
                  {canManageCourse && (
                    <form className="inline-form" onSubmit={handleCreateAssignment}>
                      <input
                        className="form-input"
                        placeholder="Assignment title"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        required
                      />
                      <textarea
                        className="form-textarea"
                        placeholder="Description"
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                      />
                      <div className="form-row">
                        <input
                          type="date"
                          className="form-input"
                          value={assignmentDueDate}
                          onChange={(e) => setAssignmentDueDate(e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          value={assignmentMaxMarks}
                          onChange={(e) => setAssignmentMaxMarks(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn-primary">Post Assignment</button>
                    </form>
                  )}
                  <div className="materials-list">
                    {(course.assignments || []).map((assignment) => {
                      const currentUserId = (user?._id || user?.id || '').toString();
                      const existingSubmission = assignment.submissions?.find(
                        (submission) =>
                          (submission.student?._id || submission.student || '').toString() === currentUserId
                      );
                      return (
                        <div key={assignment._id} className="assignment-item">
                          <div>
                            <strong>{assignment.title}</strong>
                            <p>{assignment.description || 'No description provided'}</p>
                            {assignment.dueDate && (
                              <small><FiClock /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</small>
                            )}
                          </div>
                          {isAuthenticated && user?.role === 'student' && isEnrolled && (
                            <div className="assignment-actions">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                onChange={(e) =>
                                  setAssignmentFiles((prev) => ({
                                    ...prev,
                                    [assignment._id]: e.target.files?.[0] || null,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleAssignmentSubmission(assignment._id)}
                              >
                                <FiUpload /> Upload
                              </button>
                              {existingSubmission && (
                                <span className="badge badge-success">Submitted</span>
                              )}
                            </div>
                          )}
                          {canManageCourse && (
                            <span className="badge badge-info">
                              {assignment.submissions?.length || 0} submissions
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(course.quizzes?.length > 0 || canManageCourse) && (
                <div className="course-section-block">
                  <h3>Quizzes / Tests</h3>
                  {canManageCourse && (
                    <form className="inline-form" onSubmit={handleCreateQuiz}>
                      <input
                        className="form-input"
                        placeholder="Quiz title"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Duration (minutes)"
                        value={quizDuration}
                        onChange={(e) => setQuizDuration(e.target.value)}
                        required
                      />
                      {quizQuestions.map((question, questionIndex) => (
                        <div key={questionIndex} className="question-builder">
                          <input
                            className="form-input"
                            placeholder={`Question ${questionIndex + 1}`}
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                            required
                          />
                          {question.options.map((option, optionIndex) => (
                            <input
                              key={optionIndex}
                              className="form-input"
                              placeholder={`Option ${optionIndex + 1}`}
                              value={option}
                              onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                              required
                            />
                          ))}
                          <select
                            className="form-select"
                            value={question.correctOptionIndex}
                            onChange={(e) => updateQuestion(questionIndex, 'correctOptionIndex', Number(e.target.value))}
                          >
                            <option value={0}>Correct: Option 1</option>
                            <option value={1}>Correct: Option 2</option>
                            <option value={2}>Correct: Option 3</option>
                            <option value={3}>Correct: Option 4</option>
                          </select>
                        </div>
                      ))}
                      <div className="form-row">
                        <button type="button" className="btn-secondary" onClick={addQuestion}>
                          Add Question
                        </button>
                        <button type="submit" className="btn-primary">Publish Quiz</button>
                      </div>
                    </form>
                  )}
                  <div className="materials-list">
                    {(course.quizzes || []).map((quiz) => (
                      <div key={quiz._id} className="assignment-item">
                        <div>
                          <strong>{quiz.title}</strong>
                          <p>{quiz.questions?.length || 0} questions • {quiz.durationMinutes || 30} minutes</p>
                        </div>
                        {isAuthenticated && user?.role === 'student' && isEnrolled && (
                          <button type="button" className="btn-primary" onClick={() => startQuiz(quiz)}>
                            <FiPlayCircle /> Start Test
                          </button>
                        )}
                        {canManageCourse && (
                          <span className="badge badge-info">{quiz.attempts?.length || 0} attempts</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((course.liveMeetings && course.liveMeetings.length > 0)
                || canManageCourse
                || (isAuthenticated && user?.role === 'student' && isEnrolled)) && (
                <div className="course-section-block">
                  <h3>Live Meetings (Jitsi)</h3>
                  {canManageCourse && (
                    <form className="inline-form" onSubmit={handleCreateMeeting}>
                      <input
                        className="form-input"
                        placeholder="Meeting title"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        required
                      />
                      <input
                        className="form-input"
                        placeholder="Auto-generated Jitsi meeting URL"
                        value={generatedMeetingUrl}
                        readOnly
                      />
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={meetingScheduledAt}
                        onChange={(e) => setMeetingScheduledAt(e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Meeting duration (minutes)"
                        value={meetingDuration}
                        onChange={(e) => setMeetingDuration(e.target.value)}
                      />
                      <textarea
                        className="form-textarea"
                        placeholder="Meeting notes (optional)"
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                      />
                      <button type="submit" className="btn-primary">Add Live Meeting</button>
                    </form>
                  )}

                  <div className="materials-list">
                    {(course.liveMeetings || []).map((meeting) => (
                      <div key={meeting._id} className="assignment-item">
                        <div>
                          <strong><FiVideo /> {meeting.title}</strong>
                          {meeting.scheduledAt && (
                            <p>Scheduled: {new Date(meeting.scheduledAt).toLocaleString()}</p>
                          )}
                          <p>Duration: {meeting.durationMinutes || 60} minutes</p>
                          {meeting.notes && <p>{meeting.notes}</p>}
                        </div>
                        {isMeetingEnded(meeting) ? (
                          <button type="button" className="btn-primary live-join-btn" disabled>
                            Meeting Ended
                          </button>
                        ) : (
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary live-join-btn"
                          >
                            Join Meeting <FiExternalLink />
                          </a>
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

      {activeQuiz && (
        <div className="quiz-overlay">
          <div className="quiz-modal">
            <div className="quiz-header">
              <h3>{activeQuiz.title}</h3>
              <span className="badge badge-warning">Time Left: {formatTime(quizTimeLeft)}</span>
            </div>
            <p className="quiz-warning">
              Do not switch tabs/windows. If detected, your test will automatically end.
            </p>
            <div className="quiz-questions">
              {activeQuiz.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="quiz-question">
                  <p><strong>Q{questionIndex + 1}.</strong> {question.question}</p>
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="quiz-option">
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={quizAnswers[questionIndex] === optionIndex}
                        onChange={() =>
                          setQuizAnswers((prev) =>
                            prev.map((answer, idx) => (idx === questionIndex ? optionIndex : answer))
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="quiz-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizAnswers([]);
                  setQuizTimeLeft(0);
                }}
                disabled={quizSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => submitQuizAttempt(false)}
                disabled={quizSubmitting}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;

