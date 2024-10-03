"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Toaster, toast } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});


const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const data = { access_token: tokenResponse.access_token }; // Google access token
  
      try {
        const response = await fetch('/api/auth/google/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', result.tokens.access);
          localStorage.setItem('refreshToken', result.tokens.refresh);
          localStorage.setItem('sid', result.sid);
  
          // Show success toast and redirect
          toast.success('Login successful! Redirecting...', {
            duration: 3000,
            position: 'top-center',
          });
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          const errorMessage = result.error || 'Login failed. Please try again.';
          
          // Check for specific error messages from backend and show appropriate toast message
          if (errorMessage.includes('Google Sign-In')) {
            toast.error('This account uses Google Sign-In. Please use Google to log in.', {
              duration: 4000,
              position: 'top-center',
            });
          } else if (errorMessage.includes('email and password')) {
            toast.error('This account requires email login. Please use your email and password.', {
              duration: 4000,
              position: 'top-center',
            });
          } else {
            toast.error(errorMessage, {
              duration: 4000,
              position: 'top-center',
            });
          }
        }
      } catch (error) {
        console.error('Google login error:', error);
        toast.error('An error occurred. Please try again.', {
          duration: 4000,
          position: 'top-center',
        });
      }
    },
    onError: () => {
      toast.error('Google login failed. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    },
  });
  
  
  // Replace your existing GoogleLogin component with this:
  const GoogleLoginButton = () => (
    <button
      onClick={() => handleGoogleLogin()}
      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
        />
      </svg>
      Sign in with Google
    </button>
  );

  const onSubmit = async (data) => {
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        // Store both access and refresh tokens
        localStorage.setItem('accessToken', result.token.access);
        localStorage.setItem('refreshToken', result.token.refresh);
        localStorage.setItem('sid', result.sid);
  
        // Show success toast and redirect
        toast.success('Login successful! Redirecting...', {
          duration: 3000,
          position: 'top-center',
        });
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        const errorMessage = result.error || 'Login failed. Please try again.';
  
        // Check for specific error messages from backend and show appropriate toast message
        if (errorMessage.includes('Google Sign-In')) {
          toast.error('This account uses Google Sign-In. Please use Google to log in.', {
            duration: 4000,
            position: 'top-center',
          });
        } else if (errorMessage.includes('email and password')) {
          toast.error('This account requires email login. Please use your email and password.', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          toast.error(errorMessage, {
            duration: 4000,
            position: 'top-center',
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
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
  `;

  const formFields = [
    { name: 'email', type: 'email', placeholder: 'Email address', icon: EnvelopeIcon },
    { name: 'password', type: 'password', placeholder: 'Password', icon: LockClosedIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Toaster />
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-gray-700"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto h-24 w-24 text-indigo-500 bg-indigo-100 rounded-full flex items-center justify-center"
          >
            <LockClosedIcon className="w-14 h-14" />
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Welcome back! Please enter your details
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {formFields.map((field) => (
              <div key={field.name} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                  <field.icon className={`h-5 w-5 transition-colors duration-200 ${errors[field.name] ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div className="relative">
                  <input
                    id={field.name}
                    type={field.name === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                    autoComplete={field.name}
                    className={`${inputClasses} ${errors[field.name] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                  />
                  {field.name === 'password' && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 z-20 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
                {errors[field.name] && (
                  <p className="text-red-400 text-xs mt-1 absolute">
                    {errors[field.name].message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/reset-password" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className='pt-2'>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-3 border border-transparent text-lg font-medium rounded-lg text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/signup" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
            Don't have an account? Sign up
          </Link>
        </div>
        <div className="mt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-300">Or continue with</span>
            </div>
          </div>
          <div className="mt-6">
            <GoogleLoginButton />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;