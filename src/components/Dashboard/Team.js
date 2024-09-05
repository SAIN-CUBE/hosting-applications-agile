"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const initialTeamMembers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Client', credits: 100, avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Visitor', credits: 50, avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Client', credits: 150, avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: 4, name: 'Sarah Brown', email: 'sarah@example.com', role: 'Org Admin', credits: 200, avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: 5, name: 'Chris Lee', email: 'chris@example.com', role: 'Visitor', credits: 25, avatar: 'https://i.pravatar.cc/150?img=5' },
];

const roles = ['Visitor', 'Client', 'Org Admin'];

const Team = () => {
    const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [totalCredits, setTotalCredits] = useState(1000);
    const [availableCredits, setAvailableCredits] = useState(1000);

    useEffect(() => {
        const usedCredits = teamMembers.reduce((sum, member) => sum + member.credits, 0);
        setAvailableCredits(totalCredits - usedCredits);
    }, [teamMembers, totalCredits]);

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (roleFilter === '' || member.role === roleFilter)
    );

    const getUniqueAvatar = () => {
        const randomId = Math.floor(Math.random() * 70) + 1; // generates a random number between 1 and 70
        return `https://i.pravatar.cc/150?img=${randomId}`;
    };

    const handleAddMember = (newMember) => {
        if (newMember.credits > availableCredits) {
            alert("Not enough credits available!");
            return;
        }
        setTeamMembers([...teamMembers, {
            ...newMember,
            id: Date.now(),
            avatar: getUniqueAvatar()
        }]);
        setShowModal(false);
    };

    const handleEditMember = (updatedMember) => {
        const oldCredits = teamMembers.find(m => m.id === updatedMember.id).credits;
        const creditDifference = updatedMember.credits - oldCredits;

        if (creditDifference > availableCredits) {
            alert("Not enough credits available!");
            return;
        }

        setTeamMembers(members => members.map(m => m.id === updatedMember.id ? updatedMember : m));
        setShowModal(false);
        setEditingMember(null);
    };

    const handleDeleteMember = (id) => {
        setTeamMembers(members => members.filter(m => m.id !== id));
        setActiveMenu(null);
    };

    const creditDistribution = roles.map(role => ({
        role,
        credits: teamMembers.filter(m => m.role === role).reduce((sum, m) => sum + m.credits, 0)
    }));

    const CreditDistributionCard = () => (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Credit Distribution</h2>
            <div className="space-y-4">
                {creditDistribution.map(({ role, credits }) => (
                    <div key={role} className="flex items-center">
                        <div className="w-24 text-gray-400">{role}</div>
                        <div className="flex-grow bg-gray-700 rounded-full h-4">
                            <div
                                className="bg-blue-500 rounded-full h-4"
                                style={{ width: `${(credits / totalCredits) * 100}%` }}
                            ></div>
                        </div>
                        <div className="w-16 text-right">{credits}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const TotalCreditsCard = () => (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Credit Overview</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-gray-400">Total Credits</p>
                    <p className="text-2xl font-bold">{totalCredits}</p>
                </div>
                <div>
                    <p className="text-gray-400">Available Credits</p>
                    <p className="text-2xl font-bold">{availableCredits}</p>
                </div>
            </div>
        </div>
    );

    const MemberForm = ({ onSubmit, initialData }) => {
        const [formData, setFormData] = useState(initialData || { name: '', email: '', role: '', credits: '' });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit({ ...formData, credits: parseInt(formData.credits) });
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                />
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                />
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
                <input
                    name="credits"
                    type="number"
                    value={formData.credits}
                    onChange={handleChange}
                    placeholder="Credits"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                />
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
                        Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
                        {editingMember ? 'Update Member' : 'Add Member'}
                    </button>
                </div>
            </form>
        );
    };


    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Team Management</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <CreditDistributionCard />
                    <TotalCreditsCard />
                </div>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
                    <div className="w-full sm:w-auto mb-4 sm:mb-0 relative">
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="w-full sm:w-64 px-4 py-2 pl-10 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <div className="flex space-x-4">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Roles</option>
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => { setEditingMember(null); setShowModal(true); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Member
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700 hidden sm:table-header-group">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                <AnimatePresence>
                                    {filteredMembers.map((member) => (
                                        <motion.tr
                                            key={member.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="hover:bg-gray-750 flex flex-col sm:table-row"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap sm:border-b sm:border-gray-700">
                                                <div className="flex items-center">
                                                    <img className="h-10 w-10 rounded-full mr-3" src={member.avatar} alt={member.name} />
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-gray-400 sm:hidden">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">{member.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap sm:table-cell">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'Org Admin' ? 'bg-purple-100 text-purple-800' :
                                                        member.role === 'Client' ? 'bg-green-100 text-green-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap sm:table-cell">Credits: {member.credits}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                                <button onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)} className="text-gray-400 hover:text-white">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </button>
                                                {activeMenu === member.id && (
                                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5">
                                                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                            <button
                                                                onClick={() => { setEditingMember(member); setShowModal(true); setActiveMenu(null); }}
                                                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMember(member.id)}
                                                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
                            >
                                <h2 className="text-2xl font-semibold mb-4">
                                    {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                                </h2>
                                <MemberForm
                                    onSubmit={editingMember ? handleEditMember : handleAddMember}
                                    initialData={editingMember}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default Team;                            