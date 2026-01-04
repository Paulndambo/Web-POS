import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, DollarSign, Banknote, Receipt, X, Wallet, Smartphone } from 'lucide-react';
import { useOrders } from './contexts/OrdersContext.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { CURRENCY_SYMBOL } from './config/currency.js';
import { apiGet, apiPost } from './utils/api.js';

const POS = () => {
  const { addOrder } = useOrders();
  const { getAccessToken } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stkPushSent, setStkPushSent] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState(null);
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMobileAmount, setSplitMobileAmount] = useState('');
  const searchInputRef = useRef(null);

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
          const response = await apiGet(endpoint, false);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Transform API response to match component's expected format
          const transformedProducts = data.results.map(product => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price), // Convert string to number
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

  // Helper function to round monetary values to 2 decimal places
  const roundMoney = (value) => Math.round(value * 100) / 100;

  const getSubtotal = () => roundMoney(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  
  const getTax = () => roundMoney(getSubtotal() * 0.08);
  
  const getTotal = () => roundMoney(getSubtotal() + getTax());

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

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
      return { valid: false, error: 'Phone number is required' };
    }

    // Normalize: remove all spaces, dashes, parentheses, and plus signs
    const normalized = phoneNumber.replace(/[\s\-\(\)\+]/g, '');

    // Check if it contains only digits
    if (!/^\d+$/.test(normalized)) {
      return { valid: false, error: 'Phone number should contain only digits' };
    }

    let cleanedNumber = normalized;

    // Handle different prefixes - Kenyan numbers can be:
    // Local: 0XX XXX XXXX (10 digits, starts with 0)
    // International: +254 XX XXX XXXX (13 chars with +, 12 digits without +)
    // Without prefix: XX XXX XXXX (9 digits)
    
    if (cleanedNumber.startsWith('254')) {
      // International format: 254712345678 (should be 12 digits)
      if (cleanedNumber.length !== 12) {
        return { valid: false, error: 'Invalid international format. Should be 254 followed by 9 digits' };
      }
      cleanedNumber = cleanedNumber.substring(3); // Remove '254' prefix, should be 9 digits
    } else if (cleanedNumber.startsWith('0')) {
      // Local format: 0712345678 (should be 10 digits)
      if (cleanedNumber.length !== 10) {
        return { valid: false, error: 'Invalid local format. Should be 0 followed by 9 digits (10 digits total)' };
      }
      cleanedNumber = cleanedNumber.substring(1); // Remove '0' prefix, should be 9 digits
    }

    // After normalization, we should have exactly 9 digits
    if (cleanedNumber.length !== 9) {
      if (normalized.length < 9) {
        return { valid: false, error: 'Phone number is too short. Expected 9-12 digits' };
      } else if (normalized.length > 12) {
        return { valid: false, error: 'Phone number is too long. Expected 9-12 digits' };
      } else {
        return { valid: false, error: `Invalid length. Got ${cleanedNumber.length} digits, expected 9 after removing country code` };
      }
    }

    // Check if it starts with a valid Kenyan mobile prefix (7 for Safaricom/Airtel/Telkom, 1 for some networks)
    const firstDigit = cleanedNumber[0];
    const validPrefixes = ['1', '7']; // Kenyan mobile numbers start with 1 or 7 after removing country code
    
    if (!validPrefixes.includes(firstDigit)) {
      return { valid: false, error: 'Invalid phone number format. Kenyan mobile numbers start with 1 or 7 (after removing country code)' };
    }

    // Return the cleaned number with leading 0 for display/storage
    return { valid: true, cleaned: '0' + cleanedNumber };
  };

  const processPayment = () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < getTotal()) {
        alert('Insufficient amount received');
        return;
      }
      completeTransaction();
    } else if (paymentMethod === 'mobile') {
      const validation = validatePhoneNumber(mobileNumber);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      // Store the cleaned number and proceed with payment
      const cleanedPhone = validation.cleaned;
      setMobileNumber(cleanedPhone);
      
      // Use setTimeout to ensure state update before initiating payment
      setTimeout(() => {
        initiateMobilePayment(cleanedPhone);
      }, 0);
    } else if (paymentMethod === 'cash+mpesa') {
      const cashAmount = parseFloat(splitCashAmount || 0);
      const mobileAmount = parseFloat(splitMobileAmount || 0);
      const total = getTotal();
      
      if (isNaN(cashAmount) || cashAmount < 0) {
        alert('Please enter a valid cash amount');
        return;
      }
      
      if (isNaN(mobileAmount) || mobileAmount < 0) {
        alert('Please enter a valid mobile money amount');
        return;
      }
      
      const sum = cashAmount + mobileAmount;
      if (Math.abs(sum - total) > 0.01) {
        alert(`Payment amounts don't match total. Cash: ${CURRENCY_SYMBOL} ${cashAmount.toFixed(2)} + Mpesa: ${CURRENCY_SYMBOL} ${mobileAmount.toFixed(2)} = ${CURRENCY_SYMBOL} ${sum.toFixed(2)}, but total is ${CURRENCY_SYMBOL} ${total.toFixed(2)}`);
        return;
      }
      
      const validation = validatePhoneNumber(mobileNumber);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      // Store the cleaned number and proceed with payment
      const cleanedPhone = validation.cleaned;
      setMobileNumber(cleanedPhone);
      
      // Use setTimeout to ensure state update before initiating payment
      setTimeout(() => {
        initiateMobilePayment(cleanedPhone);
      }, 0);
    } else {
      completeTransaction();
    }
  };

  const initiateMobilePayment = (phoneNumber = mobileNumber) => {
    setPaymentProcessing(true);
    setStkPushSent(false);
    setShowPayment(false);

    // Use the provided phone number or fall back to state
    const phoneToUse = phoneNumber || mobileNumber;

    // Simulate sending STK push
    setTimeout(() => {
      setStkPushSent(true);
      
      // Simulate customer confirming payment on their phone
      setTimeout(() => {
        setPaymentProcessing(false);
        setStkPushSent(false);
        completeTransaction();
      }, 4000);
    }, 2000);
  };

  // Transform order data to backend API format
  const transformOrderForBackend = (orderData) => {
    // Map payment method: "mobile" -> "mpesa", "cash" -> "cash", "cash+mpesa" -> "mpesa"
    let backendPaymentMethod = orderData.paymentMethod;
    if (orderData.paymentMethod === 'mobile') {
      backendPaymentMethod = 'mpesa';
    } else if (orderData.paymentMethod === 'cash+mpesa') {
      backendPaymentMethod = 'mpesa'; // Use mpesa for split payments, backend handles split amounts
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
      total: roundMoney(parseFloat(orderData.total)),
      paymentMethod: backendPaymentMethod,
      amountReceived: roundMoney(parseFloat(orderData.amountReceived || 0)),
      change: roundMoney(parseFloat(orderData.change || 0)),
      mobileNumber: orderData.mobileNumber || '',
      mobileNetwork: orderData.mobileNetwork || (orderData.mobileNumber ? 'Safaricom' : ''),
      splitCashAmount: roundMoney(parseFloat(orderData.splitCashAmount || 0)),
      splitMobileAmount: roundMoney(parseFloat(orderData.splitMobileAmount || 0)),
      status: orderData.status === 'paid' ? 'Paid' : 'Pending',
      date: formattedDate,
      receiptNo: orderData.receiptNo.toString()
    };
  };

  const completeTransaction = async () => {
    const totalAmount = getTotal();
    const cashReceived = paymentMethod === 'cash' ? parseFloat(amountReceived) : 0;
    const receiptData = {
      items: cart,
      subtotal: getSubtotal(),
      tax: getTax(),
      total: totalAmount,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? roundMoney(cashReceived) : roundMoney(totalAmount),
      change: paymentMethod === 'cash' ? roundMoney(cashReceived - totalAmount) : 0,
      mobileNumber: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? mobileNumber : null,
      mobileNetwork: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? 'Safaricom' : null,
      splitCashAmount: paymentMethod === 'cash+mpesa' ? roundMoney(parseFloat(splitCashAmount || 0)) : null,
      splitMobileAmount: paymentMethod === 'cash+mpesa' ? roundMoney(parseFloat(splitMobileAmount || 0)) : null,
      status: 'paid', // POS orders are always paid immediately
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
    setShowPayment(false);
    setPaymentMethod('');
    setAmountReceived('');
    setMobileNumber('');
    setSplitCashAmount('');
    setSplitMobileAmount('');
    setPhoneValidation(null);
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
            <p>Payment: ${receiptData.paymentMethod === 'cash+mpesa' ? 'CASH + MPESA' : receiptData.paymentMethod.toUpperCase()}</p>
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
                onClick={() => setShowPayment(true)}
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
      {showPayment && !paymentProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-auto max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Payment</h2>
            <div className="mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600 mb-2">Total Amount:</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{CURRENCY_SYMBOL} {getTotal().toFixed(2)}</p>
            </div>

            <div className="mb-3 sm:mb-4">
              <p className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Select Payment Method:</p>
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
                  onClick={() => {
                    setPaymentMethod('cash+mpesa');
                    setSplitCashAmount('');
                    setSplitMobileAmount('');
                  }}
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
              <div className="mb-3 sm:mb-4">
                <label className="block font-semibold mb-2 text-sm sm:text-base">Amount Received:</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                {amountReceived && parseFloat(amountReceived) >= getTotal() && (
                  <p className="mt-2 text-sm sm:text-base text-green-600 font-semibold">
                    Change: {CURRENCY_SYMBOL} {(parseFloat(amountReceived) - getTotal()).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === 'mobile' && (
              <div className="mb-3 sm:mb-4 space-y-3">
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base">Customer Phone Number:</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      // Allow only digits, spaces, dashes, parentheses, and plus sign
                      const value = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
                      setMobileNumber(value);
                      // Validate as user types
                      if (value) {
                        setPhoneValidation(validatePhoneNumber(value));
                      } else {
                        setPhoneValidation(null);
                      }
                    }}
                    placeholder="0712345678"
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg focus:outline-none ${
                      phoneValidation ? 
                        (phoneValidation.valid ? 
                          'border-green-500 focus:border-green-600' : 
                          'border-red-500 focus:border-red-600') : 
                        'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {phoneValidation && (
                    <p className={`text-xs mt-1 ${
                      phoneValidation.valid ? 
                        'text-green-600' : 
                        'text-red-600'
                    }`}>
                      {phoneValidation.valid ? 
                        `✓ Valid: ${phoneValidation.cleaned}` : 
                        phoneValidation.error}
                    </p>
                  )}
                  {!mobileNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      Enter phone number (e.g., 0712345678)
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === 'cash+mpesa' && (
              <div className="mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-purple-200 rounded-lg p-3 sm:p-4 mb-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Wallet size={20} className="text-purple-600" />
                    <p className="font-bold text-purple-700 text-sm sm:text-base">Split Payment</p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Total: <span className="font-bold text-gray-800">{CURRENCY_SYMBOL} {getTotal().toFixed(2)}</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Cash Section */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote size={20} className="text-blue-600" />
                      <label className="font-semibold text-blue-700 text-sm sm:text-base">Cash Amount</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={splitCashAmount}
                      onChange={(e) => {
                        const cashValue = e.target.value;
                        setSplitCashAmount(cashValue);
                        const cash = parseFloat(cashValue) || 0;
                        const total = getTotal();
                        const remaining = Math.max(0, total - cash);
                        setSplitMobileAmount(remaining.toFixed(2));
                      }}
                      placeholder="0.00"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    />
                    {splitCashAmount && (
                      <p className="mt-2 text-xs sm:text-sm font-semibold text-blue-700">
                        Cash: {CURRENCY_SYMBOL} {parseFloat(splitCashAmount || 0).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Mobile Money Section */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone size={20} className="text-green-600" />
                      <label className="font-semibold text-green-700 text-sm sm:text-base">Mpesa Amount</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={splitMobileAmount}
                      onChange={(e) => {
                        const mobileValue = e.target.value;
                        setSplitMobileAmount(mobileValue);
                        const mobile = parseFloat(mobileValue) || 0;
                        const total = getTotal();
                        const remaining = Math.max(0, total - mobile);
                        setSplitCashAmount(remaining.toFixed(2));
                      }}
                      placeholder="0.00"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                    />
                    <p className="mt-2 text-xs sm:text-sm font-semibold text-green-700">
                      Mpesa: {CURRENCY_SYMBOL} {parseFloat(splitMobileAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Validation Message */}
                {splitCashAmount && splitMobileAmount && (
                  <div className={`mt-3 p-2 sm:p-3 rounded-lg ${
                    (parseFloat(splitCashAmount || 0) + parseFloat(splitMobileAmount || 0)).toFixed(2) === getTotal().toFixed(2)
                      ? 'bg-green-100 border border-green-300'
                      : 'bg-red-100 border border-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {(parseFloat(splitCashAmount || 0) + parseFloat(splitMobileAmount || 0)).toFixed(2) === getTotal().toFixed(2) ? (
                        <>
                          <span className="text-green-600 font-bold">✓</span>
                          <p className="text-xs sm:text-sm text-green-700 font-semibold">
                            Payment split matches total amount
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-red-600 font-bold">✗</span>
                          <p className="text-xs sm:text-sm text-red-700 font-semibold">
                            Total: {CURRENCY_SYMBOL} {(parseFloat(splitCashAmount || 0) + parseFloat(splitMobileAmount || 0)).toFixed(2)} / Required: {CURRENCY_SYMBOL} {getTotal().toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Money Details */}
                <div className="mt-3 sm:mt-4 space-y-3">
                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Customer Phone Number:</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
                        setMobileNumber(value);
                        if (value) {
                          setPhoneValidation(validatePhoneNumber(value));
                        } else {
                          setPhoneValidation(null);
                        }
                      }}
                      placeholder="0712345678"
                      className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg focus:outline-none ${
                        phoneValidation ? 
                          (phoneValidation.valid ? 
                            'border-green-500 focus:border-green-600' : 
                            'border-red-500 focus:border-red-600') : 
                          'border-gray-300 focus:border-purple-500'
                      }`}
                    />
                    {phoneValidation && (
                      <p className={`text-xs mt-1 ${
                        phoneValidation.valid ? 
                          'text-green-600' : 
                          'text-red-600'
                      }`}>
                        {phoneValidation.valid ? 
                          `✓ Valid: ${phoneValidation.cleaned}` : 
                          phoneValidation.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowPayment(false);
                  setPaymentMethod('');
                  setAmountReceived('');
                  setMobileNumber('');
                  setPhoneValidation(null);
                  setSplitCashAmount('');
                  setSplitMobileAmount('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
              >
                {paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa' ? 'Send STK Push' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <p className="text-lg sm:text-2xl font-bold text-blue-900 break-all">{mobileNumber}</p>
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
              {paymentMethod === 'cash+mpesa' ? (
                <>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{CURRENCY_SYMBOL} {getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-blue-700 mb-2">
                    <span>Cash Paid:</span>
                    <span className="font-semibold">{CURRENCY_SYMBOL} {parseFloat(splitCashAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-green-700 mb-2 font-bold border-t pt-2">
                    <span>Mpesa Amount:</span>
                    <span>{CURRENCY_SYMBOL} {parseFloat(splitMobileAmount || 0).toFixed(2)}</span>
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
                  <span className="capitalize">{receipt.paymentMethod === 'cash+mpesa' ? 'Cash + Mpesa' : receipt.paymentMethod}</span>
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