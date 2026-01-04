import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { UserCheck, Plus, Edit, X, Save, Phone, Mail, MapPin, DollarSign, RefreshCw, Eye } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning } from '../utils/toast.js';

const Creditors = () => {
  const navigate = useNavigate();
  
  // Dummy data
  const [creditors, setCreditors] = useState([
    {
      id: 1,
      name: 'ABC Suppliers Ltd',
      contact_person: 'John Doe',
      email: 'john@abcsuppliers.com',
      phone: '+254 712 345 678',
      address: '123 Industrial Area, Nairobi',
      balance: 45000,
      credit_limit: 100000,
      status: 'Active'
    },
    {
      id: 2,
      name: 'XYZ Distributors',
      contact_person: 'Jane Smith',
      email: 'jane@xyzdist.com',
      phone: '+254 723 456 789',
      address: '456 Mombasa Road, Nairobi',
      balance: 28500,
      credit_limit: 75000,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Global Imports Co.',
      contact_person: 'Peter Kamau',
      email: 'peter@globalimports.com',
      phone: '+254 734 567 890',
      address: '789 Thika Road, Nairobi',
      balance: 0,
      credit_limit: 50000,
      status: 'Active'
    },
    {
      id: 4,
      name: 'Local Traders',
      contact_person: 'Mary Wanjiku',
      email: 'mary@localtraders.com',
      phone: '+254 745 678 901',
      address: '321 Ngong Road, Nairobi',
      balance: 15000,
      credit_limit: 30000,
      status: 'Inactive'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    credit_limit: '',
    status: 'Active'
  });

  const handleOpenModal = (creditor = null) => {
    if (creditor) {
      setEditingCreditor(creditor);
      setFormData({
        name: creditor.name || '',
        contact_person: creditor.contact_person || '',
        email: creditor.email || '',
        phone: creditor.phone || '',
        address: creditor.address || '',
        credit_limit: creditor.credit_limit || '',
        status: creditor.status || 'Active'
      });
    } else {
      setEditingCreditor(null);
      setFormData({
        name: '',
        contact_person: '',
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
    setEditingCreditor(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      credit_limit: '',
      status: 'Active'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_person || !formData.email) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (editingCreditor) {
      // Update existing creditor
      setCreditors(creditors.map(c => 
        c.id === editingCreditor.id 
          ? { ...c, ...formData, credit_limit: parseFloat(formData.credit_limit) }
          : c
      ));
      showSuccess(`Creditor "${formData.name}" updated successfully!`);
    } else {
      // Add new creditor
      const newCreditor = {
        id: Math.max(...creditors.map(c => c.id), 0) + 1,
        ...formData,
        balance: 0,
        credit_limit: parseFloat(formData.credit_limit)
      };
      setCreditors([...creditors, newCreditor]);
      showSuccess(`Creditor "${formData.name}" added successfully!`);
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

  const totalBalance = creditors.reduce((sum, c) => sum + c.balance, 0);
  const activeCreditors = creditors.filter(c => c.status?.toLowerCase() === 'active').length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Creditors Management</h1>
            <p className="text-gray-600">Manage suppliers and creditors</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Creditor
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Creditors</p>
                <p className="text-3xl font-bold text-gray-800">{creditors.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UserCheck size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Creditors</p>
                <p className="text-3xl font-bold text-gray-800">{activeCreditors}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Outstanding</p>
                <p className="text-3xl font-bold text-gray-800">{CURRENCY_SYMBOL} {totalBalance.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign size={28} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Creditors Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Creditor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance
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
                {creditors.map((creditor) => {
                  const utilization = getCreditUtilization(creditor.balance, creditor.credit_limit);
                  return (
                    <tr key={creditor.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                            <UserCheck className="text-blue-600" size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800">{creditor.name}</div>
                            <div className="text-xs text-gray-500">{creditor.contact_person}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 flex items-center gap-1">
                          <Mail size={14} className="text-gray-400" />
                          {creditor.email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone size={12} className="text-gray-400" />
                          {creditor.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-orange-600">
                          {CURRENCY_SYMBOL} {creditor.balance.toLocaleString()}
                        </div>
                        {utilization > 0 && (
                          <div className="text-xs text-gray-500">
                            {utilization.toFixed(0)}% utilized
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800">
                          {CURRENCY_SYMBOL} {creditor.credit_limit.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(creditor.status)}`}>
                          {creditor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/creditor/${creditor.id}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(creditor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Creditor"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Creditor Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingCreditor ? 'Edit Creditor' : 'Add New Creditor'}
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
                      Creditor Name *
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
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {editingCreditor && (
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
                    {editingCreditor ? 'Update' : 'Create'}
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

export default Creditors;

