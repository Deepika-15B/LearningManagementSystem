import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-email/${token}`);
        
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Email Verified!',
            text: 'Your email has been verified successfully. You can now login.',
            confirmButtonText: 'Go to Login',
          }).then(() => {
            navigate('/login');
          });
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Invalid or expired verification link';
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: message,
          confirmButtonText: 'Go to Login',
        }).then(() => {
          navigate('/login');
        });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return null;
};

export default VerifyEmail;

