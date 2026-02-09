import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { FileText, Package, TrendingDown, AlertTriangle, Download, Search } from 'lucide-react';

const InventoryReports = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <FileText size={32} className="text-blue-600" />
              Inventory Reports
            </h1>
            <p className="text-gray-600">Track inventory levels and stock movements</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
            <Download size={18} />
            Export Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Products</span>
              <Package className="text-blue-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">1,248</p>
            <p className="text-sm text-gray-500 mt-2">Active items in stock</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Low Stock Items</span>
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">23</p>
            <p className="text-sm text-yellow-600 mt-2">Requires attention</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">8</p>
            <p className="text-sm text-red-600 mt-2">Needs restocking</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Value</span>
              <Package className="text-green-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">$45,230</p>
            <p className="text-sm text-gray-500 mt-2">Inventory value</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="food">Food & Beverages</option>
              <option value="clothing">Clothing</option>
            </select>
            <select className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Inventory Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Current Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Min Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">Product A</div>
                    <div className="text-sm text-gray-500">SKU: PRD-001</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">Electronics</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">45</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">20</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      In Stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$1,350.00</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">Product B</div>
                    <div className="text-sm text-gray-500">SKU: PRD-002</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">Food & Beverages</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">8</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">15</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      Low Stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$240.00</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">Product C</div>
                    <div className="text-sm text-gray-500">SKU: PRD-003</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">Clothing</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">0</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">10</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Out of Stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryReports;
