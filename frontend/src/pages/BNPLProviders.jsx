import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { Building2, Plus, Edit, X, Save, Phone, Mail, RefreshCw, AlertCircle, Globe, Percent, Wallet } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BNPLProviders = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    website: '',
    down_payment_percentage: '',
    interest_rate_percentage: '',
    business: '',
    branch: ''
  });

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/bnpl/service-providers/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProviders(data.results || data || []);
    } catch (error) {
      console.error('Error fetching BNPL providers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Set business and branch ID from logged-in user when modal opens
  useEffect(() => {
    if (showModal && user && !editingProvider) {
      const businessId = user.business_id || user.business;
      const branchId = user.branch_id || user.branch;
      if (businessId) {
        setFormData(prev => ({ ...prev, business: businessId, branch: branchId || '' }));
      }
    }
  }, [showModal, user, editingProvider]);

  const handleOpenModal = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name || '',
        email: provider.email || '',
        phone_number: provider.phone_number || '',
        website: provider.website || '',
        down_payment_percentage: provider.down_payment_percentage || '',
        interest_rate_percentage: provider.interest_rate_percentage || '',
        business: provider.business || user?.business_id || user?.business || '',
        branch: provider.branch || user?.branch_id || user?.branch || ''
      });
    } else {
      setEditingProvider(null);
      const businessId = user?.business_id || user?.business;
      const branchId = user?.branch_id || user?.branch;
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        website: '',
        down_payment_percentage: '',
        interest_rate_percentage: '',
        business: businessId || '',
        branch: branchId || ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProvider(null);
    const businessId = user?.business_id || user?.business;
    const branchId = user?.branch_id || user?.branch;
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      website: '',
      down_payment_percentage: '',
      interest_rate_percentage: '',
      business: businessId || '',
      branch: branchId || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone_number) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (!formData.business) {
      showWarning('Business ID is required. Please ensure you are logged in.');
      return;
    }

    try {
      const submitData = {
        ...formData,
        business: parseInt(formData.business),
        branch: formData.branch ? parseInt(formData.branch) : null,
        down_payment_percentage: parseFloat(formData.down_payment_percentage) || 0,
        interest_rate_percentage: parseFloat(formData.interest_rate_percentage) || 0
      };

      if (editingProvider) {
        const response = await apiPut(`/bnpl/service-providers/${editingProvider.id}/details/`, submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess(`BNPL Provider "${formData.name}" updated successfully!`);
      } else {
        const response = await apiPost('/bnpl/service-providers/', submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess(`BNPL Provider "${formData.name}" added successfully!`);
      }

      handleCloseModal();
      fetchProviders();
    } catch (error) {
      console.error('Error saving BNPL provider:', error);
      showError(`Failed to save BNPL provider: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">BNPL Providers</h1>
            <p className="text-gray-600">Manage Buy Now Pay Later service providers</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Provider
            </button>
            <button
              onClick={fetchProviders}
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
            <span>Error loading BNPL providers: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading BNPL providers...</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Providers</p>
                  <p className="text-3xl font-bold text-gray-800">{providers.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Wallet size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg. Down Payment</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {providers.length > 0
                      ? `${(providers.reduce((sum, p) => sum + parseFloat(p.down_payment_percentage || 0), 0) / providers.length).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Percent size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg. Interest Rate</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {providers.length > 0
                      ? `${(providers.reduce((sum, p) => sum + parseFloat(p.interest_rate_percentage || 0), 0) / providers.length).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Percent size={28} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Providers Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Down Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Interest Rate
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{provider.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {provider.email || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} className="text-gray-400" />
                        {provider.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {provider.website ? (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Globe size={14} />
                          Visit Website
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Percent size={14} className="text-gray-400" />
                        {provider.down_payment_percentage || '0'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Percent size={14} className="text-gray-400" />
                        {provider.interest_rate_percentage || '0'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(provider)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Provider"
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

        {!loading && !error && providers.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Wallet size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No BNPL Providers Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first BNPL provider</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add First Provider
            </button>
          </div>
        )}

        {/* Add/Edit Provider Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProvider ? 'Edit BNPL Provider' : 'Add New BNPL Provider'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Down Payment Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.down_payment_percentage}
                      onChange={(e) => setFormData({ ...formData, down_payment_percentage: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="10.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Interest Rate Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.interest_rate_percentage}
                      onChange={(e) => setFormData({ ...formData, interest_rate_percentage: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="5.00"
                    />
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
                    {editingProvider ? 'Update' : 'Create'}
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

export default BNPLProviders;
