import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Receipt, X, ArrowLeft, Utensils } from 'lucide-react';
import { useOrders } from '../contexts/OrdersContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showWarning, showError } from '../utils/toast.js';
import { apiGet, apiPost } from '../utils/api.js';

const CreateOrder = () => {
  const { addOrder } = useOrders();
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const searchInputRef = useRef(null);

  // Fetch menu items from backend API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        
        let allProducts = [];
        let endpoint = '/inventory/menus/';
        
        // Fetch all pages of menu items
        while (endpoint) {
          const response = await apiGet(endpoint);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Transform API response to match component's expected format
          const transformedProducts = data.results.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price || 0),
            stock: item.quantity || 0,
            category: 'Menu' // Menu items don't have categories, use default
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
        console.error('Error fetching menu items:', error);
        setProductsError(error.message);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchMenuItems();
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
  // Helper function to round monetary values upwards to whole number (no cents) - if any decimal, round up to next whole number
  const roundMoneyUpToWhole = (value) => {
    const wholeNumber = Math.ceil(value);
    return wholeNumber; // Returns integer, will be formatted as .00 when displayed
  };

  const getSubtotal = () => roundMoney(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  
  const getTax = () => roundMoney(getSubtotal() * 0.08);
  
  const getTotal = () => roundMoneyUpToWhole(getSubtotal() + getTax());

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      addToCart(filteredProducts[0]);
    }
  };

  // Transform order data to backend API format
  const transformOrderForBackend = (orderData) => {
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
      paymentMethod: orderData.paymentMethod || '',
      amountReceived: roundMoney(parseFloat(orderData.amountReceived || 0)),
      change: roundMoney(parseFloat(orderData.change || 0)),
      mobileNumber: orderData.mobileNumber || '',
      mobileNetwork: orderData.mobileNetwork || '',
      splitCashAmount: roundMoney(parseFloat(orderData.splitCashAmount || 0)),
      splitMobileAmount: roundMoney(parseFloat(orderData.splitMobileAmount || 0)),
      status: orderData.status === 'paid' ? 'Paid' : 'Pending',
      date: formattedDate,
      receiptNo: orderData.receiptNo.toString(),
      source: "CreateOrder",
      order: 0
    };
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      showWarning('Please add items to the cart');
      return;
    }

    const orderData = {
      items: cart,
      subtotal: getSubtotal(),
      tax: getTax(),
      total: getTotal(),
      paymentMethod: null,
      amountReceived: 0,
      change: 0,
      mobileNumber: null,
      mobileNetwork: null,
      splitCashAmount: null,
      splitMobileAmount: null,
      status: 'pending',
      tableNumber: tableNumber || null,
      date: new Date().toLocaleString(),
      receiptNo: Math.floor(Math.random() * 100000)
    };

    // Transform data for backend API
    const backendOrderData = transformOrderForBackend(orderData);

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
      showError('Order saved locally but failed to submit to server. Please check your connection.');
    }

    // Save order to context (local storage)
    addOrder(orderData);
    setReceipt(orderData);
    setCart([]);
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const printReceipt = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        const receiptHTML = generateReceiptHTML(receipt);
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 500);
        }, 250);
        
        setTimeout(() => {
          closeReceipt();
        }, 100);
        return;
      }
    } catch (error) {
      console.warn('Auto print not available, falling back to standard print:', error);
    }
    
    window.print();
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
            .status {
              background-color: #fef3c7;
              color: #92400e;
              padding: 5px;
              border-radius: 4px;
              font-weight: bold;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Smart Retail Store</h2>
            <p>123 Main Street, Nairobi</p>
            <p>Tel: +254 712 345 678</p>
            <p>Receipt #${receiptData.receiptNo}</p>
            ${receiptData.tableNumber ? `<p>Table: ${receiptData.tableNumber}</p>` : ''}
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
            <div class="status">STATUS: PENDING PAYMENT</div>
            <p>Payment to be collected later</p>
            <p>Thank you for shopping with us!</p>
          </div>
        </body>
      </html>
    `;
  };

  const closeReceipt = () => {
    setReceipt(null);
    navigate('/orders');
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
          {/* Header with back button */}
          <div className="mb-2 sm:mb-4 flex items-center gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
              title="Back to Orders"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Create New Order</h2>
              <p className="text-xs sm:text-sm text-gray-600">Add items to create a pending order</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-2 sm:mb-4">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-2.5 sm:top-3 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto -mx-2 sm:mx-0 px-2 sm:px-0">
            {productsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading menu items...</p>
                </div>
              </div>
            ) : productsError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
                  <p className="text-red-600 font-semibold mb-2">Error loading menu items</p>
                  <p className="text-sm text-red-500">{productsError}</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-400 text-lg">No products found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
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
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Order Items</h2>
              <p className="text-xs sm:text-sm text-gray-600">Pending payment order</p>
            </div>
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
                <p className="text-xs mt-2">Add items to create an order</p>
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
                onClick={createOrder}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Receipt size={18} />
                Create Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[95vh] flex flex-col my-auto mx-2 sm:mx-4">
            <div className="text-center mb-3 sm:mb-4 no-print flex-shrink-0">
              <Receipt size={40} className="mx-auto text-purple-600 mb-2" />
              <h2 className="text-xl sm:text-2xl font-bold">Order Created!</h2>
              <div className="mt-2 inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                Pending Payment
              </div>
            </div>

            <div className="print-area bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 overflow-y-auto flex-1">
              <div className="text-center border-b pb-2 mb-2">
                <h3 className="font-bold text-lg">Smart Retail Store</h3>
                <p className="text-xs text-gray-600">123 Main Street, Nairobi</p>
                <p className="text-xs text-gray-600">Tel: +254 712 345 678</p>
                <p className="text-xs text-gray-600 mt-2">Receipt #{receipt.receiptNo}</p>
                {receipt.tableNumber && (
                  <p className="text-xs text-gray-600">Table: {receipt.tableNumber}</p>
                )}
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
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-3 text-center">
                  <p className="text-sm font-semibold text-yellow-800">Status: Pending Payment</p>
                  <p className="text-xs text-yellow-700 mt-1">Payment to be collected later</p>
                </div>
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
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default CreateOrder;

