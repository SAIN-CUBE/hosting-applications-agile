"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardIcon, UserCircleIcon, DocumentTextIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, LightBulbIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const SalesPage = ({ requests, setRequests, handleStatusChange, handleEdit, handleSave, handleDelete }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [filter, setFilter] = useState('');

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedRequests = React.useMemo(() => {
        let sortableRequests = [...requests];
        if (sortConfig.key !== null) {
            sortableRequests.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableRequests;
    }, [requests, sortConfig]);

    const filteredRequests = sortedRequests.filter(request =>
        Object.values(request).some(value => 
            value.toString().toLowerCase().includes(filter.toLowerCase())
        )
    );

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white px-4 py-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
                        <table className="w-full">
                            <thead className="bg-gray-700 sticky top-0">
                                <tr>
                                    {['Name', 'Email', 'Company', 'Credits', 'Status', 'Message', 'Actions'].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort(header.toLowerCase())}
                                        >
                                            {header}
                                            {sortConfig.key === header.toLowerCase() && (
                                                <span>{sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}</span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {filteredRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {request.isEditing ? (
                                                <input
                                                    type="text"
                                                    defaultValue={request.name}
                                                    className="bg-gray-700 rounded px-2 py-1 w-full"
                                                    onBlur={(e) => handleSave(request.id, { name: e.target.value })}
                                                />
                                            ) : (
                                                request.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{request.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{request.company}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{request.credits}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={request.status}
                                                onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                className="bg-gray-700 rounded px-2 py-1"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {request.isEditing ? (
                                                <textarea
                                                    defaultValue={request.message}
                                                    className="bg-gray-700 rounded px-2 py-1 w-full"
                                                    onBlur={(e) => handleSave(request.id, { message: e.target.value })}
                                                    rows="3"
                                                />
                                            ) : (
                                                <div className="w-64">{request.message}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(request.id)}
                                                className="text-indigo-400 hover:text-indigo-300 mr-3"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(request.id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const schema = yup.object().shape({
    credits: yup.number().positive().integer().required('Credit amount is required'),
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    company: yup.string().required('Company name is required'),
    message: yup.string(),
});

const CreditPurchase = () => {
    const [step, setStep] = useState(1);
    const [isSalesView, setIsSalesView] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState([]);

    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
        mode: 'onChange',
    });

    const creditPackages = [
        { amount: 1000, price: 99 },
        { amount: 5000, price: 449 },
        { amount: 10000, price: 849 },
    ];

    useEffect(() => {
        const fetchRequests = async () => {
            // Simulating API call
            const mockRequests = [
                { id: 1, name: 'John Doe', email: 'john@example.com', company: 'ABC Corp', credits: 5000, status: 'Pending', message: 'Urgent request for new project. Need credits ASAP.' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', company: 'XYZ Inc', credits: 10000, status: 'Approved', message: 'Please process ASAP. We have a big campaign coming up and need these credits for our marketing efforts.' },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', company: '123 LLC', credits: 1000, status: 'Pending', message: 'Need credits for new project. Looking forward to using your platform for our upcoming product launch.' },
            ];
            setRequests(mockRequests);
        };

        fetchRequests();
    }, []);

    const handleStatusChange = (id, newStatus) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === id ? { ...req, status: newStatus } : req
            )
        );
    };

    const handleEdit = (id) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === id ? { ...req, isEditing: true } : req
            )
        );
    };

    const handleSave = (id, updatedRequest) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === id ? { ...req, ...updatedRequest, isEditing: false } : req
            )
        );
    };

    const handleDelete = (id) => {
        setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
    };

    const onSubmit = useCallback(async (data) => {
        setIsSubmitting(true);
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);

        // Add the new request to the list
        const newRequest = {
            id: Date.now(), // Use a better ID generation in production
            name: data.name,
            email: data.email,
            company: data.company,
            credits: data.credits,
            status: 'Pending',
            message: data.message || 'No additional message provided.'
        };
        setRequests(prevRequests => [...prevRequests, newRequest]);

        setStep(4);
    }, []);

    const steps = [
        { id: 1, name: 'Select Credits', icon: CreditCardIcon },
        { id: 2, name: 'User Details', icon: UserCircleIcon },
        { id: 3, name: 'Confirmation', icon: DocumentTextIcon },
        { id: 4, name: 'Request Sent', icon: CheckCircleIcon },
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3 }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <motion.h1
                    className="text-5xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {isSalesView ? "Sales Dashboard" : "Purchase Additional Credits"}
                </motion.h1>

                <button
                    onClick={() => setIsSalesView(!isSalesView)}
                    className="mb-8 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                    {isSalesView ? "Switch to User View" : "Switch to Sales View"}
                </button>

                {isSalesView ? (
                    <SalesPage
                        requests={requests}
                        setRequests={setRequests}
                        handleStatusChange={handleStatusChange}
                        handleEdit={handleEdit}
                        handleSave={handleSave}
                        handleDelete={handleDelete}
                    />
                ) : (
                    <>
                        {/* Progress Bar */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between relative">
                                {steps.map((s, index) => (
                                    <div key={s.id} className="flex flex-col items-center relative z-10">
                                        <motion.div
                                            className={`rounded-full h-16 w-16 flex items-center justify-center border-4 ${step >= s.id ? 'bg-blue-600 border-blue-400' : 'border-gray-600'}`}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            <s.icon className="h-8 w-8" />
                                        </motion.div>
                                        <p className="mt-2 text-sm font-medium">{s.name}</p>
                                    </div>
                                ))}
                                {/* Full line behind the steps */}
                                <div className="absolute top-8 left-0 w-full h-1 bg-gray-600 -z-10"></div>
                                {/* Blue line for completed steps */}
                                <div 
                                    className="absolute top-8 left-0 h-1 bg-blue-600 transition-all duration-300 -z-10"
                                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Form Steps */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={fadeInUp}
                            >
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    {step === 1 && (
                                        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
                                            <h2 className="text-3xl font-semibold mb-6">Select Credit Amount</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                {creditPackages.map((pkg, index) => (
                                                    <motion.div
                                                        key={index}
                                                        className={`bg-gray-700 p-6 rounded-lg cursor-pointer transition-all duration-300 ${watch('credits') === pkg.amount ? 'ring-2 ring-blue-500' : 'hover:bg-gray-600'}`}
                                                        onClick={() => reset({ credits: pkg.amount })}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <h3 className="text-2xl font-bold mb-2">{pkg.amount.toLocaleString()} Credits</h3>
                                                        <p className="text-xl text-blue-400">${pkg.price}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <div className="mb-6">
                                                <label htmlFor="credits" className="block text-sm font-medium mb-2">Custom Amount</label>
                                                <input
                                                    type="number"
                                                    id="credits"
                                                    {...register('credits')}
                                                    className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                                    placeholder="Enter custom credit amount"
                                                />
                                                {errors.credits && <p className="text-red-500 mt-1">{errors.credits.message}</p>}
                                                </div>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                            >
                                Next
                                <ArrowRightIcon className="h-5 w-5 ml-2" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
                            <h2 className="text-3xl font-semibold mb-6">User Details</h2>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        {...register('name')}
                                        className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    />
                                    {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        {...register('email')}
                                        className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    />
                                    {errors.email && <p className="text-red-500 mt-1">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        id="company"
                                        {...register('company')}
                                        className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    />
                                    {errors.company && <p className="text-red-500 mt-1">{errors.company.message}</p>}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center"
                                >
                                    Next
                                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
                            <h2 className="text-3xl font-semibold mb-6">Confirm Your Request</h2>
                            <div className="space-y-4 mb-6">
                                <p><strong>Credits:</strong> {watch('credits')}</p>
                                <p><strong>Name:</strong> {watch('name')}</p>
                                <p><strong>Email:</strong> {watch('email')}</p>
                                <p><strong>Company:</strong> {watch('company')}</p>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium mb-2">Additional Message (Optional)</label>
                                    <textarea
                                        id="message"
                                        {...register('message')}
                                        className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                        rows="4"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-6 flex items-start">
                                <LightBulbIcon className="h-6 w-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
                                <p className="text-sm">
                                    Your credit purchase request will be processed manually by our sales team. They will contact you shortly to complete the transaction.
                                </p>
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    {!isSubmitting && <CheckCircleIcon className="h-5 w-5 ml-2" />}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {step === 4 && (
                    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <CheckCircleIcon className="h-24 w-24 text-green-500 mx-auto mb-6" />
                        </motion.div>
                        <h2 className="text-3xl font-semibold mb-4">Request Sent Successfully!</h2>
                        <p className="mb-6 text-lg">Your credit purchase request for {watch('credits')} credits has been received. Our sales team will process it manually and contact you shortly at {watch('email')}.</p>
                        <button
                            onClick={() => {
                                setStep(1);
                                reset();
                            }}
                            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 inline-flex items-center"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            Start New Request
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    </>
)}
            </div>
        </div>
    );
};

export default CreditPurchase;