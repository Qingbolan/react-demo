import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';

const CSVPreviewApp = () => {
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('columns');
    const fileInputRef = useRef(null);

    // File upload handler
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setFileName(file.name);
        setFileSize(file.size);

        try {
            const content = await file.text();

            Papa.parse(content, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        setError(`Parse error: ${results.errors[0].message}`);
                    }

                    const parsedData = results.data;
                    const headersList = results.meta.fields || [];

                    setCsvData(parsedData);
                    setHeaders(headersList);
                    calculateStats(parsedData, headersList);
                    setCurrentPage(1);
                    setLoading(false);
                    // Switch to columns tab automatically after loading
                    setActiveTab('columns');
                },
                error: (error) => {
                    setError(`Parse error: ${error.message}`);
                    setLoading(false);
                }
            });
        } catch (e) {
            setError(`File reading error: ${e.message}`);
            setLoading(false);
        }
    };

    // Calculate statistics for each column
    const calculateStats = (data, headers) => {
        const statsObj = {};

        headers.forEach(header => {
            const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined);
            const numericValues = values.filter(val => typeof val === 'number');
            const uniqueValues = _.uniq(values);

            statsObj[header] = {
                count: values.length,
                empty: data.length - values.length,
                unique: uniqueValues.length,
                dataType: numericValues.length > 0 && numericValues.length === values.length ?
                    'numeric' : 'categorical',
                topValues: uniqueValues.length <= 5 ? uniqueValues : uniqueValues.slice(0, 5),
            };

            if (numericValues.length > 0) {
                statsObj[header].min = _.min(numericValues);
                statsObj[header].max = _.max(numericValues);
                statsObj[header].sum = _.sum(numericValues);
                statsObj[header].avg = numericValues.length > 0 ? statsObj[header].sum / numericValues.length : 0;
                statsObj[header].median = calculateMedian(numericValues);
            }
        });

        setStats(statsObj);
    };

    // Calculate median for numeric values
    const calculateMedian = (values) => {
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }

        return sorted[middle];
    };

    // Sort handler
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Filter data based on search term
    const filteredData = csvData.filter(row => {
        return headers.some(header => {
            const value = row[header];
            return value !== null &&
                value !== undefined &&
                String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
    });

    // Sort data based on sort configuration
    const sortedData = React.useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const valueA = a[sortConfig.key];
                const valueB = b[sortConfig.key];

                if (valueA === null || valueA === undefined) return 1;
                if (valueB === null || valueB === undefined) return -1;

                if (typeof valueA === 'number' && typeof valueB === 'number') {
                    return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
                } else {
                    const strA = String(valueA).toLowerCase();
                    const strB = String(valueB).toLowerCase();
                    return sortConfig.direction === 'ascending'
                        ? strA.localeCompare(strB)
                        : strB.localeCompare(strA);
                }
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = sortedData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    // Navigation handlers
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleChangeRowsPerPage = (value) => {
        setRowsPerPage(Number(value));
        setCurrentPage(1);
    };

    // Reset file and states
    const resetFile = () => {
        setCsvData([]);
        setHeaders([]);
        setFileName('');
        setFileSize(0);
        setCurrentPage(1);
        setSearchTerm('');
        setSortConfig({ key: null, direction: 'ascending' });
        setStats({});
        setError('');
        setActiveTab('columns');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Download as CSV
    const downloadCSV = () => {
        if (csvData.length === 0) return;

        const csvContent = Papa.unparse(csvData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `exported_${fileName || 'data.csv'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto py-6 px-4 max-w-6xl">
            {/* Main Card with Ruby-themed gradient header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="block w-full max-w-sm text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-rose-600 file:text-white hover:file:bg-rose-700"
                        />
                        {csvData.length > 0 && (
                            <button
                                onClick={resetFile}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {loading && (
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mt-4">
                            <div className="font-medium">Error</div>
                            <div className="text-sm">{error}</div>
                        </div>
                    )}
                </div>
            </div>

            {csvData.length > 0 && (
                <div className="mt-6">
                    {/* Tabs Navigation */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="border-b">
                            <div className="flex">
                                <button
                                    className={`py-3 px-6 font-medium text-sm ${activeTab === 'data' ? 'border-b-2 border-rose-600 text-rose-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('data')}
                                >
                                    Data Table
                                </button>
                                <button
                                    className={`py-3 px-6 font-medium text-sm ${activeTab === 'columns' ? 'border-b-2 border-rose-600 text-rose-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('columns')}
                                >
                                    Columns Overview
                                </button>
                                <button
                                    className={`py-3 px-6 font-medium text-sm ${activeTab === 'analysis' ? 'border-b-2 border-rose-600 text-rose-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('analysis')}
                                >
                                    Statistical Analysis
                                </button>
                                <button
                                    className={`py-3 px-6 font-medium text-sm ${activeTab === 'detailed' ? 'border-b-2 border-rose-600 text-rose-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('detailed')}
                                >
                                    Detailed Information
                                </button>
                            </div>
                        </div>

                        {/* Columns Overview Tab - First scenario */}
                        {activeTab === 'columns' && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-2">Dataset Overview</h2>
                                <p className="text-sm text-gray-500 mb-4">Explore your data structure to plan analysis and formulate questions</p>

                                <div className="overflow-auto max-h-96">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Empty</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Values</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Values</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {headers.map((header, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-700">{header}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stats[header]?.dataType === 'numeric' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {stats[header]?.dataType === 'numeric' ? 'Numeric' : 'Categorical'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.count || 0}/{csvData.length}
                                                        <span className="ml-1 text-gray-500 text-xs">
                                                            ({((stats[header]?.count / csvData.length) * 100 || 0).toFixed(1)}%)
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.unique || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                                        {stats[header]?.topValues?.slice(0, 3).join(', ')}
                                                        {stats[header]?.topValues?.length > 3 && '...'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Data Table Tab - Second scenario */}
                        {activeTab === 'data' && (
                            <div>
                                <div className="p-4 border-b">
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                        <input
                                            placeholder="Search data..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 max-w-sm"
                                        />

                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Rows per page:</span>
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={(e) => handleChangeRowsPerPage(e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>

                                            <button
                                                onClick={downloadCSV}
                                                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 text-sm transition-colors"
                                            >
                                                Export CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="overflow-auto max-h-96">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Row
                                                    </th>
                                                    {headers.map((header, index) => (
                                                        <th
                                                            key={index}
                                                            scope="col"
                                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                            onClick={() => requestSort(header)}
                                                        >
                                                            <div className="flex items-center">
                                                                {header}
                                                                {sortConfig.key === header && (
                                                                    <span className="ml-1">
                                                                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedData.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500">
                                                            {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                                                        </td>
                                                        {headers.map((header, colIndex) => (
                                                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-t flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Showing {Math.min(sortedData.length, 1) + (currentPage - 1) * rowsPerPage} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} rows
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePrevPage}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 border rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            Previous
                                        </button>
                                        <span className="flex items-center px-2 text-sm text-gray-700">
                                            {currentPage} / {totalPages || 1}
                                        </span>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className={`px-3 py-1 border rounded-md text-sm ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Statistical Analysis Tab - Third scenario */}
                        {activeTab === 'analysis' && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-2">Statistical Analysis</h2>
                                <p className="text-sm text-gray-500 mb-4">Detailed statistical metrics for each column</p>

                                <div className="overflow-auto max-h-96">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completeness</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Values</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mean</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Median</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {headers.map((header, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-700">{header}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stats[header]?.dataType === 'numeric' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {stats[header]?.dataType === 'numeric' ? 'Numeric' : 'Categorical'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {((stats[header]?.count / csvData.length) * 100 || 0).toFixed(1)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.unique || 0}
                                                        {stats[header]?.count > 0 &&
                                                            <span className="ml-1 text-gray-500 text-xs">
                                                                ({((stats[header]?.unique / stats[header]?.count) * 100).toFixed(1)}%)
                                                            </span>
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.min !== undefined ? stats[header].min.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.max !== undefined ? stats[header].max.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.avg !== undefined ? stats[header].avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {stats[header]?.median !== undefined ? stats[header].median.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Detailed Information Tab - Fourth scenario */}
                        {activeTab === 'detailed' && (
                            <div className="p-6">
                                {fileName && (
                                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 mb-1">Filename</span>
                                            <p className="text-sm">{fileName}</p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 mb-1">Size</span>
                                            <p className="text-sm">{(fileSize / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 mb-1">Rows</span>
                                            <p className="text-sm">{csvData.length}</p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 mb-1">Columns</span>
                                            <p className="text-sm">{headers.length}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSVPreviewApp;