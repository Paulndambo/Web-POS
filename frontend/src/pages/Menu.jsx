import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { UtensilsCrossed, Search, RefreshCw, AlertCircle, Edit, Trash2, X, Save, Plus } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showError, showSuccess, showWarning } from '../utils/toast.js';
import { apiGet, apiPut, apiDelete, apiPost } from '../utils/api.js';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    quantity: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    quantity: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allProducts = [];
      let endpoint = '/inventory/menus/';
      
      // Fetch all pages of products from backend
      while (endpoint) {
        const response = await apiGet(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform API response
        const transformedProducts = data.results.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          stock: product.quantity || 0,
          created_at: product.created_at,
          updated_at: product.updated_at
        }));
        
        allProducts = [...allProducts, ...transformedProducts];
        
        // Check if there's a next page
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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreate = () => {
    setNewProduct({
      name: '',
      price: '',
      quantity: ''
    });
    setShowCreateModal(true);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.name.trim()) {
      showWarning('Please enter a product name');
      return;
    }

    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      showWarning('Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name: newProduct.name.trim(),
        quantity: parseInt(newProduct.quantity) || 0,
        price: parseFloat(newProduct.price)
      };

      const response = await apiPost('/inventory/menus/', productData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccess(`Menu item "${newProduct.name}" has been added`);
      setShowCreateModal(false);
      setNewProduct({
        name: '',
        price: '',
        quantity: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding menu item:', error);
      showError(`Failed to add menu item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      price: product.price.toString(),
      quantity: product.stock.toString()
    });
    setShowEditModal(true);
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!editFormData.name || !editFormData.name.trim()) {
      showWarning('Please enter a product name');
      return;
    }

    if (!editFormData.price || parseFloat(editFormData.price) <= 0) {
      showWarning('Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name: editFormData.name.trim(),
        quantity: parseInt(editFormData.quantity) || 0,
        price: parseFloat(editFormData.price)
      };

      const response = await apiPut(`/inventory/menus/${selectedProduct.id}/details/`, productData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccess(`Menu item "${editFormData.name}" has been updated`);
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating menu item:', error);
      showError(`Failed to update menu item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    setSaving(true);

    try {
      const response = await apiDelete(`/inventory/menus/${selectedProduct.id}/details/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccess(`Menu item "${selectedProduct.name}" has been deleted`);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showError(`Failed to delete menu item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div>
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Restaurant Menu</h2>
            <p className="text-gray-600">Browse and manage menu items</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              Create New Menu Item
            </button>
            <button
              onClick={fetchProducts}
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
            <span>Error loading menu: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-gray-600">Loading menu...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Menu Items Table */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <UtensilsCrossed size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Menu Items Found</h3>
                <p className="text-gray-500">
                  {products.length === 0 
                    ? "No products available. Add products through the Inventory section."
                    : "No menu items match your search criteria."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Stock Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => {
                        const stockStatus = product.stock === 0 
                          ? { label: 'Out of Stock', color: 'bg-red-100 text-red-700' }
                          : product.stock < 10 
                          ? { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' }
                          : { label: 'In Stock', color: 'bg-green-100 text-green-700' };
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-800">{product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="font-semibold text-blue-600">{CURRENCY_SYMBOL} {product.price.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                                {stockStatus.label}
                                {product.stock !== undefined && product.stock > 0 && (
                                  <span className="ml-2">({product.stock})</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                                  title="Edit Menu Item"
                                >
                                  <Edit size={14} />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                                  title="Delete Menu Item"
                                >
                                  <Trash2 size={14} />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create New Menu Item</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProduct({
                      name: '',
                      price: '',
                      quantity: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter menu item name"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Quantity</label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProduct({
                      name: '',
                      price: '',
                      quantity: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Product</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Quantity</label>
                  <input
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600">Delete Product</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="mb-6 text-gray-700">
                Are you sure you want to delete <strong>"{selectedProduct.name}"</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Menu;
