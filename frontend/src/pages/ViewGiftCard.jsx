import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { apiGet, apiPatch } from '../utils/api.js';
import { showSuccess, showError } from '../utils/toast.js';
import { 
  ArrowLeft, Gift, Mail, Phone, MapPin, DollarSign, 
  Calendar, RefreshCw, AlertCircle, CreditCard, TrendingUp, TrendingDown,
  Building2, Edit, Save, X
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';

const ViewGiftCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [giftCard, setGiftCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    customer_email: '',
    issuer: 'Store',
    partner_name: '',
    expiry_date: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchGiftCardDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(`/customers/gift-cards/${id}/details/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setGiftCard(data);
      // Initialize form data
      setFormData({
        customer_name: data.customer_name || '',
        phone_number: data.phone_number || '',
        customer_email: data.customer_email || '',
        issuer: data.issuer || 'Store',
        partner_name: data.partner_name || '',
        expiry_date: data.expiry_date || ''
      });
    } catch (error) {
      console.error('Error fetching gift card details:', error);
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
    // Reset form data to original gift card data
    if (giftCard) {
      setFormData({
        customer_name: giftCard.customer_name || '',
        phone_number: giftCard.phone_number || '',
        customer_email: giftCard.customer_email || '',
        issuer: giftCard.issuer || 'Store',
        partner_name: giftCard.partner_name || '',
        expiry_date: giftCard.expiry_date || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await apiPatch(`/customers/gift-cards/${id}/details/`, formData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const updatedData = await response.json();
      setGiftCard(updatedData);
      setIsEditing(false);
      showSuccess('Gift card information updated successfully!');
    } catch (error) {
      console.error('Error updating gift card:', error);
      showError(error.message || 'Failed to update gift card information');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchGiftCardDetails();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
            <p className="text-gray-600">Loading gift card details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !giftCard) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Gift Card Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The gift card you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate('/gift-cards')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Gift Cards
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate totals for table footers
  const totalRecharges = giftCard.recharges?.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0) || 0;
  const totalRedeems = giftCard.redeems?.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0) || 0;
  const isExpired = giftCard.expiry_date ? new Date(giftCard.expiry_date) < new Date() : false;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/gift-cards')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Gift Cards
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Gift Card Details</h1>
              <p className="text-gray-600">Card Number: {giftCard.card_number}</p>
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
                    onClick={fetchGiftCardDetails}
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

        {/* Gift Card Information Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Gift className="text-purple-600" size={24} />
            Gift Card Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Number - Read Only */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Card Number</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                {giftCard.card_number}
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
                <p className="text-gray-800 font-semibold">
                  {giftCard.customer_name || 'N/A'}
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
                  {giftCard.customer_email || 'N/A'}
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
                  {giftCard.phone_number || 'N/A'}
                </p>
              )}
            </div>
            
            {/* Issuer - Editable */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Issuer {isEditing && <span className="text-red-500">*</span>}</p>
              {isEditing ? (
                <select
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="Store">Store</option>
                  <option value="Partner">Partner</option>
                </select>
              ) : (
                <p className="text-gray-800 font-semibold flex items-center gap-2">
                  {giftCard.issuer === 'Partner' ? (
                    <>
                      <Building2 size={16} className="text-gray-400" />
                      Partner
                    </>
                  ) : (
                    <>
                      <Gift size={16} className="text-gray-400" />
                      Store
                    </>
                  )}
                </p>
              )}
            </div>
            
            {/* Partner Name - Editable (only if issuer is Partner) */}
            {formData.issuer === 'Partner' && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Partner Name {isEditing && <span className="text-red-500">*</span>}</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    required={formData.issuer === 'Partner'}
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">
                    {giftCard.partner_name || 'N/A'}
                  </p>
                )}
              </div>
            )}
            
            {/* Expiry Date - Editable */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <p className={`text-gray-800 font-semibold flex items-center gap-2 ${isExpired ? 'text-red-600' : ''}`}>
                  <Calendar size={16} className="text-gray-400" />
                  {giftCard.expiry_date ? new Date(giftCard.expiry_date).toLocaleDateString() : 'No expiry'}
                  {isExpired && <span className="text-xs text-red-600">(Expired)</span>}
                </p>
              )}
            </div>
            
            {/* Created At - Read Only */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Issued Date</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {giftCard.created_at ? new Date(giftCard.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            {/* Last Updated - Read Only */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="text-gray-800 font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {giftCard.updated_at ? new Date(giftCard.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Balance</p>
                <p className="text-3xl font-bold text-purple-600">{CURRENCY_SYMBOL} {parseFloat(giftCard.initial_balance || 0).toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign size={28} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recharges</p>
                <p className="text-3xl font-bold text-green-600">{CURRENCY_SYMBOL} {totalRecharges.toLocaleString()}</p>
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
                <p className="text-3xl font-bold text-orange-600">{CURRENCY_SYMBOL} {totalRedeems.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown size={28} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recharges Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              Recharges
            </h2>
            <p className="text-sm text-gray-600 mt-1">History of amounts added to this gift card</p>
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
                    Amount Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {giftCard.recharges && giftCard.recharges.length > 0 ? (
                  giftCard.recharges.map((recharge) => (
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
                          +{CURRENCY_SYMBOL} {parseFloat(recharge.amount || 0).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No recharges found for this gift card.
                    </td>
                  </tr>
                )}
              </tbody>
              {giftCard.recharges && giftCard.recharges.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-800">
                      Total Recharges:
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                      {CURRENCY_SYMBOL} {totalRecharges.toLocaleString()}
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
              Redeems
            </h2>
            <p className="text-sm text-gray-600 mt-1">History of amounts redeemed from this gift card</p>
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
                    Amount Redeemed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {giftCard.redeems && giftCard.redeems.length > 0 ? (
                  giftCard.redeems.map((redeem) => (
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
                          -{CURRENCY_SYMBOL} {parseFloat(redeem.amount || 0).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No redeems found for this gift card.
                    </td>
                  </tr>
                )}
              </tbody>
              {giftCard.redeems && giftCard.redeems.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-800">
                      Total Redeems:
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">
                      {CURRENCY_SYMBOL} {totalRedeems.toLocaleString()}
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

export default ViewGiftCard;

