import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showWarning, showError, showSuccess } from '../utils/toast.js';
import { apiGet, apiPost } from '../utils/api.js';

import { Receipt, DollarSign, Calendar, Search, Filter, Plus, CheckCircle, Clock, AlertCircle, Printer, Banknote, Smartphone, Wallet, X, Eye, RefreshCw } from 'lucide-react';

const Orders = () => {
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, paid
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMobileAmount, setSplitMobileAmount] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component format
      const transformedOrders = (data.results || []).map(order => ({
        id: order.id,
        receiptNo: order.order_number,
        timestamp: order.created_at,
        status: order.status?.toLowerCase() || 'pending',
        subtotal: parseFloat(order.sub_total || 0),
        tax: parseFloat(order.tax || 0),
        total: parseFloat(order.total_amount || 0),
        amountReceived: parseFloat(order.amount_received || 0),
        change: parseFloat(order.change || 0),
        balance: parseFloat(order.balance || 0),
        seller: order.seller,
        businessName: order.business_name,
        items_count: order.items_count || 0,
        items: [] // Will be loaded when viewing details
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Calculate statistics from orders
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const paidOrders = orders.filter(order => order.status === 'paid').length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const pendingRevenue = orders
    .filter(order => order.status === 'pending')
    .reduce((sum, order) => sum + order.total, 0);

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.receiptNo?.toString().includes(searchTerm) ||
        (order.seller && order.seller.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.businessName && order.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'amount-high') {
        return b.total - a.total;
      } else if (sortBy === 'amount-low') {
        return a.total - b.total;
      }
      return 0;
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('');
    setPaymentReference('');
    setAmountReceived('');
    setSplitCashAmount('');
    setSplitMobileAmount('');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentMethod) {
      showWarning('Please select a payment method');
      return;
    }

    if (!selectedOrder) return;

    // Validate mobile number for mobile payments
    if ((paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') && !mobileNumber) {
      showWarning('Please enter mobile number for mobile payment');
      return;
    }

    let paymentData = {
      order: selectedOrder.id,
      paymentMethod: paymentMethod,
      mobileNumber: mobileNumber || '',
      mobileNetwork: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? 'Safaricom' : '',
      splitCashAmount: 0,
      splitMobileAmount: 0,
      date: new Date().toISOString().split('T')[0],
      change: 0,
      status: 'Paid'
    };

    const balanceDue = selectedOrder.balance || 0;

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || balanceDue;
      if (received < balanceDue) {
        showWarning('Amount received cannot be less than balance due');
        return;
      }
      paymentData.amountReceived = received;
      paymentData.change = received - balanceDue;
    } else if (paymentMethod === 'mobile') {
      const received = parseFloat(amountReceived) || balanceDue;
      if (received < balanceDue) {
        showWarning('Amount received cannot be less than balance due');
        return;
      }
      paymentData.amountReceived = received;
      paymentData.change = received - balanceDue;
    } else if (paymentMethod === 'cash+mpesa') {
      const cashAmount = parseFloat(splitCashAmount || 0);
      const mobileAmount = parseFloat(splitMobileAmount || 0);

      if (Math.abs((cashAmount + mobileAmount) - balanceDue) > 0.01) {
        showWarning(`Payment amounts don't match balance due. Cash: ${CURRENCY_SYMBOL} ${cashAmount.toFixed(2)} + Mpesa: ${CURRENCY_SYMBOL} ${mobileAmount.toFixed(2)} = ${CURRENCY_SYMBOL} ${(cashAmount + mobileAmount).toFixed(2)}, but balance due is ${CURRENCY_SYMBOL} ${balanceDue.toFixed(2)}`);
        return;
      }

      paymentData.splitCashAmount = cashAmount;
      paymentData.splitMobileAmount = mobileAmount;
      paymentData.amountReceived = balanceDue;
    } else {
      paymentData.amountReceived = balanceDue;
    }

    try {
      const response = await apiPost('/orders/pay-order/', paymentData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Payment confirmed successfully');
      
      // Refresh orders list
      await fetchOrders();
      
      // Close modal and reset form
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentMethod('');
      setPaymentReference('');
      setAmountReceived('');
      setSplitCashAmount('');
      setSplitMobileAmount('');
      setMobileNumber('');
    } catch (error) {
      console.error('Error confirming payment:', error);
      showError(error.message || 'Failed to confirm payment');
    }
  };

  const generateReceiptHTML = (order) => {
    const paymentMethod = order.paymentMethod === 'cash+mpesa' ? 'CASH + MPESA' : 
                         (order.paymentMethod || 'PENDING').toUpperCase();
    
    let paymentDetails = '';
    if (order.status === 'pending') {
      paymentDetails = '<div style="background-color: #fef3c7; color: #92400e; padding: 5px; border-radius: 4px; font-weight: bold; margin-top: 10px;">STATUS: PENDING PAYMENT</div><p>Payment to be collected later</p>';
    } else if (order.paymentMethod === 'cash') {
      paymentDetails = `
        <p>Payment: ${paymentMethod}</p>
        <p>Received: ${CURRENCY_SYMBOL} ${(order.amountReceived || 0).toFixed(2)}</p>
        <p>Change: ${CURRENCY_SYMBOL} ${(order.change || 0).toFixed(2)}</p>
        ${order.paymentReference ? `<p>Reference: ${order.paymentReference}</p>` : ''}
      `;
    } else if (order.paymentMethod === 'mobile') {
      paymentDetails = `
        <p>Payment: ${paymentMethod}</p>
        <p>Amount Paid: ${CURRENCY_SYMBOL} ${(order.amountReceived || 0).toFixed(2)}</p>
        ${order.change > 0 ? `<p>Change: ${CURRENCY_SYMBOL} ${(order.change || 0).toFixed(2)}</p>` : ''}
        ${order.paymentReference ? `<p>Reference: ${order.paymentReference}</p>` : ''}
      `;
    } else if (order.paymentMethod === 'cash+mpesa') {
      paymentDetails = `
        <p>Payment: ${paymentMethod}</p>
        <p>Cash: ${CURRENCY_SYMBOL} ${(order.splitCashAmount || 0).toFixed(2)}</p>
        <p>Mpesa: ${CURRENCY_SYMBOL} ${(order.splitMobileAmount || 0).toFixed(2)}</p>
        ${order.paymentReference ? `<p>Reference: ${order.paymentReference}</p>` : ''}
      `;
    } else {
      paymentDetails = `<p>Payment: ${paymentMethod}</p>`;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.receiptNo}</title>
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; padding: 10px; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-details {
              font-size: 10px;
              color: #666;
              margin-left: 10px;
            }
            .total {
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-top: 10px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${user?.business_name || 'Smart Retail Store'}</h2>
            <p>123 Main Street, Nairobi</p>
            <p>Tel: +254 712 345 678</p>
            <p>Receipt #${order.receiptNo || 'N/A'}</p>
            ${order.tableNumber ? `<p>Table: ${order.tableNumber}</p>` : ''}
            <p>${order.date || new Date(order.timestamp).toLocaleString()}</p>
            <p>Cashier: ${order.seller || user?.name || 'N/A'}</p>
          </div>
          <div class="items">
            ${(order.items || []).map(item => `
              <div class="item">
                <div>
                  <div>${item.name || 'Unknown Item'}</div>
                  <div class="item-details">${item.quantity || 0} x ${CURRENCY_SYMBOL} ${(item.price || 0).toFixed(2)}</div>
                </div>
                <div>${CURRENCY_SYMBOL} ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item"><span>Subtotal:</span> <span>${CURRENCY_SYMBOL} ${order.subtotal.toFixed(2)}</span></div>
            <div class="item"><span>Tax (8%):</span> <span>${CURRENCY_SYMBOL} ${order.tax.toFixed(2)}</span></div>
            <div class="item" style="font-size: 16px; margin-top: 5px;">
              <span>Total:</span> <span>${CURRENCY_SYMBOL} ${order.total.toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            ${paymentDetails}
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `;
  };

  const printReceipt = async (order) => {
    try {
      // Fetch full order details first
      const response = await apiGet(`/orders/${order.id}/details/`);

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();

      // Transform the order data to include items
      const fullOrder = {
        ...order,
        items: (data.items || []).map(item => ({
          id: item.id,
          name: item.item_name,
          price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          total: parseFloat(item.item_total)
        }))
      };

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        const receiptHTML = generateReceiptHTML(fullOrder);
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 500);
        }, 250);
        return;
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      showError('Failed to print receipt. Please try again.');
    }
  };

  return (
    <Layout>
      <div>
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Orders Management</h2>
            <p className="text-gray-600">Manage all orders and track payments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/create-order')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              Create New Order
            </button>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Error loading orders: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border-l-4 border-blue-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Receipt size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border-l-4 border-green-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{paidOrders}</p>
                <p className="text-xs text-green-600 mt-1">{CURRENCY_SYMBOL} {totalRevenue.toFixed(2)} revenue</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border-l-4 border-yellow-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{pendingOrders}</p>
                <p className="text-xs text-yellow-600 mt-1">{CURRENCY_SYMBOL} {pendingRevenue.toFixed(2)} pending</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock size={28} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border-l-4 border-purple-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {orders.filter(order => {
                    const orderDate = new Date(order.timestamp).toDateString();
                    return orderDate === new Date().toDateString();
                  }).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar size={28} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-end">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Receipt size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-4">
              {orders.length === 0 
                ? "No orders have been placed yet. Create your first order to get started."
                : "No orders match your search criteria."}
            </p>
            {orders.length === 0 && (
              <button
                onClick={() => navigate('/create-order')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition p-4 sm:p-6 border-l-4 ${
                  order.status === 'paid' ? 'border-green-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                      <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold text-sm sm:text-base">
                        Receipt #{order.receiptNo}
                      </div>
                      {order.tableNumber && (
                        <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm">
                          Table: {order.tableNumber}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm ${
                        order.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'paid' ? (
                          <CheckCircle size={16} />
                        ) : (
                          <Clock size={16} />
                        )}
                        {order.status === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(order.timestamp)}
                      </div>
                    </div>
                    
                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Items</p>
                        <p className="font-semibold text-sm sm:text-base">{order.items_count} item(s)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Seller</p>
                        <p className="font-semibold text-sm sm:text-base">{order.seller || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                        <p className="font-semibold text-sm sm:text-base">{CURRENCY_SYMBOL} {order.subtotal.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="font-semibold text-blue-600 text-base sm:text-lg">{CURRENCY_SYMBOL} {order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {order.amountReceived > 0 && (
                      <div className="mt-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-semibold">Amount Received:</span> {CURRENCY_SYMBOL} {order.amountReceived.toFixed(2)}
                        </div>
                        {order.change > 0 && (
                          <div>
                            <span className="font-semibold">Change:</span> {CURRENCY_SYMBOL} {order.change.toFixed(2)}
                          </div>
                        )}
                        {order.balance > 0 && (
                          <div className="text-red-600">
                            <span className="font-semibold">Balance Due:</span> {CURRENCY_SYMBOL} {order.balance.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => openPaymentModal(order)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                      >
                        <CheckCircle size={18} />
                        Confirm Payment
                      </button>
                    )}
                    <button
                      onClick={() => printReceipt(order)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                      title="Print receipt"
                    >
                      <Printer size={18} />
                      Print Receipt
                    </button>
                    <button
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg touch-manipulation min-h-[44px]"
                    >
                      <Eye size={18} />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">Confirm Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Receipt #{selectedOrder.receiptNo}</p>
                <p className="text-2xl font-bold text-blue-600">{CURRENCY_SYMBOL} {(selectedOrder.balance || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Balance Due</p>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2 text-sm sm:text-base">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 sm:p-4 border-2 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-colors ${
                      paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Banknote size={24} />
                    <span className="text-xs sm:text-sm font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`p-3 sm:p-4 border-2 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-colors ${
                      paymentMethod === 'mobile' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Smartphone size={24} />
                    <span className="text-xs sm:text-sm font-medium">Mpesa</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash+mpesa')}
                    className={`p-3 sm:p-4 border-2 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-colors relative ${
                      paymentMethod === 'cash+mpesa' ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="relative">
                      <Banknote size={20} className="absolute -top-1 -left-1 text-blue-600" />
                      <Smartphone size={20} className="absolute -bottom-1 -right-1 text-green-600" />
                      <Wallet size={16} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600 bg-white rounded-full" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">Cash + Mpesa</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mb-4">
                  <label className="block font-semibold mb-2 text-sm sm:text-base">Amount Received *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder={`${CURRENCY_SYMBOL} ${(selectedOrder.balance || 0).toFixed(2)}`}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  {amountReceived && parseFloat(amountReceived) >= (selectedOrder.balance || 0) && (
                    <p className="mt-2 text-sm text-green-600 font-semibold">
                      Change: {CURRENCY_SYMBOL} {(parseFloat(amountReceived) - (selectedOrder.balance || 0)).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'mobile' && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Amount Paid *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder={`${CURRENCY_SYMBOL} ${(selectedOrder.balance || 0).toFixed(2)}`}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    {amountReceived && parseFloat(amountReceived) >= (selectedOrder.balance || 0) && (
                      <p className="mt-2 text-sm text-green-600 font-semibold">
                        Change: {CURRENCY_SYMBOL} {(parseFloat(amountReceived) - (selectedOrder.balance || 0)).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Mobile Number *</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g., 0745491093"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cash+mpesa' && (
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-2 text-sm sm:text-base">Cash Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={splitCashAmount}
                        onChange={(e) => {
                          const cashValue = e.target.value;
                          setSplitCashAmount(cashValue);
                          const cash = parseFloat(cashValue) || 0;
                          const balanceDue = selectedOrder.balance || 0;
                          const remaining = Math.max(0, balanceDue - cash);
                          setSplitMobileAmount(remaining > 0 ? remaining.toFixed(2) : '0.00');
                        }}
                        placeholder="0.00"
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2 text-sm sm:text-base">Mpesa Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={splitMobileAmount}
                        readOnly
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-green-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Mobile Number *</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g., 0745491093"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block font-semibold mb-2 text-sm sm:text-base">Payment Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., Transaction ID, Receipt Number"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Enter reference number for tracking (optional)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
