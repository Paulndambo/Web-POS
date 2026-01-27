import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, DollarSign, Receipt, X } from 'lucide-react';
import { useOrders } from './contexts/OrdersContext.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useCustomers } from './contexts/CustomersContext.jsx';
import { usePayment } from './hooks/usePayment.js';
import PaymentModal from './components/PaymentModal.jsx';
import Layout from './components/Layout.jsx';
import { CURRENCY_SYMBOL } from './config/currency.js';
import { apiGet, apiPost } from './utils/api.js';

const POS = () => {
  const { addOrder } = useOrders();
  const { getAccessToken } = useAuth();
  const { customers, fetchCustomers } = useCustomers();
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [receipt, setReceipt] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stkPushSent, setStkPushSent] = useState(false);
  const searchInputRef = useRef(null);

  // Helper function to round monetary values to 2 decimal places
  const roundMoney = (value) => Math.round(value * 100) / 100;
  // Helper function to round monetary values upwards to whole number (no cents) - if any decimal, round up to next whole number
  const roundMoneyUpToWhole = (value) => {
    const wholeNumber = Math.ceil(value);
    return wholeNumber; // Returns integer, will be formatted as .00 when displayed
  };

  const getSubtotal = () => roundMoney(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  const getTax = () => roundMoney(getSubtotal() * 0.08);
  const getTotal = () => roundMoneyUpToWhole(getSubtotal() + getTax());

  // Use ref to store completeTransaction to avoid circular dependency
  const completeTransactionRef = useRef(null);

  // Use the reusable payment hook
  const payment = usePayment({
    totalAmount: getTotal(),
    onPaymentComplete: (paymentData) => {
      if (completeTransactionRef.current) {
        completeTransactionRef.current(paymentData);
      }
    },
    customers: customers || []
  });

  // Complete transaction function
  const completeTransaction = async (paymentData) => {
    const totalAmount = getTotal();
    const receiptData = {
      items: cart,
      subtotal: getSubtotal(),
      tax: getTax(),
      total: totalAmount,
      ...paymentData, // Spread all payment data from the hook
      date: new Date().toLocaleString(),
      receiptNo: Math.floor(Math.random() * 100000)
    };

    // Transform data for backend API
    const backendOrderData = transformOrderForBackend(receiptData);

    try {
      const token = getAccessToken();
      
      // Submit order to backend
      const response = await apiPost('/orders/pos-place-order/', backendOrderData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.text();
      console.log('Order submitted successfully:', responseData);
    } catch (error) {
      console.error('Error submitting order to backend:', error);
      // Still proceed with local storage even if backend submission fails
      alert('Order saved locally but failed to submit to server. Please check your connection.');
    }

    // Save order to context (local storage)
    addOrder(receiptData);
    
    setReceipt(receiptData);
    setCart([]);
    payment.resetPayment(); // Reset all payment state using the hook
  };

  // Set the ref after completeTransaction is defined
  completeTransactionRef.current = completeTransaction;

  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        
        let allProducts = [];
        let endpoint = '/inventory';
        
        // Fetch all pages of products
        while (endpoint) {
          // Inventory endpoint doesn't require authentication
          const response = await apiGet(endpoint);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Transform API response to match component's expected format
          const transformedProducts = data.results.map(product => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price || 0), // Use selling_price for POS
            barcode: product.barcode,
            category: product.category_name, // Use category_name instead of category
            stock: product.quantity // Use quantity as stock
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
        setProductsError(error.message);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Note: Customers are already fetched by CustomersContext on mount
  // No need to fetch again here to avoid flooding the backend

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (id, delta) => {
    const product = products.find(p => p.id === id);
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      addToCart(filteredProducts[0]);
    }
  };

  // Process payment using the hook
  const handleProcessPayment = () => {
    const result = payment.processPayment();
    if (result.success) {
      // For mobile payments, initiate STK push
      if (payment.paymentMethod === 'mobile' || payment.paymentMethod === 'cash+mpesa') {
        const validation = payment.validatePhoneNumber(payment.mobileNumber);
        if (validation.valid) {
          payment.setMobileNumber(validation.cleaned);
          setTimeout(() => {
            initiateMobilePayment(validation.cleaned);
          }, 0);
        }
      } else {
        // For other payment methods, complete immediately
        // Call the onPaymentComplete callback which will trigger completeTransaction via the ref
        if (completeTransactionRef.current) {
          completeTransactionRef.current(result.paymentData);
        }
      }
    } else {
      alert(result.error);
    }
  };

  const initiateMobilePayment = (phoneNumber) => {
    setPaymentProcessing(true);
    setStkPushSent(false);
    payment.setShowPayment(false);

    // Simulate sending STK push
    setTimeout(() => {
      setStkPushSent(true);
      
      // Simulate customer confirming payment on their phone
      setTimeout(() => {
        setPaymentProcessing(false);
        setStkPushSent(false);
        // Get payment data and complete transaction
        const paymentData = payment.buildPaymentData();
        // Call completeTransaction via the ref
        if (completeTransactionRef.current) {
          completeTransactionRef.current(paymentData);
        }
      }, 4000);
    }, 2000);
  };

  // Transform order data to backend API format
  const transformOrderForBackend = (orderData) => {
    // Map payment method: "mobile" -> "mpesa", "cash" -> "cash", "cash+mpesa" -> "mpesa", "bnpl" -> "bnpl", "store-credit" -> "store_credit"
    let backendPaymentMethod = orderData.paymentMethod;
    if (orderData.paymentMethod === 'mobile') {
      backendPaymentMethod = 'mpesa';
    } else if (orderData.paymentMethod === 'cash+mpesa') {
      backendPaymentMethod = 'mpesa'; // Use mpesa for split payments, backend handles split amounts
    } else if (orderData.paymentMethod === 'store-credit') {
      backendPaymentMethod = 'store_credit';
    } else if (orderData.paymentMethod === 'loyalty-card') {
      backendPaymentMethod = 'loyalty_card';
    }

    // Transform items to backend format
    const transformedItems = orderData.items.map(item => ({
      id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: roundMoney(parseFloat(item.price)),
      total_price: roundMoney(parseFloat(item.price * item.quantity))
    }));

    // Format date as YYYY-MM-DD
    const dateObj = new Date();
    const formattedDate = dateObj.toISOString().split('T')[0];

    return {
      items: transformedItems,
      subtotal: roundMoney(parseFloat(orderData.subtotal)),
      tax: roundMoney(parseFloat(orderData.tax)),
      total: roundMoneyUpToWhole(parseFloat(orderData.total)), // Round total upwards to whole number
      paymentMethod: backendPaymentMethod,
      amountReceived: roundMoney(parseFloat(orderData.amountReceived || 0)),
      change: roundMoney(parseFloat(orderData.change || 0)),
      mobileNumber: orderData.mobileNumber || '',
      mobileNetwork: orderData.mobileNetwork || (orderData.mobileNumber ? 'Safaricom' : ''),
      splitCashAmount: roundMoney(parseFloat(orderData.splitCashAmount || 0)),
      splitMobileAmount: roundMoney(parseFloat(orderData.splitMobileAmount || 0)),
      bnplDownPayment: roundMoney(parseFloat(orderData.bnplDownPayment || 0)),
      bnplInstallments: orderData.bnplInstallments || null,
      bnplInterval: orderData.bnplInterval || null,
      storeCreditUsed: roundMoney(parseFloat(orderData.storeCreditUsed || 0)),
      storeCreditBalance: roundMoney(parseFloat(orderData.storeCreditBalance || 0)),
      loyaltyCardNumber: orderData.loyaltyCardNumber || '',
      loyaltyPointsUsed: parseInt(orderData.loyaltyPointsUsed || 0),
      loyaltyPointsBalance: parseInt(orderData.loyaltyPointsBalance || 0),
      loyaltyPointsRate: parseFloat(orderData.loyaltyPointsRate || 1),
      loyaltyCustomerName: orderData.loyaltyCustomerName || '',
      status: orderData.status === 'paid' ? 'Paid' : 'Pending',
      date: formattedDate,
      receiptNo: orderData.receiptNo.toString()
    };
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const printReceipt = () => {
    // Attempt auto printing - opens in new window and attempts to print automatically
    // Falls back to standard print dialog if popup is blocked
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        // Generate receipt HTML
        const receiptHTML = generateReceiptHTML(receipt);
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        // Wait for content to load, then try to print
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Auto-close after printing
          setTimeout(() => {
            printWindow.close();
          }, 500);
        }, 250);
        
        // Close modal after attempting print
        setTimeout(() => {
          closeReceipt();
        }, 100);
        return;
      }
    } catch (error) {
      console.warn('Auto print not available, falling back to standard print:', error);
    }
    
    // Fallback to standard print dialog if popup was blocked
    window.print();
    // Close receipt modal after print dialog
    setTimeout(() => {
      closeReceipt();
    }, 100);
  };

  const generateReceiptHTML = (receiptData) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${receiptData.receiptNo}</title>
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
            <p>Receipt #${receiptData.receiptNo}</p>
            <p>${receiptData.date}</p>
            <p>Cashier: John Doe</p>
          </div>
          <div class="items">
            ${receiptData.items.map(item => `
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
            <div class="item"><span>Subtotal:</span> <span>${CURRENCY_SYMBOL} ${receiptData.subtotal.toFixed(2)}</span></div>
            <div class="item"><span>Tax (8%):</span> <span>${CURRENCY_SYMBOL} ${receiptData.tax.toFixed(2)}</span></div>
            <div class="item" style="font-size: 16px; margin-top: 5px;">
              <span>Total:</span> <span>${CURRENCY_SYMBOL} ${receiptData.total.toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Payment: ${
              receiptData.paymentMethod === 'cash+mpesa' ? 'CASH + MPESA' : 
              receiptData.paymentMethod === 'bnpl' ? 'BUY NOW, PAY LATER' :
              receiptData.paymentMethod === 'store-credit' ? 'STORE CREDIT' :
              receiptData.paymentMethod === 'loyalty-card' ? 'LOYALTY CARD' :
              receiptData.paymentMethod.toUpperCase()
            }</p>
            ${receiptData.paymentMethod === 'cash' ? `
              <p>Received: ${CURRENCY_SYMBOL} ${receiptData.amountReceived.toFixed(2)}</p>
              <p>Change: ${CURRENCY_SYMBOL} ${receiptData.change.toFixed(2)}</p>
            ` : ''}
            ${receiptData.paymentMethod === 'mobile' ? `
              <p>Mobile: ${receiptData.mobileNumber}</p>
              <p>Network: Mpesa</p>
            ` : ''}
            ${receiptData.paymentMethod === 'cash+mpesa' ? `
              <p>Cash: ${CURRENCY_SYMBOL} ${(receiptData.splitCashAmount || 0).toFixed(2)}</p>
              <p>Mpesa: ${CURRENCY_SYMBOL} ${(receiptData.splitMobileAmount || 0).toFixed(2)}</p>
              <p>Mobile: ${receiptData.mobileNumber}</p>
              <p>Network: Mpesa</p>
            ` : ''}
            ${receiptData.paymentMethod === 'bnpl' ? `
              ${receiptData.bnplDownPayment > 0 ? `<p>Down Payment: ${CURRENCY_SYMBOL} ${(receiptData.bnplDownPayment || 0).toFixed(2)}</p>` : ''}
              <p>Installments: ${receiptData.bnplInstallments || 3} payments</p>
              ${(() => {
                const total = receiptData.total;
                const downPayment = receiptData.bnplDownPayment || 0;
                const remaining = total - downPayment;
                const installmentAmount = remaining / (receiptData.bnplInstallments || 3);
                const intervalText = receiptData.bnplInterval === 1 ? 'week' : receiptData.bnplInterval === 2 ? '2 weeks' : 'month';
                return `<p>Amount per payment: ${CURRENCY_SYMBOL} ${installmentAmount.toFixed(2)}</p><p>Payment interval: Every ${intervalText}</p><p>Remaining Balance: ${CURRENCY_SYMBOL} ${remaining.toFixed(2)}</p>`;
              })()}
            ` : ''}
            ${receiptData.paymentMethod === 'store-credit' ? `
              <p>Store Credit Used: ${CURRENCY_SYMBOL} ${(receiptData.storeCreditUsed || 0).toFixed(2)}</p>
              <p>Previous Balance: ${CURRENCY_SYMBOL} ${(receiptData.storeCreditBalance || 0).toFixed(2)}</p>
              <p>Remaining Credit: ${CURRENCY_SYMBOL} ${((receiptData.storeCreditBalance || 0) - (receiptData.storeCreditUsed || 0)).toFixed(2)}</p>
            ` : ''}
            ${receiptData.paymentMethod === 'loyalty-card' ? `
              <p>Customer: ${receiptData.loyaltyCustomerName || 'N/A'}</p>
              <p>Card Number: ${receiptData.loyaltyCardNumber || 'N/A'}</p>
              <p>Points Used: ${(receiptData.loyaltyPointsUsed || 0).toLocaleString()}</p>
              <p>Points Value: ${CURRENCY_SYMBOL} ${((receiptData.loyaltyPointsUsed || 0) * (receiptData.loyaltyPointsRate || 1)).toFixed(2)}</p>
              <p>Previous Balance: ${(receiptData.loyaltyPointsBalance || 0).toLocaleString()} points</p>
              <p>Remaining Points: ${((receiptData.loyaltyPointsBalance || 0) - (receiptData.loyaltyPointsUsed || 0)).toLocaleString()}</p>
              ${((receiptData.loyaltyPointsUsed || 0) * (receiptData.loyaltyPointsRate || 1)) < receiptData.total ? `<p>Remaining Balance: ${CURRENCY_SYMBOL} ${(receiptData.total - ((receiptData.loyaltyPointsUsed || 0) * (receiptData.loyaltyPointsRate || 1))).toFixed(2)} (to be paid separately)</p>` : ''}
            ` : ''}
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `;
  };

  const closeReceipt = () => {
    setReceipt(null);
    setPaymentProcessing(false);
    setStkPushSent(false);
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-2 sm:p-4 overflow-hidden order-2 lg:order-1">
          {/* Search Bar */}
          <div className="mb-2 sm:mb-4">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-2.5 sm:top-3 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search product or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-4 overflow-x-auto pb-2 -mx-2 sm:mx-0 px-2 sm:px-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition text-sm sm:text-base ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto -mx-2 sm:mx-0 px-2 sm:px-0">
            {productsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : productsError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
                  <p className="text-red-600 font-semibold mb-2">Error loading products</p>
                  <p className="text-sm text-red-500">{productsError}</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-400 text-lg">No products found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search or category filter</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white p-2 sm:p-3 rounded-lg shadow hover:shadow-lg transition text-left"
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="font-semibold text-gray-800 mb-1 text-xs sm:text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 hidden sm:block">{product.category}</p>
                      <div className="mt-auto">
                        <p className="text-base sm:text-lg font-bold text-blue-600">{CURRENCY_SYMBOL} {product.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 bg-white shadow-xl flex flex-col order-1 lg:order-2 lg:border-l border-gray-200">
          <div className="p-3 sm:p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Current Order</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 p-2"
                title="Clear cart"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-h-[40vh] lg:max-h-none">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <ShoppingCart size={64} className="mx-auto mb-4 opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{CURRENCY_SYMBOL} {item.price.toFixed(2)} each</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-bold text-blue-600 text-sm sm:text-base">
                        {CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-3 sm:p-4 bg-gray-50">
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Subtotal:</span>
                  <span>{CURRENCY_SYMBOL} {getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Tax (8%):</span>
                  <span>{CURRENCY_SYMBOL} {getTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-800 pt-2 border-t">
                  <span>Total:</span>
                  <span>{CURRENCY_SYMBOL} {getTotal().toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={payment.openPayment}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <DollarSign size={18} />
                Process Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        show={payment.showPayment && !paymentProcessing}
        totalAmount={getTotal()}
        paymentState={payment}
        onProcessPayment={handleProcessPayment}
        onCancel={payment.closePayment}
        customers={customers || []}
      />

      {/* Mobile Payment Processing Modal */}

      {/* Mobile Payment Processing Modal */}
      {paymentProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full text-center mx-4">
            <div className="mb-4 sm:mb-6">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
              {!stkPushSent ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Initiating Payment</h2>
                  <p className="text-sm sm:text-base text-gray-600">Please wait while we process your request...</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Waiting for Payment</h2>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-sm sm:text-base text-blue-800 font-semibold mb-1">STK Push sent to</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900 break-all">{payment.mobileNumber}</p>
                    <p className="text-xs sm:text-sm text-blue-600 mt-2">via M-Pesa (Safaricom)</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-gray-600">
                    <div className="animate-pulse">⏳</div>
                    <p>Customer confirming payment on their phone...</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              {payment.paymentMethod === 'cash+mpesa' ? (
                <>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{CURRENCY_SYMBOL} {getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-blue-700 mb-2">
                    <span>Cash Paid:</span>
                    <span className="font-semibold">{CURRENCY_SYMBOL} {parseFloat(payment.splitCashAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-green-700 mb-2 font-bold border-t pt-2">
                    <span>Mpesa Amount:</span>
                    <span>{CURRENCY_SYMBOL} {parseFloat(payment.splitMobileAmount || 0).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                  <span>Amount to Pay:</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL} {getTotal().toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 animate-pulse" style={{width: stkPushSent ? '75%' : '25%'}}></div>
                </div>
                <span>{stkPushSent ? 'Confirming...' : 'Sending...'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[95vh] flex flex-col my-auto mx-2 sm:mx-4">
            <div className="text-center mb-3 sm:mb-4 no-print flex-shrink-0">
              <Receipt size={40} className="mx-auto text-green-600 mb-2" />
              <h2 className="text-xl sm:text-2xl font-bold">Payment Successful!</h2>
            </div>

            <div className="print-area bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 overflow-y-auto flex-1">
              <div className="text-center border-b pb-2 mb-2">
                <h3 className="font-bold text-lg">Smart Retail Store</h3>
                <p className="text-xs text-gray-600">123 Main Street, Nairobi</p>
                <p className="text-xs text-gray-600">Tel: +254 712 345 678</p>
                <p className="text-xs text-gray-600 mt-2">Receipt #{receipt.receiptNo}</p>
                <p className="text-xs text-gray-600">{receipt.date}</p>
                <p className="text-xs text-gray-600">Cashier: John Doe</p>
              </div>

              <div className="space-y-1 text-sm mb-2 border-b pb-2">
                <div className="flex justify-between font-semibold mb-1">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                {receipt.items.map(item => (
                  <div key={item.id}>
                    <div className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-600 ml-2">
                      {item.quantity} x {CURRENCY_SYMBOL} {item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{CURRENCY_SYMBOL} {receipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%):</span>
                  <span>{CURRENCY_SYMBOL} {receipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{CURRENCY_SYMBOL} {receipt.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 pt-2 border-t mt-2">
                  <span>Payment Method:</span>
                  <span className="capitalize">
                    {receipt.paymentMethod === 'cash+mpesa' ? 'Cash + Mpesa' : 
                     receipt.paymentMethod === 'bnpl' ? 'Buy Now, Pay Later' :
                     receipt.paymentMethod === 'store-credit' ? 'Store Credit' :
                     receipt.paymentMethod === 'loyalty-card' ? 'Loyalty Card' :
                     receipt.paymentMethod}
                  </span>
                </div>
                {receipt.paymentMethod === 'mobile' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Mobile Network:</span>
                      <span>M-Pesa (Safaricom)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phone Number:</span>
                      <span>{receipt.mobileNumber}</span>
                    </div>
                  </>
                )}
                {receipt.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Amount Received:</span>
                      <span>{CURRENCY_SYMBOL} {receipt.amountReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-600">
                      <span>Change:</span>
                      <span>{CURRENCY_SYMBOL} {receipt.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {receipt.paymentMethod === 'cash+mpesa' && (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-blue-700">Cash Amount:</span>
                        <span className="font-bold text-blue-700">{CURRENCY_SYMBOL} {(receipt.splitCashAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-green-700">Mpesa Amount:</span>
                        <span className="font-bold text-green-700">{CURRENCY_SYMBOL} {(receipt.splitMobileAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-purple-300 pt-2 flex justify-between text-sm">
                        <span className="font-bold">Total Paid:</span>
                        <span className="font-bold">{CURRENCY_SYMBOL} {((receipt.splitCashAmount || 0) + (receipt.splitMobileAmount || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>Mobile Network:</span>
                      <span>M-Pesa (Safaricom)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phone Number:</span>
                      <span>{receipt.mobileNumber}</span>
                    </div>
                  </>
                )}
                {receipt.paymentMethod === 'bnpl' && (
                  <>
                    {receipt.bnplCustomerName && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2 mb-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-orange-700">Customer:</span>
                          <span className="font-bold text-orange-700">{receipt.bnplCustomerName}</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2 space-y-2">
                      {receipt.bnplDownPayment > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-orange-700">Down Payment:</span>
                          <span className="font-bold text-orange-700">{CURRENCY_SYMBOL} {(receipt.bnplDownPayment || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-orange-700">Installments:</span>
                        <span className="font-bold text-orange-700">{receipt.bnplInstallments || 3} payments</span>
                      </div>
                      {(() => {
                        const total = receipt.total;
                        const downPayment = receipt.bnplDownPayment || 0;
                        const remaining = total - downPayment;
                        const installmentAmount = remaining / (receipt.bnplInstallments || 3);
                        const intervalText = receipt.bnplInterval === 1 ? 'week' : receipt.bnplInterval === 2 ? '2 weeks' : 'month';
                        return (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-orange-700">Installment Amount:</span>
                              <span className="font-bold text-orange-700">{CURRENCY_SYMBOL} {installmentAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-orange-700">Payment Interval:</span>
                              <span className="font-bold text-orange-700">Every {intervalText}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="border-t border-orange-300 pt-2 flex justify-between text-sm">
                        <span className="font-bold">Remaining Balance:</span>
                        <span className="font-bold">{CURRENCY_SYMBOL} {(receipt.total - (receipt.bnplDownPayment || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
                {receipt.paymentMethod === 'store-credit' && (
                  <>
                    {receipt.storeCreditCustomerName && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 mt-2 mb-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-indigo-700">Customer:</span>
                          <span className="font-bold text-indigo-700">{receipt.storeCreditCustomerName}</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-indigo-700">Store Credit Used:</span>
                        <span className="font-bold text-indigo-700">{CURRENCY_SYMBOL} {(receipt.storeCreditUsed || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-indigo-700">Previous Balance:</span>
                        <span className="font-bold text-indigo-700">{CURRENCY_SYMBOL} {(receipt.storeCreditBalance || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-indigo-300 pt-2 flex justify-between text-sm">
                        <span className="font-bold">Remaining Credit:</span>
                        <span className="font-bold">{CURRENCY_SYMBOL} {((receipt.storeCreditBalance || 0) - (receipt.storeCreditUsed || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
                {receipt.paymentMethod === 'loyalty-card' && (
                  <>
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-pink-700">Customer:</span>
                        <span className="font-bold text-pink-700">{receipt.loyaltyCustomerName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-pink-700">Card Number:</span>
                        <span className="font-bold text-pink-700">{receipt.loyaltyCardNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-pink-700">Points Used:</span>
                        <span className="font-bold text-pink-700">{(receipt.loyaltyPointsUsed || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-pink-700">Points Value:</span>
                        <span className="font-bold text-pink-700">{CURRENCY_SYMBOL} {((receipt.loyaltyPointsUsed || 0) * (receipt.loyaltyPointsRate || 1)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-pink-700">Previous Balance:</span>
                        <span className="font-bold text-pink-700">{(receipt.loyaltyPointsBalance || 0).toLocaleString()} points</span>
                      </div>
                      <div className="border-t border-pink-300 pt-2 flex justify-between text-sm">
                        <span className="font-bold">Remaining Points:</span>
                        <span className="font-bold">{((receipt.loyaltyPointsBalance || 0) - (receipt.loyaltyPointsUsed || 0)).toLocaleString()}</span>
                      </div>
                      {((receipt.loyaltyPointsUsed || 0) * (receipt.loyaltyPointsRate || 1)) < receipt.total && (
                        <div className="text-xs text-orange-600 pt-1 border-t border-pink-300">
                          Remaining balance: {CURRENCY_SYMBOL} {(receipt.total - ((receipt.loyaltyPointsUsed || 0) * (receipt.loyaltyPointsRate || 1))).toFixed(2)} (to be paid separately)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="text-center mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600">Thank you for shopping with us!</p>
                <p className="text-xs text-gray-600">Visit us again soon</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 no-print flex-shrink-0">
              <button
                onClick={printReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
                title="Print receipt"
              >
                <Receipt size={18} />
                Print Receipt
              </button>
              <button
                onClick={closeReceipt}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default POS;