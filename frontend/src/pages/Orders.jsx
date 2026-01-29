import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCustomers } from '../contexts/CustomersContext.jsx';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showWarning, showError, showSuccess } from '../utils/toast.js';
import { apiGet, apiPost } from '../utils/api.js';
import { usePayment } from '../hooks/usePayment.js';
import PaymentModal from '../components/PaymentModal.jsx';

import { Receipt, DollarSign, Calendar, Search, Filter, Plus, CheckCircle, Clock, AlertCircle, Printer, Banknote, Smartphone, Wallet, X, Eye, RefreshCw } from 'lucide-react';

const Orders = () => {
  const { user, getAccessToken } = useAuth();
  const { customers } = useCustomers();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, paid
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Use the reusable payment hook
  const paymentCompleteRef = useRef(null);
  
  const payment = usePayment({
    totalAmount: selectedOrder?.balance || 0,
    onPaymentComplete: (paymentData) => {
      if (paymentCompleteRef.current) {
        paymentCompleteRef.current(paymentData);
      }
    },
    customers: customers || []
  });

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

  // Complete transaction function
  const completeTransaction = async (paymentData) => {
    if (!selectedOrder) return;

    const backendPaymentData = {
      order: selectedOrder.id,
      data: {
        paymentMethod: paymentData.paymentMethod,
        mobileNumber: (paymentData.paymentMethod === 'mobile' || paymentData.paymentMethod === 'cash+mpesa') ? (paymentData.mobileNumber || '') : '',
        mobileNetwork: (paymentData.paymentMethod === 'mobile' || paymentData.paymentMethod === 'cash+mpesa') ? 'Safaricom' : '',
        splitCashAmount: paymentData.paymentMethod === 'cash+mpesa' ? (paymentData.splitCashAmount || 0) : 0,
        splitMobileAmount: paymentData.paymentMethod === 'cash+mpesa' ? (paymentData.splitMobileAmount || 0) : 0,
        date: new Date().toISOString().split('T')[0],
        change: paymentData.change || 0,
        status: 'Paid',
        amountReceived: paymentData.amountReceived || (selectedOrder.balance || 0),
        // Include BNPL, Store Credit, and Loyalty Card data if present
        bnplDownPayment: paymentData.bnplDownPayment,
        bnplInstallments: paymentData.bnplInstallments,
        bnplInterval: paymentData.bnplInterval,
        customerId: paymentData.customerId,
        customerName: paymentData.customerName,
        cardNumber: paymentData.cardNumber,
        storeCreditUsed: paymentData.storeCreditUsed,
        loyaltyPointsUsed: paymentData.loyaltyPointsUsed
      }
    };

    try {
      const response = await apiPost('/orders/pay-order/', backendPaymentData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Payment confirmed successfully');
      
      // Refresh orders list
      await fetchOrders();
      
      // Reset payment state
      payment.resetPayment();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
      showError(error.message || 'Failed to confirm payment');
    }
  };

  // Set the ref so completeTransaction can be called
  paymentCompleteRef.current = completeTransaction;

  // Process payment using the hook
  const handleProcessPayment = () => {
    const result = payment.processPayment();
    if (result.success) {
      // For mobile payments, validate phone number
      if (payment.paymentMethod === 'mobile' || payment.paymentMethod === 'cash+mpesa') {
        const validation = payment.validatePhoneNumber(payment.mobileNumber);
        if (validation.valid) {
          payment.setMobileNumber(validation.cleaned);
          // Call completeTransaction directly with the payment data
          if (paymentCompleteRef.current) {
            paymentCompleteRef.current(result.paymentData);
          }
        } else {
          showWarning(validation.error);
        }
      } else {
        // For other payment methods, complete immediately
        // Call completeTransaction directly with the payment data
        if (paymentCompleteRef.current) {
          paymentCompleteRef.current(result.paymentData);
        }
      }
    } else {
      showWarning(result.error);
    }
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    payment.openPayment();
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
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">#{order.receiptNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(order.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs ${
                          order.status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status === 'paid' ? (
                            <CheckCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {order.status === 'paid' ? 'Paid' : 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="font-semibold text-blue-600">{CURRENCY_SYMBOL} {order.total.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => openPaymentModal(order)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                              title="Confirm Payment"
                            >
                              <CheckCircle size={14} />
                              <span className="hidden sm:inline">Pay</span>
                            </button>
                          )}
                          <button
                            onClick={() => printReceipt(order)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                            title="Print Receipt"
                          >
                            <Printer size={14} />
                            <span className="hidden sm:inline">Print</span>
                          </button>
                          <button
                            onClick={() => navigate(`/order/${order.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                            title="View Details"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

        {/* Payment Modal */}
        {selectedOrder && (
          <PaymentModal
            show={payment.showPayment}
            totalAmount={selectedOrder.balance || 0}
            paymentState={payment}
            onProcessPayment={handleProcessPayment}
            onCancel={() => {
              payment.closePayment();
              setSelectedOrder(null);
            }}
            customers={customers || []}
          />
        )}
      </div>
    </Layout>
  );
};

export default Orders;
