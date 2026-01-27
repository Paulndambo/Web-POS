import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useCustomers } from '../contexts/CustomersContext.jsx';
import { 
  Users, Plus, Edit, X, Save, Phone, Mail, MapPin, Star, Award, 
  RefreshCw, Eye, Search, CreditCard, TrendingUp, Calendar, Receipt 
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning, showError } from '../utils/toast.js';

const Customers = () => {
  const navigate = useNavigate();
  const { customers, loading, error, addCustomer, updateCustomer, deleteCustomer, addPoints, redeemPoints, fetchCustomers } = useCustomers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    loyaltyCardNumber: '',
    points: 0
  });
  const [pointsFormData, setPointsFormData] = useState({
    action: 'add', // 'add' or 'redeem'
    points: '',
    moneySpend: '',
    description: ''
  });

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        loyaltyCardNumber: customer.loyaltyCardNumber || '',
        points: customer.points || 0
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        loyaltyCardNumber: '',
        points: 0
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      loyaltyCardNumber: '',
      points: 0
    });
  };

  const handleOpenPointsModal = (customer) => {
    setSelectedCustomer(customer);
    setPointsFormData({
      action: 'add',
      points: '',
      moneySpend: '',
      description: ''
    });
    setShowPointsModal(true);
  };

  const handleClosePointsModal = () => {
    setShowPointsModal(false);
    setSelectedCustomer(null);
    setPointsFormData({
      action: 'add',
      points: '',
      moneySpend: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingCustomer) {
      // When editing, validate required fields: name, email, phone, address
      if (!formData.name || !formData.email || !formData.phone || !formData.address) {
        showWarning('Please fill in all required fields (Name, Email, Phone, Address)');
        return;
      }
    } else {
      // When creating, only name and email are required
      if (!formData.name || !formData.email) {
        showWarning('Please fill in all required fields');
        return;
      }
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        showSuccess(`Customer "${formData.name}" updated successfully!`);
      } else {
        await addCustomer(formData);
        showSuccess(`Customer "${formData.name}" added successfully!`);
      }
      handleCloseModal();
    } catch (error) {
      showError(error.message || 'Failed to save customer');
    }
  };

  const handlePointsSubmit = async (e) => {
    e.preventDefault();
    
    if (!pointsFormData.points || parseFloat(pointsFormData.points) <= 0) {
      showWarning('Please enter a valid number of points');
      return;
    }

    if (pointsFormData.action === 'add' && (!pointsFormData.moneySpend || parseFloat(pointsFormData.moneySpend) < 0)) {
      showWarning('Please enter a valid amount spent (must be 0 or greater)');
      return;
    }

    // Validate that redemption amount doesn't exceed available points
    if (pointsFormData.action === 'redeem') {
      const pointsToRedeem = parseFloat(pointsFormData.points);
      const availablePoints = selectedCustomer.points || 0;
      if (pointsToRedeem > availablePoints) {
        showWarning(`Cannot redeem ${pointsToRedeem} points. Available points: ${availablePoints}`);
        return;
      }
    }

    try {
      const points = parseFloat(pointsFormData.points);
      if (pointsFormData.action === 'add') {
        const moneySpend = parseFloat(pointsFormData.moneySpend || 0);
        await addPoints(selectedCustomer.id, points, moneySpend, null, pointsFormData.description);
        showSuccess(`${points} points added to ${selectedCustomer.name}`);
      } else {
        await redeemPoints(selectedCustomer.id, points, pointsFormData.description);
        showSuccess(`${points} points redeemed for ${selectedCustomer.name}`);
      }
      handleClosePointsModal();
    } catch (error) {
      showError(error.message || 'Failed to process points');
    }
  };

  const getStatusBadge = (status) => {
    return status?.toLowerCase() === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.loyaltyCardNumber?.includes(searchTerm)
  );

  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const activeCustomers = customers.filter(c => c.status !== 'Inactive').length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Customers & Loyalty</h1>
            <p className="text-gray-600">Manage customer loyalty cards and shopping points</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Customer
            </button>
            <button
              onClick={fetchCustomers}
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
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-gray-800">{totalCustomers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Customers</p>
                <p className="text-3xl font-bold text-gray-800">{activeCustomers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Points</p>
                <p className="text-3xl font-bold text-gray-800">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Star size={28} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-800">{CURRENCY_SYMBOL} {totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp size={28} className="text-orange-600" />
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
              placeholder="Search by name, email, phone, or loyalty card number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600">Loading customers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Customers Table */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Loyalty Card
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                            <Users className="text-purple-600" size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800">{customer.name}</div>
                            {customer.address && (
                              <div className="text-xs text-gray-500">{customer.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-gray-400" />
                          <span className="text-sm font-mono text-gray-800">{customer.loyaltyCardNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-gray-800">{customer.points || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800">
                          {CURRENCY_SYMBOL} {(customer.totalSpent || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 flex items-center gap-1">
                          <Mail size={14} className="text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone size={12} className="text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/customer/${customer.id}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenPointsModal(customer)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Manage Points"
                          >
                            <Award size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(customer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Customer"
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
        )}

        {/* Add/Edit Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                      Phone Number {editingCustomer && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required={!!editingCustomer}
                    />
                  </div>

                  {!editingCustomer && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loyalty Card Number
                      </label>
                      <input
                        type="text"
                        value={formData.loyaltyCardNumber}
                        onChange={(e) => setFormData({ ...formData, loyaltyCardNumber: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Auto-generated if left empty"
                      />
                    </div>
                  )}

                  {editingCustomer && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loyalty Card Number
                      </label>
                      <input
                        type="text"
                        value={editingCustomer.loyaltyCardNumber || editingCustomer.card_number || ''}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        disabled
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address {editingCustomer && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required={!!editingCustomer}
                  />
                </div>

                {editingCustomer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Only customer name, email, phone number, and address can be edited. 
                      Points and loyalty card number cannot be modified.
                    </p>
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
                    {editingCustomer ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Points Management Modal */}
        {showPointsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Manage Points - {selectedCustomer.name}
                </h2>
                <button
                  onClick={handleClosePointsModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-bold text-gray-800">
                    Current Points: {selectedCustomer.points || 0}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePointsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Action *
                  </label>
                  <select
                    value={pointsFormData.action}
                    onChange={(e) => {
                      const newAction = e.target.value;
                      setPointsFormData({ 
                        ...pointsFormData, 
                        action: newAction,
                        moneySpend: newAction === 'redeem' ? '' : pointsFormData.moneySpend
                      });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="add">Add Points</option>
                    <option value="redeem">Redeem Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Points *
                  </label>
                  <input
                    type="number"
                    value={pointsFormData.points}
                    onChange={(e) => setPointsFormData({ ...pointsFormData, points: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    min="1"
                    max={pointsFormData.action === 'redeem' ? (selectedCustomer?.points || 0) : undefined}
                    required
                  />
                  {pointsFormData.action === 'redeem' && selectedCustomer && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available points: {selectedCustomer.points || 0}
                    </p>
                  )}
                </div>

                {pointsFormData.action === 'add' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Money Spent {CURRENCY_SYMBOL} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pointsFormData.moneySpend}
                      onChange={(e) => setPointsFormData({ ...pointsFormData, moneySpend: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      min="0"
                      required={pointsFormData.action === 'add'}
                      placeholder="Enter amount spent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Amount of money the customer spent to earn these points
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={pointsFormData.description}
                    onChange={(e) => setPointsFormData({ ...pointsFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                    placeholder="Optional description for this transaction"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePointsModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      pointsFormData.action === 'add'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {pointsFormData.action === 'add' ? 'Add Points' : 'Redeem Points'}
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

export default Customers;

