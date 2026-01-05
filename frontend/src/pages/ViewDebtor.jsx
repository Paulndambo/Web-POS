import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { 
  ArrowLeft, Users, Mail, Phone, MapPin, DollarSign, 
  TrendingUp, TrendingDown, Calendar, RefreshCw, AlertCircle,
  CreditCard, CheckCircle, Clock
} from 'lucide-react';

const ViewDebtor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Dummy debtor data
  const [debtor, setDebtor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const dummyDebtor = {
        id: parseInt(id),
        name: 'John Kamau',
        email: 'john.kamau@email.com',
        phone: '+254 712 345 678',
        address: '123 Westlands, Nairobi',
        balance: 15000,
        credit_limit: 50000,
        status: 'Active',
        total_purchases: 85000,
        total_payments: 70000,
        last_transaction_date: '2024-01-15'
      };
      setDebtor(dummyDebtor);
      setLoading(false);
    }, 500);
  }, [id]);

  // Dummy transaction logs (combined purchases and payments)
  const [transactions] = useState([
    {
      id: 1,
      type: 'purchase',
      date: '2024-01-15',
      reference: 'INV-2024-001',
      description: 'Electronics purchase - Invoice',
      amount: 8000,
      balance_after: 15000,
      status: 'pending'
    },
    {
      id: 2,
      type: 'payment',
      date: '2024-01-10',
      reference: 'PMT-2024-005',
      description: 'Payment received via M-Pesa',
      amount: 5000,
      balance_after: 7000,
      status: 'completed',
      payment_method: 'M-Pesa'
    },
    {
      id: 3,
      type: 'purchase',
      date: '2024-01-08',
      reference: 'INV-2024-002',
      description: 'Grocery items - Invoice',
      amount: 4500,
      balance_after: 12000,
      status: 'pending'
    },
    {
      id: 4,
      type: 'payment',
      date: '2024-01-05',
      reference: 'PMT-2024-004',
      description: 'Partial payment - Cash',
      amount: 3000,
      balance_after: 7500,
      status: 'completed',
      payment_method: 'Cash'
    },
    {
      id: 5,
      type: 'purchase',
      date: '2024-01-03',
      reference: 'INV-2024-003',
      description: 'Office supplies - Invoice',
      amount: 6500,
      balance_after: 10500,
      status: 'pending'
    },
    {
      id: 6,
      type: 'payment',
      date: '2023-12-28',
      reference: 'PMT-2023-112',
      description: 'Monthly settlement via Bank Transfer',
      amount: 10000,
      balance_after: 4000,
      status: 'completed',
      payment_method: 'Bank Transfer'
    },
    {
      id: 7,
      type: 'purchase',
      date: '2023-12-20',
      reference: 'INV-2023-098',
      description: 'Hardware equipment - Invoice',
      amount: 12000,
      balance_after: 14000,
      status: 'pending'
    },
    {
      id: 8,
      type: 'payment',
      date: '2023-12-15',
      reference: 'PMT-2023-105',
      description: 'Payment received - Cash',
      amount: 2000,
      balance_after: 2000,
      status: 'completed',
      payment_method: 'Cash'
    }
  ]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
            <p className="text-gray-600">Loading debtor details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!debtor) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Debtor Not Found</h2>
          <p className="text-gray-600 mb-6">The debtor you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/debtors')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Debtors
          </button>
        </div>
      </Layout>
    );
  }

  const creditUtilization = (debtor.balance / debtor.credit_limit) * 100;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/debtors')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Debtors
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{debtor.name}</h1>
              <p className="text-gray-600">Customer Account Details</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition">
                <DollarSign size={20} />
                Record Payment
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition">
                <RefreshCw size={20} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Debtor Information Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-purple-600" size={24} />
            Customer Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                {debtor.email}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                {debtor.phone}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                {debtor.address}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                debtor.status?.toLowerCase() === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {debtor.status}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Transaction</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {new Date(debtor.last_transaction_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">{CURRENCY_SYMBOL} {debtor.balance.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
                <p className="text-2xl font-bold text-blue-600">{CURRENCY_SYMBOL} {debtor.credit_limit.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                <p className="text-2xl font-bold text-purple-600">{CURRENCY_SYMBOL} {debtor.total_purchases.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-green-600">{CURRENCY_SYMBOL} {debtor.total_payments.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingDown size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Credit Utilization */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Credit Utilization</h2>
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {CURRENCY_SYMBOL} {debtor.balance.toLocaleString()} of {CURRENCY_SYMBOL} {debtor.credit_limit.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {creditUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                creditUtilization > 80 ? 'bg-red-600' : 
                creditUtilization > 50 ? 'bg-orange-500' : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(creditUtilization, 100)}%` }}
            />
          </div>
          {creditUtilization > 80 && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle size={16} />
              Warning: Customer is approaching credit limit
            </p>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'purchase' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {transaction.type === 'purchase' ? (
                          <>
                            <TrendingUp size={12} />
                            Purchase
                          </>
                        ) : (
                          <>
                            <TrendingDown size={12} />
                            Payment
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-800">{transaction.reference}</div>
                      {transaction.payment_method && (
                        <div className="text-xs text-gray-500">{transaction.payment_method}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${
                        transaction.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'purchase' ? '+' : '-'} {CURRENCY_SYMBOL} {transaction.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-800">
                        {CURRENCY_SYMBOL} {transaction.balance_after.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {transaction.status === 'completed' ? (
                          <>
                            <CheckCircle size={12} />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewDebtor;

