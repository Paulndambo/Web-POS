import React from 'react';
import Layout from '../components/Layout.jsx';
import { BookOpen, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';

const BusinessLedger = () => {
  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Business Ledger</h1>
            <p className="text-gray-600">
              High-level view of all financial movements for your business.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net position</p>
                <p className="text-2xl font-bold text-blue-600">
                  {CURRENCY_SYMBOL} 0.00
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total debits</p>
                <p className="text-2xl font-bold text-green-600">
                  {CURRENCY_SYMBOL} 0.00
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <ArrowDownRight size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total credits</p>
                <p className="text-2xl font-bold text-red-600">
                  {CURRENCY_SYMBOL} 0.00
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <ArrowUpRight size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Ledger entries</h2>
            </div>
            <p className="text-sm text-gray-500">
              Detailed ledger functionality can be wired to your backend later.
            </p>
          </div>
          <div className="p-8 text-center text-gray-500">
            No ledger data is loaded yet. Connect this page to your accounting or reporting
            endpoints to show line-by-line movements by date, account, and source module.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BusinessLedger;

