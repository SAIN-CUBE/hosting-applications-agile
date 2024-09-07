"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const OTPVerificationPage = () => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('user_id');
    if (userIdParam) {
      setUserId(userIdParam);
    }
    // Focus on the first input field when the component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOTP = [...otp];
    newOTP[index] = element.value;
    setOTP(newOTP);

    // Move to next input if current field is filled
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'Backspace':
        // Move to previous input on backspace if current field is empty
        if (index > 0 && otp[index] === '') {
          inputRefs.current[index - 1].focus();
        }
        break;
      case 'ArrowLeft':
        // Move to previous input on left arrow key
        if (index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1].focus();
        }
        break;
      case 'ArrowRight':
        // Move to next input on right arrow key
        if (index < 5) {
          e.preventDefault();
          inputRefs.current[index + 1].focus();
        }
        break;
      default:
        break;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOTP = [...otp];
    pastedData.forEach((value, index) => {
      if (index < 6 && !isNaN(value)) {
        newOTP[index] = value;
      }
    });
    setOTP(newOTP);
    // Focus on the next empty input or the last input
    const nextEmptyIndex = newOTP.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId) {
      toast.error('User ID is missing. Please try registering again.');
      setIsLoading(false);
      return;
    }

    if (otp.some(digit => digit === '')) {
      toast.error('Please enter the complete OTP.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          otp: otp.join(''),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account verified successfully!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast.error(data.error || 'Verification failed. Please try again.');
        // Clear OTP fields on error
        setOTP(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) {
      toast.error('User ID is missing. Please try registering again.');
      return;
    }

    try {
      const response = await fetch('/api/auth/resend-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('New OTP sent to your email.');
        // Clear OTP fields
        setOTP(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      } else {
        toast.error(data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-gray-700"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Verify Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter the 6-digit code sent to your email
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex justify-center space-x-2">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength="1"
                className="w-12 h-12 text-center text-2xl font-bold text-white bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 transition-all duration-200"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Verify OTP'
              )}
            </motion.button>
          </div>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={handleResendOTP}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
          >
            Resend OTP
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerificationPage;