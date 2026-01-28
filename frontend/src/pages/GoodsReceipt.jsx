import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { 
  Package, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Save,
  X,
  Building2,
  ShoppingBag,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const GoodsReceipt = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPurchaseOrder, setFilterPurchaseOrder] = useState('All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [receivedQuantity, setReceivedQuantity] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const itemsPerPage = 10;

  // Get unique purchase orders for filter
  const uniquePurchaseOrders = [...new Set(orderItems.map(item => item.purchase_order))].sort((a, b) => a - b);

  const fetchOrderItems = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build endpoint with pagination
      const endpoint = `/supply-chain/purchaseorderitems/?limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}`;
      const response = await apiGet(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const itemsArray = data.results || [];
      
      setOrderItems(itemsArray);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (error) {
      console.error('Error fetching order items:', error);
      setError(error.message);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrderItems(currentPage);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentPage === 1) {
      fetchOrderItems(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterPurchaseOrder]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterPurchaseOrder]);

  const handleOpenReceiptModal = (item) => {
    setEditingItem(item);
    setReceivedQuantity(item.received_quantity || 0);
    setShowReceiptModal(true);
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setEditingItem(null);
    setReceivedQuantity(0);
  };

  const handleSaveReceipt = async () => {
    if (!editingItem) return;

    const quantityToReceive = parseInt(receivedQuantity);
    const orderedQuantity = parseInt(editingItem.quantity);

    if (quantityToReceive < 0) {
      showWarning('Received quantity cannot be negative');
      return;
    }

    if (quantityToReceive > orderedQuantity) {
      showWarning(`Received quantity cannot exceed ordered quantity (${orderedQuantity})`);
      return;
    }

    setSaving(true);
    try {
      const response = await apiPost('/supply-chain/purchaseorderitems/receive/', {
        purchase_order_item: editingItem.id,
        received_quantity: quantityToReceive
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Goods received successfully!');
      handleCloseReceiptModal();
      fetchOrderItems(currentPage);
    } catch (error) {
      console.error('Error receiving goods:', error);
      showError(`Failed to receive goods: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (item) => {
    const received = parseInt(item.received_quantity || 0);
    const ordered = parseInt(item.quantity || 0);
    
    if (received === 0) {
      return { class: 'bg-yellow-100 text-yellow-700', label: 'Pending', icon: <Clock size={14} /> };
    } else if (received < ordered) {
      return { class: 'bg-blue-100 text-blue-700', label: 'Partial', icon: <Clock size={14} /> };
    } else if (received >= ordered) {
      return { class: 'bg-green-100 text-green-700', label: 'Received', icon: <CheckCircle size={14} /> };
    }
    return { class: 'bg-gray-100 text-gray-700', label: item.status || 'Unknown', icon: <Clock size={14} /> };
  };

  // Filter order items based on search and filters
  const filteredItems = orderItems.filter(item => {
    const matchesSearch = 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.purchase_order?.toString().includes(searchTerm);

    const received = parseInt(item.received_quantity || 0);
    const ordered = parseInt(item.quantity || 0);
    let statusMatch = true;
    
    if (filterStatus === 'Pending') {
      statusMatch = received === 0;
    } else if (filterStatus === 'Partial') {
      statusMatch = received > 0 && received < ordered;
    } else if (filterStatus === 'Received') {
      statusMatch = received >= ordered;
    }

    const matchesPurchaseOrder = filterPurchaseOrder === 'All' || item.purchase_order?.toString() === filterPurchaseOrder;

    return matchesSearch && statusMatch && matchesPurchaseOrder;
  });

  const pendingItems = filteredItems.filter(item => parseInt(item.received_quantity || 0) === 0).length;
  const partialItems = filteredItems.filter(item => {
    const received = parseInt(item.received_quantity || 0);
    const ordered = parseInt(item.quantity || 0);
    return received > 0 && received < ordered;
  }).length;
  const receivedItems = filteredItems.filter(item => {
    const received = parseInt(item.received_quantity || 0);
    const ordered = parseInt(item.quantity || 0);
    return received >= ordered;
  }).length;
  const totalValue = filteredItems.reduce((sum, item) => sum + parseFloat(item.item_total || 0), 0);

  const handlePreviousPage = () => {
    if (hasPrevious && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (hasNext && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setFilterStatus('All');
    setFilterPurchaseOrder('All');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [filterStatus, filterPurchaseOrder].filter(f => f !== 'All').length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Goods Receipt</h1>
            <p className="text-gray-600">Record and track received goods from purchase orders</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderItems(currentPage)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Receipt</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingItems}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Partial Receipt</p>
                <p className="text-3xl font-bold text-blue-600">{partialItems}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fully Received</p>
                <p className="text-3xl font-bold text-green-600">{receivedItems}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">{CURRENCY_SYMBOL} {totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by product name, supplier, or purchase order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                showFilterPanel 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter size={20} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Received">Fully Received</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Order</label>
                  <select
                    value={filterPurchaseOrder}
                    onChange={(e) => setFilterPurchaseOrder(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Purchase Orders</option>
                    {uniquePurchaseOrders.map(poId => (
                      <option key={poId} value={poId.toString()}>PO #{poId}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
            <div>
              <p className="text-red-800 font-semibold">Error loading goods receipt</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Order Items Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading goods receipt items...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Purchase Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ordered Qty
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Received Qty
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Item Total
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                          {searchTerm || activeFiltersCount > 0 
                            ? 'No items found matching your search or filters.' 
                            : 'No purchase order items found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const statusInfo = getStatusBadge(item);
                        const received = parseInt(item.received_quantity || 0);
                        const ordered = parseInt(item.quantity || 0);
                        const remaining = ordered - received;
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                                  <Package className="text-blue-600" size={20} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-800">{item.product_name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-800">{item.supplier_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ShoppingBag size={14} className="text-gray-400" />
                                <span className="text-sm font-semibold text-gray-800">PO #{item.purchase_order}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-800">{ordered}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-800">{received}</div>
                              {remaining > 0 && (
                                <div className="text-xs text-gray-500">Remaining: {remaining}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-800">{CURRENCY_SYMBOL} {parseFloat(item.unit_cost || 0).toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-800">{CURRENCY_SYMBOL} {parseFloat(item.item_total || 0).toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleOpenReceiptModal(item)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Receive Goods"
                              >
                                <PackageCheck size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} items
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={!hasPrevious || currentPage === 1}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                      <ChevronLeft size={18} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-3 py-2 rounded-lg font-semibold transition ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={handleNextPage}
                      disabled={!hasNext || currentPage === totalPages}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Record Receipt Modal */}
        {showReceiptModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Receive Goods</h2>
                <button
                  onClick={handleCloseReceiptModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Product</div>
                  <div className="font-semibold text-gray-800">{editingItem.product_name}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Supplier</div>
                  <div className="font-semibold text-gray-800">{editingItem.supplier_name}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Purchase Order</div>
                  <div className="font-semibold text-gray-800">PO #{editingItem.purchase_order}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Ordered Quantity</div>
                    <div className="text-2xl font-bold text-blue-800">{editingItem.quantity}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">Previously Received</div>
                    <div className="text-2xl font-bold text-green-800">{editingItem.received_quantity || 0}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Received Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editingItem.quantity}
                    value={receivedQuantity}
                    onChange={(e) => setReceivedQuantity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum: {editingItem.quantity} units
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseReceiptModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReceipt}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Receiving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Receive Goods
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GoodsReceipt;
