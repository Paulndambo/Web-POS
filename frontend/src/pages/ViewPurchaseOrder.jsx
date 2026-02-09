import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Building2, 
  Calendar, 
  DollarSign, 
  Package,
  RefreshCw,
  AlertCircle,
  Printer,
  Plus,
  X,
  Save,
  Search,
  ChevronDown,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle,
  XCircle,
  Send
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showError, showSuccess, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPatch } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const ViewPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [localOrderItems, setLocalOrderItems] = useState([]);
  const [addingItem, setAddingItem] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('Increase');
  const [actionQuantity, setActionQuantity] = useState(1);
  const [processingAction, setProcessingAction] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [formData, setFormData] = useState({
    supply_request: '',
    quantity: 1
  });
  const [supplyRequestSearch, setSupplyRequestSearch] = useState('');
  const [showSupplyRequestDropdown, setShowSupplyRequestDropdown] = useState(false);

  const fetchPurchaseOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/supply-chain/purchaseorders/${id}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPurchaseOrder(data);
      
      // Supplier information is included in the response
      if (data.supplier_name) {
        setSupplier({
          name: data.supplier_name,
          id: data.supplier
        });
      }
    } catch (error) {
      console.error('Error fetching purchase order details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplyRequests = async () => {
    try {
      const response = await apiGet('/supply-chain/supplyrequests/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSupplyRequests(data.results || data || []);
    } catch (error) {
      console.error('Error fetching supply requests:', error);
    }
  };

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
          barcode: product.barcode
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

  useEffect(() => {
    if (id) {
      fetchPurchaseOrderDetails();
      fetchSupplyRequests();
      fetchProducts();
    }
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSupplyRequestDropdown && !event.target.closest('.supply-request-dropdown-container')) {
        setShowSupplyRequestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSupplyRequestDropdown]);

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (statusLower === 'approved') return 'bg-green-100 text-green-700';
    if (statusLower === 'completed') return 'bg-blue-100 text-blue-700';
    if (statusLower === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const generatePurchaseOrderHTML = (po) => {
    if (!po || !po.orderitems) {
      return '';
    }

    const orderItems = po.orderitems || [];
    const totalAmount = parseFloat(po.total_amount || 0);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order #${po.id}</title>
          <style>
            @media print {
              @page { margin: 0; size: A4; }
              body { margin: 0; padding: 20px; }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header-left h2 {
              margin: 0;
              font-size: 24px;
            }
            .header-right {
              text-align: right;
            }
            .po-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .supplier-info, .po-details {
              flex: 1;
            }
            .supplier-info h3, .po-details h3 {
              margin-top: 0;
              font-size: 14px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background-color: #f3f4f6;
              padding: 10px;
              text-align: left;
              border: 1px solid #ddd;
            }
            .items-table td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .items-table .text-right {
              text-align: right;
            }
            .totals {
              text-align: right;
              margin-top: 20px;
            }
            .totals-row {
              display: flex;
              justify-content: flex-end;
              margin: 5px 0;
            }
            .totals-row span {
              width: 150px;
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              font-size: 16px;
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px dashed #000;
              text-align: center;
              font-size: 10px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 11px;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-approved {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-completed {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .status-cancelled {
              background-color: #fee2e2;
              color: #991b1b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h2>${user?.business_name || po.bussiness_name || po.business_name || 'Smart Retail Store'}</h2>
              ${po.branch_name ? `<p>${po.branch_name}</p>` : ''}
              <p>Tel: +254 712 345 678</p>
              <p>Email: info@smartretail.com</p>
            </div>
            <div class="header-right">
              <h2 style="margin: 0; font-size: 28px;">PURCHASE ORDER</h2>
              <p style="font-size: 18px; font-weight: bold;">PO #${po.id || 'N/A'}</p>
            </div>
          </div>
          
          <div class="po-info">
            <div class="supplier-info">
              <h3>Supplier:</h3>
              <p><strong>${po.supplier_name || 'N/A'}</strong></p>
              ${po.branch_name ? `<p>Branch: ${po.branch_name}</p>` : ''}
            </div>
            <div class="po-details">
              <h3>Order Details:</h3>
              <p><strong>Order Date:</strong> ${po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Expected Delivery:</strong> ${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${(po.status || '').toLowerCase()}">${po.status || 'N/A'}</span></p>
              <p><strong>Prepared By:</strong> ${user?.name || 'Admin'}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Item Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => `
                <tr>
                  <td>${item.product_name || 'Product'}</td>
                  <td class="text-right">${item.quantity || 0}</td>
                  <td class="text-right">${CURRENCY_SYMBOL} ${parseFloat(item.unit_cost || 0).toFixed(2)}</td>
                  <td class="text-right">${CURRENCY_SYMBOL} ${parseFloat(item.item_total || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row total-row">
              <span>Total Amount:</span>
              <span>${CURRENCY_SYMBOL} ${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p style="margin-top: 20px;">This is a computer-generated purchase order.</p>
            <p>Please confirm delivery and quality upon receipt.</p>
            <p style="margin-top: 10px;">Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!purchaseOrder || !purchaseOrder.orderitems || purchaseOrder.orderitems.length === 0) {
      showError('Purchase order data not loaded. Please wait and try again.');
      return;
    }

    try {
      const poHTML = generatePurchaseOrderHTML(purchaseOrder);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(poHTML);
        printWindow.document.close();
        
        // Wait for content to load before printing
        printWindow.onload = function() {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
            }, 500);
          }, 250);
        };
        
        // Fallback if onload doesn't fire
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.focus();
            printWindow.print();
          }
        }, 1000);
      } else {
        showError('Unable to open print window. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error printing purchase order:', error);
      showError(`Failed to print purchase order: ${error.message}`);
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  const getSupplyRequestDisplay = (request) => {
    const productId = request.product || request.product_id;
    const productName = getProductName(productId);
    return `${productName} - Qty: ${request.quantity}`;
  };

  const filteredSupplyRequests = supplyRequests.filter(request => {
    // Only show pending supply requests
    if (request.status?.toLowerCase() !== 'pending') {
      return false;
    }
    
    const productId = request.product || request.product_id;
    const productName = getProductName(productId);
    const searchLower = supplyRequestSearch.toLowerCase();
    return productName.toLowerCase().includes(searchLower) || 
           request.id.toString().includes(searchLower);
  });

  const handleSelectSupplyRequest = (selectedRequest) => {
    setFormData(prev => ({ 
      ...prev, 
      supply_request: selectedRequest.id,
      quantity: selectedRequest.quantity || 1 // Set quantity to supply request quantity
    }));
    setSupplyRequestSearch(getSupplyRequestDisplay(selectedRequest));
    setShowSupplyRequestDropdown(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!formData.supply_request || !formData.quantity || formData.quantity <= 0) {
      showWarning('Please select a supply request and enter a valid quantity');
      return;
    }

    const selectedRequest = supplyRequests.find(r => r.id === formData.supply_request);
    if (!selectedRequest) {
      showWarning('Selected supply request not found');
      return;
    }

    setAddingItem(true);
    try {
      const requestData = {
        purchase_order: parseInt(id),
        supply_request: parseInt(formData.supply_request),
        quantity: parseInt(formData.quantity)
      };

      const response = await apiPost('/supply-chain/purchaseorderitems/create/', requestData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Item added to purchase order successfully!');
      
      // Reset form
      setFormData({
        supply_request: '',
        quantity: 1
      });
      setSupplyRequestSearch('');
      setShowAddItemModal(false);
      
      // Refresh purchase order details to show the new item
      await fetchPurchaseOrderDetails();
      
      // Refresh supply requests to avoid showing outdated data
      await fetchSupplyRequests();
    } catch (error) {
      console.error('Error adding item to purchase order:', error);
      showError(`Failed to add item: ${error.message}`);
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveLocalItem = (itemId) => {
    setLocalOrderItems(prev => prev.filter(item => item.id !== itemId));
    showSuccess('Item removed');
  };

  const handleOpenActionModal = (item, action) => {
    setSelectedItem(item);
    setActionType(action);
    setActionQuantity(1);
    setShowActionModal(true);
  };

  const handleOpenDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setSelectedItem(null);
    setActionQuantity(1);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!id) {
      showError('Purchase order ID is missing');
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await apiPatch(`/supply-chain/purchaseorders/${id}/`, {
        status: newStatus
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const statusMessages = {
        'Approved': 'Purchase order approved successfully!',
        'Completed': 'Purchase order completed successfully!',
        'Cancelled': 'Purchase order cancelled successfully!'
      };

      showSuccess(statusMessages[newStatus] || 'Purchase order status updated successfully!');
      
      // Refresh purchase order details to show the updated status
      await fetchPurchaseOrderDetails();
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      showError(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedItem || !actionQuantity || actionQuantity <= 0) {
      showWarning('Please enter a valid quantity');
      return;
    }

    setProcessingAction(true);
    try {
      const requestData = {
        purchase_order_item: selectedItem.id,
        action_type: actionType,
        quantity: parseInt(actionQuantity)
      };

      const response = await apiPost('/supply-chain/purchaseorderitems/update/', requestData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess(`Item ${actionType.toLowerCase()}d successfully!`);
      handleCloseActionModal();
      
      // Refresh purchase order details
      await fetchPurchaseOrderDetails();
    } catch (error) {
      console.error(`Error ${actionType.toLowerCase()}ing item:`, error);
      showError(`Failed to ${actionType.toLowerCase()} item: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    setProcessingAction(true);
    try {
      const requestData = {
        purchase_order_item: selectedItem.id,
        action_type: 'Remove',
        quantity: 0
      };

      const response = await apiPost('/supply-chain/purchaseorderitems/update/', requestData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Item removed successfully!');
      handleCloseDeleteModal();
      
      // Refresh purchase order details
      await fetchPurchaseOrderDetails();
    } catch (error) {
      console.error('Error removing item:', error);
      showError(`Failed to remove item: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setFormData({
      supply_request: '',
      quantity: 1
    });
    setSupplyRequestSearch('');
    setShowSupplyRequestDropdown(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading purchase order details...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Error loading purchase order: {error}</span>
        </div>
      </Layout>
    );
  }

  if (!purchaseOrder) {
    return (
      <Layout>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Purchase Order Not Found</h3>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 mt-4"
          >
            <ArrowLeft size={20} />
            Back to Purchase Orders
          </button>
        </div>
      </Layout>
    );
  }

  const orderItems = purchaseOrder?.orderitems || purchaseOrder?.order_items || [];
  const allOrderItems = [...orderItems, ...localOrderItems];
  
  // Calculate totals including local items
  const totalQuantity = allOrderItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  // For local items, add their item_total; for existing items, they're already included in total_amount
  const localItemsTotal = localOrderItems.reduce((sum, item) => sum + (parseFloat(item.item_total) || 0), 0);
  const totalAmount = parseFloat(purchaseOrder?.total_amount || 0) + localItemsTotal;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/purchase-orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Purchase Order #{purchaseOrder.id}
              </h1>
              <p className="text-gray-600">View purchase order details and items</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {purchaseOrder.status === 'Pending' && purchaseOrder.has_items === true && (
              <button
                onClick={() => handleUpdateStatus('Approved')}
                disabled={updatingStatus}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <CheckCircle size={20} />
                {updatingStatus ? 'Approving...' : 'Approve Purchase Order'}
              </button>
            )}
            {purchaseOrder.status === 'Approved' && (
              <button
                onClick={() => {}}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <Send size={20} />
                Send Order
              </button>
            )}
            {(purchaseOrder.status === 'Pending' || purchaseOrder.status === 'Approved') && (
              <button
                onClick={() => handleUpdateStatus('Cancelled')}
                disabled={updatingStatus}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <XCircle size={20} />
                {updatingStatus ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Printer size={20} />
              Print
            </button>
          </div>
        </div>

        {/* Purchase Order Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="text-lg font-semibold text-gray-800">PO #{purchaseOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusBadge(purchaseOrder.status)}`}>
                    {purchaseOrder.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Order Date
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {purchaseOrder.order_date ? new Date(purchaseOrder.order_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Expected Delivery
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {purchaseOrder.expected_delivery_date ? new Date(purchaseOrder.expected_delivery_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {purchaseOrder.supplier_name && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <Building2 size={14} />
                    Supplier Information
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800 mb-1">{purchaseOrder.supplier_name}</p>
                    {purchaseOrder.branch_name && (
                      <p className="text-sm text-gray-600">Branch: {purchaseOrder.branch_name}</p>
                    )}
                    {(purchaseOrder.bussiness_name || purchaseOrder.business_name) && (
                      <p className="text-sm text-gray-600">Business: {purchaseOrder.bussiness_name || purchaseOrder.business_name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Items</span>
                <span className="font-semibold text-gray-800">{allOrderItems.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Quantity</span>
                <span className="font-semibold text-gray-800">{totalQuantity}</span>
              </div>
              {localOrderItems.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-600">New Items (not saved)</span>
                  <span className="font-semibold text-yellow-600">{localOrderItems.length}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                    
                    {CURRENCY_SYMBOL} {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package size={24} />
              Order Items
            </h2>
            <button
              onClick={() => setShowAddItemModal(true)}
              disabled={purchaseOrder?.status !== 'Pending'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>
          {allOrderItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Item Total
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allOrderItems.map((item, index) => {
                    const isLocalItem = item.id && item.id.toString().startsWith('local-');
                    // Use product_name from API response, or fallback to local item's product_name
                    const productName = item.product_name || item.product?.name || `Product #${item.product || item.product_id || index + 1}`;
                    return (
                      <tr key={item.id || index} className={`hover:bg-gray-50 transition ${isLocalItem ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                              <Package className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 flex items-center gap-2">
                                {productName}
                                {isLocalItem && (
                                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">New</span>
                                )}
                              </div>
                              {item.product && !isLocalItem && (
                                <div className="text-xs text-gray-500">Product ID: {item.product}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-800">{item.quantity || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-800">
                            {CURRENCY_SYMBOL} {parseFloat(item.unit_cost || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-800">
                            {CURRENCY_SYMBOL} {parseFloat(item.item_total || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!isLocalItem ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenActionModal(item, 'Increase')}
                                disabled={purchaseOrder?.status !== 'Pending'}
                                className="p-2 text-green-600 hover:bg-green-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition"
                                title={purchaseOrder?.status !== 'Pending' ? 'Actions are only available for Pending orders' : 'Increase Quantity'}
                              >
                                <TrendingUp size={18} />
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(item, 'Decrease')}
                                disabled={purchaseOrder?.status !== 'Pending'}
                                className="p-2 text-orange-600 hover:bg-orange-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition"
                                title={purchaseOrder?.status !== 'Pending' ? 'Actions are only available for Pending orders' : 'Decrease Quantity'}
                              >
                                <TrendingDown size={18} />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(item)}
                                disabled={purchaseOrder?.status !== 'Pending'}
                                className="p-2 text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition"
                                title={purchaseOrder?.status !== 'Pending' ? 'Actions are only available for Pending orders' : 'Remove Item'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleRemoveLocalItem(item.id)}
                                disabled={purchaseOrder?.status !== 'Pending'}
                                className="p-2 text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg transition"
                                title={purchaseOrder?.status !== 'Pending' ? 'Actions are only available for Pending orders' : 'Remove Item'}
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    
                    <td colSpan="3" className="px-6 py-4 text-right font-semibold text-gray-800">
                      Total Amount:
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        {CURRENCY_SYMBOL} {totalAmount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Items Found</h3>
              <p className="text-gray-500">This purchase order has no items yet.</p>
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList size={24} />
                  Add Item from Supply Request
                </h2>
                <button
                  onClick={handleCloseAddItemModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="relative supply-request-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supply Request *
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Search size={18} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        value={supplyRequestSearch}
                        onChange={(e) => {
                          setSupplyRequestSearch(e.target.value);
                          setShowSupplyRequestDropdown(true);
                        }}
                        onFocus={() => setShowSupplyRequestDropdown(true)}
                        placeholder="Search for a supply request..."
                        className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 text-gray-400 cursor-pointer"
                        onClick={() => setShowSupplyRequestDropdown(!showSupplyRequestDropdown)}
                      />
                    </div>
                    {showSupplyRequestDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredSupplyRequests.length > 0 ? (
                          filteredSupplyRequests.map((requestItem) => {
                            const productId = requestItem.product || requestItem.product_id;
                            const productName = getProductName(productId);
                            return (
                              <div
                                key={requestItem.id}
                                onClick={() => handleSelectSupplyRequest(requestItem)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-800">
                                  {productName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Requested Qty: {requestItem.quantity} • Status: {requestItem.status}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No supply requests found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.supply_request && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {supplyRequestSearch}
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Quantity from supply request (can be modified)
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseAddItemModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {addingItem ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Add Item
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Action Modal (Increase/Decrease) */}
        {showActionModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {actionType} Quantity
                </h2>
                <button
                  onClick={handleCloseActionModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="font-semibold text-gray-800 mb-1">{selectedItem.product_name}</div>
                  <div className="text-sm text-gray-600">Current Quantity: <span className="font-bold">{selectedItem.quantity}</span></div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity to {actionType} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actionQuantity}
                    onChange={(e) => setActionQuantity(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter quantity"
                    autoFocus
                  />
                  {actionQuantity && (
                    <div className="mt-2 text-sm text-blue-600 font-semibold">
                      New Quantity: {
                        actionType === 'Increase' 
                          ? parseInt(selectedItem.quantity) + parseInt(actionQuantity)
                          : Math.max(0, parseInt(selectedItem.quantity) - parseInt(actionQuantity))
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseActionModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={!actionQuantity || parseInt(actionQuantity) <= 0 || processingAction}
                  className={`flex-1 ${
                    actionType === 'Increase' 
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                      : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300'
                  } text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition`}
                >
                  {processingAction ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionType === 'Increase' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      {actionType}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600">Remove Item</h2>
                <button
                  onClick={handleCloseDeleteModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <div className="font-semibold text-gray-800 mb-1">{selectedItem.product_name}</div>
                  <div className="text-sm text-gray-600">Current Quantity: <span className="font-bold">{selectedItem.quantity}</span></div>
                </div>
                <p className="text-gray-700">
                  Are you sure you want to remove <strong>"{selectedItem.product_name}"</strong> from this purchase order? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={processingAction}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  {processingAction ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Remove
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

export default ViewPurchaseOrder;
