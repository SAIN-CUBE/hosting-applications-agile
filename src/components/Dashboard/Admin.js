"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, EllipsisVerticalIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const initialUsers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@acme.com',
        role: 'Org Admin',
        credits: 7100,
        lastLogin: '2024-08-22',
        isActive: true,
        revenue: 99,
        price: "$99",
        organizationId: 1,
        organizationName: 'Acme Corp',
        teamMembers: [
            {
                id: 2,
                name: 'Alice Smith',
                email: 'alice@acme.com',
                role: 'Client',
                credits: 500,
                lastLogin: '2024-08-21',
                isActive: true,
                revenue: 29,
                price: "$29"
            },
            {
                id: 3,
                name: 'Bob Johnson',
                email: 'bob@acme.com',
                role: 'Free Trial',
                credits: 100,
                lastLogin: '2024-08-20',
                isActive: true,
                revenue: 0,
                price: "$0"
            }
        ]
    },
    {
        id: 4,
        name: 'Sarah Brown',
        email: 'sarah@example.com',
        role: 'Client',
        credits: 300,
        lastLogin: '2024-08-19',
        isActive: true,
        revenue: 49,
        price: "$49"
    },
    {
        id: 5,
        name: 'Mike Wilson',
        email: 'mike@example.com',
        role: 'Free Trial',
        credits: 50,
        lastLogin: '2024-08-18',
        isActive: true,
        revenue: 0,
        price: "$0"
    }
];

const roles = ['Org Admin', 'Client', 'Free Trial', 'Sales'];

