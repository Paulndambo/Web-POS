import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { Package, Search, RefreshCw, AlertCircle, Plus, Edit, TrendingUp, TrendingDown, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showError, showInfo } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showRemoveStockModal, setShowRemoveStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    barcode: '',
    category: '',
    stock: '',
    description: ''
  });

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      // Categories endpoint doesn't require authentication
      const response = await apiGet('/inventory/categories', false);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Categories fetched:', data);
      setCategories(data.results || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set empty array on error so dropdown still works
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allProducts = [];
      let endpoint = '/inventory';
      
      // Fetch all pages of products from backend
      while (endpoint) {
        // Inventory endpoint doesn't require authentication
        const response = await apiGet(endpoint, false);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform API response
        const transformedProducts = data.results.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          barcode: product.barcode,
          category: product.category_name || 'Uncategorized',
          categoryId: product.category,
          stock: product.quantity || 0,
          description: product.description || ''
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
      console.log('Fetched all products:', allProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const filterCategories = ['All', ...new Set(products.map(p => p.category))];

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Client-side pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        category: parseInt(newProduct.category),
        name: newProduct.name,
        barcode: newProduct.barcode,
        quantity: parseInt(newProduct.stock),
        price: parseFloat(newProduct.price)
      };

      // Inventory endpoint doesn't require authentication
      const response = await apiPost('/inventory/', productData, false);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccess(`Product "${newProduct.name}" has been added to inventory`);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        price: '',
        barcode: '',
        category: '',
        stock: '',
        description: ''
      });
      
      // Refresh the products list
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      showError(`Failed to add product: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      barcode: product.barcode || '',
      category: product.categoryId ? product.categoryId.toString() : '',
      stock: product.stock.toString(),
      description: product.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    try {
      const productData = {
        category: parseInt(newProduct.category),
        name: newProduct.name,
        barcode: newProduct.barcode,
        quantity: parseInt(newProduct.stock),
        price: parseFloat(newProduct.price)
      };

      // Inventory endpoint doesn't require authentication
      const response = await apiPut(`/inventory/${selectedProduct.id}/details/`, productData, false);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccess(`Product "${selectedProduct.name}" has been updated`);
      setShowEditModal(false);
      setSelectedProduct(null);
      
      // Refresh the products list
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showError(`Failed to update product: ${error.message}`);
    }
  };

  const handleRestock = (product) => {
    setSelectedProduct(product);
    setStockAmount('');
    setShowRestockModal(true);
  };

  const handleConfirmRestock = () => {
    // Dummy action - just show info
    showInfo(`${stockAmount} units would be added to "${selectedProduct.name}". New stock: ${parseInt(selectedProduct.stock) + parseInt(stockAmount)}`);
    setShowRestockModal(false);
    setSelectedProduct(null);
    setStockAmount('');
  };

  const handleRemoveStock = (product) => {
    setSelectedProduct(product);
    setStockAmount('');
    setShowRemoveStockModal(true);
  };

  const handleConfirmRemoveStock = () => {
    // Dummy action - just show info
    const newStock = Math.max(0, parseInt(selectedProduct.stock) - parseInt(stockAmount));
    showInfo(`${stockAmount} units would be removed from "${selectedProduct.name}". New stock: ${newStock}`);
    setShowRemoveStockModal(false);
    setSelectedProduct(null);
    setStockAmount('');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory Management</h1>
            <p className="text-gray-600">View and manage your product inventory</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Stock Item
            </button>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                {filterCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Error loading inventory: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        )}

        {/* Products Table */}
        {!loading && !error && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {searchTerm || selectedCategory !== 'All' 
                ? `Showing ${paginatedProducts.length} of ${filteredProducts.length} filtered products (${products.length} total)`
                : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length} products`
              }
            </div>
            {paginatedProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Package size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
                <p className="text-gray-500">
                  {products.length === 0
                    ? 'No products in inventory. Add products through your backend API.'
                    : 'No products match your search criteria.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                                  <Package className="text-blue-600" size={20} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-800">{product.name}</div>
                                  {product.barcode && (
                                    <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-800">{product.category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-blue-600">
                                {CURRENCY_SYMBOL} {product.price.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-800">{product.stock}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Product"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleRestock(product)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                  title="Restock"
                                >
                                  <TrendingUp size={18} />
                                </button>
                                <button
                                  onClick={() => handleRemoveStock(product)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                  title="Remove Stock"
                                >
                                  <TrendingDown size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition"
                      >
                        <ChevronLeft size={18} />
                        Previous
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition"
                      >
                        Next
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* Add Stock Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Add New Stock Item</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">No categories available. Please add categories first.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={18} />
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Product</h2>
                <button
                  onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProduct(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">No categories available. Please add categories first.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={18} />
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Restock Modal */}
        {showRestockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Restock Product</h2>
                <button
                  onClick={() => { setShowRestockModal(false); setSelectedProduct(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="font-semibold text-gray-800 mb-1">{selectedProduct.name}</div>
                  <div className="text-sm text-gray-600">Current Stock: <span className="font-bold">{selectedProduct.stock}</span></div>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Enter quantity"
                  autoFocus
                />
                {stockAmount && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">
                    New Stock: {parseInt(selectedProduct.stock) + parseInt(stockAmount)}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRestockModal(false); setSelectedProduct(null); }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRestock}
                  disabled={!stockAmount || parseInt(stockAmount) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <TrendingUp size={18} />
                  Confirm Restock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Stock Modal */}
        {showRemoveStockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Remove Stock</h2>
                <button
                  onClick={() => { setShowRemoveStockModal(false); setSelectedProduct(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <div className="font-semibold text-gray-800 mb-1">{selectedProduct.name}</div>
                  <div className="text-sm text-gray-600">Current Stock: <span className="font-bold">{selectedProduct.stock}</span></div>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity to Remove *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="Enter quantity"
                  autoFocus
                />
                {stockAmount && (
                  <div className="mt-2 text-sm text-orange-600 font-semibold">
                    New Stock: {Math.max(0, parseInt(selectedProduct.stock) - parseInt(stockAmount))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRemoveStockModal(false); setSelectedProduct(null); }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemoveStock}
                  disabled={!stockAmount || parseInt(stockAmount) <= 0 || parseInt(stockAmount) > selectedProduct.stock}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <TrendingDown size={18} />
                  Confirm Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;

