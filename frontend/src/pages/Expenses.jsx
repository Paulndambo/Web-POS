import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { 
  Receipt, 
  Plus, 
  Edit, 
  X, 
  Save, 
  DollarSign, 
  RefreshCw, 
  Search,
  Filter,
  Calendar,
  Tag,
  FileText,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning } from '../utils/toast.js';

const Expenses = () => {
  // Expense categories
  const categories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Supplies',
    'Marketing',
    'Transportation',
    'Maintenance',
    'Insurance',
    'Taxes',
    'Other'
  ];

  // Payment methods
  const paymentMethods = ['Cash', 'Bank Transfer', 'M-Pesa', 'Credit Card', 'Cheque'];

  // Dummy data - business expenses
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      date: '2024-01-15',
      category: 'Rent',
      description: 'Monthly shop rent - January 2024',
      amount: 50000,
      payment_method: 'Bank Transfer',
      reference: 'EXP-2024-001',
      vendor: 'Property Management Ltd',
      status: 'Paid'
    },
    {
      id: 2,
      date: '2024-01-14',
      category: 'Utilities',
      description: 'Electricity bill - December 2023',
      amount: 8500,
      payment_method: 'M-Pesa',
      reference: 'EXP-2024-002',
      vendor: 'Kenya Power',
      status: 'Paid'
    },
    {
      id: 3,
      date: '2024-01-12',
      category: 'Salaries',
      description: 'Staff salaries - January 2024',
      amount: 120000,
      payment_method: 'Bank Transfer',
      reference: 'EXP-2024-003',
      vendor: 'Staff Payroll',
      status: 'Paid'
    },
    {
      id: 4,
      date: '2024-01-10',
      category: 'Supplies',
      description: 'Office supplies and stationery',
      amount: 4500,
      payment_method: 'Cash',
      reference: 'EXP-2024-004',
      vendor: 'Office Mart',
      status: 'Paid'
    },
    {
      id: 5,
      date: '2024-01-08',
      category: 'Marketing',
      description: 'Social media advertising campaign',
      amount: 15000,
      payment_method: 'Credit Card',
      reference: 'EXP-2024-005',
      vendor: 'Facebook Ads',
      status: 'Paid'
    },
    {
      id: 6,
      date: '2024-01-05',
      category: 'Transportation',
      description: 'Fuel and vehicle maintenance',
      amount: 12000,
      payment_method: 'Cash',
      reference: 'EXP-2024-006',
      vendor: 'Shell Petrol Station',
      status: 'Paid'
    },
    {
      id: 7,
      date: '2024-01-03',
      category: 'Maintenance',
      description: 'Air conditioning repair',
      amount: 8000,
      payment_method: 'M-Pesa',
      reference: 'EXP-2024-007',
      vendor: 'Cool Air Services',
      status: 'Paid'
    },
    {
      id: 8,
      date: '2024-01-02',
      category: 'Utilities',
      description: 'Water bill - December 2023',
      amount: 2500,
      payment_method: 'M-Pesa',
      reference: 'EXP-2024-008',
      vendor: 'Nairobi Water',
      status: 'Paid'
    },
    {
      id: 9,
      date: '2024-01-16',
      category: 'Insurance',
      description: 'Business insurance premium - Q1 2024',
      amount: 25000,
      payment_method: 'Bank Transfer',
      reference: 'EXP-2024-009',
      vendor: 'Insurance Company Ltd',
      status: 'Pending'
    },
    {
      id: 10,
      date: '2024-01-17',
      category: 'Taxes',
      description: 'VAT payment - December 2023',
      amount: 35000,
      payment_method: 'Bank Transfer',
      reference: 'EXP-2024-010',
      vendor: 'KRA',
      status: 'Pending'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    description: '',
    amount: '',
    payment_method: 'Cash',
    reference: '',
    vendor: '',
    status: 'Paid'
  });

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        date: expense.date || '',
        category: expense.category || 'Other',
        description: expense.description || '',
        amount: expense.amount || '',
        payment_method: expense.payment_method || 'Cash',
        reference: expense.reference || '',
        vendor: expense.vendor || '',
        status: expense.status || 'Paid'
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        description: '',
        amount: '',
        payment_method: 'Cash',
        reference: '',
        vendor: '',
        status: 'Paid'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      description: '',
      amount: '',
      payment_method: 'Cash',
      reference: '',
      vendor: '',
      status: 'Paid'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (editingExpense) {
      // Update existing expense
      setExpenses(expenses.map(exp => 
        exp.id === editingExpense.id 
          ? { ...exp, ...formData, amount: parseFloat(formData.amount) }
          : exp
      ));
      showSuccess(`Expense "${formData.description}" updated successfully!`);
    } else {
      // Add new expense
      const newExpense = {
        id: Math.max(...expenses.map(e => e.id), 0) + 1,
        ...formData,
        amount: parseFloat(formData.amount),
        reference: formData.reference || `EXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`
      };
      setExpenses([newExpense, ...expenses]);
      showSuccess(`Expense "${formData.description}" added successfully!`);
    }

    handleCloseModal();
  };

  const handleDelete = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(exp => exp.id !== expenseId));
      showSuccess('Expense deleted successfully!');
    }
  };

  const getStatusBadge = (status) => {
    return status?.toLowerCase() === 'paid' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-yellow-100 text-yellow-700';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Rent': 'bg-purple-100 text-purple-700',
      'Utilities': 'bg-blue-100 text-blue-700',
      'Salaries': 'bg-green-100 text-green-700',
      'Supplies': 'bg-orange-100 text-orange-700',
      'Marketing': 'bg-pink-100 text-pink-700',
      'Transportation': 'bg-indigo-100 text-indigo-700',
      'Maintenance': 'bg-yellow-100 text-yellow-700',
      'Insurance': 'bg-red-100 text-red-700',
      'Taxes': 'bg-gray-100 text-gray-700',
      'Other': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // Filter expenses based on search term and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || expense.status === filterStatus;

    let matchesDateRange = true;
    if (filterDateRange !== 'All') {
      const expenseDate = new Date(expense.date);
      const today = new Date();
      
      if (filterDateRange === 'Today') {
        matchesDateRange = expenseDate.toDateString() === today.toDateString();
      } else if (filterDateRange === 'This Week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDateRange = expenseDate >= weekAgo;
      } else if (filterDateRange === 'This Month') {
        matchesDateRange = expenseDate.getMonth() === today.getMonth() && 
                          expenseDate.getFullYear() === today.getFullYear();
      } else if (filterDateRange === 'This Year') {
        matchesDateRange = expenseDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = filteredExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

  // Calculate expenses by category
  const expensesByCategory = categories.map(cat => ({
    category: cat,
    total: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  const clearFilters = () => {
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterDateRange('All');
    setSearchTerm('');
  };

  const activeFiltersCount = [filterCategory, filterStatus, filterDateRange].filter(f => f !== 'All').length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Expenses Management</h1>
            <p className="text-gray-600">Track and manage business expenses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Expense
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
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{CURRENCY_SYMBOL} {totalExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Receipt size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">{CURRENCY_SYMBOL} {paidExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{CURRENCY_SYMBOL} {pendingExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <DollarSign size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-3xl font-bold text-blue-600">{filteredExpenses.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText size={24} className="text-blue-600" />
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
                placeholder="Search by description, vendor, reference, or category..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
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

        {/* Category Breakdown */}
        {expensesByCategory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={24} />
              Expenses by Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expensesByCategory.map(item => (
                <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{CURRENCY_SYMBOL} {item.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((item.total / totalExpenses) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vendor
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
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || activeFiltersCount > 0 
                        ? 'No expenses found matching your search or filters.' 
                        : 'No expenses found. Add your first expense to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">{expense.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(expense.category)}`}>
                          <Tag size={12} />
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 font-medium">{expense.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{expense.vendor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{expense.payment_method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-red-600">
                          {CURRENCY_SYMBOL} {expense.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(expense)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Expense"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Expense"
                          >
                            <Trash2 size={18} />
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

        {/* Add/Edit Expense Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
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
                      Vendor *
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
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
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
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
                    {editingExpense ? 'Update' : 'Create'}
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

export default Expenses;

