import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  X, 
  Save, 
  DollarSign, 
  RefreshCw, 
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning } from '../utils/toast.js';

const Payments = () => {
  // Payment types
  const paymentTypes = ['Customer Payment', 'Supplier Payment', 'Expense Payment', 'Other'];
  
  // Payment methods
  const paymentMethods = ['Cash', 'Bank Transfer', 'M-Pesa', 'Credit Card', 'Cheque', 'Other'];

  // Payment statuses
  const statuses = ['Completed', 'Pending', 'Failed', 'Cancelled'];

  // Dummy data - all payments (incoming and outgoing)
  const [payments, setPayments] = useState([
    {
      id: 1,
      date: '2024-01-15',
      reference: 'PAY-2024-001',
      type: 'Customer Payment',
      payer_payee: 'John Kamau',
      description: 'Payment for Invoice INV-2024-045',
      amount: 15000,
      payment_method: 'M-Pesa',
      transaction_id: 'MPE123456789',
      status: 'Completed',
      direction: 'incoming'
    },
    {
      id: 2,
      date: '2024-01-14',
      reference: 'PAY-2024-002',
      type: 'Supplier Payment',
      payer_payee: 'ABC Suppliers Ltd',
      description: 'Payment for inventory purchase',
      amount: 45000,
      payment_method: 'Bank Transfer',
      transaction_id: 'BT987654321',
      status: 'Completed',
      direction: 'outgoing'
    },
    {
      id: 3,
      date: '2024-01-13',
      reference: 'PAY-2024-003',
      type: 'Customer Payment',
      payer_payee: 'Sarah Njeri',
      description: 'Partial payment for Invoice INV-2024-042',
      amount: 8500,
      payment_method: 'Cash',
      transaction_id: 'CASH-001',
      status: 'Completed',
      direction: 'incoming'
    },
    {
      id: 4,
      date: '2024-01-12',
      reference: 'PAY-2024-004',
      type: 'Expense Payment',
      payer_payee: 'Kenya Power',
      description: 'Electricity bill payment',
      amount: 8500,
      payment_method: 'M-Pesa',
      transaction_id: 'MPE987654321',
      status: 'Completed',
      direction: 'outgoing'
    },
    {
      id: 5,
      date: '2024-01-11',
      reference: 'PAY-2024-005',
      type: 'Customer Payment',
      payer_payee: 'Grace Wambui',
      description: 'Payment for Invoice INV-2024-038',
      amount: 25000,
      payment_method: 'Bank Transfer',
      transaction_id: 'BT123456789',
      status: 'Completed',
      direction: 'incoming'
    },
    {
      id: 6,
      date: '2024-01-10',
      reference: 'PAY-2024-006',
      type: 'Supplier Payment',
      payer_payee: 'XYZ Distributors',
      description: 'Payment for stock delivery',
      amount: 28500,
      payment_method: 'Cheque',
      transaction_id: 'CHQ-001234',
      status: 'Pending',
      direction: 'outgoing'
    },
    {
      id: 7,
      date: '2024-01-09',
      reference: 'PAY-2024-007',
      type: 'Customer Payment',
      payer_payee: 'David Ochieng',
      description: 'Payment for Invoice INV-2024-035',
      amount: 12000,
      payment_method: 'M-Pesa',
      transaction_id: 'MPE456789123',
      status: 'Completed',
      direction: 'incoming'
    },
    {
      id: 8,
      date: '2024-01-08',
      reference: 'PAY-2024-008',
      type: 'Expense Payment',
      payer_payee: 'Property Management Ltd',
      description: 'Monthly rent payment',
      amount: 50000,
      payment_method: 'Bank Transfer',
      transaction_id: 'BT555666777',
      status: 'Completed',
      direction: 'outgoing'
    },
    {
      id: 9,
      date: '2024-01-16',
      reference: 'PAY-2024-009',
      type: 'Customer Payment',
      payer_payee: 'Michael Otieno',
      description: 'Payment for Invoice INV-2024-048',
      amount: 18000,
      payment_method: 'Credit Card',
      transaction_id: 'CC789456123',
      status: 'Pending',
      direction: 'incoming'
    },
    {
      id: 10,
      date: '2024-01-17',
      reference: 'PAY-2024-010',
      type: 'Supplier Payment',
      payer_payee: 'Global Imports Co.',
      description: 'Payment for bulk order',
      amount: 32000,
      payment_method: 'Bank Transfer',
      transaction_id: 'BT111222333',
      status: 'Failed',
      direction: 'outgoing'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDirection, setFilterDirection] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Customer Payment',
    payer_payee: '',
    description: '',
    amount: '',
    payment_method: 'Cash',
    transaction_id: '',
    status: 'Completed',
    direction: 'incoming'
  });

  const handleOpenModal = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        date: payment.date || '',
        type: payment.type || 'Customer Payment',
        payer_payee: payment.payer_payee || '',
        description: payment.description || '',
        amount: payment.amount || '',
        payment_method: payment.payment_method || 'Cash',
        transaction_id: payment.transaction_id || '',
        status: payment.status || 'Completed',
        direction: payment.direction || 'incoming'
      });
    } else {
      setEditingPayment(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Customer Payment',
        payer_payee: '',
        description: '',
        amount: '',
        payment_method: 'Cash',
        transaction_id: '',
        status: 'Completed',
        direction: 'incoming'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Customer Payment',
      payer_payee: '',
      description: '',
      amount: '',
      payment_method: 'Cash',
      transaction_id: '',
      status: 'Completed',
      direction: 'incoming'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.payer_payee || !formData.amount || !formData.description) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (editingPayment) {
      // Update existing payment
      setPayments(payments.map(pay => 
        pay.id === editingPayment.id 
          ? { ...pay, ...formData, amount: parseFloat(formData.amount) }
          : pay
      ));
      showSuccess(`Payment "${formData.reference || 'record'}" updated successfully!`);
    } else {
      // Add new payment
      const newPayment = {
        id: Math.max(...payments.map(p => p.id), 0) + 1,
        ...formData,
        amount: parseFloat(formData.amount),
        reference: `PAY-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`
      };
      setPayments([newPayment, ...payments]);
      showSuccess(`Payment recorded successfully!`);
    }

    handleCloseModal();
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Completed': 'bg-green-100 text-green-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Failed': 'bg-red-100 text-red-700',
      'Cancelled': 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Completed': <CheckCircle size={14} />,
      'Pending': <Clock size={14} />,
      'Failed': <XCircle size={14} />,
      'Cancelled': <XCircle size={14} />
    };
    return icons[status] || <Clock size={14} />;
  };

  // Filter payments based on search term and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.payer_payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'All' || payment.type === filterType;
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesDirection = filterDirection === 'All' || payment.direction === filterDirection;

    let matchesDateRange = true;
    if (filterDateRange !== 'All') {
      const paymentDate = new Date(payment.date);
      const today = new Date();
      
      if (filterDateRange === 'Today') {
        matchesDateRange = paymentDate.toDateString() === today.toDateString();
      } else if (filterDateRange === 'This Week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDateRange = paymentDate >= weekAgo;
      } else if (filterDateRange === 'This Month') {
        matchesDateRange = paymentDate.getMonth() === today.getMonth() && 
                          paymentDate.getFullYear() === today.getFullYear();
      } else if (filterDateRange === 'This Year') {
        matchesDateRange = paymentDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDirection && matchesDateRange;
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const incomingPayments = filteredPayments.filter(p => p.direction === 'incoming').reduce((sum, p) => sum + p.amount, 0);
  const outgoingPayments = filteredPayments.filter(p => p.direction === 'outgoing').reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = filteredPayments.filter(p => p.status === 'Completed').length;

  const clearFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterDirection('All');
    setFilterDateRange('All');
    setSearchTerm('');
  };

  const activeFiltersCount = [filterType, filterStatus, filterDirection, filterDateRange].filter(f => f !== 'All').length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments Management</h1>
            <p className="text-gray-600">Track all incoming and outgoing payments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Record Payment
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">{CURRENCY_SYMBOL} {totalPayments.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Incoming</p>
                <p className="text-2xl font-bold text-green-600">{CURRENCY_SYMBOL} {incomingPayments.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Outgoing</p>
                <p className="text-2xl font-bold text-red-600">{CURRENCY_SYMBOL} {outgoingPayments.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-purple-600">{completedPayments}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by payer/payee, description, reference, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
                showFilterPanel 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter size={20} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Directions</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Status</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="This Year">This Year</option>
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payer/Payee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || activeFiltersCount > 0 
                        ? 'No payments found matching your search or filters.' 
                        : 'No payments found. Record your first payment to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">{payment.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.direction === 'incoming' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {payment.direction === 'incoming' ? '↓' : '↑'} {payment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 font-medium flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          {payment.payer_payee}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{payment.description}</div>
                        <div className="text-xs text-gray-500">ID: {payment.transaction_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{payment.payment_method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-bold ${
                          payment.direction === 'incoming' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {payment.direction === 'incoming' ? '+' : '-'} {CURRENCY_SYMBOL} {payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(payment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Payment"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Payment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingPayment ? 'Edit Payment' : 'Record New Payment'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Direction *
                    </label>
                    <select
                      value={formData.direction}
                      onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="incoming">Incoming (Received)</option>
                      <option value="outgoing">Outgoing (Paid)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      {paymentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {formData.direction === 'incoming' ? 'Payer' : 'Payee'} *
                    </label>
                    <input
                      type="text"
                      value={formData.payer_payee}
                      onChange={(e) => setFormData({ ...formData, payer_payee: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder={formData.direction === 'incoming' ? 'Who paid?' : 'Who received payment?'}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={18} />
                    {editingPayment ? 'Update' : 'Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Payments;

