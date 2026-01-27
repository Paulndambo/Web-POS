import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useGiftCards } from '../contexts/GiftCardsContext.jsx';
import { 
  Gift, Plus, Edit, X, Save, RefreshCw, Search, CreditCard, 
  DollarSign, Calendar, CheckCircle, XCircle, TrendingUp, 
  User, Building2, Receipt, Eye
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning, showError } from '../utils/toast.js';

const GiftCards = () => {
  const navigate = useNavigate();
  const { giftCards, loading, error, issueGiftCard, updateGiftCard, deleteGiftCard, redeemGiftCard, reloadGiftCard, fetchGiftCards } = useGiftCards();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState(null);
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    initialBalance: '',
    balance: '',
    issuer: 'Store', // 'Store' or 'Partner'
    partnerName: '',
    expiryDate: '',
    status: 'Active'
  });
  const [redeemFormData, setRedeemFormData] = useState({
    cardNumber: '',
    amount: '',
    description: ''
  });
  const [reloadFormData, setReloadFormData] = useState({
    cardNumber: '',
    amount: '',
    description: ''
  });

  const handleOpenModal = (giftCard = null) => {
    if (giftCard) {
      setEditingGiftCard(giftCard);
      setFormData({
        cardNumber: giftCard.cardNumber || '',
        recipientName: giftCard.recipientName || '',
        recipientEmail: giftCard.recipientEmail || '',
        recipientPhone: giftCard.recipientPhone || '',
        initialBalance: giftCard.initialBalance || '',
        balance: giftCard.balance || '',
        issuer: giftCard.issuer || 'Store',
        partnerName: giftCard.partnerName || '',
        expiryDate: giftCard.expiryDate || '',
        status: giftCard.status || 'Active'
      });
    } else {
      setEditingGiftCard(null);
      setFormData({
        cardNumber: '',
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        initialBalance: '',
        balance: '',
        issuer: 'Store',
        partnerName: '',
        expiryDate: '',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGiftCard(null);
    setFormData({
      cardNumber: '',
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      initialBalance: '',
      balance: '',
      issuer: 'Store',
      partnerName: '',
      expiryDate: '',
      status: 'Active'
    });
  };

  const handleOpenRedeemModal = (giftCard = null) => {
    if (giftCard) {
      setSelectedGiftCard(giftCard);
      setRedeemFormData({
        cardNumber: giftCard.cardNumber,
        amount: '',
        description: ''
      });
    } else {
      setSelectedGiftCard(null);
      setRedeemFormData({
        cardNumber: '',
        amount: '',
        description: ''
      });
    }
    setShowRedeemModal(true);
  };

  const handleCloseRedeemModal = () => {
    setShowRedeemModal(false);
    setSelectedGiftCard(null);
    setRedeemFormData({
      cardNumber: '',
      amount: '',
      description: ''
    });
  };

  const handleOpenReloadModal = (giftCard) => {
    setSelectedGiftCard(giftCard);
    setReloadFormData({
      cardNumber: giftCard.cardNumber,
      amount: '',
      description: ''
    });
    setShowReloadModal(true);
  };

  const handleCloseReloadModal = () => {
    setShowReloadModal(false);
    setSelectedGiftCard(null);
    setReloadFormData({
      cardNumber: '',
      amount: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingGiftCard && !formData.initialBalance) {
      showWarning('Please enter an initial balance');
      return;
    }

    try {
      if (editingGiftCard) {
        // When editing, only send editable fields
        await updateGiftCard(editingGiftCard.id, formData);
        showSuccess(`Gift card "${editingGiftCard.cardNumber}" updated successfully!`);
      } else {
        const balance = parseFloat(formData.initialBalance);
        await issueGiftCard({
          ...formData,
          balance: balance,
          initialBalance: balance
        });
        showSuccess(`Gift card issued successfully!`);
      }
      handleCloseModal();
    } catch (error) {
      showError(error.message || 'Failed to save gift card');
    }
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    
    if (!redeemFormData.cardNumber || !redeemFormData.amount) {
      showWarning('Please fill in all required fields');
      return;
    }

    // Validate that redemption amount doesn't exceed available balance
    const amountToRedeem = parseFloat(redeemFormData.amount);
    const availableBalance = selectedGiftCard?.balance || 0;
    if (amountToRedeem > availableBalance) {
      showWarning(`Cannot redeem ${CURRENCY_SYMBOL} ${amountToRedeem.toLocaleString()}. Available balance: ${CURRENCY_SYMBOL} ${availableBalance.toLocaleString()}`);
      return;
    }

    try {
      await redeemGiftCard(redeemFormData.cardNumber, amountToRedeem, null, redeemFormData.description);
      showSuccess(`Successfully redeemed ${CURRENCY_SYMBOL} ${amountToRedeem.toLocaleString()} from gift card`);
      handleCloseRedeemModal();
    } catch (error) {
      showError(error.message || 'Failed to redeem gift card');
    }
  };

  const handleReloadSubmit = async (e) => {
    e.preventDefault();
    
    if (!reloadFormData.amount) {
      showWarning('Please enter an amount');
      return;
    }

    try {
      const amount = parseFloat(reloadFormData.amount);
      await reloadGiftCard(selectedGiftCard.cardNumber, amount, reloadFormData.description);
      showSuccess(`Successfully reloaded ${CURRENCY_SYMBOL} ${amount} to gift card`);
      handleCloseReloadModal();
    } catch (error) {
      showError(error.message || 'Failed to reload gift card');
    }
  };

  const getStatusBadge = (status) => {
    if (status?.toLowerCase() === 'active') {
      return 'bg-green-100 text-green-700';
    } else if (status?.toLowerCase() === 'expired') {
      return 'bg-red-100 text-red-700';
    } else {
      return 'bg-gray-100 text-gray-700';
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Filter gift cards based on search term
  const filteredGiftCards = giftCards.filter(giftCard => 
    giftCard.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    giftCard.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    giftCard.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    giftCard.recipientPhone?.includes(searchTerm)
  );

  const totalGiftCards = giftCards.length;
  const totalValue = giftCards.reduce((sum, gc) => sum + (gc.balance || 0), 0);
  const activeGiftCards = giftCards.filter(gc => gc.status === 'Active' && !isExpired(gc.expiryDate)).length;
  const expiredGiftCards = giftCards.filter(gc => isExpired(gc.expiryDate)).length;

  return (
    <Layout>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gift Cards</h1>
            <p className="text-gray-600">Issue, manage, and track gift cards</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Plus size={20} />
              Issue Gift Card
            </button>
            <button
              onClick={fetchGiftCards}
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
                <p className="text-sm text-gray-600 mb-1">Total Gift Cards</p>
                <p className="text-3xl font-bold text-gray-800">{totalGiftCards}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Gift size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Cards</p>
                <p className="text-3xl font-bold text-gray-800">{activeGiftCards}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={28} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-800">{CURRENCY_SYMBOL} {totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign size={28} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expired Cards</p>
                <p className="text-3xl font-bold text-gray-800">{expiredGiftCards}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle size={28} className="text-red-600" />
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
              placeholder="Search by card number, recipient name, email, or phone..."
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
            <p className="text-gray-600">Loading gift cards...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Gift Cards Table */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Card Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Issuer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGiftCards.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No gift cards found matching your search.' : 'No gift cards found. Issue your first gift card to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredGiftCards.map((giftCard) => {
                    const expired = isExpired(giftCard.expiryDate);
                    const effectiveStatus = expired ? 'Expired' : giftCard.status;
                    return (
                      <tr key={giftCard.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-gray-400" />
                            <span className="text-sm font-mono text-gray-800">{giftCard.cardNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800">{giftCard.recipientName || 'N/A'}</div>
                            {giftCard.recipientEmail && (
                              <div className="text-xs text-gray-500">{giftCard.recipientEmail}</div>
                            )}
                            {giftCard.recipientPhone && (
                              <div className="text-xs text-gray-500">{giftCard.recipientPhone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${giftCard.balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {CURRENCY_SYMBOL} {(giftCard.balance || 0).toLocaleString()}
                          </div>
                          {giftCard.initialBalance && (
                            <div className="text-xs text-gray-500">
                              Initial: {CURRENCY_SYMBOL} {giftCard.initialBalance.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {giftCard.issuer === 'Partner' ? (
                              <>
                                <Building2 size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-800">{giftCard.partnerName || 'Partner'}</span>
                              </>
                            ) : (
                              <>
                                <Gift size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-800">Store</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(effectiveStatus)}`}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {giftCard.expiryDate ? (
                            <div className={`text-sm ${expired ? 'text-red-600' : 'text-gray-800'}`}>
                              {new Date(giftCard.expiryDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No expiry</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/gift-card/${giftCard.id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            {giftCard.balance > 0 && effectiveStatus === 'Active' && (
                              <button
                                onClick={() => handleOpenRedeemModal(giftCard)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                title="Redeem"
                              >
                                <DollarSign size={18} />
                              </button>
                            )}
                            {effectiveStatus === 'Active' && (
                              <button
                                onClick={() => handleOpenReloadModal(giftCard)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Reload"
                              >
                                <TrendingUp size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenModal(giftCard)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
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
        )}

        {/* Issue/Edit Gift Card Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingGiftCard ? 'Edit Gift Card' : 'Issue New Gift Card'}
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
                      Card Number
                    </label>
                    {editingGiftCard ? (
                      <>
                        <input
                          type="text"
                          value={formData.cardNumber}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                          disabled
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
                      </>
                    ) : (
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Auto-generated if left empty"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issuer *
                    </label>
                    <select
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="Store">Store</option>
                      <option value="Partner">Partner</option>
                    </select>
                  </div>
                </div>

                {formData.issuer === 'Partner' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Partner Name *
                    </label>
                    <input
                      type="text"
                      value={formData.partnerName}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required={formData.issuer === 'Partner'}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {editingGiftCard ? 'Balance' : 'Initial Balance'} *
                    </label>
                    {editingGiftCard ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.balance}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                          disabled
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">This field cannot be edited. Use reload/redeem actions to modify balance.</p>
                      </>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.initialBalance}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          initialBalance: e.target.value 
                        })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        min="0"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {editingGiftCard && (
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
                        <option value="Expired">Expired</option>
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
                    {editingGiftCard ? 'Update' : 'Issue Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Redeem Gift Card Modal */}
        {showRedeemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Redeem Gift Card</h2>
                <button
                  onClick={handleCloseRedeemModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {selectedGiftCard && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Card Number</div>
                  <div className="font-mono font-bold text-gray-800">{selectedGiftCard.cardNumber}</div>
                  <div className="text-sm text-gray-600 mt-2">Current Balance</div>
                  <div className="text-lg font-bold text-green-600">
                    {CURRENCY_SYMBOL} {(selectedGiftCard.balance || 0).toLocaleString()}
                  </div>
                </div>
              )}

              <form onSubmit={handleRedeemSubmit} className="space-y-4">
                {!selectedGiftCard && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={redeemFormData.cardNumber}
                      onChange={(e) => setRedeemFormData({ ...redeemFormData, cardNumber: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required={!selectedGiftCard}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount to Redeem *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={redeemFormData.amount}
                    onChange={(e) => setRedeemFormData({ ...redeemFormData, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    min="0.01"
                    max={selectedGiftCard?.balance || ''}
                    required
                  />
                  {selectedGiftCard && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available balance: {CURRENCY_SYMBOL} {(selectedGiftCard.balance || 0).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={redeemFormData.description}
                    onChange={(e) => setRedeemFormData({ ...redeemFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                    placeholder="Optional description for this redemption"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseRedeemModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Redeem
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reload Gift Card Modal */}
        {showReloadModal && selectedGiftCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Reload Gift Card</h2>
                <button
                  onClick={handleCloseReloadModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Card Number</div>
                <div className="font-mono font-bold text-gray-800">{selectedGiftCard.cardNumber}</div>
                <div className="text-sm text-gray-600 mt-2">Current Balance</div>
                <div className="text-lg font-bold text-green-600">
                  {CURRENCY_SYMBOL} {(selectedGiftCard.balance || 0).toLocaleString()}
                </div>
              </div>

              <form onSubmit={handleReloadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount to Reload *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={reloadFormData.amount}
                    onChange={(e) => setReloadFormData({ ...reloadFormData, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    min="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={reloadFormData.description}
                    onChange={(e) => setReloadFormData({ ...reloadFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    rows="3"
                    placeholder="Optional description for this reload"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseReloadModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Reload Card
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

export default GiftCards;

