import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { ClipboardList, Plus, Edit, X, Save, Package, RefreshCw, AlertCircle, User, Search, ChevronDown } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const SupplyRequests = () => {
  const { user } = useAuth();
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    product: '',
    quantity: 1,
    requested_by: '',
    status: 'Pending',
    business: '',
    branch: ''
  });
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const fetchProducts = async () => {
    try {
      let allProducts = [];
      let endpoint = '/inventory';
      
      while (endpoint) {
        const response = await apiGet(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const transformedProducts = data.results.map(product => ({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          stock: product.quantity || 0
        }));
        
        allProducts = [...allProducts, ...transformedProducts];
        
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
    }
  };

  const fetchSupplyRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/supply-chain/supplyrequests/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSupplyRequests(data.results || data || []);
    } catch (error) {
      console.error('Error fetching supply requests:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyRequests();
    fetchProducts();
  }, []);

  // Set business, branch, and requested_by from logged-in user when modal opens
  useEffect(() => {
    if (showModal && user && !editingRequest) {
      const businessId = user.business_id || user.business;
      const branchId = user.branch_id || user.branch;
      const userId = user.id;
      if (businessId) {
        setFormData(prev => ({ 
          ...prev, 
          business: businessId, 
          branch: branchId || '',
          requested_by: userId
        }));
      }
    }
  }, [showModal, user, editingRequest]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProductDropdown && !event.target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown]);

  const handleOpenModal = (request = null) => {
    if (request) {
      // Prevent editing if status is Declined or Added to PO
      if (request.status?.toLowerCase() === 'declined' || request.status?.toLowerCase() === 'added to po') {
        showWarning('Cannot edit supply requests that are declined or added to purchase order');
        return;
      }
      setEditingRequest(request);
      setFormData({
        product: request.product || request.product_id || '',
        quantity: request.quantity || 1,
        requested_by: request.requested_by || request.requested_by_id || user?.id || '',
        status: request.status || 'Pending',
        business: request.business || request.business_id || user?.business_id || user?.business || '',
        branch: request.branch || request.branch_id || user?.branch_id || user?.branch || ''
      });
      const product = products.find(p => p.id === (request.product || request.product_id));
      setProductSearch(product ? product.name : '');
    } else {
      setEditingRequest(null);
      const businessId = user?.business_id || user?.business;
      const branchId = user?.branch_id || user?.branch;
      const userId = user?.id;
      setFormData({
        product: '',
        quantity: 1,
        requested_by: userId || '',
        status: 'Pending',
        business: businessId || '',
        branch: branchId || ''
      });
      setProductSearch('');
    }
    setShowProductDropdown(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRequest(null);
    setProductSearch('');
    setShowProductDropdown(false);
    const businessId = user?.business_id || user?.business;
    const branchId = user?.branch_id || user?.branch;
    const userId = user?.id;
    setFormData({
      product: '',
      quantity: 1,
      requested_by: userId || '',
      status: 'Pending',
      business: businessId || '',
      branch: branchId || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent editing if status is Declined or Added to PO
    if (editingRequest && (editingRequest.status?.toLowerCase() === 'declined' || editingRequest.status?.toLowerCase() === 'added to po')) {
      showWarning('Cannot edit supply requests that are declined or added to purchase order');
      return;
    }
    
    if (!formData.product || !formData.quantity) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (!formData.business) {
      showWarning('Business ID is required. Please ensure you are logged in.');
      return;
    }

    try {
      const submitData = {
        ...formData,
        product: parseInt(formData.product),
        quantity: parseInt(formData.quantity),
        requested_by: formData.requested_by ? parseInt(formData.requested_by) : null,
        business: parseInt(formData.business),
        branch: formData.branch ? parseInt(formData.branch) : null
      };

      if (editingRequest) {
        const response = await apiPut(`/supply-chain/supplyrequests/${editingRequest.id}/`, submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess('Supply request updated successfully!');
      } else {
        const response = await apiPost('/supply-chain/supplyrequests/', submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess('Supply request created successfully!');
      }

      handleCloseModal();
      fetchSupplyRequests();
    } catch (error) {
      console.error('Error saving supply request:', error);
      showError(`Failed to save supply request: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (statusLower === 'declined') return 'bg-red-100 text-red-700';
    if (statusLower === 'added to po') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getProductName = (request) => {
    const productId = request.product || request.product_id;
    if (!productId) return 'N/A';
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'N/A';
  };

  const filteredProducts = products.filter(product => {
    const searchLower = productSearch.toLowerCase();
    return product.name.toLowerCase().includes(searchLower) || 
           (product.barcode && product.barcode.toLowerCase().includes(searchLower));
  });

  const handleSelectProduct = (selectedProduct) => {
    setFormData(prev => ({ ...prev, product: selectedProduct.id }));
    setProductSearch(selectedProduct.name);
    setShowProductDropdown(false);
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Supply Requests</h1>
            <p className="text-gray-600">View and manage supply requests</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Create Request
            </button>
            <button
              onClick={fetchSupplyRequests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Error loading supply requests: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading supply requests...</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-800">{supplyRequests.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ClipboardList size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {supplyRequests.filter(r => r.status?.toLowerCase() === 'pending').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <ClipboardList size={28} className="text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Declined</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {supplyRequests.filter(r => r.status?.toLowerCase() === 'declined').length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <ClipboardList size={28} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Added to PO</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {supplyRequests.filter(r => r.status?.toLowerCase() === 'added to po').length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ClipboardList size={28} className="text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supply Requests Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
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
                {supplyRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Package className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{getProductName(request)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{request.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(request)}
                        disabled={request.status?.toLowerCase() === 'declined' || request.status?.toLowerCase() === 'added to po'}
                        className="p-2 text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition"
                        title={request.status?.toLowerCase() === 'declined' || request.status?.toLowerCase() === 'added to po' 
                          ? 'Cannot edit declined or added to PO requests' 
                          : 'Edit Request'}
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {!loading && !error && supplyRequests.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ClipboardList size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Supply Requests Found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first supply request</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Request
            </button>
          </div>
        )}

        {/* Add/Edit Supply Request Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingRequest ? 'Edit Supply Request' : 'Create Supply Request'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative product-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product *
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Search size={18} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Search for a product..."
                        disabled={editingRequest && (editingRequest.status?.toLowerCase() === 'declined' || editingRequest.status?.toLowerCase() === 'added to po')}
                        className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                      />
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 text-gray-400 cursor-pointer"
                        onClick={() => setShowProductDropdown(!showProductDropdown)}
                      />
                    </div>
                    {showProductDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((productItem) => (
                            <div
                              key={productItem.id}
                              onClick={() => handleSelectProduct(productItem)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">
                                {productItem.name}
                              </div>
                              {productItem.barcode && (
                                <div className="text-sm text-gray-500">
                                  Barcode: {productItem.barcode}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.product && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {productSearch}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    disabled={editingRequest && (editingRequest.status?.toLowerCase() === 'declined' || editingRequest.status?.toLowerCase() === 'added to po')}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {editingRequest && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={editingRequest && (editingRequest.status?.toLowerCase() === 'declined' || editingRequest.status?.toLowerCase() === 'added to po')}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="Declined">Declined</option>
                      <option value="Added to PO">Added to PO</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingRequest && (editingRequest.status?.toLowerCase() === 'declined' || editingRequest.status?.toLowerCase() === 'added to po')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={18} />
                    {editingRequest ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupplyRequests;
