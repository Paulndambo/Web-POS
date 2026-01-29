import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { 
  ArrowLeft, Users, DollarSign, 
  TrendingUp, Calendar, RefreshCw, AlertCircle,
  CreditCard, CheckCircle, Clock, Building2, FileText, Eye
} from 'lucide-react';
import { apiGet } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { showError } from '../utils/toast.js';

const ViewBNPLPurchase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [installments, setInstallments] = useState([]);

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/bnpl/purchases/${id}/details/`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPurchase(data);
      setInstallments(data.installments || []);
    } catch (error) {
      console.error('Error fetching BNPL purchase details:', error);
      setError(error.message);
      showError(`Failed to load BNPL purchase details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchPurchaseDetails();
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
            <p className="text-gray-600">Loading BNPL purchase details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !purchase) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Purchase Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The purchase you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/bnpl-loans')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to BNPL Loans
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate statistics
  const totalAmount = parseFloat(purchase.total_amount || 0);
  const downPayment = parseFloat(purchase.down_payment || 0);
  const bnplAmount = parseFloat(purchase.bnpl_amount || 0);
  const amountPaid = parseFloat(purchase.amount_paid || 0);
  const outstandingAmount = bnplAmount - amountPaid;
  
  const paidInstallments = installments.filter(i => i.status === 'Paid' || parseFloat(i.amount_paid || 0) > 0).length;
  const pendingInstallments = installments.filter(i => i.status === 'Pending').length;
  const totalExpected = installments.reduce((sum, i) => sum + parseFloat(i.amount_expected || 0), 0);
  const totalPaidFromInstallments = installments.reduce((sum, i) => sum + parseFloat(i.amount_paid || 0), 0);

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/bnpl-loans')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to BNPL Loans
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                BNPL Purchase #{purchase.id}
              </h1>
              <p className="text-gray-600">Customer: {purchase.customer_name || 'N/A'}</p>
            </div>
            <div className="flex gap-3">
              {purchase.order && (
                <button
                  onClick={() => navigate(`/order/${purchase.order}`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <Eye size={20} />
                  View Order
                </button>
              )}
              <button 
                onClick={fetchPurchaseDetails}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Purchase Information Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="text-purple-600" size={24} />
            Purchase Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Customer Name</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                {purchase.customer_name || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Purchase Date</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {formatDateTime(purchase.purchase_date || purchase.created_at)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(purchase.status)}`}>
                {purchase.status || 'N/A'}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                {purchase.order ? `Order #${purchase.order}` : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Number of Installments</p>
              <p className="text-gray-800 font-semibold">
                {purchase.number_of_installments || 0}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Interval</p>
              <p className="text-gray-800 font-semibold">
                Every {purchase.payment_interval_days || 0} day(s)
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Created At</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {formatDateTime(purchase.created_at)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {formatDateTime(purchase.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {CURRENCY_SYMBOL} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Down Payment</p>
                <p className="text-2xl font-bold text-purple-600">
                  {CURRENCY_SYMBOL} {downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CreditCard size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">BNPL Amount</p>
                <p className="text-2xl font-bold text-orange-600">
                  {CURRENCY_SYMBOL} {bnplAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${outstandingAmount > 0 ? 'border-red-600' : 'border-green-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                <p className={`text-2xl font-bold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {CURRENCY_SYMBOL} {outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Paid: {CURRENCY_SYMBOL} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-3 rounded-full ${outstandingAmount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <DollarSign size={24} className={outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'} />
              </div>
            </div>
          </div>
        </div>

        {/* Installment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid Installments</p>
                <p className="text-2xl font-bold text-green-600">{paidInstallments}</p>
                <p className="text-xs text-gray-500 mt-1">of {installments.length} total</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Installments</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingInstallments}</p>
                <p className="text-xs text-gray-500 mt-1">of {installments.length} total</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Installment Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {CURRENCY_SYMBOL} {parseFloat(purchase.installment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">per installment</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Installments Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Installment Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">
              {installments.length} installments • Total Expected: {CURRENCY_SYMBOL} {totalExpected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Total Paid: {CURRENCY_SYMBOL} {totalPaidFromInstallments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount Expected
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No installments found for this purchase.
                    </td>
                  </tr>
                ) : (
                  installments.map((installment, index) => {
                    const amountExpected = parseFloat(installment.amount_expected || 0);
                    const amountPaid = parseFloat(installment.amount_paid || 0);
                    const isPaid = amountPaid > 0 || installment.status === 'Paid';
                    const isOverdue = !isPaid && new Date(installment.due_date) < new Date();
                    
                    return (
                      <tr key={installment.id} className={`hover:bg-gray-50 transition ${isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800 flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            {formatDate(installment.due_date)}
                            {isOverdue && (
                              <span className="text-xs text-red-600 font-semibold">(Overdue)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            {CURRENCY_SYMBOL} {amountExpected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${isPaid ? 'text-green-600' : 'text-gray-400'}`}>
                            {CURRENCY_SYMBOL} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {amountExpected > amountPaid && amountPaid > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              Remaining: {CURRENCY_SYMBOL} {(amountExpected - amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">
                            {installment.paid_date ? formatDateTime(installment.paid_date) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(installment.status)}`}>
                            {isPaid ? (
                              <>
                                <CheckCircle size={12} />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock size={12} />
                                {installment.status || 'Pending'}
                              </>
                            )}
                          </span>
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

export default ViewBNPLPurchase;
