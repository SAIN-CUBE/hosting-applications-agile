"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useFilters, usePagination } from 'react-table';
import { format } from 'date-fns';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { CalendarIcon, UserIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Mocked data (same as before)
const mockLogs = [
    { id: 1, userId: 1, userName: 'John Doe', action: 'Login', timestamp: '2024-08-24T10:30:00Z', details: 'Successful login' },
    { id: 2, userId: 2, userName: 'Alice Smith', action: 'Credit Usage', timestamp: '2024-08-24T11:15:00Z', details: 'Used 100 credits' },
    // ... more log entries
];

const mockUsers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Alice Smith' },
    // ... more users
];

const actionTypes = ['Login', 'Logout', 'Credit Usage', 'Password Reset', 'Profile Update'];

const Reports = () => {
    const [activeTab, setActiveTab] = useState('logging');
    const [logs, setLogs] = useState(mockLogs);
    const [filterDate, setFilterDate] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [reportType, setReportType] = useState('systemUsage');
    const [dateRange, setDateRange] = useState('lastWeek');

    useEffect(() => {
        // In a real application, you would fetch logs from an API here
        // setLogs(fetchedLogs);
    }, []);

    // Logging tab functions
    const columns = React.useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'id',
            },
            {
                Header: 'User',
                accessor: 'userName',
            },
            {
                Header: 'Action',
                accessor: 'action',
            },
            {
                Header: 'Timestamp',
                accessor: 'timestamp',
                Cell: ({ value }) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'),
            },
            {
                Header: 'Details',
                accessor: 'details',
            },
        ],
        []
    );

    const filterLogs = useCallback(() => {
        let filteredLogs = [...mockLogs];

        if (filterDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp.startsWith(filterDate));
        }

        if (filterUser) {
            filteredLogs = filteredLogs.filter(log => log.userName === filterUser);
        }

        if (filterAction) {
            filteredLogs = filteredLogs.filter(log => log.action === filterAction);
        }

        setLogs(filteredLogs);
    }, [filterDate, filterUser, filterAction]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data: logs,
            initialState: { pageIndex: 0, pageSize: 10 },
        },
        useFilters,
        useSortBy,
        usePagination
    );

    // Reports tab functions
    const systemUsageData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Active Users',
                data: [65, 59, 80, 81, 56, 55, 40],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Credits Used',
                data: [28, 48, 40, 19, 86, 27, 90],
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
        ],
    };

    const creditDistributionData = {
        labels: ['Free Trial', 'Basic Plan', 'Pro Plan', 'Enterprise'],
        datasets: [
            {
                data: [300, 50, 100, 200],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            },
        ],
    };

    const revenueData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Revenue',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ],
    };

    const getChartData = useCallback(() => {
        switch (reportType) {
            case 'systemUsage':
                return systemUsageData;
            case 'creditDistribution':
                return creditDistributionData;
            case 'revenue':
                return revenueData;
            default:
                return systemUsageData;
        }
    }, [reportType]);

    const renderChart = useCallback(() => {
        const data = getChartData();
        switch (reportType) {
            case 'systemUsage':
                return <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
            case 'creditDistribution':
                return <Pie data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
            case 'revenue':
                return <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
            default:
                return <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
        }
    }, [reportType, getChartData]);

    const exportAsPDF = useCallback(() => {
        const doc = new jsPDF();
        doc.text('Activity Logs', 14, 15);
        doc.autoTable({
            head: [columns.map(column => column.Header)],
            body: logs.map(log => columns.map(column => {
                if (column.accessor === 'timestamp') {
                    return format(new Date(log[column.accessor]), 'yyyy-MM-dd HH:mm:ss');
                }
                return log[column.accessor];
            })),
        });
        doc.save('activity_logs.pdf');
    }, [logs, columns]);

    const csvData = logs.map(log => ({
        ...log,
        timestamp: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
    }));

    return (
        <div className="bg-gray-900 ml-6 text-gray-100 p-6">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold mb-6"
            >
                Reports And Logging
            </motion.h1>

            <div className="mb-6 space-x-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('logging')}
                    className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'logging' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Logging
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Reports
                </motion.button>
            </div>

            {activeTab === 'logging' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <h2 className="text-2xl font-bold">Activity Logs</h2>
                    <div className="flex flex-wrap gap-4">
                        <div className="relative">
                            <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="pl-10 p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="pl-10 p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Users</option>
                                {mockUsers.map((user) => (
                                    <option key={user.id} value={user.name}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="pl-10 p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Actions</option>
                                {actionTypes.map((action) => (
                                    <option key={action} value={action}>
                                        {action}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={filterLogs}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Apply Filters
                        </motion.button>
                    </div>

                    <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
                        <table {...getTableProps()} className="w-full">
                            <thead>
                                {headerGroups.map((headerGroup) => (
                                    <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map((column) => (
                                            <th
                                                key={column.id}
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                className="p-3 text-left bg-gray-700 border-b border-gray-600"
                                            >
                                                {column.render('Header')}
                                                <span>
                                                    {column.isSorted
                                                        ? column.isSortedDesc
                                                            ? ' 🔽'
                                                            : ' 🔼'
                                                        : ''}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody {...getTableBodyProps()}>
                                {page.map((row) => {
                                    prepareRow(row);
                                    return (
                                        <tr key={row.id} {...row.getRowProps()} className="border-b border-gray-700 hover:bg-gray-700">
                                            {row.cells.map((cell) => (
                                                <td key={cell.column.id} {...cell.getCellProps()} className="p-3">
                                                    {cell.render('Cell')}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between">
                        <div className="space-x-2">
                            <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="p-2 border border-gray-600 rounded-md disabled:opacity-50">
                                {'<<'}
                            </button>
                            <button onClick={() => previousPage()} disabled={!canPreviousPage} className="p-2 border border-gray-600 rounded-md disabled:opacity-50">
                                {'<'}
                            </button>
                            <button onClick={() => nextPage()} disabled={!canNextPage} className="p-2 border border-gray-600 rounded-md disabled:opacity-50">
                                {'>'}
                            </button>
                            <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} className="p-2 border border-gray-600 rounded-md disabled:opacity-50">
                                {'>>'}
                            </button>
                        </div>
                        <span>
                            Page{' '}
                            <strong>
                                {pageIndex + 1} of {pageOptions.length}
                            </strong>{' '}
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    Show {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-6 flex gap-4">
                        <CSVLink
                            data={csvData}
                            filename={"activity_logs.csv"}
                            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export as CSV
                        </CSVLink>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={exportAsPDF}
                            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export as PDF
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {activeTab === 'reports' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <h2 className="text-2xl font-bold">Reports</h2>
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="systemUsage">System Usage</option>
                            <option value="creditDistribution">Credit Distribution</option>
                            <option value="revenue">Revenue</option>
                        </select>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="p-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="lastWeek">Last Week</option>
                            <option value="lastMonth">Last Month</option>
                            <option value="lastYear">Last Year</option>
                        </select>
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gray-800 p-6 rounded-lg shadow-xl"
                        style={{ height: '400px' }}
                    >
                        {renderChart()}
                    </motion.div>

                    <div className="mt-6 flex gap-4">
                        <CSVLink
                            data={getChartData().datasets[0].data.map((value, index) => ({
                                label: getChartData().labels[index],
                                value: value
                            }))}
                            filename={`${reportType}_report.csv`}
                            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export as CSV
                        </CSVLink>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                const canvas = document.querySelector('canvas');
                                const pdf = new jsPDF();
                                pdf.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 15);
                                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 20, 190, 100);
                                pdf.save(`${reportType}_report.pdf`);
                            }}
                            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export as PDF
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Reports;