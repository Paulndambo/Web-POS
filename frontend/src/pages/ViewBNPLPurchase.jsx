import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { 
  ArrowLeft, Users, DollarSign, 
  TrendingUp, Calendar, RefreshCw, AlertCircle,
  CreditCard, CheckCircle, Clock, Building2, FileText, Eye,
  ChevronLeft, ChevronRight, X, Receipt
} from 'lucide-react';
import { apiGet, apiPost } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { showError, showSuccess } from '../utils/toast.js';

const ViewBNPLPurchase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [installments, setInstallments] = useState([]);
  
  // Pagination state for installments
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [selectedReceiptInstallment, setSelectedReceiptInstallment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_method: 'Mobile Money',
    receipt_number: ''
  });
  const [bulkPaymentFormData, setBulkPaymentFormData] = useState({
    number_of_installments: '',
    payment_method: 'Mobile Money',
    receipt_number: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

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

  // Reset to page 1 when installments change
  useEffect(() => {
    setCurrentPage(1);
  }, [installments.length]);

  // Handle opening payment modal
  const handleOpenPaymentModal = (installment) => {
    const amountExpected = parseFloat(installment.amount_expected || 0);
    const amountPaid = parseFloat(installment.amount_paid || 0);
    const remainingAmount = amountExpected - amountPaid;
    
    setSelectedInstallment(installment);
    setPaymentFormData({
      amount: remainingAmount > 0 ? remainingAmount.toFixed(2) : amountExpected.toFixed(2),
      payment_method: 'Mobile Money',
      receipt_number: ''
    });
    setShowPaymentModal(true);
  };

  // Handle closing payment modal
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInstallment(null);
    setPaymentFormData({
      amount: '',
      payment_method: 'Mobile Money',
      receipt_number: ''
    });
  };

  // Handle opening bulk payment modal
  const handleOpenBulkPaymentModal = () => {
    setBulkPaymentFormData({
      number_of_installments: '',
      payment_method: 'Mobile Money',
      receipt_number: ''
    });
    setShowBulkPaymentModal(true);
  };

  // Handle closing bulk payment modal
  const handleCloseBulkPaymentModal = () => {
    setShowBulkPaymentModal(false);
    setBulkPaymentFormData({
      number_of_installments: '',
      payment_method: 'Mobile Money',
      receipt_number: ''
    });
  };

  // Handle opening receipt view modal
  const handleOpenReceiptModal = (installment) => {
    setSelectedReceiptInstallment(installment);
    setShowReceiptModal(true);
  };

  // Handle closing receipt view modal
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedReceiptInstallment(null);
  };

  // Handle bulk payment submission
  const handleSubmitBulkPayment = async (e) => {
    e.preventDefault();

    const numberOfInstallments = parseInt(bulkPaymentFormData.number_of_installments);
    const installmentAmount = parseFloat(purchase.installment_amount || 0);
    
    // Calculate maximum number of unpaid installments
    const unpaidInstallments = installments.filter(i => {
      const amountExpected = parseFloat(i.amount_expected || 0);
      const amountPaid = parseFloat(i.amount_paid || 0);
      return amountPaid < amountExpected;
    });
    const maxInstallments = unpaidInstallments.length;

    if (!numberOfInstallments || numberOfInstallments <= 0) {
      showError('Number of installments must be greater than 0');
      return;
    }

    if (numberOfInstallments > maxInstallments) {
      showError(`Number of installments cannot exceed ${maxInstallments} unpaid installments`);
      return;
    }

    // Calculate payment amount
    const paymentAmount = numberOfInstallments * installmentAmount;

    // Note: We allow the calculated amount to slightly exceed outstanding amount due to rounding
    // This is acceptable for bulk payments

    try {
      setSubmittingPayment(true);

      // Generate receipt number if not provided
      const receiptNumber = bulkPaymentFormData.receipt_number.trim() || generateReceiptNumber();

      const paymentData = {
        loan: parseInt(id),
        installment: 0,
        amount: paymentAmount,
        payment_method: bulkPaymentFormData.payment_method,
        receipt_number: receiptNumber,
        payment_type: 'bulk',
        installments_count: numberOfInstallments
      };

      const response = await apiPost('/payments/make-bnpl-payment/', paymentData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.text();
      console.log('Bulk payment submitted successfully:', responseData);

      showSuccess('Bulk payment submitted successfully!');
      handleCloseBulkPaymentModal();
      
      // Refresh purchase details to show updated payment information
      await fetchPurchaseDetails();
    } catch (error) {
      console.error('Error submitting bulk payment:', error);
      showError(`Failed to submit bulk payment: ${error.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Generate random receipt number
  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `BNPL-PT-${timestamp}-${random}`;
  };

  // Handle payment submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedInstallment) return;

    // Validate amount doesn't exceed remaining amount
    const amountExpected = parseFloat(selectedInstallment.amount_expected || 0);
    const amountPaid = parseFloat(selectedInstallment.amount_paid || 0);
    const remainingAmount = amountExpected - amountPaid;
    const paymentAmount = parseFloat(paymentFormData.amount);

    if (paymentAmount > remainingAmount) {
      showError(`Payment amount cannot exceed the remaining amount of ${CURRENCY_SYMBOL} ${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    if (paymentAmount <= 0) {
      showError('Payment amount must be greater than 0');
      return;
    }

    try {
      setSubmittingPayment(true);

      // Generate receipt number if not provided
      const receiptNumber = paymentFormData.receipt_number.trim() || generateReceiptNumber();

      const paymentData = {
        loan: parseInt(id),
        installment: selectedInstallment.id,
        amount: paymentAmount,
        payment_method: paymentFormData.payment_method,
        receipt_number: receiptNumber,
        payment_type: 'single',
        installments_count: 0
      };

      const response = await apiPost('/payments/make-bnpl-payment/', paymentData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.text();
      console.log('Payment submitted successfully:', responseData);

      showSuccess('Payment submitted successfully!');
      handleClosePaymentModal();
      
      // Refresh purchase details to show updated payment information
      await fetchPurchaseDetails();
    } catch (error) {
      console.error('Error submitting payment:', error);
      showError(`Failed to submit payment: ${error.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

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
  const outstandingAmount = totalAmount - amountPaid;
  
  const paidInstallments = installments.filter(i => i.status === 'Paid' || parseFloat(i.amount_paid || 0) > 0).length;
  const pendingInstallments = installments.filter(i => i.status === 'Pending').length;
  const totalExpected = installments.reduce((sum, i) => sum + parseFloat(i.amount_expected || 0), 0);
  const totalPaidFromInstallments = installments.reduce((sum, i) => sum + parseFloat(i.amount_paid || 0), 0);
  
  // Pagination calculations for installments
  const totalPages = Math.ceil(installments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInstallments = installments.slice(startIndex, endIndex);

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Installment Schedule</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {installments.length} installments • Total Expected: {CURRENCY_SYMBOL} {totalExpected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Total Paid: {CURRENCY_SYMBOL} {totalPaidFromInstallments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {purchase.status?.toLowerCase() !== 'paid' && (
                <button
                  onClick={handleOpenBulkPaymentModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition whitespace-nowrap"
                >
                  <DollarSign size={20} />
                  Make Bulk Payment
                </button>
              )}
            </div>
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
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No installments found for this purchase.
                    </td>
                  </tr>
                ) : (
                  paginatedInstallments.map((installment, index) => {
                    const amountExpected = parseFloat(installment.amount_expected || 0);
                    const amountPaid = parseFloat(installment.amount_paid || 0);
                    const isPaid = amountPaid > 0 || installment.status === 'Paid';
                    const isOverdue = !isPaid && new Date(installment.due_date) < new Date();
                    const installmentNumber = startIndex + index + 1;
                    
                    return (
                      <tr key={installment.id} className={`hover:bg-gray-50 transition ${isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            {installmentNumber}
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
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => handleOpenPaymentModal(installment)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                              title="Make Payment"
                            >
                              <DollarSign size={16} />
                              Make Payment
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenReceiptModal(installment)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                              title="View Payment Receipt"
                            >
                              <Receipt size={16} />
                              View Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, installments.length)} of {installments.length} installments
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Previous Page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-700 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Next Page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedInstallment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Make Payment</h2>
                <button
                  onClick={handleClosePaymentModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={submittingPayment}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Installment Details</p>
                <p className="text-sm font-semibold text-gray-800">
                  Due Date: {formatDate(selectedInstallment.due_date)}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Amount Expected: {CURRENCY_SYMBOL} {parseFloat(selectedInstallment.amount_expected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Amount Paid: {CURRENCY_SYMBOL} {parseFloat(selectedInstallment.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {parseFloat(selectedInstallment.amount_expected || 0) > parseFloat(selectedInstallment.amount_paid || 0) && (
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    Remaining: {CURRENCY_SYMBOL} {(parseFloat(selectedInstallment.amount_expected || 0) - parseFloat(selectedInstallment.amount_paid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentFormData.amount}
                    readOnly
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    required
                    disabled={submittingPayment}
                  />
                  <p className="text-xs text-gray-500 mt-1">This amount is fixed for the selected installment</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentFormData.payment_method}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submittingPayment}
                  >
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Receipt Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.receipt_number}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, receipt_number: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    disabled={submittingPayment}
                    placeholder="Leave empty to auto-generate (e.g., BNPL-PT-1/001)"
                  />
                  <p className="text-xs text-gray-500 mt-1">If left empty, a receipt number will be automatically generated</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    disabled={submittingPayment}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {submittingPayment ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} />
                        Submit Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Payment Modal */}
        {showBulkPaymentModal && purchase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Make Bulk Payment</h2>
                <button
                  onClick={handleCloseBulkPaymentModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={submittingPayment}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Loan Details</p>
                <p className="text-sm font-semibold text-gray-800">
                  BNPL Amount: {CURRENCY_SYMBOL} {parseFloat(purchase.bnpl_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Amount Paid: {CURRENCY_SYMBOL} {parseFloat(purchase.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-blue-600 mt-1">
                  Outstanding: {CURRENCY_SYMBOL} {(parseFloat(purchase.total_amount || 0) - parseFloat(purchase.amount_paid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-2">
                  Installment Amount: {CURRENCY_SYMBOL} {parseFloat(purchase.installment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Unpaid Installments: {installments.filter(i => {
                    const amountExpected = parseFloat(i.amount_expected || 0);
                    const amountPaid = parseFloat(i.amount_paid || 0);
                    return amountPaid < amountExpected;
                  }).length}
                </p>
              </div>

              <form onSubmit={handleSubmitBulkPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Installments to Pay *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={installments.filter(i => {
                      const amountExpected = parseFloat(i.amount_expected || 0);
                      const amountPaid = parseFloat(i.amount_paid || 0);
                      return amountPaid < amountExpected;
                    }).length}
                    value={bulkPaymentFormData.number_of_installments}
                    onChange={(e) => {
                      const value = e.target.value;
                      const maxInstallments = installments.filter(i => {
                        const amountExpected = parseFloat(i.amount_expected || 0);
                        const amountPaid = parseFloat(i.amount_paid || 0);
                        return amountPaid < amountExpected;
                      }).length;
                      // Prevent entering number greater than max
                      if (value && parseInt(value) > maxInstallments) {
                        setBulkPaymentFormData({ ...bulkPaymentFormData, number_of_installments: maxInstallments.toString() });
                      } else {
                        setBulkPaymentFormData({ ...bulkPaymentFormData, number_of_installments: value });
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submittingPayment}
                    placeholder="Enter number of installments"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {installments.filter(i => {
                      const amountExpected = parseFloat(i.amount_expected || 0);
                      const amountPaid = parseFloat(i.amount_paid || 0);
                      return amountPaid < amountExpected;
                    }).length} unpaid installments
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Calculated Amount *
                  </label>
                  <input
                    type="text"
                    value={bulkPaymentFormData.number_of_installments ? 
                      `${CURRENCY_SYMBOL} ${(parseInt(bulkPaymentFormData.number_of_installments) * parseFloat(purchase.installment_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                      `${CURRENCY_SYMBOL} 0.00`
                    }
                    readOnly
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    disabled={submittingPayment}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {bulkPaymentFormData.number_of_installments ? 
                      `${bulkPaymentFormData.number_of_installments} × ${CURRENCY_SYMBOL} ${parseFloat(purchase.installment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${CURRENCY_SYMBOL} ${(parseInt(bulkPaymentFormData.number_of_installments) * parseFloat(purchase.installment_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                      'Amount will be calculated based on number of installments'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={bulkPaymentFormData.payment_method}
                    onChange={(e) => setBulkPaymentFormData({ ...bulkPaymentFormData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                    disabled={submittingPayment}
                  >
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Receipt Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={bulkPaymentFormData.receipt_number}
                    onChange={(e) => setBulkPaymentFormData({ ...bulkPaymentFormData, receipt_number: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    disabled={submittingPayment}
                    placeholder="Leave empty to auto-generate (e.g., BNPL-PT-1/001)"
                  />
                  <p className="text-xs text-gray-500 mt-1">If left empty, a receipt number will be automatically generated</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseBulkPaymentModal}
                    disabled={submittingPayment}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {submittingPayment ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <DollarSign size={16} />
                        Submit Bulk Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receipt View Modal */}
        {showReceiptModal && selectedReceiptInstallment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Receipt className="text-green-600" size={24} />
                  Payment Receipt
                </h2>
                <button
                  onClick={handleCloseReceiptModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Receipt Header */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Installment Number</p>
                    <p className="text-lg font-bold text-gray-800">
                      Installment #{(() => {
                        const index = installments.findIndex(i => i.id === selectedReceiptInstallment.id);
                        return index !== -1 ? index + 1 : 'N/A';
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      <CheckCircle size={14} />
                      Paid
                    </span>
                  </div>
                </div>

                {/* Installment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                    <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {formatDate(selectedReceiptInstallment.due_date)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Paid Date</p>
                    <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {selectedReceiptInstallment.paid_date ? formatDateTime(selectedReceiptInstallment.paid_date) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Payment Amount Details */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Amount Expected</p>
                      <p className="text-base font-semibold text-gray-800">
                        {CURRENCY_SYMBOL} {parseFloat(selectedReceiptInstallment.amount_expected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="text-base font-bold text-green-700">
                        {CURRENCY_SYMBOL} {parseFloat(selectedReceiptInstallment.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {parseFloat(selectedReceiptInstallment.amount_expected || 0) > parseFloat(selectedReceiptInstallment.amount_paid || 0) && (
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Remaining Balance</p>
                        <p className="text-base font-semibold text-orange-700">
                          {CURRENCY_SYMBOL} {(parseFloat(selectedReceiptInstallment.amount_expected || 0) - parseFloat(selectedReceiptInstallment.amount_paid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan Information */}
                {purchase && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Loan Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Loan ID</p>
                        <p className="text-base font-semibold text-gray-800">#{purchase.id}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Customer</p>
                        <p className="text-base font-semibold text-gray-800">{purchase.customer_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseReceiptModal}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ViewBNPLPurchase;