const Admin = () => {
    const [users, setUsers] = useState(initialUsers);
    const [selectedTab, setSelectedTab] = useState('dashboard');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [totalCredits, setTotalCredits] = useState(8050); // Sum of all credits
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [expandedOrgs, setExpandedOrgs] = useState({});

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (roleFilter === '' || user.role === roleFilter)
    );

    const handleAddUser = (newUser) => {
        const userToAdd = { 
            ...newUser, 
            id: Date.now(), 
            lastLogin: 'Never', 
            isActive: true, 
            revenue: parseInt(newUser.price.replace('$', '')), 
            credits: parseInt(newUser.credits) 
        };

        if (newUser.organizationId) {
            setUsers(prevUsers => prevUsers.map(user => {
                if (user.id === newUser.organizationId) {
                    return {
                        ...user,
                        teamMembers: [...(user.teamMembers || []), userToAdd]
                    };
                }
                return user;
            }));
        } else {
            setUsers(prevUsers => [...prevUsers, userToAdd]);
        }

        setShowModal(false);
        toast.success('User added successfully');
    };

    const handleEditUser = (updatedUser) => {
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === updatedUser.id) {
                return { ...updatedUser, revenue: parseInt(updatedUser.price.replace('$', '')) };
            }
            if (user.teamMembers) {
                return {
                    ...user,
                    teamMembers: user.teamMembers.map(member =>
                        member.id === updatedUser.id ? { ...updatedUser, revenue: parseInt(updatedUser.price.replace('$', '')) } : member
                    )
                };
            }
            return user;
        }));
        setShowModal(false);
        setEditingUser(null);
        toast.success('User updated successfully');
    };

    const handleDeleteUser = (userId) => {
        setConfirmAction(() => () => {
            setUsers(prevUsers => {
                const newUsers = prevUsers.filter(user => user.id !== userId);
                newUsers.forEach(user => {
                    if (user.teamMembers) {
                        user.teamMembers = user.teamMembers.filter(member => member.id !== userId);
                    }
                });
                return newUsers;
            });
            toast.success('User deleted successfully');
        });
        setShowConfirmModal(true);
    };

    const handleToggleUserStatus = (userId) => {
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === userId) {
                return { ...user, isActive: !user.isActive };
            }
            if (user.teamMembers) {
                return {
                    ...user,
                    teamMembers: user.teamMembers.map(member =>
                        member.id === userId ? { ...member, isActive: !member.isActive } : member
                    )
                };
            }
            return user;
        }));
        toast.success(`User ${users.find(u => u.id === userId).isActive ? 'disabled' : 'enabled'} successfully`);
    };

    const handleResetPassword = (userId) => {
        toast.success('Password reset link sent to user');
    };

    const handleChangeRole = (userId, newRole) => {
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === userId) {
                return { ...user, role: newRole };
            }
            if (user.teamMembers) {
                return {
                    ...user,
                    teamMembers: user.teamMembers.map(member =>
                        member.id === userId ? { ...member, role: newRole } : member
                    )
                };
            }
            return user;
        }));
        toast.success('User role updated successfully');
    };

    const UserForm = ({ onSubmit, initialData }) => {
        const [formData, setFormData] = useState(initialData || { name: '', email: '', role: '', credits: 0, price: '', organizationId: '' });

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
                <input
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Price"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                />
                <select
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleChange}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                >
                    <option value="">Select Organization (optional)</option>
                    {users.filter(user => user.role === 'Org Admin').map(org => (
                        <option key={org.id} value={org.id}>{org.organizationName}</option>
                    ))}
                </select>
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
                        Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300">
                        {editingUser ? 'Update User' : 'Add User'}
                    </button>
                </div>
            </form>
        );
    };

    const DashboardTab = () => {
        const totalUsers = users.length + users.filter(u => u.teamMembers).flatMap(u => u.teamMembers).length;
        const activeUsers = users.filter(u => u.isActive).length + 
                            users.filter(u => u.teamMembers).flatMap(u => u.teamMembers).filter(m => m.isActive).length;
        const totalRevenue = users.reduce((sum, user) => sum + user.revenue, 0) + 
                             users.filter(u => u.teamMembers).flatMap(u => u.teamMembers).reduce((sum, member) => sum + member.revenue, 0);

        const allUsers = [...users, ...users.filter(u => u.teamMembers).flatMap(u => u.teamMembers)];

        const creditData = {
            labels: allUsers.map(user => user.name),
            datasets: [
                {
                    label: 'Revenue ($)',
                    data: allUsers.map(user => user.revenue),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    yAxisID: 'y-axis-1',
                },
                {
                    label: 'Credits',
                    data: allUsers.map(user => user.credits),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    yAxisID: 'y-axis-2',
                },
            ],
        };

        const creditOptions = {
            responsive: true,
            scales: {
                'y-axis-1': {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                },
                'y-axis-2': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Credits'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'User Revenue and Credits',
                },
            },
        };

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Total Users</h2>
                        <p className="text-4xl font-bold">{totalUsers}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Active Users</h2>
                        <p className="text-4xl font-bold">{activeUsers}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Total Credits</h2>
                        <p className="text-4xl font-bold">{totalCredits}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Total Revenue</h2>
                        <p className="text-4xl font-bold">${totalRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-xl font-semibold mb-4">User Revenue and Credits</h2>
                    <Bar data={creditData} options={creditOptions} />
                </div>
            </div>
        );
    };

    const UsersTab = () => {
        const [expandedOrgs, setExpandedOrgs] = useState({});
        const [activeMenu, setActiveMenu] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [roleFilter, setRoleFilter] = useState('');
    
        const toggleOrgExpansion = (orgId) => {
            setExpandedOrgs(prev => ({ ...prev, [orgId]: !prev[orgId] }));
        };
    
        const filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (roleFilter === '' || user.role === roleFilter)
        );
    

        return (
            <div>
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
                    <div className="w-full sm:w-auto mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full sm:w-64 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                            onClick={() => { setEditingUser(null); setShowModal(true); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add User
                        </button>
                    </div>
                </div>
                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredUsers.map((user) => (
                                <React.Fragment key={user.id}>
                                    <tr className="hover:bg-gray-750">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.role === 'Org Admin' && user.teamMembers ? (
                                                <div className="flex items-center">
                                                    <span>{user.name}</span>
                                                    <button onClick={() => toggleOrgExpansion(user.id)}>
                                                        {expandedOrgs[user.id] ? (
                                                            <ChevronUpIcon className="h-5 w-5 ml-2" />
                                                        ) : (
                                                            <ChevronDownIcon className="h-5 w-5 ml-2" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                user.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.credits}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.lastLogin}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === user.id ? null : user.id);
                                                }} 
                                                className="text-gray-400 hover:text-white"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {activeMenu === user.id && (
                                                <div className="absolute right-0 mt-2 w-48 z-20 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5">
                                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation();
                                                                setEditingUser(user); 
                                                                setShowModal(true); 
                                                                setActiveMenu(null); 
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteUser(user.id);
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleUserStatus(user.id);
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                        >
                                                            {user.isActive ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleResetPassword(user.id);
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                        >
                                                            Reset Password
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    {user.role === 'Org Admin' && user.teamMembers && expandedOrgs[user.id] && (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-4 bg-gray-750">
                                                <table className="w-full">
                                                    <tbody>
                                                        {user.teamMembers.map((member) => (
                                                            <tr key={member.id} className="hover:bg-gray-700">
                                                                <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{member.role}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{member.credits}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{member.price}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{member.lastLogin}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {member.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveMenu(activeMenu === member.id ? null : member.id);
                                                                        }} 
                                                                        className="text-gray-400 hover:text-white"
                                                                    >
                                                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                                                    </button>
                                                                    {activeMenu === member.id && (
                                                                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5">
                                                                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                                                <button
                                                                                    onClick={(e) => { 
                                                                                        e.stopPropagation();
                                                                                        setEditingUser(member); 
                                                                                        setShowModal(true); 
                                                                                        setActiveMenu(null); 
                                                                                    }}
                                                                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteUser(member.id);
                                                                                    }}
                                                                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleToggleUserStatus(member.id);
                                                                                    }}
                                                                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                                                >
                                                                                    {member.isActive ? 'Disable' : 'Enable'}
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleResetPassword(member.id);
                                                                                    }}
                                                                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white w-full text-left"
                                                                                >
                                                                                    Reset Password
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    
    const SettingsTab = () => {
        const [systemCredits, setSystemCredits] = useState(totalCredits);
        const [creditsAlert, setCreditsAlert] = useState('');
        const [selectedUser, setSelectedUser] = useState('');
        const [creditIncrease, setCreditIncrease] = useState(0);
    
        const totalUserCredits = users.reduce((sum, user) => sum + user.credits + (user.teamMembers ? user.teamMembers.reduce((teamSum, member) => teamSum + member.credits, 0) : 0), 0);
    
        useEffect(() => {
            if (systemCredits < totalUserCredits) {
                setCreditsAlert('Warning: System credits are less than total user credits!');
            } else if (systemCredits < totalUserCredits * 1.2) {  // 20% buffer
                setCreditsAlert('Low credit alert: System credits are running low.');
            } else {
                setCreditsAlert('');
            }
        }, [systemCredits, totalUserCredits]);
    
        const handleSystemCreditsChange = (e) => {
            const newCredits = parseInt(e.target.value);
            setSystemCredits(newCredits);
            setTotalCredits(newCredits);
        };
    
        const handleIncreaseCredits = () => {
            if (selectedUser && creditIncrease > 0) {
                setUsers(prevUsers => prevUsers.map(user => {
                    if (user.id.toString() === selectedUser) {
                        return { ...user, credits: user.credits + creditIncrease };
                    }
                    if (user.teamMembers) {
                        return {
                            ...user,
                            teamMembers: user.teamMembers.map(member => 
                                member.id.toString() === selectedUser 
                                    ? { ...member, credits: member.credits + creditIncrease }
                                    : member
                            )
                        };
                    }
                    return user;
                }));
                setCreditIncrease(0);
                setSelectedUser('');
                toast.success('User credits increased successfully');
            }
        };
    
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl space-y-6">
                <h2 className="text-2xl font-semibold mb-6">System Settings</h2>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Total System Credits</label>
                    <input
                        type="number"
                        value={systemCredits}
                        onChange={handleSystemCreditsChange}
                        className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                    {creditsAlert && (
                        <p className={`mt-2 text-sm ${creditsAlert.includes('Warning') ? 'text-red-500' : 'text-yellow-500'}`}>
                            {creditsAlert}
                        </p>
                    )}
                </div>
    
                <div>
                    <h3 className="text-xl font-semibold mb-4">Increase User Credits</h3>
                    <div className="flex space-x-4">
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="bg-gray-700 rounded-lg px-4 py-2 text-white flex-grow">
                            <option value="">Select User</option>
                            {users.flatMap(user => [
                                <option key={user.id} value={user.id}>{user.name}</option>,
                                ...(user.teamMembers ? user.teamMembers.map(member => 
                                    <option key={member.id} value={member.id}>{member.name} (Team Member)</option>
                                ) : [])
                            ])}
                        </select>
                        <input
                            type="number"
                            value={creditIncrease}
                            onChange={(e) => setCreditIncrease(parseInt(e.target.value))}
                            placeholder="Credits to add"
                            className="bg-gray-700 rounded-lg px-4 py-2 text-white w-1/3"
                        />
                        <button
                            onClick={handleIncreaseCredits}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                        >
                            Increase
                        </button>
                    </div>
                </div>
    
                <div>
                    <h3 className="text-xl font-semibold mb-4">Credit Usage</h3>
                    <p>Total User Credits: {totalUserCredits}</p>
                    <p>Available System Credits: {systemCredits}</p>
                </div>
            </div>
        );
    };

    const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => (
        <AnimatePresence>
            {isOpen && (
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
                        <h2 className="text-2xl font-semibold mb-4">Confirm Action</h2>
                        <p className="mb-6">{message}</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={onClose} className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
                                Cancel
                            </button>
                            <button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300">
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                <div className="flex mb-8">
                    <button
                        onClick={() => setSelectedTab('dashboard')}
                        className={`mr-4 px-4 py-2 rounded-lg ${selectedTab === 'dashboard' ? 'bg-blue-600' : 'bg-gray-800'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setSelectedTab('users')}
                        className={`mr-4 px-4 py-2 rounded-lg ${selectedTab === 'users' ? 'bg-blue-600' : 'bg-gray-800'}`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setSelectedTab('settings')}
                        className={`px-4 py-2 rounded-lg ${selectedTab === 'settings' ? 'bg-blue-600' : 'bg-gray-800'}`}
                    >
                        Settings
                    </button>
                </div>

                {selectedTab === 'dashboard' && <DashboardTab />}
                {selectedTab === 'users' && <UsersTab />}
                {selectedTab === 'settings' && <SettingsTab />}

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
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h2>
                                <UserForm
                                    onSubmit={editingUser ? handleEditUser : handleAddUser}
                                    initialData={editingUser}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmAction}
                    message="Are you sure you want to perform this action?"
                />

                <ToastContainer
                    position="bottom-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                />
            </div>
        </div>
    );
}

export default Admin;