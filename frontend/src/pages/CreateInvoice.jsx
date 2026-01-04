import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, FileText, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost } from '../utils/api.js';

const CreateInvoice = () => {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [dueDate, setDueDate] = useState('');
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
            price: parseFloat(product.price),
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

  // Set default due date to 30 days from now
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setDueDate(date.toISOString().split('T')[0]);
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

  const createInvoice = async () => {
    if (cart.length === 0) {
      showWarning('Please add items to the invoice');
      return;
    }

    if (!customerName.trim()) {
      showWarning('Please enter customer name');
      return;
    }

    try {
      const token = getAccessToken();
      
      // Generate invoice number
      const invoiceNumber = `INV${Date.now().toString().slice(-6)}`;
      
      // Calculate totals
      const subtotal = getSubtotal();
      const tax = getTax();
      const total = getTotal();
      
      // Transform data for backend API
      const backendInvoiceData = {
        customer_name: customerName.trim(),
        email: customerEmail.trim() || '',
        address: customerAddress.trim() || '',
        invoice_number: invoiceNumber,
        due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        phone_number: customerPhone.trim() || '',
        tax: parseFloat(tax.toFixed(2)),
        sub_total: parseFloat(subtotal.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2)),
        items: cart.map(item => ({
          item_id: item.id,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          item_total: parseFloat(item.price * item.quantity)
        }))
      };

      // Submit invoice to backend
      const response = await apiPost('/invoices/', backendInvoiceData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to create invoice');
      }

      const responseData = await response.json();
      console.log('Invoice created successfully:', responseData);
      
      showSuccess(`Invoice #${invoiceNumber} created successfully!`);
      
      // Navigate to the invoice details page
      navigate(`/invoice/${responseData.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showError(`Failed to create invoice: ${error.message}`);
    }
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 md:p-4 overflow-hidden order-2 lg:order-1">
          {/* Header with back button */}
          <div className="mb-2 sm:mb-4 flex items-center gap-3">
            <button
              onClick={() => navigate('/invoices')}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
              title="Back to Invoices"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Create New Invoice</h2>
              <p className="text-xs sm:text-sm text-gray-600">Add items and customer details</p>
            </div>
          </div>

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
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : productsError ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-6 max-w-md mx-2">
                  <p className="text-red-600 font-semibold mb-2">Error loading products</p>
                  <p className="text-sm text-red-500">{productsError}</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center">
                  <p className="text-gray-400 text-base sm:text-lg">No products found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search or category filter</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg active:shadow-md transition text-left touch-manipulation min-h-[100px] sm:min-h-[120px]"
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base line-clamp-2 leading-tight">{product.name}</h3>
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

        {/* Cart & Customer Info Section */}
        <div className="w-full lg:w-96 xl:w-[28rem] bg-white shadow-xl flex flex-col order-1 lg:order-2 lg:border-l border-gray-200 max-h-[50vh] lg:max-h-none">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Invoice Details</h2>
            <p className="text-xs sm:text-sm text-gray-600">Customer and items information</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {/* Customer Information */}
            <div className="mb-4 pb-4 border-b">
              <h3 className="font-semibold text-gray-800 mb-3 text-base">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Address</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Customer address"
                    rows="3"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Items</h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Clear cart"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{item.name}</h3>
                          <p className="text-xs text-gray-500">{CURRENCY_SYMBOL} {item.price.toFixed(2)} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-semibold text-xs sm:text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="font-bold text-blue-600 text-xs sm:text-sm">
                          {CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                onClick={createInvoice}
                disabled={!customerName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation"
              >
                <FileText size={20} />
                Create Invoice
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default CreateInvoice;

