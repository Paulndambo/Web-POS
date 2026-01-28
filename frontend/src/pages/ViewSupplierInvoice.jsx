import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { 
  ArrowLeft, 
  Printer, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  Store,
  ShoppingBag,
  X,
  CreditCard,
  Edit,
  Save
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showError, showSuccess, showWarning } from '../utils/toast.js';
import { apiGet, apiPatch, apiPost } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const ViewSupplierInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState('');
  const [savingDueDate, setSavingDueDate] = useState(false);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/invoices/supplier-invoices/${id}/details/`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching supplier invoice details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchInvoiceDetails();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, id]);

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'paid') return { class: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
    if (statusLower === 'unpaid') return { class: 'bg-yellow-100 text-yellow-700', icon: <Clock size={16} /> };
    if (statusLower === 'overdue') return { class: 'bg-red-100 text-red-700', icon: <AlertCircle size={16} /> };
    if (statusLower === 'partial') return { class: 'bg-blue-100 text-blue-700', icon: <Clock size={16} /> };
    return { class: 'bg-gray-100 text-gray-700', icon: <Clock size={16} /> };
  };

  const generateInvoiceHTML = (inv) => {
    // Ensure we have valid data
    if (!inv || !inv.invoiceitems || inv.invoiceitems.length === 0) {
      return '<html><body><p>No invoice data available</p></body></html>';
    }

    const status = inv.status || 'unpaid';
    const totalAmount = parseFloat(inv.total_amount || 0);
    
    let statusDetails = '';
    if (status.toLowerCase() === 'paid') {
      statusDetails = `
        <div style="background-color: #d1fae5; color: #065f46; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PAID IN FULL
        </div>
      `;
    } else if (status.toLowerCase() === 'partial') {
      statusDetails = `
        <div style="background-color: #dbeafe; color: #1e40af; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PARTIALLY PAID
        </div>
      `;
    } else {
      statusDetails = `
        <div style="background-color: #fef3c7; color: #92400e; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: ${status.toUpperCase()}
        </div>
        <p>Amount Due: ${CURRENCY_SYMBOL} ${totalAmount.toFixed(2)}</p>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Supplier Invoice #${inv.invoice_number}</title>
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
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .supplier-info, .invoice-details {
              flex: 1;
            }
            .supplier-info h3, .invoice-details h3 {
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
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h2>${inv.business_name || user?.business_name || 'Business'}</h2>
              <p>${inv.branch_name || 'Branch'}</p>
            </div>
            <div class="header-right">
              <h2 style="margin: 0; font-size: 28px;">SUPPLIER INVOICE</h2>
              <p style="font-size: 18px; font-weight: bold;">#${inv.invoice_number || 'N/A'}</p>
            </div>
          </div>
          
          <div class="invoice-info">
            <div class="supplier-info">
              <h3>From Supplier:</h3>
              <p><strong>${inv.supplier_name || 'Supplier'}</strong></p>
            </div>
            <div class="invoice-details">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice Date:</strong> ${inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Due Date:</strong> ${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Not Set'}</p>
              ${inv.purchase_order ? `<p><strong>Purchase Order:</strong> PO #${inv.purchase_order}</p>` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${inv.invoiceitems.map(item => `
                <tr>
                  <td>${item.product_name || 'Product'}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${CURRENCY_SYMBOL} ${parseFloat(item.unit_cost || 0).toFixed(2)}</td>
                  <td>${CURRENCY_SYMBOL} ${parseFloat(item.item_total || 0).toFixed(2)}</td>
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
            ${statusDetails}
            <p style="margin-top: 20px;">Thank you for your business!</p>
            <p>Please process payment according to the terms.</p>
          </div>
        </body>
      </html>
    `;
  };

  const printInvoice = () => {
    // Check if invoice data is available
    if (!invoice || !invoice.invoiceitems || invoice.invoiceitems.length === 0) {
      showError('Invoice data not loaded. Please wait and try again.');
      return;
    }

    try {
      const invoiceHTML = generateInvoiceHTML(invoice);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        
        // Wait for content to load before printing
        printWindow.onload = function() {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            // Close window after printing (optional)
            setTimeout(() => {
              if (printWindow && !printWindow.closed) {
                printWindow.close();
              }
            }, 1000);
          }, 250);
        };
        
        // Fallback if onload doesn't fire
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.focus();
            printWindow.print();
          }
        }, 500);
      } else {
        showError('Unable to open print window. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      showError(`Failed to print invoice: ${error.message}`);
    }
  };

  const handlePrint = () => {
    printInvoice();
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!id) {
      showError('Invoice ID is missing');
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await apiPatch(`/invoices/supplier-invoices/${id}/details/`, {
        status: newStatus
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const statusMessages = {
        'Approved': 'Supplier invoice approved successfully!',
        'Completed': 'Supplier invoice completed successfully!',
        'Cancelled': 'Supplier invoice cancelled successfully!'
      };

      showSuccess(statusMessages[newStatus] || 'Invoice status updated successfully!');
      
      // Refresh invoice details to show the updated status
      await fetchInvoiceDetails();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      showError(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenPaymentModal = () => {
    const totalAmount = parseFloat(invoice.total_amount || 0);
    setPaymentAmount(totalAmount.toFixed(2));
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentMethod('cash');
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;

    const amount = parseFloat(paymentAmount);
    const totalAmount = parseFloat(invoice.total_amount || 0);

    if (!amount || amount <= 0) {
      showWarning('Please enter a valid payment amount');
      return;
    }

    if (amount > totalAmount) {
      showWarning('Payment amount cannot exceed invoice total');
      return;
    }

    setRecordingPayment(true);
    try {
      // Record payment for supplier invoice
      const paymentData = {
        supplier_invoice: invoice.id,
        amount: amount,
        payment_method: paymentMethod,
        date: new Date().toISOString().split('T')[0],
        status: amount >= totalAmount ? 'Paid' : 'Partial'
      };

      const response = await apiPost('/invoices/supplier-invoice-payment/', paymentData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Payment recorded successfully!');
      handleClosePaymentModal();
      
      // Refresh invoice details to show updated status
      await fetchInvoiceDetails();
    } catch (error) {
      console.error('Error recording payment:', error);
      showError(`Failed to record payment: ${error.message}`);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleStartEdit = () => {
    if (invoice) {
      setEditingDueDate(invoice.due_date || '');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDueDate('');
  };

  const handleSaveDueDate = async () => {
    if (!id) {
      showError('Invoice ID is missing');
      return;
    }

    setSavingDueDate(true);
    try {
      const response = await apiPatch(`/invoices/supplier-invoices/${id}/details/`, {
        due_date: editingDueDate || null
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Due date updated successfully!');
      setIsEditing(false);
      setEditingDueDate('');
      
      // Refresh invoice details to show the updated due date
      await fetchInvoiceDetails();
    } catch (error) {
      console.error('Error updating due date:', error);
      showError(`Failed to update due date: ${error.message}`);
    } finally {
      setSavingDueDate(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading supplier invoice details...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <p className="text-red-800 font-semibold">Error loading supplier invoice</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Invoice Not Found</h3>
          <p className="text-gray-500 mb-4">The supplier invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/supplier-invoices')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Supplier Invoices
          </button>
        </div>
      </Layout>
    );
  }

  const statusInfo = getStatusBadge(invoice.status);
  const invoiceItems = invoice.invoiceitems || [];
  const totalAmount = parseFloat(invoice.total_amount || 0);

  return (
    <Layout>
      <div className="print-container">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <button
            onClick={() => navigate('/supplier-invoices')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to Supplier Invoices</span>
          </button>
          <div className="flex flex-wrap gap-3">
            {/* Status Action Buttons */}
            {invoice.status?.toLowerCase() === 'unpaid' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('Approved')}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus('Cancelled')}
                  disabled={updatingStatus}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed"
                >
                  <X size={20} />
                  Cancel
                </button>
              </>
            )}
            {invoice.status?.toLowerCase() === 'approved' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('Completed')}
                  disabled={updatingStatus}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  Complete
                </button>
                <button
                  onClick={handleOpenPaymentModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <CreditCard size={20} />
                  Record Payment
                </button>
              </>
            )}
            <button
              onClick={fetchInvoiceDetails}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Printer size={20} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {/* Invoice Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Invoice</h1>
                <p className="text-gray-600">Invoice #{invoice.invoice_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold ${statusInfo.class}`}>
                  {statusInfo.icon}
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Supplier Information */}
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  Supplier
                </h3>
                <p className="text-lg font-semibold text-gray-900">{invoice.supplier_name}</p>
              </div>

              {/* Business Information */}
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Store size={16} className="text-gray-500" />
                  Business / Branch
                </h3>
                <p className="text-lg font-semibold text-gray-900">{invoice.business_name}</p>
                <p className="text-sm text-gray-600 mt-1">{invoice.branch_name}</p>
              </div>
            </div>

            {/* Invoice Dates and Purchase Order */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  Invoice Date
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  Due Date
                  {invoice.status?.toLowerCase() === 'unpaid' && !isEditing && (
                    <button
                      onClick={handleStartEdit}
                      className="ml-auto p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit Due Date"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                </h3>
                {isEditing && invoice.status?.toLowerCase() === 'unpaid' ? (
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={editingDueDate}
                      onChange={(e) => setEditingDueDate(e.target.value)}
                      min={invoice.invoice_date || ''}
                      className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:border-blue-600 focus:outline-none text-sm font-semibold"
                      disabled={savingDueDate}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDueDate}
                        disabled={savingDueDate}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition disabled:cursor-not-allowed"
                      >
                        <Save size={14} />
                        {savingDueDate ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingDueDate}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-lg font-semibold ${invoice.due_date ? 'text-gray-900' : 'text-gray-400'}`}>
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not Set'}
                  </p>
                )}
              </div>
              {invoice.purchase_order && (
                <div className="border border-gray-200 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-gray-500" />
                    Purchase Order
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">PO #{invoice.purchase_order}</p>
                </div>
              )}
            </div>

            {/* Invoice Items Table */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Invoice Items</h2>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No items found in this invoice.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Package className="text-gray-400" size={18} />
                              <div className="font-semibold text-gray-900">{item.product_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-semibold text-gray-800">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm text-gray-800">{CURRENCY_SYMBOL} {parseFloat(item.unit_cost || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-semibold text-gray-800">{CURRENCY_SYMBOL} {parseFloat(item.item_total || 0).toLocaleString()}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex justify-end">
                <div className="w-full md:w-1/3">
                  <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {CURRENCY_SYMBOL} {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Metadata */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Created:</span> {new Date(invoice.created_at).toLocaleString()}</p>
                </div>
                {invoice.updated_at !== invoice.created_at && (
                  <div>
                    <p><span className="font-semibold">Last Updated:</span> {new Date(invoice.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && invoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Record Payment</h2>
                <button
                  onClick={handleClosePaymentModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={recordingPayment}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Invoice Number</div>
                  <div className="font-semibold text-gray-800">{invoice.invoice_number}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-xl font-bold text-gray-800">
                    {CURRENCY_SYMBOL} {parseFloat(invoice.total_amount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={invoice.total_amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold"
                    required
                    disabled={recordingPayment}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                    disabled={recordingPayment}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    disabled={recordingPayment}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRecordPayment}
                    disabled={recordingPayment}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {recordingPayment ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Record Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print-container {
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ViewSupplierInvoice;
