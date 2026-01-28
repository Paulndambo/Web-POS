import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { ShoppingBag, Plus, Edit, X, Save, Building2, RefreshCw, AlertCircle, Calendar, DollarSign, Search, ChevronDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';

const PurchaseOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    supplier: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'Pending',
    business: '',
    branch: ''
  });
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const response = await apiGet('/supply-chain/suppliers/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuppliers(data.results || data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/supply-chain/purchaseorders/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPurchaseOrders(data.results || data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, []);

  // Set business and branch ID from logged-in user when modal opens
  useEffect(() => {
    if (showModal && user && !editingOrder) {
      const businessId = user.business_id || user.business;
      const branchId = user.branch_id || user.branch;
      if (businessId) {
        setFormData(prev => ({ ...prev, business: businessId, branch: branchId || '' }));
      }
    }
  }, [showModal, user, editingOrder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSupplierDropdown && !event.target.closest('.supplier-dropdown-container')) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSupplierDropdown]);

  const handleOpenModal = (order = null) => {
    if (order) {
      // Only allow editing orders that are Pending
      if (order.status?.toLowerCase() !== 'pending') {
        showWarning('Only purchase orders with Pending status can be edited.');
        return;
      }
      setEditingOrder(order);
      setFormData({
        supplier: order.supplier || order.supplier_id || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        expected_delivery_date: order.expected_delivery_date || '',
        status: order.status || 'Pending',
        business: order.business || order.business_id || user?.business_id || user?.business || '',
        branch: order.branch || order.branch_id || user?.branch_id || user?.branch || ''
      });
      const supplier = suppliers.find(s => s.id === (order.supplier || order.supplier_id));
      setSupplierSearch(supplier ? supplier.name : '');
    } else {
      setEditingOrder(null);
      const businessId = user?.business_id || user?.business;
      const branchId = user?.branch_id || user?.branch;
      setFormData({
        supplier: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'Pending',
        business: businessId || '',
        branch: branchId || ''
      });
      setSupplierSearch('');
    }
    setShowSupplierDropdown(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setSupplierSearch('');
    setShowSupplierDropdown(false);
    const businessId = user?.business_id || user?.business;
    const branchId = user?.branch_id || user?.branch;
    setFormData({
      supplier: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      status: 'Pending',
      business: businessId || '',
      branch: branchId || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplier || !formData.order_date) {
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
        supplier: parseInt(formData.supplier),
        business: parseInt(formData.business),
        branch: formData.branch ? parseInt(formData.branch) : null,
        expected_delivery_date: formData.expected_delivery_date || null
      };

      if (editingOrder) {
        const response = await apiPut(`/supply-chain/purchaseorders/${editingOrder.id}/`, submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess('Purchase order updated successfully!');
      } else {
        const response = await apiPost('/supply-chain/purchaseorders/', submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess('Purchase order created successfully!');
      }

      handleCloseModal();
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      showError(`Failed to save purchase order: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (statusLower === 'approved') return 'bg-green-100 text-green-700';
    if (statusLower === 'declined') return 'bg-red-100 text-red-700';
    if (statusLower === 'completed') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getSupplierName = (order) => {
    const supplierId = order.supplier || order.supplier_id;
    if (!supplierId) return 'N/A';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'N/A';
  };

  const filteredSuppliers = suppliers.filter(supplierItem => {
    const searchLower = supplierSearch.toLowerCase();
    return supplierItem.name.toLowerCase().includes(searchLower) || 
           (supplierItem.email && supplierItem.email.toLowerCase().includes(searchLower)) ||
           (supplierItem.phone_number && supplierItem.phone_number.includes(searchLower));
  });

  const handleSelectSupplier = (selectedSupplier) => {
    setFormData(prev => ({ ...prev, supplier: selectedSupplier.id }));
    setSupplierSearch(selectedSupplier.name);
    setShowSupplierDropdown(false);
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage purchase orders and procurement</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Create Order
            </button>
            <button
              onClick={fetchPurchaseOrders}
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
            <span>Error loading purchase orders: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading purchase orders...</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{purchaseOrders.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ShoppingBag size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {purchaseOrders.filter(o => o.status?.toLowerCase() === 'pending').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <ShoppingBag size={28} className="text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {purchaseOrders.filter(o => o.status?.toLowerCase() === 'approved').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <ShoppingBag size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Declined</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {purchaseOrders.filter(o => o.status?.toLowerCase() === 'declined').length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <ShoppingBag size={28} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {CURRENCY_SYMBOL} {purchaseOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign size={28} className="text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Amount
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
                {purchaseOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">PO #{order.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{getSupplierName(order)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">
                        {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-800">
                        {CURRENCY_SYMBOL} {parseFloat(order.total_amount || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/purchase-order/${order.id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(order)}
                          disabled={order.status?.toLowerCase() !== 'pending'}
                          className="p-2 text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition"
                          title={order.status?.toLowerCase() !== 'pending' ? 'Only Pending orders can be edited' : 'Edit Order'}
                        >
                          <Edit size={18} />
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

        {!loading && !error && purchaseOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Purchase Orders Found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first purchase order</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Order
            </button>
          </div>
        )}

        {/* Add/Edit Purchase Order Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative supplier-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supplier *
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Search size={18} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          setShowSupplierDropdown(true);
                        }}
                        onFocus={() => setShowSupplierDropdown(true)}
                        placeholder="Search for a supplier..."
                        className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 text-gray-400 cursor-pointer"
                        onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                      />
                    </div>
                    {showSupplierDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredSuppliers.length > 0 ? (
                          filteredSuppliers.map((supplierItem) => (
                            <div
                              key={supplierItem.id}
                              onClick={() => handleSelectSupplier(supplierItem)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">
                                {supplierItem.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {supplierItem.email} • {supplierItem.phone_number}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No suppliers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.supplier && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {supplierSearch}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Order Date *
                    </label>
                    <input
                      type="date"
                      value={formData.order_date}
                      onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      min={formData.order_date}
                    />
                  </div>
                </div>

                {editingOrder && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={18} />
                    {editingOrder ? 'Update' : 'Create'}
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

export default PurchaseOrders;
