"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { UsersIcon, PlusCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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


const Team = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/team/', {
                headers: getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch team data');
            }
            
            const data = await response.json();
            setTeamMembers(data);
        } catch (error) {
            console.error('Error fetching team data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
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
            const data = await response.json();
            setTeamMembers([...teamMembers, data]);
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
            const data = await response.json();
            setTeamMembers(members => members.map(m => m.id === updatedMember.id ? data : m));
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
            setTeamMembers(members => members.filter(m => m.id !== id));
            setActiveMenu(null);
        } catch (err) {
            setError('Failed to delete team member');
        }
    };

    const filteredMembers = Array.isArray(teamMembers) 
    ? teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (roleFilter === '' || member.role === roleFilter)
      )
    : [];

    const MemberForm = ({ onSubmit, initialData }) => {
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
                    <option value="Client">Client</option>
                    <option value="Visitor">Visitor</option>
                </select>
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

    if (loading) {
        return <div className="text-white text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Team Management</h1>

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
                            <option value="Client">Client</option>
                            <option value="Visitor">Visitor</option>
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
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
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
                                            className="hover:bg-gray-750"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="font-medium">{member.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'Client' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {member.role}
                                                </span>
                                            </td>
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

const NoTeamMembers = ({ onAddFirstMember }) => {
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <UsersIcon className="h-24 w-24 text-blue-500 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold text-white mb-4">Your Team Awaits</h1>
                    <p className="text-gray-300 mb-8 text-lg">Start building your dream team today and unlock new possibilities.</p>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-full inline-flex items-center justify-center hover:bg-blue-700 transition duration-300 text-lg font-semibold shadow-lg"
                    onClick={onAddFirstMember}
                >
                    <PlusCircleIcon className="h-6 w-6 mr-2" />
                    Add First Team Member
                    <ChevronRightIcon className="h-5 w-5 ml-2" />
                </motion.button>
            </motion.div>
        </div>
    );
};

const NoAccessMessage = () => (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
            <UsersIcon className="h-24 w-24 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-gray-300 mb-8">You don't have the necessary permissions to view team data. Please contact your administrator for assistance.</p>
        </motion.div>
    </div>
);

const TeamPage = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasAccess, setHasAccess] = useState(true);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/team/', {
                headers: getHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    setHasAccess(false);
                    throw new Error('Access forbidden');
                }
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch team data');
            }
            
            const data = await response.json();
            setTeamMembers(data);
        } catch (error) {
            console.error('Error fetching team data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamData();
    }, []);

    if (loading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!hasAccess) {
        return <NoAccessMessage />;
    }

    if (error) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen">
          {teamMembers.length === 0 ? (
                <NoTeamMembers onAddFirstMember={fetchTeamData} />
            ) : (
                <Team teamMembers={teamMembers} setTeamMembers={setTeamMembers} />
            )}
        </div>
    );
};

export default TeamPage;