"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const getHeaders = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        throw new Error('No access token found');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
};

const TeamManagementPage = () => {
    const [team, setTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'add', 'edit'
    const [editingMember, setEditingMember] = useState(null);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/team/', {
                headers: getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch team data');
            }
            
            const data = await response.json();
            setTeam(data);
            setTeamMembers(data.team_members || []);
        } catch (error) {
            console.error('Error fetching team data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (teamName) => {
        try {
            const response = await fetch('/api/team/create/', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ team_name: teamName }),
            });
            if (!response.ok) {
                throw new Error('Failed to create team');
            }
            await fetchTeamData();
            setShowModal(false);
        } catch (err) {
            setError('Failed to create team');
        }
    };

    const handleAddMember = async (newMember) => {
        try {
            const response = await fetch('/api/team/add/', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newMember),
            });
            if (!response.ok) {
                throw new Error('Failed to add team member');
            }
            await fetchTeamData();
            setShowModal(false);
        } catch (err) {
            setError('Failed to add team member');
        }
    };

    const handleEditMember = async (updatedMember) => {
        try {
            const response = await fetch(`/api/team/update/${updatedMember.id}/`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updatedMember),
            });
            if (!response.ok) {
                throw new Error('Failed to update team member');
            }
            await fetchTeamData();
            setShowModal(false);
            setEditingMember(null);
        } catch (err) {
            setError('Failed to update team member');
        }
    };

    const handleDeleteMember = async (id) => {
        try {
            const response = await fetch(`/api/team/delete/${id}/`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!response.ok) {
                throw new Error('Failed to delete team member');
            }
            await fetchTeamData();
        } catch (err) {
            setError('Failed to delete team member');
        }
    };

    if (loading) {
        return <div className="text-white text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    if (!team) {
        return <NoTeamView onCreateTeam={() => { setModalMode('create'); setShowModal(true); }} />;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Team Management - {team.team_name}</h1>

                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <p>Team Admin: {team.org_admin}</p>
                    </div>
                    <button
                        onClick={() => { setModalMode('add'); setShowModal(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Member
                    </button>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {teamMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-750">
                                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => { setEditingMember(member); setModalMode('edit'); setShowModal(true); }}
                                            className="text-indigo-400 hover:text-indigo-300 mr-3"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
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

                <AnimatePresence>
                    {showModal && (
                        <Modal
                            mode={modalMode}
                            onClose={() => setShowModal(false)}
                            onSubmit={modalMode === 'create' ? handleCreateTeam : modalMode === 'add' ? handleAddMember : handleEditMember}
                            initialData={editingMember}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const NoTeamView = ({ onCreateTeam }) => (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
            <UsersIcon className="h-24 w-24 text-blue-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Create Your Team</h1>
            <p className="text-gray-300 mb-8">Start by creating your team to manage members and collaborate effectively.</p>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-8 py-4 rounded-full inline-flex items-center justify-center hover:bg-blue-700 transition duration-300 text-lg font-semibold shadow-lg"
                onClick={onCreateTeam}
            >
                Create Team
                <ChevronRightIcon className="h-5 w-5 ml-2" />
            </motion.button>
        </motion.div>
    </div>
);

const Modal = ({ mode, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState(initialData || { name: '', email: '', role: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
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
                <h2 className="text-2xl font-semibold mb-4 text-white">
                    {mode === 'create' ? 'Create Team' : mode === 'add' ? 'Add Team Member' : 'Edit Team Member'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'create' ? (
                        <input
                            name="team_name"
                            value={formData.team_name || ''}
                            onChange={handleChange}
                            placeholder="Team Name"
                            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                            required
                        />
                    ) : (
                        <>
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
                                <option value="Client">Client</option>
                                <option value="Visitor">Visitor</option>
                            </select>
                        </>
                    )}
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
                            {mode === 'create' ? 'Create Team' : mode === 'add' ? 'Add Member' : 'Update Member'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default TeamManagementPage;