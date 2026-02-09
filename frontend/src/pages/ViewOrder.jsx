import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCustomers } from '../contexts/CustomersContext.jsx';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showWarning, showError, showSuccess } from '../utils/toast.js';
import { apiGet, apiPost } from '../utils/api.js';
import { usePayment } from '../hooks/usePayment.js';
import PaymentModal from '../components/PaymentModal.jsx';
import { 
  ArrowLeft, Search, Plus, Minus, X, Printer, DollarSign, 
  Receipt, Edit2, Save, Trash2, ShoppingCart, Banknote, 
  Smartphone, Wallet, Calendar, CheckCircle, Clock, RefreshCw, AlertCircle
} from 'lucide-react';

const ViewOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  const { customers } = useCustomers();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddItems, setShowAddItems] = useState(false);

  // Use the reusable payment hook
  const paymentCompleteRef = useRef(null);
  
  const payment = usePayment({
    totalAmount: order?.balance || 0,
    onPaymentComplete: (paymentData) => {
      if (paymentCompleteRef.current) {
        paymentCompleteRef.current(paymentData);
      }
    },
    customers: customers || []
  });

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        
        let allProducts = [];
        let endpoint = '/inventory';
        
        while (endpoint) {
          // Inventory endpoint doesn't require authentication
          const response = await apiGet(endpoint);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          const transformedProducts = data.results.map(product => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price || 0), // Use selling_price for orders
            barcode: product.barcode,
            category: product.category_name,
            stock: product.quantity
          }));
          
          allProducts = [...allProducts, ...transformedProducts];
          
          // Check if there's a next page - extract endpoint from full URL
          if (data.next) {
            const url = new URL(data.next);
            endpoint = url.pathname + url.search;
          } else {
            endpoint = null;
          }
        }
        
        setProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    if (showAddItems) {
      fetchProducts();
    }
  }, [showAddItems]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/orders/${id}/details/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component format
      const transformedOrder = {
        id: data.id,
        receiptNo: data.order_number,
        timestamp: data.created_at,
        status: data.status?.toLowerCase() || 'pending',
        subtotal: parseFloat(data.sub_total || 0),
        tax: parseFloat(data.tax || 0),
        total: parseFloat(data.total_amount || 0),
        amountReceived: parseFloat(data.amount_received || 0),
        change: parseFloat(data.change || 0),
        balance: parseFloat(data.balance || 0),
        seller: data.seller,
        businessName: data.business_name,
        items: (data.items || []).map(item => ({
          id: item.id,
          name: item.item_name,
          price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          total: parseFloat(item.item_total)
        })),
        payments: (data.payments || []).map(payment => ({
          id: payment.id,
          paymentMethod: payment.payment_method,
          amount: parseFloat(payment.amount_received),
          change: parseFloat(payment.change || 0)
        }))
      };
      
      setOrder(transformedOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Order</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Orders
            </button>
            <button
              onClick={fetchOrderDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div>
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Receipt size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Order Not Found</h3>
            <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/orders')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Orders
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const status = order?.status || 'pending';
  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = async (product) => {
    try {
      const response = await apiPost('/orders/create-order-items/', {
        order: order.id,
        item: {
          id: product.id,
          item_name: product.name,
          quantity: 1,
          item_total: product.price
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Item added to order successfully');
      
      // Refresh order details
      await fetchOrderDetails();
      
      // Clear search and close add items panel
      setSearchTerm('');
      setShowAddItems(false);
    } catch (error) {
      console.error('Error adding item to order:', error);
      showError(error.message || 'Failed to add item to order');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remove this item from order?')) {
      return;
    }

    try {
      const response = await apiPost('/orders/update-order-items/', {
        body: JSON.stringify({
          order_item: itemId,
          action_type: 'remove',
          quantity: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Item removed successfully');
      
      // Refresh order details
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error removing item:', error);
      showError(error.message || 'Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    // Prevent negative quantities
    if (newQuantity < 1) {
      showWarning('Quantity cannot be less than 1. Use remove button to delete item.');
      return;
    }

    try {
      const currentItem = order.items.find(item => item.id === itemId);
      if (!currentItem) return;

      // Calculate the difference to determine action type and quantity
      const difference = newQuantity - currentItem.quantity;
      const actionType = difference > 0 ? 'increment' : 'decrement';
      const quantityChange = Math.abs(difference);

      const response = await apiPost('/orders/update-order-items/', {
        order_item: itemId,
        action_type: actionType,
        quantity: quantityChange
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess(`Item quantity ${actionType === 'increment' ? 'increased' : 'decreased'} successfully`);
      
      // Refresh order details
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error updating item quantity:', error);
      showError(error.message || 'Failed to update item quantity');
    }
  };

  // Complete transaction function
  const completeTransaction = async (paymentData) => {
    if (!order) return;

    const backendPaymentData = {
      order: order.id,
      data: {
        paymentMethod: paymentData.paymentMethod,
        mobileNumber: (paymentData.paymentMethod === 'mobile' || paymentData.paymentMethod === 'cash+mpesa') ? (paymentData.mobileNumber || '') : '',
        mobileNetwork: (paymentData.paymentMethod === 'mobile' || paymentData.paymentMethod === 'cash+mpesa') ? 'Safaricom' : '',
        splitCashAmount: paymentData.paymentMethod === 'cash+mpesa' ? (paymentData.splitCashAmount || 0) : 0,
        splitMobileAmount: paymentData.paymentMethod === 'cash+mpesa' ? (paymentData.splitMobileAmount || 0) : 0,
        date: new Date().toISOString().split('T')[0],
        change: (paymentData.change || 0).toFixed(2),
        status: 'Paid',
        amountReceived: paymentData.amountReceived || (order.balance || 0),
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
      
      // Refresh order details
      await fetchOrderDetails();
      
      // Reset payment state
      payment.resetPayment();
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

  const generateReceiptHTML = (orderData) => {
    const paymentMethod = orderData.paymentMethod === 'cash+mpesa' ? 'CASH + MPESA' : 
                         (orderData.paymentMethod || 'PENDING').toUpperCase();
    
    let paymentDetails = '';
    if (orderData.status === 'pending') {
      paymentDetails = '<div style="background-color: #fef3c7; color: #92400e; padding: 5px; border-radius: 4px; font-weight: bold; margin-top: 10px;">STATUS: PENDING PAYMENT</div><p>Payment to be collected later</p>';
    } else if (orderData.paymentMethod === 'cash') {
      paymentDetails = `
        <p>Payment: ${paymentMethod}</p>
        <p>Received: ${CURRENCY_SYMBOL} ${(orderData.amountReceived || 0).toFixed(2)}</p>
        <p>Change: ${CURRENCY_SYMBOL} ${(orderData.change || 0).toFixed(2)}</p>
        ${orderData.paymentReference ? `<p>Reference: ${orderData.paymentReference}</p>` : ''}
      `;
    } else if (orderData.paymentMethod === 'mobile') {
      paymentDetails = `
        <p>Payment: ${paymentMethod}</p>
        <p>Amount Paid: ${CURRENCY_SYMBOL} ${(orderData.amountReceived || 0).toFixed(2)}</p>
        ${orderData.change > 0 ? `<p>Change: ${CURRENCY_SYMBOL} ${(orderData.change || 0).toFixed(2)}</p>` : ''}
        ${orderData.paymentReference ? `<p>Reference: ${orderData.paymentReference}</p>` : ''}
      `;
    } else if (orderData.paymentMethod === 'cash+mpesa') {
      paymentDetails = `
        <p>Payment: ${paymentMethod}</p>
        <p>Cash: ${CURRENCY_SYMBOL} ${(orderData.splitCashAmount || 0).toFixed(2)}</p>
        <p>Mpesa: ${CURRENCY_SYMBOL} ${(orderData.splitMobileAmount || 0).toFixed(2)}</p>
        ${orderData.paymentReference ? `<p>Reference: ${orderData.paymentReference}</p>` : ''}
      `;
    } else {
      paymentDetails = `<p>Payment: ${paymentMethod}</p>`;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${orderData.receiptNo}</title>
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
            <h2>Smart Retail Store</h2>
            <p>123 Main Street, Nairobi</p>
            <p>Tel: +254 712 345 678</p>
            <p>Receipt #${orderData.receiptNo}</p>
            ${orderData.tableNumber ? `<p>Table: ${orderData.tableNumber}</p>` : ''}
            <p>${orderData.date || new Date(orderData.timestamp).toLocaleString()}</p>
            <p>Cashier: ${user?.name || 'John Doe'}</p>
          </div>
          <div class="items">
            ${orderData.items.map(item => `
              <div class="item">
                <div>
                  <div>${item.name}</div>
                  <div class="item-details">${item.quantity} x ${CURRENCY_SYMBOL} ${item.price.toFixed(2)}</div>
                </div>
                <div>${CURRENCY_SYMBOL} ${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item"><span>Subtotal:</span> <span>${CURRENCY_SYMBOL} ${orderData.subtotal.toFixed(2)}</span></div>
            <div class="item"><span>Tax (8%):</span> <span>${CURRENCY_SYMBOL} ${orderData.tax.toFixed(2)}</span></div>
            <div class="item" style="font-size: 16px; margin-top: 5px;">
              <span>Total:</span> <span>${CURRENCY_SYMBOL} ${orderData.total.toFixed(2)}</span>
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

  const printReceipt = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        const receiptHTML = generateReceiptHTML(order);
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
      console.warn('Auto print not available, falling back to standard print:', error);
    }
    
    const printContent = generateReceiptHTML(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              onClick={() => navigate('/orders')}
              className="p-2.5 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition touch-manipulation"
              title="Back to Orders"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">Receipt #{order.receiptNo}</h2>
              <p className="text-sm sm:text-base text-gray-600">
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {status === 'pending' && (
              <>
                <button
                  onClick={() => payment.openPayment()}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                >
                  <CheckCircle size={18} />
                  <span className="hidden sm:inline">Confirm Payment</span>
                  <span className="sm:hidden">Payment</span>
                </button>
                <button
                  onClick={() => setShowAddItems(true)}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Items</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </>
            )}
            <button
              onClick={printReceipt}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Order Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Receipt size={20} />
                Order Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Receipt Number</p>
                  <p className="font-semibold text-gray-800">#{order.receiptNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(order.timestamp)}
                  </p>
                </div>
                {order.tableNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Table Number</p>
                    <p className="font-semibold text-gray-800">Table {order.tableNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${
                    status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {status === 'paid' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                    {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Order Items
                </h3>
                {status === 'paid' && (
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Order is paid - editing disabled
                  </span>
                )}
              </div>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-base">{item.name}</p>
                        <p className="text-sm text-gray-500">{CURRENCY_SYMBOL} {item.price.toFixed(2)} each</p>
                      </div>
                      {status === 'pending' && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 active:text-red-800 p-2 touch-manipulation"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {status === 'pending' ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-2 rounded touch-manipulation"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-semibold text-base">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-2 rounded touch-manipulation"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-center font-semibold text-base text-gray-700">{item.quantity}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Unit: {CURRENCY_SYMBOL} {item.price.toFixed(2)}</p>
                        <p className="font-bold text-blue-600 text-base">Total: {CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Item</th>
                      <th className="text-center py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Unit Price</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-2 sm:px-4">
                          <div>
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-500">{CURRENCY_SYMBOL} {item.price.toFixed(2)} each</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-center">
                          {status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-1.5 rounded touch-manipulation"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-12 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-1.5 rounded touch-manipulation"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-700">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right">{CURRENCY_SYMBOL} {item.price.toFixed(2)}</td>
                        <td className="py-3 px-2 sm:px-4 text-right font-semibold">{CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}</td>
                        <td className="py-3 px-2 sm:px-4 text-center">
                          {status === 'pending' && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 active:text-red-800 p-1.5 touch-manipulation"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL} {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8%):</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL} {order.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{CURRENCY_SYMBOL} {order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Amount Received:</span>
                  <span className="font-semibold text-green-600">{CURRENCY_SYMBOL} {(order.amountReceived || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Due:</span>
                  <span className="font-semibold text-red-600">{CURRENCY_SYMBOL} {(order.balance || 0).toFixed(2)}</span>
                </div>
                <div className={`p-3 rounded-lg mt-4 ${
                  status === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`text-sm font-semibold ${
                    status === 'paid' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    Status: {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payments History */}
            {order.payments && order.payments.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">#</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Method</th>
                        <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.payments.map((payment, index) => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 sm:px-4 text-sm">{index + 1}</td>
                          <td className="py-3 px-2 sm:px-4 text-sm capitalize">
                            {payment.paymentMethod === 'cash+mpesa' ? 'Cash + Mpesa' : payment.paymentMethod || 'N/A'}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-sm text-right font-semibold text-green-600">
                            {CURRENCY_SYMBOL} {(payment.amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-sm text-right">
                            {CURRENCY_SYMBOL} {(payment.change || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-bold">
                        <td colSpan="2" className="py-3 px-2 sm:px-4 text-sm">Total Paid</td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-right text-green-600">
                          {CURRENCY_SYMBOL} {order.payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-right">
                          {CURRENCY_SYMBOL} {order.payments.reduce((sum, p) => sum + (p.change || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Items Modal */}
      {showAddItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-lg p-4 sm:p-6 max-w-4xl w-full h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">Add Items to Order</h2>
              <button
                onClick={() => {
                  setShowAddItems(false);
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="text-gray-500 hover:text-gray-700 active:text-gray-900 p-2 touch-manipulation"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition touch-manipulation ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddItem(product)}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition text-left touch-manipulation min-h-[100px] sm:min-h-[120px]"
                  >
                    <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    <p className="font-bold text-blue-600 text-base sm:text-lg">{CURRENCY_SYMBOL} {product.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {order && (
        <PaymentModal
          show={payment.showPayment}
          totalAmount={order.balance || 0}
          paymentState={payment}
          onProcessPayment={handleProcessPayment}
          onCancel={payment.closePayment}
          customers={customers || []}
        />
      )}
    </Layout>
  );
};

export default ViewOrder;

