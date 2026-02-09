import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { Upload, FileSpreadsheet, Package, CheckCircle, AlertCircle } from 'lucide-react';

const DataImport = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importType, setImportType] = useState('products');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }
    // Placeholder for import functionality
    alert(`Importing ${importType} from ${selectedFile.name}`);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Upload size={32} className="text-blue-600" />
            Data Import
          </h1>
          <p className="text-gray-600">Import data from CSV or Excel files</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Import Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Data</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Import Type
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="products">Products</option>
                  <option value="customers">Customers</option>
                  <option value="suppliers">Suppliers</option>
                  <option value="inventory">Inventory</option>
                  <option value="sales">Sales Transactions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Click to upload
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleImport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Import Data
              </button>
            </div>
          </div>

          {/* Import Guide */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Guide</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-800">Supported Formats</p>
                  <p className="text-sm text-gray-600">CSV, XLSX, XLS</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-800">File Size Limit</p>
                  <p className="text-sm text-gray-600">Maximum 10MB per file</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-gray-800">Important</p>
                  <p className="text-sm text-gray-600">Ensure your file matches the required format template</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <FileSpreadsheet size={18} />
                  Download Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Imports */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Imports</h2>
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 text-gray-300" />
            <p>No recent imports</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataImport;
