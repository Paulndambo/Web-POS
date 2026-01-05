import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { Users, Plus, Edit, X, Save, Phone, Mail, MapPin, DollarSign, RefreshCw, Eye, Search } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning } from '../utils/toast.js';

const Debtors = () => {
  const navigate = useNavigate();
  
  // Dummy data - customers who owe money to the business
  const [debtors, setDebtors] = useState([
    {
      id: 1,
      name: 'John Kamau',
      email: 'john.kamau@email.com',
      phone: '+254 712 345 678',
      address: '123 Westlands, Nairobi',
      balance: 15000, // Amount they owe
      credit_limit: 50000,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Sarah Njeri',
      email: 'sarah.njeri@email.com',
      phone: '+254 723 456 789',
      address: '456 Kilimani, Nairobi',
      balance: 8500,
      credit_limit: 30000,
      status: 'Active'
    },
    {
      id: 3,
      name: 'David Ochieng',
      email: 'david.ochieng@email.com',
      phone: '+254 734 567 890',
      address: '789 Parklands, Nairobi',
      balance: 0,
      credit_limit: 20000,
      status: 'Active'
    },
    {
      id: 4,
      name: 'Grace Wambui',
      email: 'grace.wambui@email.com',
      phone: '+254 745 678 901',
      address: '321 Karen, Nairobi',
      balance: 25000,
      credit_limit: 60000,
      status: 'Active'
    },
    {
      id: 5,
      name: 'Michael Otieno',
      email: 'michael.otieno@email.com',
      phone: '+254 756 789 012',
      address: '654 Lavington, Nairobi',
      balance: 12000,
      credit_limit: 40000,
      status: 'Inactive'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    credit_limit: '',
    status: 'Active'
  });

  const handleOpenModal = (debtor = null) => {
    if (debtor) {
      setEditingDebtor(debtor);
      setFormData({
        name: debtor.name || '',
        email: debtor.email || '',
        phone: debtor.phone || '',
        address: debtor.address || '',
        credit_limit: debtor.credit_limit || '',
        status: debtor.status || 'Active'
      });
    } else {
      setEditingDebtor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        credit_limit: '',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDebtor(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      credit_limit: '',
      status: 'Active'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (editingDebtor) {
      // Update existing debtor
      setDebtors(debtors.map(d => 
        d.id === editingDebtor.id 
          ? { ...d, ...formData, credit_limit: parseFloat(formData.credit_limit) }
          : d
      ));
      showSuccess(`Debtor "${formData.name}" updated successfully!`);
    } else {
      // Add new debtor
      const newDebtor = {
        id: Math.max(...debtors.map(d => d.id), 0) + 1,
        ...formData,
        balance: 0,
        credit_limit: parseFloat(formData.credit_limit)
      };
      setDebtors([...debtors, newDebtor]);
      showSuccess(`Debtor "${formData.name}" added successfully!`);
    }

    handleCloseModal();
  };

  const getStatusBadge = (status) => {
    return status?.toLowerCase() === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  };

  const getCreditUtilization = (balance, limit) => {
    if (!limit) return 0;
    return (balance / limit) * 100;
  };

  // Filter debtors based on search term
  const filteredDebtors = debtors.filter(debtor => 
    debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debtor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debtor.phone.includes(searchTerm)
  );

  const totalBalance = debtors.reduce((sum, d) => sum + d.balance, 0);
  const activeDebtors = debtors.filter(d => d.status?.toLowerCase() === 'active').length;
  const debtorsWithBalance = debtors.filter(d => d.balance > 0).length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Debtors Management</h1>
            <p className="text-gray-600">Manage customers with outstanding balances</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Debtor
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
                <p className="text-sm text-gray-600 mb-1">Total Debtors</p>
                <p className="text-3xl font-bold text-gray-800">{debtors.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Debtors</p>
                <p className="text-3xl font-bold text-gray-800">{activeDebtors}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Receivables</p>
                <p className="text-3xl font-bold text-gray-800">{CURRENCY_SYMBOL} {totalBalance.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign size={28} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">With Balance</p>
                <p className="text-3xl font-bold text-gray-800">{debtorsWithBalance}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign size={28} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Debtors Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Outstanding Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No debtors found matching your search.' : 'No debtors found. Add your first debtor to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map((debtor) => {
                    const utilization = getCreditUtilization(debtor.balance, debtor.credit_limit);
                    return (
                      <tr key={debtor.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                              <Users className="text-purple-600" size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-800">{debtor.name}</div>
                              <div className="text-xs text-gray-500">{debtor.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800 flex items-center gap-1">
                            <Mail size={14} className="text-gray-400" />
                            {debtor.email}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone size={12} className="text-gray-400" />
                            {debtor.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${debtor.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {CURRENCY_SYMBOL} {debtor.balance.toLocaleString()}
                          </div>
                          {utilization > 0 && (
                            <div className="text-xs text-gray-500">
                              {utilization.toFixed(0)}% of limit
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-800">
                            {CURRENCY_SYMBOL} {debtor.credit_limit.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(debtor.status)}`}>
                            {debtor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/debtor/${debtor.id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleOpenModal(debtor)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Debtor"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Debtor Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingDebtor ? 'Edit Debtor' : 'Add New Debtor'}
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
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Credit Limit *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {editingDebtor && (
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
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}

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
                    {editingDebtor ? 'Update' : 'Create'}
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

export default Debtors;

