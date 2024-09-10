"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const formSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPasswordFormPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(formSchema),
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { uid, token } = useParams();
    const router = useRouter();

    const onSubmit = async (data) => {
        setIsLoading(true);
    
        try {
          const response = await fetch(`/api/auth/password-reset/${uid}/${token}/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: data.password, password2: data.confirmPassword }),
          });
    
          const result = await response.json();
    
          if (response.ok) {
            toast.success(result.toast.message);
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          } else {
            toast.error(result.toast.message);
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
        sm:text-sm bg-gray-800 pl-10 pr-10 transition-all duration-200
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
                        Set New Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-300">
                        Enter your new password
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">
                                New Password
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                {...register("password")}
                                className={inputClasses}
                                placeholder="New password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                        )}
                        <div className="relative">
                            <label htmlFor="confirm-password" className="sr-only">
                                Confirm New Password
                            </label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                {...register("confirmPassword")}
                                className={inputClasses}
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
                        )}
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
                                'Reset Password'
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPasswordFormPage;