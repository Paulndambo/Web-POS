import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, Download, Calendar } from 'lucide-react';

const FinancialReports = () => {
  const [dateRange, setDateRange] = useState('month');

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <DollarSign size={32} className="text-blue-600" />
              Financial Reports
            </h1>
            <p className="text-gray-600">Comprehensive financial analysis and insights</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">$45,230.00</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +18.2% from last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Expenses</span>
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">$12,450.00</p>
            <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
              <TrendingDown size={14} />
              +5.3% from last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Net Profit</span>
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">$32,780.00</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +24.5% from last period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <CreditCard className="text-purple-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-800">72.5%</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp size={14} />
              +2.1% from last period
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue vs Expenses</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart visualization will be displayed here</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profit Trend</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart visualization will be displayed here</p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Income Breakdown */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={24} />
                Income Breakdown
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sales Revenue</span>
                  <span className="font-semibold text-gray-800">$38,450.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other Income</span>
                  <span className="font-semibold text-gray-800">$6,780.00</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total Income</span>
                  <span className="font-bold text-lg text-green-600">$45,230.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrendingDown className="text-red-600" size={24} />
                Expense Breakdown
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Operating Expenses</span>
                  <span className="font-semibold text-gray-800">$8,230.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cost of Goods</span>
                  <span className="font-semibold text-gray-800">$3,450.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other Expenses</span>
                  <span className="font-semibold text-gray-800">$770.00</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total Expenses</span>
                  <span className="font-bold text-lg text-red-600">$12,450.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">2024-01-15</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <TrendingUp size={14} />
                      Income
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">Sales Revenue</td>
                  <td className="px-6 py-4 text-sm text-green-600 text-right font-semibold">+$1,638.00</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">2024-01-15</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <TrendingDown size={14} />
                      Expense
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">Operating Expense</td>
                  <td className="px-6 py-4 text-sm text-red-600 text-right font-semibold">-$450.00</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">2024-01-14</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <TrendingUp size={14} />
                      Income
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">Sales Revenue</td>
                  <td className="px-6 py-4 text-sm text-green-600 text-right font-semibold">+$1,482.00</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialReports;
