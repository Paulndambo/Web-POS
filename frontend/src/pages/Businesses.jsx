import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { Building2, Plus, Edit, X, Save, MapPin, Phone, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';

const Businesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    business_type: '',
    tax_number: '',
    currency: 'KES',
    status: 'Active'
  });

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Businesses endpoint doesn't require authentication
      const response = await apiGet('/core/businesses/', false);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setBusinesses(data.results || data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleOpenModal = (business = null) => {
    if (business) {
      setEditingBusiness(business);
      setFormData({
        name: business.name || '',
        owner_name: business.owner_name || '',
        email: business.email || '',
        phone_number: business.phone_number || '',
        address: business.address || '',
        city: business.city || '',
        business_type: business.business_type || '',
        tax_number: business.tax_number || '',
        currency: business.currency || 'KES',
        status: business.status || 'Active'
      });
    } else {
      setEditingBusiness(null);
      setFormData({
        name: '',
        owner_name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        business_type: '',
        tax_number: '',
        currency: 'KES',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBusiness(null);
    setFormData({
      name: '',
      owner_name: '',
      email: '',
      phone_number: '',
      address: '',
      city: '',
      business_type: '',
      tax_number: '',
      currency: 'KES',
      status: 'Active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.owner_name || !formData.email) {
      showWarning('Please fill in all required fields');
      return;
    }

    try {
      if (editingBusiness) {
        // Update existing business - doesn't require authentication
        const response = await apiPut(`/core/businesses/${editingBusiness.id}/details/`, formData, false);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        showSuccess(`Business "${formData.name}" updated successfully!`);
      } else {
        // Add new business - doesn't require authentication
        const response = await apiPost('/core/businesses/', formData, false);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        showSuccess(`Business "${formData.name}" added successfully!`);
      }

      handleCloseModal();
      fetchBusinesses(); // Refresh the list
    } catch (error) {
      console.error('Error saving business:', error);
      showError(`Failed to save business: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    return statusLower === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Businesses Management</h1>
            <p className="text-gray-600">Manage all business locations and details</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Business
            </button>
            <button
              onClick={fetchBusinesses}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Error loading businesses: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading businesses...</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
                  <p className="text-3xl font-bold text-gray-800">{businesses.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building2 size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Businesses</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {businesses.filter(b => b.status?.toLowerCase() === 'active').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Building2 size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inactive Businesses</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {businesses.filter(b => b.status?.toLowerCase() === 'inactive').length}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Building2 size={28} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Businesses Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tax ID
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
                {businesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{business.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} />
                            {business.address}{business.city ? `, ${business.city}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{business.owner_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {business.email}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} className="text-gray-400" />
                        {business.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-600">{business.tax_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(business.status)}`}>
                        {business.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(business)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Business"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {!loading && !error && businesses.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Businesses Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first business</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add First Business
            </button>
          </div>
        )}

        {/* Add/Edit Business Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingBusiness ? 'Edit Business' : 'Add New Business'}
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
                      Business Name *
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
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
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
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <input
                      type="text"
                      value={formData.business_type}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Electronics, Retail"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tax Number *
                    </label>
                    <input
                      type="text"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., A0929UDKDX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  {editingBusiness && (
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
                    {editingBusiness ? 'Update' : 'Create'}
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

export default Businesses;

