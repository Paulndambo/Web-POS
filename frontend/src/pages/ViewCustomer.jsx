import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { apiGet, apiPatch } from '../utils/api.js';
import { showSuccess, showError } from '../utils/toast.js';
import { 
  ArrowLeft, Users, Mail, Phone, MapPin, Star, 
  Calendar, RefreshCw, AlertCircle, CreditCard, TrendingUp, TrendingDown,
  Award, Edit, Save, X
} from 'lucide-react';

const ViewCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    customer_email: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/customers/loyalty-cards/${id}/details/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCustomer(data);
      // Initialize form data
      setFormData({
        customer_name: data.customer_name || '',
        phone_number: data.phone_number || '',
        customer_email: data.customer_email || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original customer data
    if (customer) {
      setFormData({
        customer_name: customer.customer_name || '',
        phone_number: customer.phone_number || '',
        customer_email: customer.customer_email || '',
        address: customer.address || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await apiPatch(`/customers/loyalty-cards/${id}/details/`, formData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const updatedData = await response.json();
      setCustomer(updatedData);
      setIsEditing(false);
      showSuccess('Customer information updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      showError(error.message || 'Failed to update customer information');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
            <p className="text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The customer you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate('/customers')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Customers
          </button>
        </div>
      </Layout>
    );
  }

  const totalRecharges = customer.recharges?.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0) || 0;
  const totalRedeems = customer.redeems?.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0) || 0;
  const netPoints = totalRecharges - totalRedeems;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Customers
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{customer.customer_name}</h1>
              <p className="text-gray-600">Loyalty Card Details</p>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                  >
                    <Edit size={20} />
                    Edit
                  </button>
                  <button
                    onClick={fetchCustomerDetails}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                  >
                    <RefreshCw size={20} />
                    Refresh
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                  >
                    <X size={20} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-purple-600" size={24} />
            Customer Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loyalty Card Number - Read Only */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Loyalty Card Number</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                {customer.card_number}
              </p>
            </div>
            
            {/* Customer Name - Editable */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Customer Name {isEditing && <span className="text-red-500">*</span>}</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              ) : (
                <p className="text-gray-800 font-semibold flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  {customer.customer_name || 'N/A'}
                </p>
              )}
            </div>
            
            {/* Email - Editable */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Email {isEditing && <span className="text-red-500">*</span>}</p>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              ) : (
                <p className="text-gray-800 font-semibold flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  {customer.customer_email || 'N/A'}
                </p>
              )}
            </div>
            
            {/* Phone - Editable */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone {isEditing && <span className="text-red-500">*</span>}</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              ) : (
                <p className="text-gray-800 font-semibold flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  {customer.phone_number || 'N/A'}
                </p>
              )}
            </div>
            
            {/* Address - Editable */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Address {isEditing && <span className="text-red-500">*</span>}</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              ) : (
                <p className="text-gray-800 font-semibold flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  {customer.address || 'N/A'}
                </p>
              )}
            </div>
            
            {/* Member Since - Read Only */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            {/* Last Updated - Read Only */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Points Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Points</p>
                <p className="text-3xl font-bold text-purple-600">{parseFloat(customer.points || 0).toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Star size={28} className="text-purple-600 fill-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recharges</p>
                <p className="text-3xl font-bold text-green-600">{totalRecharges.toLocaleString()} pts</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Redeems</p>
                <p className="text-3xl font-bold text-orange-600">{totalRedeems.toLocaleString()} pts</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown size={28} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-blue-600">{parseFloat(customer.amount_spend || 0).toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Award size={28} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recharges Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              Points Recharges
            </h2>
            <p className="text-sm text-gray-600 mt-1">History of points added to this loyalty card</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Points Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customer.recharges && customer.recharges.length > 0 ? (
                  customer.recharges.map((recharge) => (
                    <tr key={recharge.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(recharge.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(recharge.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-800">#{recharge.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600 flex items-center justify-end gap-2">
                          <TrendingUp size={16} />
                          +{parseFloat(recharge.amount || 0).toLocaleString()} pts
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No recharges found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
              {customer.recharges && customer.recharges.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-800">
                      Total Recharges:
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                      {totalRecharges.toLocaleString()} pts
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Redeems Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingDown className="text-orange-600" size={24} />
              Points Redeems
            </h2>
            <p className="text-sm text-gray-600 mt-1">History of points redeemed from this loyalty card</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Points Redeemed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customer.redeems && customer.redeems.length > 0 ? (
                  customer.redeems.map((redeem) => (
                    <tr key={redeem.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(redeem.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(redeem.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-800">#{redeem.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-orange-600 flex items-center justify-end gap-2">
                          <TrendingDown size={16} />
                          -{parseFloat(redeem.amount || 0).toLocaleString()} pts
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No redeems found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
              {customer.redeems && customer.redeems.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-800">
                      Total Redeems:
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">
                      {totalRedeems.toLocaleString()} pts
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewCustomer;

