import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showError } from '../utils/toast.js';
import { apiGet } from '../utils/api.js';
import { FileText, DollarSign, Calendar, Search, Filter, Plus, CheckCircle, Clock, AlertCircle, Printer, Eye, RefreshCw } from 'lucide-react';

const Invoices = () => {
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, partial, paid

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/invoices/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component format
      const transformedInvoices = (data.results || []).map(invoice => ({
        id: invoice.id,
        invoiceNo: invoice.invoice_number,
        customerName: invoice.customer_name,
        customerEmail: invoice.email,
        customerPhone: invoice.phone_number,
        customerAddress: invoice.address,
        dueDate: invoice.due_date,
        timestamp: invoice.created_at,
        status: invoice.status?.toLowerCase() || 'pending',
        total: parseFloat(invoice.total_amount),
        amountPaid: parseFloat(invoice.amount_paid || 0),
        items_count: invoice.items_count || 0,
        items: [] // Will be loaded when viewing details
      }));
      
      setInvoices(transformedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Calculate statistics from invoices
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaidAmount = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalPendingAmount = totalInvoiceAmount - totalPaidAmount;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const partialInvoices = invoices.filter(inv => inv.status === 'partial').length;

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNo?.toString().includes(searchTerm) ||
        (invoice.customerName && invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.customerEmail && invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'amount-high') {
        return b.total - a.total;
      } else if (sortBy === 'amount-low') {
        return a.total - b.total;
      }
      return 0;
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (invoice) => {
    const status = invoice.status || 'pending';
    const amountDue = invoice.total - (invoice.amountPaid || 0);
    
    if (status === 'paid') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm bg-green-100 text-green-700">
          <CheckCircle size={16} />
          Paid
        </div>
      );
    } else if (status === 'partial') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm bg-blue-100 text-blue-700">
          <AlertCircle size={16} />
          Partial ({CURRENCY_SYMBOL} {amountDue.toFixed(2)} due)
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm bg-yellow-100 text-yellow-700">
          <Clock size={16} />
          Pending
        </div>
      );
    }
  };

  const generateInvoiceHTML = (invoice) => {
    // Ensure we have valid data
    if (!invoice || !invoice.items || invoice.items.length === 0) {
      return '<html><body><p>No invoice data available</p></body></html>';
    }

    const amountDue = invoice.balance || (invoice.total - (invoice.amountPaid || 0));
    const status = invoice.status || 'pending';
    const subtotal = invoice.subtotal || 0;
    const tax = invoice.tax || 0;
    const total = invoice.total || 0;
    const amountPaid = invoice.amountPaid || 0;
    
    let paymentDetails = '';
    if (status === 'paid') {
      paymentDetails = `
        <div style="background-color: #d1fae5; color: #065f46; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PAID IN FULL
        </div>
        <p>Total Paid: ${CURRENCY_SYMBOL} ${amountPaid.toFixed(2)}</p>
      `;
    } else if (status === 'partial') {
      paymentDetails = `
        <div style="background-color: #dbeafe; color: #1e40af; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PARTIALLY PAID
        </div>
        <p>Amount Paid: ${CURRENCY_SYMBOL} ${amountPaid.toFixed(2)}</p>
        <p>Amount Due: ${CURRENCY_SYMBOL} ${amountDue.toFixed(2)}</p>
      `;
    } else {
      paymentDetails = `
        <div style="background-color: #fef3c7; color: #92400e; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PENDING PAYMENT
        </div>
        <p>Amount Due: ${CURRENCY_SYMBOL} ${amountDue.toFixed(2)}</p>
      `;
    }

    if (invoice.payments && invoice.payments.length > 0) {
      paymentDetails += '<div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">';
      paymentDetails += '<p style="font-weight: bold; margin-bottom: 5px;">Payment History:</p>';
      invoice.payments.forEach((payment, index) => {
        paymentDetails += `
          <p style="font-size: 11px; margin: 3px 0;">
            ${index + 1}. ${CURRENCY_SYMBOL} ${(payment.amount || 0).toFixed(2)} - ${payment.paymentMethod || 'N/A'} 
            (${payment.timestamp ? new Date(payment.timestamp).toLocaleString() : 'N/A'})
            ${payment.paymentReference ? ` - Ref: ${payment.paymentReference}` : ''}
          </p>
        `;
      });
      paymentDetails += '</div>';
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invoice.invoiceNo}</title>
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
            .customer-info, .invoice-details {
              flex: 1;
            }
            .customer-info h3, .invoice-details h3 {
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
              <h2>${user?.business_name || 'Smart Retail Store'}</h2>
              <p>123 Main Street, Nairobi</p>
              <p>Tel: +254 712 345 678</p>
              <p>Email: info@smartretail.com</p>
            </div>
            <div class="header-right">
              <h2 style="margin: 0; font-size: 28px;">INVOICE</h2>
              <p style="font-size: 18px; font-weight: bold;">#${invoice.invoiceNo || 'N/A'}</p>
            </div>
          </div>
          
          <div class="invoice-info">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${invoice.customerName || 'Customer'}</strong></p>
              ${invoice.customerEmail ? `<p>${invoice.customerEmail}</p>` : ''}
              ${invoice.customerPhone ? `<p>${invoice.customerPhone}</p>` : ''}
              ${invoice.customerAddress ? `<p>${invoice.customerAddress}</p>` : ''}
            </div>
            <div class="invoice-details">
              <h3>Invoice Details:</h3>
              <p><strong>Date:</strong> ${invoice.timestamp ? formatDate(invoice.timestamp) : 'N/A'}</p>
              <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Issued By:</strong> ${user?.name || 'Admin'}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.name || 'Item'}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${CURRENCY_SYMBOL} ${(item.price || 0).toFixed(2)}</td>
                  <td>${CURRENCY_SYMBOL} ${(item.total || (item.price * item.quantity) || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${CURRENCY_SYMBOL} ${subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Tax/VAT:</span>
              <span>${CURRENCY_SYMBOL} ${tax.toFixed(2)}</span>
            </div>
            <div class="totals-row total-row">
              <span>Total:</span>
              <span>${CURRENCY_SYMBOL} ${total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            ${paymentDetails}
            <p style="margin-top: 20px;">Thank you for your business!</p>
            <p>Please make payment by the due date.</p>
          </div>
        </body>
      </html>
    `;
  };

  const printInvoice = async (invoice) => {
    try {
      // Fetch full invoice details including items
      const response = await apiGet(`/invoices/${invoice.id}/details/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice details: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to include items
      const fullInvoice = {
        ...invoice,
        subtotal: parseFloat(data.sub_total || 0),
        tax: parseFloat(data.vat || 0),
        total: parseFloat(data.total_amount || 0),
        amountPaid: parseFloat(data.amount_paid || 0),
        balance: parseFloat(data.balance || 0),
        items: (data.invoiceitems || []).map(item => ({
          id: item.id,
          name: item.item_name,
          price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          total: parseFloat(item.item_total)
        }))
      };
      
      // Generate and print invoice HTML
      const invoiceHTML = generateInvoiceHTML(fullInvoice);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
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
      console.error('Error printing invoice:', error);
      showError(`Failed to print invoice: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div>
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Invoice Management</h2>
            <p className="text-gray-600">Create, manage, and track invoices</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/create-invoice')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              Create New Invoice
            </button>
            <button
              onClick={fetchInvoices}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
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
            <span>Error loading invoices: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading invoices...</p>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-5 border-l-4 border-blue-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Invoices</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">{invoices.length}</p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <FileText size={20} className="sm:w-7 sm:h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-5 border-l-4 border-green-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Paid Invoices</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">{paidInvoices}</p>
                <p className="text-xs text-green-600 mt-1 truncate">{CURRENCY_SYMBOL} {totalPaidAmount.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <CheckCircle size={20} className="sm:w-7 sm:h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-5 border-l-4 border-yellow-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending Amount</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">{CURRENCY_SYMBOL} {totalPendingAmount.toFixed(0)}</p>
                <p className="text-xs text-yellow-600 mt-1 truncate">{pendingInvoices + partialInvoices} invoices</p>
              </div>
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <Clock size={20} className="sm:w-7 sm:h-7 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-5 border-l-4 border-purple-600 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">{CURRENCY_SYMBOL} {totalInvoiceAmount.toFixed(0)}</p>
              </div>
              <div className="bg-purple-100 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <DollarSign size={20} className="sm:w-7 sm:h-7 text-purple-600" />
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Filters */}
        {!loading && !error && (
          <>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-5 mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400 flex-shrink-0 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 flex items-center justify-center sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Invoices Found</h3>
            <p className="text-gray-500 mb-4">
              {invoices.length === 0 
                ? "No invoices have been created yet. Create your first invoice to get started."
                : "No invoices match your search criteria."}
            </p>
            {invoices.length === 0 && (
              <button
                onClick={() => navigate('/create-invoice')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create First Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const amountDue = invoice.total - (invoice.amountPaid || 0);
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">#{invoice.invoiceNo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">{invoice.customerName || 'N/A'}</div>
                          {invoice.customerEmail && (
                            <div className="text-xs text-gray-500">{invoice.customerEmail}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(invoice.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="font-semibold text-blue-600">{CURRENCY_SYMBOL} {invoice.total.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-semibold ${amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {CURRENCY_SYMBOL} {amountDue.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/invoice/${invoice.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                              title="View Details"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => printInvoice(invoice)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                              title="Print Invoice"
                            >
                              <Printer size={14} />
                              <span className="hidden sm:inline">Print</span>
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
      </div>
    </Layout>
  );
};

export default Invoices;

