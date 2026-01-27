import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { Store, Plus, Edit, X, Save, MapPin, Phone, Mail, RefreshCw, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast.js';
import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const Branches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone_number: '',
    email: '',
    branch_manager: '',
    business: '',
    status: 'Active'
  });
  const [managerSearch, setManagerSearch] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/core/branches/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setBranches(data.results || data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiGet('/users/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.results || data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  // Set business ID from logged-in user when modal opens
  useEffect(() => {
    if (showModal && user && !editingBranch) {
      const businessId = user.business_id || user.business;
      if (businessId) {
        setFormData(prev => ({ ...prev, business: businessId }));
      }
    }
  }, [showModal, user, editingBranch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showManagerDropdown && !event.target.closest('.manager-dropdown-container')) {
        setShowManagerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManagerDropdown]);

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        city: branch.city || '',
        phone_number: branch.phone_number || '',
        email: branch.email || '',
        branch_manager: branch.branch_manager || branch.branch_manager_id || '',
        business: branch.business || branch.business_id || user?.business_id || user?.business || '',
        status: branch.status || 'Active'
      });
      const manager = users.find(u => u.id === (branch.branch_manager || branch.branch_manager_id));
      setManagerSearch(manager ? `${manager.first_name} ${manager.last_name}` : '');
    } else {
      setEditingBranch(null);
      const businessId = user?.business_id || user?.business;
      setFormData({
        name: '',
        address: '',
        city: '',
        phone_number: '',
        email: '',
        branch_manager: '',
        business: businessId || '',
        status: 'Active'
      });
      setManagerSearch('');
    }
    setShowManagerDropdown(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBranch(null);
    setManagerSearch('');
    setShowManagerDropdown(false);
    const businessId = user?.business_id || user?.business;
    setFormData({
      name: '',
      address: '',
      city: '',
      phone_number: '',
      email: '',
      branch_manager: '',
      business: businessId || '',
      status: 'Active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (!formData.business) {
      showWarning('Business ID is required. Please ensure you are logged in.');
      return;
    }

    try {
      // Prepare data for API - ensure branch_manager is an integer or null
      const submitData = {
        ...formData,
        branch_manager: formData.branch_manager ? parseInt(formData.branch_manager) : null,
        business: parseInt(formData.business)
      };

      if (editingBranch) {
        const response = await apiPut(`/core/branches/${editingBranch.id}/details/`, submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess(`Branch "${formData.name}" updated successfully!`);
      } else {
        const response = await apiPost('/core/branches/', submitData);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }

        showSuccess(`Branch "${formData.name}" added successfully!`);
      }

      handleCloseModal();
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      showError(`Failed to save branch: ${error.message}`);
    }
  };

  const getManagerName = (branch) => {
    const managerId = branch.branch_manager || branch.branch_manager_id;
    if (!managerId) return 'N/A';
    const manager = users.find(u => u.id === managerId);
    return manager ? `${manager.first_name} ${manager.last_name}` : 'N/A';
  };

  const filteredUsers = users.filter(userItem => {
    const fullName = `${userItem.first_name} ${userItem.last_name}`.toLowerCase();
    const searchLower = managerSearch.toLowerCase();
    return fullName.includes(searchLower) || 
           userItem.email?.toLowerCase().includes(searchLower) ||
           userItem.username?.toLowerCase().includes(searchLower);
  });

  const handleSelectManager = (selectedUser) => {
    setFormData(prev => ({ ...prev, branch_manager: selectedUser.id }));
    setManagerSearch(`${selectedUser.first_name} ${selectedUser.last_name}`);
    setShowManagerDropdown(false);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Branches Management</h1>
            <p className="text-gray-600">Manage all business branches and locations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Add Branch
            </button>
            <button
              onClick={fetchBranches}
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
            <span>Error loading branches: {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading branches...</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Branches</p>
                  <p className="text-3xl font-bold text-gray-800">{branches.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Store size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Branches</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {branches.filter(b => b.status?.toLowerCase() === 'active').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Store size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inactive Branches</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {branches.filter(b => b.status?.toLowerCase() === 'inactive').length}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Store size={28} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branches Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
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
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Store className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">{branch.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{getManagerName(branch)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {branch.email || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} className="text-gray-400" />
                        {branch.phone_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {branch.address}{branch.city ? `, ${branch.city}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(branch.status)}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(branch)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Branch"
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

        {!loading && !error && branches.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Store size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Branches Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first branch</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add First Branch
            </button>
          </div>
        )}

        {/* Add/Edit Branch Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
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
                    Branch Name *
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

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
                </div>

                <div className="relative manager-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Branch Manager
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <Search size={18} className="absolute left-3 text-gray-400" />
                      <input
                        type="text"
                        value={managerSearch}
                        onChange={(e) => {
                          setManagerSearch(e.target.value);
                          setShowManagerDropdown(true);
                        }}
                        onFocus={() => setShowManagerDropdown(true)}
                        placeholder="Search for a manager..."
                        className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 text-gray-400 cursor-pointer"
                        onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                      />
                    </div>
                    {showManagerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((userItem) => (
                            <div
                              key={userItem.id}
                              onClick={() => handleSelectManager(userItem)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">
                                {userItem.first_name} {userItem.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userItem.email} • {userItem.role}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.branch_manager && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {managerSearch}
                    </p>
                  )}
                </div>

                {editingBranch && (
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
                    {editingBranch ? 'Update' : 'Create'}
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

export default Branches;
