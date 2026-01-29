import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CreditCard, DollarSign, RefreshCw, Eye, Search, ChevronLeft, ChevronRight, Calendar, AlertCircle, TrendingUp, Users, Clock, FileText } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showError } from '../utils/toast.js';
import { apiGet } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BNPLPurchases = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const itemsPerPage = 10;

  const fetchPurchases = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build endpoint with pagination
      const endpoint = `/bnpl/purchases/?limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}`;
      const response = await apiGet(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const purchasesArray = data.results || [];
      
      setPurchases(purchasesArray);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (error) {
      console.error('Error fetching BNPL purchases:', error);
      setError(error.message);
      setPurchases([]);
      showError(`Failed to load BNPL purchases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPurchases(currentPage);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, currentPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentPage === 1) {
      fetchPurchases(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  // Reset page when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const handleRefresh = () => {
    fetchPurchases(currentPage);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Filter purchases based on search term and status
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id?.toString().includes(searchTerm) ||
      purchase.order?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || purchase.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics from API data
  const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
  const totalBnplAmount = purchases.reduce((sum, p) => sum + parseFloat(p.bnpl_amount || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
  const activeLoans = purchases.filter(p => p.status === 'Active').length;
  const totalOutstanding = totalBnplAmount - totalPaid;

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'defaulted':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">BNPL Loans</h1>
            <p className="text-gray-600">Manage Buy Now Pay Later purchases and loans</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="text-red-800 font-semibold">Error loading BNPL purchases</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Loans</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : totalCount}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : `${CURRENCY_SYMBOL} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Outstanding</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : `${CURRENCY_SYMBOL} ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp size={28} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : activeLoans}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock size={28} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer name, ID, or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Defaulted">Defaulted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
              <p className="text-gray-600">Loading BNPL purchases...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Purchase Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        BNPL Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Installments
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                          {searchTerm || statusFilter !== 'All' 
                            ? 'No purchases found matching your search criteria.' 
                            : 'No BNPL purchases found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((purchase) => {
                        const totalAmount = parseFloat(purchase.total_amount || 0);
                        const bnplAmount = parseFloat(purchase.bnpl_amount || 0);
                        const amountPaid = parseFloat(purchase.amount_paid || 0);
                        const outstandingAmount = bnplAmount - amountPaid;
                        
                        return (
                          <tr key={purchase.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                                  <Users className="text-purple-600" size={20} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-800">{purchase.customer_name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">Order #{purchase.order || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-800 flex items-center gap-1">
                                <Calendar size={14} className="text-gray-400" />
                                {formatDate(purchase.purchase_date || purchase.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-800">
                                {CURRENCY_SYMBOL} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-blue-600">
                                {CURRENCY_SYMBOL} {bnplAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600">
                                {CURRENCY_SYMBOL} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {outstandingAmount > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  Outstanding: {CURRENCY_SYMBOL} {outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-800">
                                <div className="font-semibold">{purchase.number_of_installments || 0} installments</div>
                                <div className="text-xs text-gray-500">
                                  {CURRENCY_SYMBOL} {parseFloat(purchase.installment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                                </div>
                                <div className="text-xs text-gray-500">
                                  Every {purchase.payment_interval_days || 0} day(s)
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(purchase.status)}`}>
                                {purchase.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => navigate(`/bnpl-loan/${purchase.id}`)}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>
                                {purchase.order && (
                                  <button
                                    onClick={() => navigate(`/order/${purchase.order}`)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="View Order"
                                  >
                                    <FileText size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} purchases
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!hasPrevious || loading}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-gray-700 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={!hasNext || loading}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
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

export default BNPLPurchases;
