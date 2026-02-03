import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCustomers } from '../contexts/CustomersContext.jsx';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast.js';
import { apiGet, apiPost, apiPatch } from '../utils/api.js';
import { usePayment } from '../hooks/usePayment.js';
import PaymentModal from '../components/PaymentModal.jsx';
import { 
  ArrowLeft, Search, Plus, Minus, X, Printer, DollarSign, 
  FileText, Edit2, Save, Trash2, ShoppingCart, Banknote, 
  Smartphone, Wallet, Calendar, Mail, Phone, MapPin, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();
  const { customers } = useCustomers();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [acceptingInvoice, setAcceptingInvoice] = useState(false);
  
  // Customer info editing
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Use the reusable payment hook
  const paymentCompleteRef = useRef(null);
  
  const payment = usePayment({
    totalAmount: invoice?.balance || 0,
    onPaymentComplete: (paymentData) => {
      if (paymentCompleteRef.current) {
        paymentCompleteRef.current(paymentData);
      }
    },
    customers: customers || []
  });

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/invoices/${id}/details/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component format
      const transformedInvoice = {
        id: data.id,
        invoiceNo: data.invoice_number,
        customerName: data.customer_name,
        customerEmail: data.email,
        customerPhone: data.phone_number,
        customerAddress: data.address,
        dueDate: data.due_date,
        timestamp: data.created_at,
        status: data.status === 'Accepted' ? 'Accepted' : 
                data.status === 'Partially Paid' ? 'Partially Paid' : 
                (data.status?.toLowerCase() || 'pending'),
        subtotal: parseFloat(data.sub_total || 0),
        tax: parseFloat(data.tax || 0),
        total: parseFloat(data.total_amount || 0),
        amountPaid: parseFloat(data.amount_paid || 0),
        balance: parseFloat(data.balance || 0),
        items: (data.invoiceitems || []).map(item => ({
          id: item.id,
          name: item.item_name,
          price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity),
          total: parseFloat(item.item_total)
        })),
        payments: (data.invoice_payments || []).map(payment => ({
          id: payment.id,
          amountPaid: parseFloat(payment.amount_paid || 0),
          paymentMethod: payment.payment_method || 'N/A',
          date: payment.created_at || payment.date || null
        }))
      };
      
      setInvoice(transformedInvoice);
      setCustomerName(transformedInvoice.customerName || '');
      setCustomerEmail(transformedInvoice.customerEmail || '');
      setCustomerPhone(transformedInvoice.customerPhone || '');
      setCustomerAddress(transformedInvoice.customerAddress || '');
      setDueDate(transformedInvoice.dueDate || '');
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        
        let allProducts = [];
        let endpoint = '/inventory';
        
        while (endpoint) {
          // Inventory endpoint doesn't require authentication
          const response = await apiGet(endpoint);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          const transformedProducts = data.results.map(product => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price || 0), // Use selling_price for invoices
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
      } finally {
        setProductsLoading(false);
      }
    };

    if (showAddItems) {
      fetchProducts();
    }
  }, [showAddItems]);

  if (!invoice) {
    return (
      <Layout>
        <div>
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Invoice Not Found</h3>
            <p className="text-gray-500 mb-4">The invoice you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/invoices')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Invoices
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const amountDue = invoice.balance || 0;
  const status = invoice.status || 'pending';
  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveCustomerInfo = () => {
    // TODO: Implement API call to update invoice customer info
    showInfo('Update customer info API endpoint not yet implemented');
    setIsEditing(false);
  };

  const handleAcceptInvoice = async () => {
    if (!id) {
      showError('Invoice ID is missing');
      return;
    }

    setAcceptingInvoice(true);
    try {
      const response = await apiPatch(`/invoices/${id}/details/`, {
        status: 'Accepted'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Invoice accepted successfully!');
      
      // Refresh invoice details to show the updated status
      await fetchInvoiceDetails();
    } catch (error) {
      console.error('Error accepting invoice:', error);
      showError(`Failed to accept invoice: ${error.message}`);
    } finally {
      setAcceptingInvoice(false);
    }
  };

  const handleInvoiceItemAction = async (invoiceItemId, actionType, amount) => {
    try {
      const updateData = {
        invoice_item: invoiceItemId,
        action_type: actionType,
        amount: amount
      };

      const response = await apiPost('/invoices/invoice-item-update/', updateData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh invoice details after successful update
      await fetchInvoiceDetails();
      
      const actionMessage = actionType === 'delete' ? 'removed' : 
                           actionType === 'increment' ? 'increased' : 'decreased';
      showSuccess(`Item quantity ${actionMessage} successfully!`);
    } catch (error) {
      console.error('Error updating invoice item:', error);
      showError(`Failed to update item: ${error.message}`);
    }
  };

  const handleAddItem = async (product) => {
    try {
      const itemData = {
        invoice: parseInt(id),
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            quantity: 1,
            item_total: parseFloat(product.price)
          }
        ]
      };

      const response = await apiPost('/invoices/new-invoice-items/', itemData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh invoice details after successful addition
      await fetchInvoiceDetails();
      
      setSearchTerm('');
      showSuccess(`${product.name} added to invoice successfully!`);
    } catch (error) {
      console.error('Error adding item to invoice:', error);
      showError(`Failed to add item: ${error.message}`);
    }
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Remove this item from invoice?')) {
      handleInvoiceItemAction(itemId, 'delete', 0);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    // Get current quantity from invoice items
    const currentItem = invoice.items.find(item => item.id === itemId);
    if (!currentItem) return;

    const difference = newQuantity - currentItem.quantity;
    
    if (difference === 0) return; // No change
    
    if (difference > 0) {
      // Increment
      handleInvoiceItemAction(itemId, 'increment', Math.abs(difference));
    } else {
      // Decrement
      handleInvoiceItemAction(itemId, 'decrement', Math.abs(difference));
    }
  };

  // Complete transaction function
  const completeTransaction = async (paymentData) => {
    if (!invoice) return;

    const amountDue = invoice.balance || 0;
    const finalPaymentAmount = paymentData.amountReceived || amountDue;
    const change = paymentData.change || 0;
    
    // Determine payment status
    let paymentStatus = 'Paid';
    if (finalPaymentAmount < invoice.total) {
      paymentStatus = 'Partial';
    }

    const backendPaymentData = {
      invoice: parseInt(id),
      data: {
        invoice: parseInt(id), // Include invoice ID in data object for invoice payments
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total_amount: invoice.total || 0,
        amountReceived: finalPaymentAmount,
        paymentMethod: paymentData.paymentMethod === 'cash+mpesa' ? 'cash+mpesa' : paymentData.paymentMethod,
        mobileNumber: (paymentData.paymentMethod === 'mobile' || paymentData.paymentMethod === 'cash+mpesa') ? (paymentData.mobileNumber || '') : '',
        mobileNetwork: (paymentData.paymentMethod === 'mobile' || paymentData.paymentMethod === 'cash+mpesa') ? 'Safaricom' : '',
        splitCashAmount: paymentData.paymentMethod === 'cash+mpesa' ? (paymentData.splitCashAmount || 0) : 0,
        splitMobileAmount: paymentData.paymentMethod === 'cash+mpesa' ? (paymentData.splitMobileAmount || 0) : 0,
        date: new Date().toISOString().split('T')[0],
        change: change,
        status: paymentStatus,
        // Include BNPL, Store Credit, and Loyalty Card data if present
        bnplDownPayment: paymentData.bnplDownPayment,
        bnplInstallments: paymentData.bnplInstallments,
        bnplInterval: paymentData.bnplInterval,
        customerId: paymentData.customerId,
        customerName: paymentData.customerName,
        cardNumber: paymentData.cardNumber,
        storeCreditUsed: paymentData.storeCreditUsed,
        loyaltyPointsUsed: paymentData.loyaltyPointsUsed
      }
    };

    try {
      const response = await apiPost('/invoices/invoice-payment/', backendPaymentData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to process payment');
      }

      const responseData = await response.json();
      console.log('Payment processed successfully:', responseData);
      
      showSuccess('Payment processed successfully!');
      
      // Reset payment state
      payment.resetPayment();
      
      // Refresh invoice details
      await fetchInvoiceDetails();
    } catch (error) {
      console.error('Error processing payment:', error);
      showError(`Failed to process payment: ${error.message}`);
    }
  };

  // Set the ref so completeTransaction can be called
  paymentCompleteRef.current = completeTransaction;

  // Process payment using the hook
  const handleProcessPayment = () => {
    const result = payment.processPayment();
    if (result.success) {
      // For mobile payments, validate phone number first
      if (payment.paymentMethod === 'mobile' || payment.paymentMethod === 'cash+mpesa') {
        const validation = payment.validatePhoneNumber(payment.mobileNumber);
        if (validation.valid) {
          payment.setMobileNumber(validation.cleaned);
        } else {
          showWarning(validation.error);
          return;
        }
      }
      
      // Build payment data and complete the transaction
      const paymentData = payment.buildPaymentData();
      if (paymentCompleteRef.current) {
        paymentCompleteRef.current(paymentData);
      }
    } else {
      showWarning(result.error);
    }
  };

  const generateInvoiceHTML = (inv) => {
    // Ensure we have valid data
    if (!inv || !inv.items || inv.items.length === 0) {
      return '<html><body><p>No invoice data available</p></body></html>';
    }

    const amountDue = inv.balance || 0;
    const status = inv.status || 'pending';
    const statusLower = status.toLowerCase();
    const subtotal = inv.subtotal || 0;
    const tax = inv.tax || 0;
    const total = inv.total || 0;
    const amountPaid = inv.amountPaid || 0;
    
    let paymentDetails = '';
    if (statusLower === 'paid' || status === 'Paid') {
      paymentDetails = `
        <div style="background-color: #d1fae5; color: #065f46; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PAID IN FULL
        </div>
        <p>Total Paid: ${CURRENCY_SYMBOL} ${amountPaid.toFixed(2)}</p>
      `;
    } else if (statusLower === 'partial' || status === 'Partially Paid') {
      paymentDetails = `
        <div style="background-color: #dbeafe; color: #1e40af; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: PARTIALLY PAID
        </div>
        <p>Amount Paid: ${CURRENCY_SYMBOL} ${amountPaid.toFixed(2)}</p>
        <p>Amount Due: ${CURRENCY_SYMBOL} ${amountDue.toFixed(2)}</p>
      `;
    } else if (status === 'Accepted' || statusLower === 'accepted') {
      paymentDetails = `
        <div style="background-color: #e0e7ff; color: #4338ca; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          STATUS: ACCEPTED
        </div>
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

    if (inv.payments && inv.payments.length > 0) {
      paymentDetails += '<div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">';
      paymentDetails += '<p style="font-weight: bold; margin-bottom: 8px;">Payment History:</p>';
      paymentDetails += '<table style="width: 100%; border-collapse: collapse; font-size: 11px;">';
      paymentDetails += '<thead><tr style="background-color: #f3f4f6; border-bottom: 1px solid #ddd;">';
      paymentDetails += '<th style="padding: 6px; text-align: left; font-weight: bold;">#</th>';
      paymentDetails += '<th style="padding: 6px; text-align: left; font-weight: bold;">Date</th>';
      paymentDetails += '<th style="padding: 6px; text-align: left; font-weight: bold;">Method</th>';
      paymentDetails += '<th style="padding: 6px; text-align: right; font-weight: bold;">Amount</th>';
      paymentDetails += '</tr></thead><tbody>';
      
      inv.payments.forEach((payment, index) => {
        const paymentDate = payment.date ? new Date(payment.date).toLocaleDateString() : 
                           payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 
                           payment.timestamp ? new Date(payment.timestamp).toLocaleDateString() : 'N/A';
        const paymentMethod = payment.paymentMethod === 'cash+mpesa' ? 'Cash + Mpesa' : 
                             payment.paymentMethod === 'mobile' ? 'Mpesa' : 
                             payment.paymentMethod || 'N/A';
        const paymentAmount = payment.amountPaid || payment.amount || 0;
        
        paymentDetails += '<tr style="border-bottom: 1px solid #eee;">';
        paymentDetails += `<td style="padding: 6px;">${index + 1}</td>`;
        paymentDetails += `<td style="padding: 6px;">${paymentDate}</td>`;
        paymentDetails += `<td style="padding: 6px; text-transform: capitalize;">${paymentMethod}</td>`;
        paymentDetails += `<td style="padding: 6px; text-align: right; font-weight: bold;">${CURRENCY_SYMBOL} ${paymentAmount.toFixed(2)}</td>`;
        paymentDetails += '</tr>';
      });
      
      // Add total row
      const totalPaid = inv.payments.reduce((sum, p) => sum + (p.amountPaid || p.amount || 0), 0);
      paymentDetails += '<tr style="border-top: 2px solid #000; font-weight: bold; background-color: #f9fafb;">';
      paymentDetails += '<td colspan="3" style="padding: 8px;">Total Paid</td>';
      paymentDetails += `<td style="padding: 8px; text-align: right;">${CURRENCY_SYMBOL} ${totalPaid.toFixed(2)}</td>`;
      paymentDetails += '</tr>';
      
      paymentDetails += '</tbody></table>';
      paymentDetails += '</div>';
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${inv.invoiceNo}</title>
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
              <p style="font-size: 18px; font-weight: bold;">#${inv.invoiceNo || 'N/A'}</p>
            </div>
          </div>
          
          <div class="invoice-info">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${inv.customerName || 'Customer'}</strong></p>
              ${inv.customerEmail ? `<p>${inv.customerEmail}</p>` : ''}
              ${inv.customerPhone ? `<p>${inv.customerPhone}</p>` : ''}
              ${inv.customerAddress ? `<p>${inv.customerAddress}</p>` : ''}
            </div>
            <div class="invoice-details">
              <h3>Invoice Details:</h3>
              <p><strong>Date:</strong> ${inv.timestamp ? new Date(inv.timestamp).toLocaleString() : 'N/A'}</p>
              <p><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
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
              ${inv.items.map(item => `
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
            ${(statusLower !== 'paid' && status !== 'Paid') ? '<p>Please make payment by the due date.</p>' : ''}
          </div>
        </body>
      </html>
    `;
  };

  const printInvoice = () => {
    // Check if invoice data is available
    if (!invoice || !invoice.items || invoice.items.length === 0) {
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

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading invoice details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Error Loading Invoice</h3>
              <p>{error}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate('/invoices')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                >
                  Back to Invoices
                </button>
                <button
                  onClick={fetchInvoiceDetails}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (!invoice) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg text-center">
            <FileText size={48} className="mx-auto mb-4 text-yellow-400" />
            <h3 className="font-semibold mb-2">Invoice Not Found</h3>
            <p className="mb-4">The invoice you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/invoices')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      
      <div>
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              onClick={() => navigate('/invoices')}
              className="p-2.5 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition touch-manipulation"
              title="Back to Invoices"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">Invoice #{invoice.invoiceNo}</h2>
              <p className="text-sm sm:text-base text-gray-600">
                {status === 'paid' || status === 'Paid' ? 'Paid' : 
                 status === 'partial' || status === 'Partially Paid' ? 'Partially Paid' : 
                 status === 'Accepted' || status === 'accepted' ? 'Accepted' : 
                 'Pending Payment'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Accept Invoice Button - Show when status is Pending */}
            {status === 'pending' && (
              <button
                onClick={handleAcceptInvoice}
                disabled={acceptingInvoice}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
              >
                {acceptingInvoice ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    <span className="hidden sm:inline">Accepting...</span>
                    <span className="sm:hidden">Accepting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span className="hidden sm:inline">Accept Invoice</span>
                    <span className="sm:hidden">Accept</span>
                  </>
                )}
              </button>
            )}
            {/* Payment Button - Only show when status is Accepted or Partially Paid */}
            {(invoice?.balance || 0) > 0 && (status === 'Accepted' || status === 'accepted' || status === 'partial' || status === 'Partially Paid') && (
              <button
                onClick={() => payment.openPayment()}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
              >
                <DollarSign size={18} />
                <span className="hidden sm:inline">Receive Payment</span>
                <span className="sm:hidden">Payment</span>
              </button>
            )}
            {status === 'pending' && (
              <button
                onClick={() => setShowAddItems(true)}
                className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Items</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
            <button
              onClick={printInvoice}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-4 py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Invoice Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText size={20} />
                  Customer Information
                </h3>
                {status === 'pending' && (
                  !isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCustomerInfo}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setCustomerName(invoice.customerName || '');
                          setCustomerEmail(invoice.customerEmail || '');
                          setCustomerPhone(invoice.customerPhone || '');
                          setCustomerAddress(invoice.customerAddress || '');
                          setDueDate(invoice.dueDate || '');
                        }}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )
                )}
                {status !== 'pending' && (
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Invoice {status === 'paid' ? 'paid' : 'partially paid'} - editing disabled
                  </span>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Phone size={14} />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin size={14} />
                      Address
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar size={14} />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{invoice.customerName || 'N/A'}</p>
                  {invoice.customerEmail && <p className="text-gray-600 flex items-center gap-2"><Mail size={14} />{invoice.customerEmail}</p>}
                  {invoice.customerPhone && <p className="text-gray-600 flex items-center gap-2"><Phone size={14} />{invoice.customerPhone}</p>}
                  {invoice.customerAddress && <p className="text-gray-600 flex items-center gap-2"><MapPin size={14} />{invoice.customerAddress}</p>}
                  {invoice.dueDate && <p className="text-gray-600 flex items-center gap-2"><Calendar size={14} />Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Invoice Items
                </h3>
                {status !== 'pending' && (
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Invoice {status === 'paid' ? 'paid' : 'partially paid'} - editing disabled
                  </span>
                )}
              </div>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {invoice.items.map(item => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-base">{item.name}</p>
                        <p className="text-sm text-gray-500">{CURRENCY_SYMBOL} {item.price.toFixed(2)} each</p>
                      </div>
                      {status === 'pending' && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 active:text-red-800 p-2 touch-manipulation"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {status === 'pending' ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-2 rounded touch-manipulation"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-semibold text-base">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-2 rounded touch-manipulation"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-center font-semibold text-base text-gray-700">{item.quantity}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Unit: {CURRENCY_SYMBOL} {item.price.toFixed(2)}</p>
                        <p className="font-bold text-blue-600 text-base">Total: {CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Item</th>
                      <th className="text-center py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Unit Price</th>
                      <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-2 sm:px-4">
                          <div>
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-500">{CURRENCY_SYMBOL} {item.price.toFixed(2)} each</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-center">
                          {status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-1.5 rounded touch-manipulation"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-12 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 p-1.5 rounded touch-manipulation"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-700">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right">{CURRENCY_SYMBOL} {item.price.toFixed(2)}</td>
                        <td className="py-3 px-2 sm:px-4 text-right font-semibold">{CURRENCY_SYMBOL} {(item.price * item.quantity).toFixed(2)}</td>
                        <td className="py-3 px-2 sm:px-4 text-center">
                          {status === 'pending' && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 active:text-red-800 p-1.5 touch-manipulation"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Invoice Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL} {invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8%):</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL} {invoice.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{CURRENCY_SYMBOL} {invoice.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600">{CURRENCY_SYMBOL} {(invoice.amountPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span>Amount Due:</span>
                    <span className={amountDue > 0 ? 'text-red-600' : 'text-green-600'}>
                      {CURRENCY_SYMBOL} {amountDue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg mt-4 ${
                  status === 'paid' || status === 'Paid' ? 'bg-green-50 border border-green-200' :
                  status === 'partial' || status === 'Partially Paid' ? 'bg-blue-50 border border-blue-200' :
                  status === 'Accepted' || status === 'accepted' ? 'bg-indigo-50 border border-indigo-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`text-sm font-semibold ${
                    status === 'paid' || status === 'Paid' ? 'text-green-700' :
                    status === 'partial' || status === 'Partially Paid' ? 'text-blue-700' :
                    status === 'Accepted' || status === 'accepted' ? 'text-indigo-700' :
                    'text-yellow-700'
                  }`}>
                    Status: {status === 'paid' || status === 'Paid' ? 'Paid in Full' : 
                             status === 'partial' || status === 'Partially Paid' ? 'Partially Paid' : 
                             status === 'Accepted' || status === 'accepted' ? 'Accepted' : 
                             'Pending Payment'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">#</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Method</th>
                        <th className="text-right py-3 px-2 sm:px-4 text-sm font-semibold text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.payments.map((payment, index) => (
                        <tr key={payment.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 sm:px-4 text-sm">{index + 1}</td>
                          <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">
                            {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-sm capitalize text-gray-600">
                            {payment.paymentMethod === 'cash+mpesa' ? 'Cash + Mpesa' : 
                             payment.paymentMethod === 'mobile' ? 'Mpesa' : 
                             payment.paymentMethod || 'N/A'}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-sm text-right font-semibold text-green-600">
                            {CURRENCY_SYMBOL} {payment.amountPaid.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-bold">
                        <td colSpan="3" className="py-3 px-2 sm:px-4 text-sm">Total Paid</td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-right text-green-600">
                          {CURRENCY_SYMBOL} {invoice.payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Add Items Modal */}
      {showAddItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-none sm:rounded-lg p-4 sm:p-6 max-w-4xl w-full h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add Items to Invoice</h2>
              <button
                onClick={() => {
                  setShowAddItems(false);
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddItem(product)}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition text-left touch-manipulation min-h-[100px] sm:min-h-[120px]"
                  >
                    <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    <p className="font-bold text-blue-600 text-base sm:text-lg">{CURRENCY_SYMBOL} {product.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {invoice && (
        <PaymentModal
          show={payment.showPayment}
          totalAmount={invoice.balance || 0}
          paymentState={payment}
          onProcessPayment={handleProcessPayment}
          onCancel={payment.closePayment}
          customers={customers || []}
        />
      )}
      </div>
    </Layout>
  );
};

export default ViewInvoice;

