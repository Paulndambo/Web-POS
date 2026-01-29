import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { 
  ArrowLeft, Users, Mail, MapPin, DollarSign, 
  TrendingUp, TrendingDown, Calendar, RefreshCw, AlertCircle,
  CreditCard, CheckCircle, Clock, Building2, User, FileText
} from 'lucide-react';
import { apiGet } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { showError } from '../utils/toast.js';

const ViewDebtor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [debtor, setDebtor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchDebtorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/finances/debtors/${id}/details/`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDebtor(data);
      
      // Combine repayments and loanawards into transactions
      const combinedTransactions = [];
      
      // Add loan awards (purchases/loans issued)
      if (data.loanawards && data.loanawards.length > 0) {
        data.loanawards.forEach(loan => {
          combinedTransactions.push({
            id: `loan-${loan.id}`,
            type: 'loan',
            date: loan.issued_at || loan.created_at,
            reference: `LOAN-${loan.id}`,
            description: loan.action || 'Loan issued',
            amount: parseFloat(loan.amount || 0),
            status: 'completed',
            performed_by: loan.performed_by
          });
        });
      }
      
      // Add repayments (payments received)
      if (data.repayments && data.repayments.length > 0) {
        data.repayments.forEach(repayment => {
          combinedTransactions.push({
            id: `repayment-${repayment.id}`,
            type: 'repayment',
            date: repayment.repayment_date || repayment.created_at,
            reference: `REP-${repayment.id}`,
            description: `Repayment via ${repayment.channel}`,
            amount: parseFloat(repayment.amount || 0),
            status: 'completed',
            channel: repayment.channel,
            received_by: repayment.received_by
          });
        });
      }
      
      // Sort by date (newest first)
      combinedTransactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      setTransactions(combinedTransactions);
    } catch (error) {
      console.error('Error fetching debtor details:', error);
      setError(error.message);
      showError(`Failed to load debtor details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      fetchDebtorDetails();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

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

  if (error || !debtor) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Debtor Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The debtor you\'re looking for doesn\'t exist.'}</p>
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{debtor.customer_name || 'N/A'}</h1>
              <p className="text-gray-600">Customer Account Details</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchDebtorDetails}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
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
                {debtor.customer_email || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Card Number</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                {debtor.customer_card_number || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Business</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                {debtor.business_name || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Branch</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                {debtor.branch_name || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Issued By</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                {debtor.issuer || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Issued Date</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {formatDate(debtor.issued_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Outstanding Amount</p>
                <p className={`text-2xl font-bold ${parseFloat(debtor.outstanding_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {CURRENCY_SYMBOL} {parseFloat(debtor.outstanding_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {CURRENCY_SYMBOL} {parseFloat(debtor.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FileText size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {CURRENCY_SYMBOL} {parseFloat(debtor.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingDown size={24} className="text-green-600" />
              </div>
            </div>
          </div>
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
                    -
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No transactions found for this debtor.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(transaction.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'loan' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {transaction.type === 'loan' ? (
                          <>
                            <TrendingUp size={12} />
                            Loan Issued
                          </>
                        ) : (
                          <>
                            <TrendingDown size={12} />
                            Repayment
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-800">{transaction.reference}</div>
                      {transaction.channel && (
                        <div className="text-xs text-gray-500">{transaction.channel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${
                        transaction.type === 'loan' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'loan' ? '+' : '-'} {CURRENCY_SYMBOL} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-800">
                        -
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewDebtor;

