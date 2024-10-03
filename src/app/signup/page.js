"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Toaster, toast } from 'react-hot-toast';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone_number: z.string().regex(
    /^((\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|03\d{2}[\s.-]?\d{7})$/,
    'Invalid phone number'
  ),
  password: passwordSchema,
  password2: z.string()
}).refine((data) => data.password === data.password2, {
  message: "Passwords don't match",
  path: ["password2"],
});

const SignUpPage = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Registration successful! Please verify your email.', {
          duration: 3000,
          position: 'top-center',
        });
        router.push(`/verify-otp?user_id=${result.user_id}`);
      } else {
        if (result.email) {
          setError('email', {
            type: 'manual',
            message: result.email,
          });
        } else if (result.password) {
          setError('password', {
            type: 'manual',
            message: result.password,
          });
        }
        toast.error(result.error || 'Registration failed. Please try again.', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
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
    { name: 'first_name', type: 'text', placeholder: 'First name', icon: UserIcon },
    { name: 'last_name', type: 'text', placeholder: 'Last name', icon: UserIcon },
    { name: 'email', type: 'email', placeholder: 'Email address', icon: EnvelopeIcon },
    { name: 'phone_number', type: 'tel', placeholder: 'Phone number', icon: PhoneIcon },
    { name: 'password', type: 'password', placeholder: 'Password', icon: LockClosedIcon },
    { name: 'password2', type: 'password', placeholder: 'Confirm Password', icon: LockClosedIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Toaster />
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full space-y-8 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-gray-700"
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
          <h2 className="mt-6 text-center text-4xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-xl text-gray-300">
            Join us and experience the future of collaboration
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {formFields.map((field) => (
              <div key={field.name} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                  <field.icon className={`h-5 w-5 transition-colors duration-200 ${errors[field.name] ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div className="relative">
                  <input
                    id={field.name}
                    type={field.name.includes('password') ? ((field.name === 'password' ? showPassword : showPassword2) ? 'text' : 'password') : field.type}
                    autoComplete={field.name}
                    className={`${inputClasses} ${errors[field.name] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                  />
                  {field.name.includes('password') && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 z-20 transition-colors duration-200"
                      onClick={() => field.name === 'password' ? setShowPassword(!showPassword) : setShowPassword2(!showPassword2)}
                    >
                      {(field.name === 'password' ? showPassword : showPassword2) ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {errors[field.name] && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-xs mt-1 absolute"
                    >
                      {errors[field.name].message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className='pt-4'>
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
                <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
            Already have an account? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;