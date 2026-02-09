import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { Database, Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { apiGet } from '../utils/api.js';
import { showSuccess, showError } from '../utils/toast.js';

const DataExport = () => {
  const [exporting, setExporting] = useState({
    sales: false,
    customers: false,
    suppliers: false,
    inventory: false
  });

  // Convert array of objects to CSV
  const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) {
      return '';
    }

    // Create header row
    const headerRow = headers.map(h => `"${h.label}"`).join(',');
    
    // Create data rows
    const dataRows = data.map(row => {
      return headers.map(h => {
        const value = row[h.key] || '';
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  };

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Customers
  const handleExportCustomers = async () => {
    setExporting(prev => ({ ...prev, customers: true }));
    try {
      const response = await apiGet('/customers/loyalty-cards/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const customers = data.results || data || [];

      // Define CSV headers
      const headers = [
        { key: 'id', label: 'ID' },
        { key: 'customer_name', label: 'Customer Name' },
        { key: 'customer_email', label: 'Email' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'address', label: 'Address' },
        { key: 'card_number', label: 'Card Number' },
        { key: 'points', label: 'Points' },
        { key: 'amount_spend', label: 'Total Spent' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created At' }
      ];

      // Convert to CSV
      const csvContent = convertToCSV(customers, headers);
      
      if (csvContent) {
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `customers_export_${timestamp}.csv`);
        showSuccess(`Exported ${customers.length} customers successfully!`);
      } else {
        showError('No customer data to export');
      }
    } catch (error) {
      console.error('Error exporting customers:', error);
      showError(`Failed to export customers: ${error.message}`);
    } finally {
      setExporting(prev => ({ ...prev, customers: false }));
    }
  };

  // Export Suppliers
  const handleExportSuppliers = async () => {
    setExporting(prev => ({ ...prev, suppliers: true }));
    try {
      const response = await apiGet('/supply-chain/suppliers/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const suppliers = data.results || data || [];

      // Define CSV headers
      const headers = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'address', label: 'Address' },
        { key: 'status', label: 'Status' },
        { key: 'lead_time_days', label: 'Lead Time (Days)' },
        { key: 'payment_terms', label: 'Payment Terms' }
      ];

      // Convert to CSV
      const csvContent = convertToCSV(suppliers, headers);
      
      if (csvContent) {
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `suppliers_export_${timestamp}.csv`);
        showSuccess(`Exported ${suppliers.length} suppliers successfully!`);
      } else {
        showError('No supplier data to export');
      }
    } catch (error) {
      console.error('Error exporting suppliers:', error);
      showError(`Failed to export suppliers: ${error.message}`);
    } finally {
      setExporting(prev => ({ ...prev, suppliers: false }));
    }
  };

  // Export Sales Data (Orders)
  const handleExportSales = async () => {
    setExporting(prev => ({ ...prev, sales: true }));
    try {
      const response = await apiGet('/orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const orders = data.results || data || [];

      // Define CSV headers
      const headers = [
        { key: 'id', label: 'Order ID' },
        { key: 'order_number', label: 'Order Number' },
        { key: 'created_at', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'sub_total', label: 'Subtotal' },
        { key: 'tax', label: 'Tax' },
        { key: 'total_amount', label: 'Total Amount' },
        { key: 'amount_received', label: 'Amount Received' },
        { key: 'change', label: 'Change' },
        { key: 'balance', label: 'Balance' },
        { key: 'seller', label: 'Seller' },
        { key: 'business_name', label: 'Business Name' },
        { key: 'items_count', label: 'Items Count' }
      ];

      // Convert to CSV
      const csvContent = convertToCSV(orders, headers);
      
      if (csvContent) {
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `sales_export_${timestamp}.csv`);
        showSuccess(`Exported ${orders.length} orders successfully!`);
      } else {
        showError('No sales data to export');
      }
    } catch (error) {
      console.error('Error exporting sales data:', error);
      showError(`Failed to export sales data: ${error.message}`);
    } finally {
      setExporting(prev => ({ ...prev, sales: false }));
    }
  };

  // Export Inventory
  const handleExportInventory = async () => {
    setExporting(prev => ({ ...prev, inventory: true }));
    try {
      let allProducts = [];
      let endpoint = '/inventory';
      
      // Fetch all pages of products
      while (endpoint) {
        const response = await apiGet(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allProducts = [...allProducts, ...(data.results || [])];
        
        // Check if there's a next page
        if (data.next) {
          const url = new URL(data.next);
          endpoint = url.pathname + url.search;
        } else {
          endpoint = null;
        }
      }

      // Define CSV headers
      const headers = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Product Name' },
        { key: 'barcode', label: 'Barcode' },
        { key: 'category_name', label: 'Category' },
        { key: 'quantity', label: 'Stock Quantity' },
        { key: 'buying_price', label: 'Buying Price' },
        { key: 'selling_price', label: 'Selling Price' },
        { key: 'description', label: 'Description' }
      ];

      // Convert to CSV
      const csvContent = convertToCSV(allProducts, headers);
      
      if (csvContent) {
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `inventory_export_${timestamp}.csv`);
        showSuccess(`Exported ${allProducts.length} products successfully!`);
      } else {
        showError('No inventory data to export');
      }
    } catch (error) {
      console.error('Error exporting inventory:', error);
      showError(`Failed to export inventory: ${error.message}`);
    } finally {
      setExporting(prev => ({ ...prev, inventory: false }));
    }
  };
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Database size={32} className="text-blue-600" />
            Data Export
          </h1>
          <p className="text-gray-600">Export your business data in various formats</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Export Sales Data */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileSpreadsheet className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Sales Data</h2>
            </div>
            <p className="text-gray-600 mb-4">Export sales transactions, orders, and revenue data</p>
            <button 
              onClick={handleExportSales}
              disabled={exporting.sales}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
            >
              {exporting.sales ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export CSV
                </>
              )}
            </button>
          </div>

          {/* Export Inventory Data */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FileSpreadsheet className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Inventory Data</h2>
            </div>
            <p className="text-gray-600 mb-4">Export products, stock levels, and inventory history</p>
            <button 
              onClick={handleExportInventory}
              disabled={exporting.inventory}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
            >
              {exporting.inventory ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export CSV
                </>
              )}
            </button>
          </div>

          {/* Export Customer Data */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileSpreadsheet className="text-purple-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Customer Data</h2>
            </div>
            <p className="text-gray-600 mb-4">Export customer information and loyalty card data</p>
            <button 
              onClick={handleExportCustomers}
              disabled={exporting.customers}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
            >
              {exporting.customers ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export CSV
                </>
              )}
            </button>
          </div>

          {/* Export Financial Data */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FileText className="text-yellow-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Financial Data</h2>
            </div>
            <p className="text-gray-600 mb-4">Export invoices, payments, and financial records</p>
            <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Export Supplier Data */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FileSpreadsheet className="text-orange-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Supplier Data</h2>
            </div>
            <p className="text-gray-600 mb-4">Export supplier information and purchase orders</p>
            <button 
              onClick={handleExportSuppliers}
              disabled={exporting.suppliers}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
            >
              {exporting.suppliers ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export CSV
                </>
              )}
            </button>
          </div>

          {/* Full Database Export */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Database className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Full Database</h2>
            </div>
            <p className="text-gray-600 mb-4">Export all data in a complete backup format</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
              <Download size={18} />
              Export Backup
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataExport;
