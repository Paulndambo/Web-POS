import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Calendar, Download } from 'lucide-react';

const SalesReports = () => {
  const [dateRange, setDateRange] = useState('today');

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <BarChart3 size={32} className="text-blue-600" />
              Sales Reports
            </h1>
            <p className="text-gray-600">View and analyze your sales performance</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Sales</span>
              <DollarSign className="text-green-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">$12,450.00</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +12.5% from last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Orders</span>
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">342</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +8.2% from last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Average Order</span>
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">$36.40</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +4.1% from last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Transactions</span>
              <Calendar className="text-orange-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">1,248</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +15.3% from last period
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart visualization will be displayed here</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Products</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart visualization will be displayed here</p>
            </div>
          </div>
        </div>

        {/* Detailed Report Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Sales Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Avg Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">2024-01-15</td>
                  <td className="px-6 py-4 text-sm text-gray-800">45</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$1,638.00</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$36.40</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">2024-01-14</td>
                  <td className="px-6 py-4 text-sm text-gray-800">38</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$1,482.00</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$39.00</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">2024-01-13</td>
                  <td className="px-6 py-4 text-sm text-gray-800">52</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$1,892.00</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">$36.38</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesReports;
