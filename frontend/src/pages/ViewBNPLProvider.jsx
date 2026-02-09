import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { 
  ArrowLeft, Building2, Phone, Mail, Globe, Percent, 
  RefreshCw, AlertCircle, CreditCard, Calendar, Eye,
  DollarSign, TrendingUp, Users, FileText, Clock, CheckCircle
} from 'lucide-react';
import { apiGet } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { showError } from '../utils/toast.js';

const ViewBNPLProvider = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/bnpl/service-providers/${id}/details`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProvider(data);
    } catch (error) {
      console.error('Error fetching BNPL provider details:', error);
      setError(error.message);
      showError(`Failed to load BNPL provider details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchProviderDetails();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
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
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
            <p className="text-gray-600">Loading BNPL provider details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !provider) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Provider Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The provider you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/bnpl-providers')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to BNPL Providers
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate statistics from purchases
  const purchases = provider.bnpl_purchases || [];
  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
  const totalBnplAmount = purchases.reduce((sum, p) => sum + parseFloat(p.bnpl_amount || 0), 0);
  const totalAmountPaid = purchases.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
  const activePurchases = purchases.filter(p => p.status?.toLowerCase() === 'active').length;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/bnpl-providers')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to BNPL Providers
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {provider.name || 'BNPL Provider'}
              </h1>
              <p className="text-gray-600">
                {provider.business_name || 'N/A'}
                {provider.branch_name && ` • ${provider.branch_name}`}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchProviderDetails}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Provider Information Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} />
            Provider Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Provider Name</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                {provider.name || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Business Name</p>
              <p className="text-gray-800 font-semibold">
                {provider.business_name || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Branch Name</p>
              <p className="text-gray-800 font-semibold">
                {provider.branch_name || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                {provider.email || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone Number</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                {provider.phone_number || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Website</p>
              {provider.website ? (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
                >
                  <Globe size={16} />
                  Visit Website
                </a>
              ) : (
                <p className="text-gray-400">N/A</p>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Down Payment Percentage</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Percent size={16} className="text-gray-400" />
                {provider.down_payment_percentage || '0'}%
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Interest Rate Percentage</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Percent size={16} className="text-gray-400" />
                {provider.interest_rate_percentage || '0'}%
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Created At</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {formatDateTime(provider.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-600">{totalPurchases}</p>
                <p className="text-xs text-gray-500 mt-1">BNPL purchases</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Purchases</p>
                <p className="text-2xl font-bold text-green-600">{activePurchases}</p>
                <p className="text-xs text-gray-500 mt-1">Currently active</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total BNPL Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {CURRENCY_SYMBOL} {totalBnplAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total financed</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount Paid</p>
                <p className="text-2xl font-bold text-orange-600">
                  {CURRENCY_SYMBOL} {totalAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total collected</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* BNPL Purchases Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">BNPL Purchases</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalPurchases} purchase{totalPurchases !== 1 ? 's' : ''} • Total Amount: {CURRENCY_SYMBOL} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Purchase ID
                  </th>
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
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No BNPL purchases found for this provider.
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => {
                    const totalAmount = parseFloat(purchase.total_amount || 0);
                    const bnplAmount = parseFloat(purchase.bnpl_amount || 0);
                    const amountPaid = parseFloat(purchase.amount_paid || 0);
                    const outstandingAmount = bnplAmount - amountPaid;
                    
                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            #{purchase.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800 flex items-center gap-2">
                            <Users size={14} className="text-gray-400" />
                            {purchase.customer_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800 flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            {formatDateTime(purchase.purchase_date || purchase.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            {CURRENCY_SYMBOL} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-purple-600">
                            {CURRENCY_SYMBOL} {bnplAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {CURRENCY_SYMBOL} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {outstandingAmount > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              Outstanding: {CURRENCY_SYMBOL} {outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">
                            {purchase.number_of_installments || 0} installments
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {CURRENCY_SYMBOL} {parseFloat(purchase.installment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(purchase.status)}`}>
                            {purchase.status?.toLowerCase() === 'active' ? (
                              <>
                                <CheckCircle size={12} />
                                {purchase.status}
                              </>
                            ) : (
                              purchase.status || 'N/A'
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => navigate(`/bnpl-loan/${purchase.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Purchase Details"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewBNPLProvider;
