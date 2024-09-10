"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.toast.message);
        setEmail('');
      } else {
        toast.error(data.toast.message);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputClasses = `
    appearance-none relative block w-full px-3 py-3 border
    placeholder-gray-400 text-gray-200 rounded-lg focus:outline-none 
    focus:ring-2 focus:ring-indigo-500 focus:z-10 
    sm:text-sm bg-gray-800 pl-10 transition-all duration-200
    autofill:bg-gray-800 autofill:text-gray-200 autofill:shadow-[inset_0_0_0px_1000px_rgb(31,41,55)]
    [-webkit-text-fill-color:rgb(229,231,235)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(229,231,235)]
    [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(31,41,55)_inset]
    border-gray-700 focus:border-indigo-500
  `;

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
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter your email to receive a password reset link
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            <div className="relative">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClasses}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
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
                'Send Reset Link'
              )}
            </motion.button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;