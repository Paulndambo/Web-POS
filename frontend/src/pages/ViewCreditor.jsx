import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { 
  ArrowLeft, UserCheck, Mail, Phone, MapPin, DollarSign, 
  TrendingUp, TrendingDown, Calendar, RefreshCw, AlertCircle,
  CreditCard, CheckCircle, Clock
} from 'lucide-react';

const ViewCreditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Dummy creditor data
  const [creditor, setCreditor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const dummyCreditor = {
        id: parseInt(id),
        name: 'ABC Suppliers Ltd',
        contact_person: 'John Doe',
        email: 'john@abcsuppliers.com',
        phone: '+254 712 345 678',
        address: '123 Industrial Area, Nairobi',
        balance: 45000,
        credit_limit: 100000,
        status: 'Active',
        total_loans: 125000,
        total_repayments: 80000,
        last_transaction_date: '2024-01-15'
      };
      setCreditor(dummyCreditor);
      setLoading(false);
    }, 500);
  }, [id]);

  // Dummy transaction logs (combined loans and repayments)
  const [transactions] = useState([
    {
      id: 1,
      type: 'loan',
      date: '2024-01-15',
      reference: 'INV-2024-001',
      description: 'Purchase of electronics inventory',
      amount: 25000,
      balance_after: 45000,
      status: 'pending'
    },
    {
      id: 2,
      type: 'repayment',
      date: '2024-01-10',
      reference: 'PMT-2024-005',
      description: 'Payment via bank transfer',
      amount: 15000,
      balance_after: 20000,
      status: 'completed',
      payment_method: 'Bank Transfer'
    },
    {
      id: 3,
      type: 'loan',
      date: '2024-01-08',
      reference: 'INV-2024-002',
      description: 'Bulk order - Office supplies',
      amount: 18000,
      balance_after: 35000,
      status: 'pending'
    },
    {
      id: 4,
      type: 'repayment',
      date: '2024-01-05',
      reference: 'PMT-2024-004',
      description: 'Partial payment - Cash',
      amount: 10000,
      balance_after: 17000,
      status: 'completed',
      payment_method: 'Cash'
    },
    {
      id: 5,
      type: 'loan',
      date: '2024-01-03',
      reference: 'INV-2024-003',
      description: 'Hardware equipment purchase',
      amount: 32000,
      balance_after: 27000,
      status: 'pending'
    },
    {
      id: 6,
      type: 'repayment',
      date: '2023-12-28',
      reference: 'PMT-2023-112',
      description: 'End of month settlement',
      amount: 20000,
      balance_after: -5000,
      status: 'completed',
      payment_method: 'M-Pesa'
    },
    {
      id: 7,
      type: 'loan',
      date: '2023-12-20',
      reference: 'INV-2023-098',
      description: 'Grocery stock replenishment',
      amount: 28000,
      balance_after: 15000,
      status: 'pending'
    },
    {
      id: 8,
      type: 'repayment',
      date: '2023-12-15',
      reference: 'PMT-2023-105',
      description: 'Payment via cheque',
      amount: 25000,
      balance_after: -13000,
      status: 'completed',
      payment_method: 'Cheque'
    }
  ]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={48} className="text-blue-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!creditor) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Creditor not found</span>
        </div>
      </Layout>
    );
  }

  const creditUtilization = (creditor.balance / creditor.credit_limit) * 100;
  const availableCredit = creditor.credit_limit - creditor.balance;

  const getTransactionIcon = (type) => {
    return type === 'loan' ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type) => {
    return type === 'loan' 
      ? 'text-orange-600 bg-orange-50' 
      : 'text-green-600 bg-green-50';
  };

  const getStatusBadge = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/creditors')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Creditors
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Creditor Details</h1>
              <p className="text-gray-600">View creditor information and transaction history</p>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Creditor Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <UserCheck size={32} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{creditor.name}</h2>
                  <p className="text-gray-600 mb-3">Contact: {creditor.contact_person}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  creditor.status === 'Active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {creditor.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-sm">{creditor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={18} className="text-gray-400" />
                  <span className="text-sm">{creditor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin size={18} className="text-gray-400" />
                  <span className="text-sm">{creditor.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Current Balance</p>
              <DollarSign size={24} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {CURRENCY_SYMBOL} {creditor.balance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Outstanding amount</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Credit Limit</p>
              <CreditCard size={24} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {CURRENCY_SYMBOL} {creditor.credit_limit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Maximum credit allowed</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Available Credit</p>
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {CURRENCY_SYMBOL} {availableCredit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{creditUtilization.toFixed(1)}% utilized</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Loans</p>
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {CURRENCY_SYMBOL} {creditor.total_loans.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Lifetime loans</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Total Repayments</h3>
              <TrendingDown size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {CURRENCY_SYMBOL} {creditor.total_repayments.toLocaleString()}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Repayment Rate</span>
                <span className="font-semibold text-gray-800">
                  {((creditor.total_repayments / creditor.total_loans) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Credit Utilization</h3>
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Used</span>
                <span className="font-semibold text-gray-800">{creditUtilization.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    creditUtilization > 80 ? 'bg-red-600' : 
                    creditUtilization > 60 ? 'bg-orange-600' : 
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Transaction</span>
                <span className="font-semibold text-gray-800">
                  {new Date(creditor.last_transaction_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
            <p className="text-sm text-gray-600 mt-1">Combined loans and repayment records</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance After
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction.type);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getTransactionColor(transaction.type)}`}>
                          <Icon size={14} />
                          {transaction.type === 'loan' ? 'Loan' : 'Repayment'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-800">{transaction.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{transaction.description}</div>
                        {transaction.payment_method && (
                          <div className="text-xs text-gray-500 mt-1">
                            via {transaction.payment_method}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${
                          transaction.type === 'loan' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'loan' ? '+' : '-'} {CURRENCY_SYMBOL} {transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-800">
                          {CURRENCY_SYMBOL} {transaction.balance_after.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Loans:</span>
                <span className="font-bold text-orange-600">
                  + {CURRENCY_SYMBOL} {transactions.filter(t => t.type === 'loan').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Repayments:</span>
                <span className="font-bold text-green-600">
                  - {CURRENCY_SYMBOL} {transactions.filter(t => t.type === 'repayment').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net Balance:</span>
                <span className="font-bold text-gray-800">
                  {CURRENCY_SYMBOL} {creditor.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewCreditor;


