import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { 
  CreditCard, 
  X, 
  DollarSign, 
  RefreshCw, 
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showError } from '../utils/toast.js';
import { apiGet } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Transform backend payment data to frontend format
const transformPaymentFromBackend = (backendPayment) => {
  // Map payment method from backend format to frontend format
  const paymentMethodMap = {
    'cash': 'Cash',
    'mpesa': 'M-Pesa',
    'bank_transfer': 'Bank Transfer',
    'credit_card': 'Credit Card',
    'cheque': 'Cheque',
    '': 'Other'
  };

  // Map status from backend format to frontend format
  const statusMap = {
    'Paid': 'Completed',
    'Pending': 'Pending',
    'Failed': 'Failed',
    'Cancelled': 'Cancelled'
  };

  // Map direction from backend format to frontend format
  const directionMap = {
    'Incoming': 'incoming',
    'Outgoing': 'outgoing'
  };

  return {
    id: backendPayment.id,
    date: backendPayment.created_at ? backendPayment.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    reference: backendPayment.receipt_number || `PAY-${backendPayment.id}`,
    type: 'Customer Payment', // Default type since backend doesn't provide this
    payer_payee: backendPayment.paid_by || 'Unknown',
    description: `Payment - Receipt ${backendPayment.receipt_number || backendPayment.id}`, // Default description
    amount: parseFloat(backendPayment.amount_received || 0),
    payment_method: paymentMethodMap[backendPayment.payment_method?.toLowerCase()] || backendPayment.payment_method || 'Other',
    transaction_id: backendPayment.receipt_number || '',
    status: statusMap[backendPayment.status] || backendPayment.status || 'Pending',
    direction: directionMap[backendPayment.direction] || backendPayment.direction?.toLowerCase() || 'incoming'
  };
};

const Payments = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Payment types
  const paymentTypes = ['Customer Payment', 'Supplier Payment', 'Expense Payment', 'Other'];
  
  // Payment methods
  const paymentMethods = ['Cash', 'Bank Transfer', 'M-Pesa', 'Credit Card', 'Cheque', 'Other'];

  // Payment statuses
  const statuses = ['Completed', 'Pending', 'Failed', 'Cancelled'];

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDirection, setFilterDirection] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const itemsPerPage = 10;

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build endpoint with pagination
      const endpoint = `/payments/?limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}`;
      const response = await apiGet(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const paymentsArray = data.results || [];
      const transformedPayments = paymentsArray.map(transformPaymentFromBackend);
      
      setPayments(transformedPayments);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for authentication to be ready before fetching
    if (!authLoading && isAuthenticated) {
      fetchPayments(currentPage);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentPage === 1) {
      fetchPayments(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, filterStatus, filterDirection, filterDateRange]);
  
  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, filterStatus, filterDirection, filterDateRange]);

  const getStatusBadge = (status) => {
    const badges = {
      'Completed': 'bg-green-100 text-green-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Failed': 'bg-red-100 text-red-700',
      'Cancelled': 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Completed': <CheckCircle size={14} />,
      'Pending': <Clock size={14} />,
      'Failed': <XCircle size={14} />,
      'Cancelled': <XCircle size={14} />
    };
    return icons[status] || <Clock size={14} />;
  };

  // Filter payments based on search term and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.payer_payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'All' || payment.type === filterType;
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesDirection = filterDirection === 'All' || payment.direction === filterDirection;

    let matchesDateRange = true;
    if (filterDateRange !== 'All') {
      const paymentDate = new Date(payment.date);
      const today = new Date();
      
      if (filterDateRange === 'Today') {
        matchesDateRange = paymentDate.toDateString() === today.toDateString();
      } else if (filterDateRange === 'This Week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDateRange = paymentDate >= weekAgo;
      } else if (filterDateRange === 'This Month') {
        matchesDateRange = paymentDate.getMonth() === today.getMonth() && 
                          paymentDate.getFullYear() === today.getFullYear();
      } else if (filterDateRange === 'This Year') {
        matchesDateRange = paymentDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDirection && matchesDateRange;
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const incomingPayments = filteredPayments.filter(p => p.direction === 'incoming').reduce((sum, p) => sum + p.amount, 0);
  const outgoingPayments = filteredPayments.filter(p => p.direction === 'outgoing').reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = filteredPayments.filter(p => p.status === 'Completed').length;

  const handlePreviousPage = () => {
    if (hasPrevious && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (hasNext && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterDirection('All');
    setFilterDateRange('All');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [filterType, filterStatus, filterDirection, filterDateRange].filter(f => f !== 'All').length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments Management</h1>
            <p className="text-gray-600">Track all incoming and outgoing payments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">{CURRENCY_SYMBOL} {totalPayments.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Incoming</p>
                <p className="text-2xl font-bold text-green-600">{CURRENCY_SYMBOL} {incomingPayments.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Outgoing</p>
                <p className="text-2xl font-bold text-red-600">{CURRENCY_SYMBOL} {outgoingPayments.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-purple-600">{completedPayments}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by payer/payee, description, reference, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                showFilterPanel 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter size={20} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Directions</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Status</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="This Year">This Year</option>
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
            <div>
              <p className="text-red-800 font-semibold">Error loading payments</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date & Reference
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payer/Payee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm || activeFiltersCount > 0 
                          ? 'No payments found matching your search or filters.' 
                          : 'No payments found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">{payment.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.direction === 'incoming' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {payment.direction === 'incoming' ? '↓' : '↑'} {payment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 font-medium flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          {payment.payer_payee}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{payment.description}</div>
                        <div className="text-xs text-gray-500">ID: {payment.transaction_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{payment.payment_method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-bold ${
                          payment.direction === 'incoming' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {payment.direction === 'incoming' ? '+' : '-'} {CURRENCY_SYMBOL} {payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} payments
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!hasPrevious || currentPage === 1}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-2 rounded-lg font-semibold transition ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={!hasNext || currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Payments;

