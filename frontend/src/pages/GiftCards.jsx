import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { useGiftCards } from '../contexts/GiftCardsContext.jsx';
import { 
  Gift, Plus, Edit, X, Save, RefreshCw, Search, CreditCard, 
  DollarSign, Calendar, CheckCircle, XCircle, 
  Building2, Receipt
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { showSuccess, showWarning, showError } from '../utils/toast.js';

const GiftCards = () => {
  const { giftCards, loading, error, issueGiftCard, updateGiftCard, deleteGiftCard, redeemGiftCard, reloadGiftCard, fetchGiftCards } = useGiftCards();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState(null);
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [creatingMultiple, setCreatingMultiple] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    cardNumber: '',
    amount: '',
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
  const [multipleFormData, setMultipleFormData] = useState({
    issuer: 'Store',
    partnerName: '',
    amount: '',
    expiryDate: '',
    numberOfCards: ''
  });

  const handleOpenModal = (giftCard = null) => {
    if (giftCard) {
      setEditingGiftCard(giftCard);
      setFormData({
        cardNumber: giftCard.cardNumber || '',
        amount: giftCard.amount || '',
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
        amount: '',
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
      amount: '',
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
    
    if (!editingGiftCard && !formData.amount) {
      showWarning('Please enter an amount');
      return;
    }

    try {
      if (editingGiftCard) {
        // When editing, only send editable fields
        await updateGiftCard(editingGiftCard.id, formData);
        showSuccess(`Gift card "${editingGiftCard.cardNumber}" updated successfully!`);
      } else {
        const balance = parseFloat(formData.amount);
        await issueGiftCard({
          ...formData,
          balance: balance,
          amount: balance
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

  const handleOpenMultipleModal = () => {
    setMultipleFormData({
      issuer: 'Store',
      partnerName: '',
      amount: '',
      expiryDate: '',
      numberOfCards: ''
    });
    setShowMultipleModal(true);
  };

  const handleCloseMultipleModal = () => {
    setShowMultipleModal(false);
    setMultipleFormData({
      issuer: 'Store',
      partnerName: '',
      amount: '',
      expiryDate: '',
      numberOfCards: ''
    });
  };

  const handleMultipleSubmit = async (e) => {
    e.preventDefault();
    
    if (!multipleFormData.amount || !multipleFormData.numberOfCards) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (multipleFormData.issuer === 'Partner' && !multipleFormData.partnerName) {
      showWarning('Please enter partner name');
      return;
    }

    const numberOfCards = parseInt(multipleFormData.numberOfCards);
    if (numberOfCards < 1 || numberOfCards > 100) {
      showWarning('Number of cards must be between 1 and 100');
      return;
    }

    try {
      setCreatingMultiple(true);
      const amount = parseFloat(multipleFormData.amount);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < numberOfCards; i++) {
        try {
          await issueGiftCard({
            issuer: multipleFormData.issuer,
            partnerName: multipleFormData.partnerName || null,
            amount: amount,
            balance: amount,
            expiryDate: multipleFormData.expiryDate || null,
            status: 'Active'
          });
          successCount++;
        } catch (error) {
          console.error(`Error creating gift card ${i + 1}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`Successfully created ${successCount} gift card${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        showError('Failed to create any gift cards');
      }

      handleCloseMultipleModal();
    } catch (error) {
      showError(error.message || 'Failed to create multiple gift cards');
    } finally {
      setCreatingMultiple(false);
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
    giftCard.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredGiftCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGiftCards = filteredGiftCards.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalGiftCards = giftCards.length;
  const totalValue = giftCards.reduce((sum, gc) => sum + (gc.balance || 0), 0);
  const activeGiftCards = giftCards.filter(gc => gc.status === 'Active' && !isExpired(gc.expiryDate)).length;
  const expiredGiftCards = giftCards.filter(gc => isExpired(gc.expiryDate)).length;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

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
              onClick={handleOpenMultipleModal}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Gift size={20} />
              Create Multiple
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
              placeholder="Search by card number..."
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
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No gift cards found matching your search.' : 'No gift cards found. Issue your first gift card to get started.'}
                    </td>
                  </tr>
                ) : (
                  paginatedGiftCards.map((giftCard) => {
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${giftCard.balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {CURRENCY_SYMBOL} {(giftCard.balance || 0).toLocaleString()}
                          </div>
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

        {/* Pagination */}
        {!loading && filteredGiftCards.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-1 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              {/* Pagination info */}
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredGiftCards.length)} of {filteredGiftCards.length} gift card{filteredGiftCards.length !== 1 ? 's' : ''}
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {totalPages > 0 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border-2 border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                >
                  Next
                </button>
              </div>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {editingGiftCard ? 'Balance' : 'Amount'} *
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
                      value={formData.amount}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        amount: e.target.value 
                      })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      min="0"
                      required
                    />
                  )}
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

        {/* Create Multiple Gift Cards Modal */}
        {showMultipleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Create Multiple Gift Cards
                </h2>
                <button
                  onClick={handleCloseMultipleModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={creatingMultiple}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleMultipleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issuer *
                    </label>
                    <select
                      value={multipleFormData.issuer}
                      onChange={(e) => setMultipleFormData({ ...multipleFormData, issuer: e.target.value, partnerName: e.target.value === 'Store' ? '' : multipleFormData.partnerName })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required
                      disabled={creatingMultiple}
                    >
                      <option value="Store">Store</option>
                      <option value="Partner">Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount per Gift Card *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={multipleFormData.amount}
                      onChange={(e) => setMultipleFormData({ ...multipleFormData, amount: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      min="0"
                      required
                      disabled={creatingMultiple}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                {multipleFormData.issuer === 'Partner' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Partner Name *
                    </label>
                    <input
                      type="text"
                      value={multipleFormData.partnerName}
                      onChange={(e) => setMultipleFormData({ ...multipleFormData, partnerName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      required={multipleFormData.issuer === 'Partner'}
                      disabled={creatingMultiple}
                      placeholder="Enter partner name"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={multipleFormData.expiryDate}
                      onChange={(e) => setMultipleFormData({ ...multipleFormData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      disabled={creatingMultiple}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Gift Cards *
                    </label>
                    <input
                      type="number"
                      value={multipleFormData.numberOfCards}
                      onChange={(e) => setMultipleFormData({ ...multipleFormData, numberOfCards: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      min="1"
                      max="100"
                      required
                      disabled={creatingMultiple}
                      placeholder="Enter number of cards (1-100)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum 100 cards at a time</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This will create {multipleFormData.numberOfCards || 'N'} gift card{multipleFormData.numberOfCards && parseInt(multipleFormData.numberOfCards) > 1 ? 's' : ''} with {multipleFormData.amount ? `${CURRENCY_SYMBOL} ${parseFloat(multipleFormData.amount || 0).toLocaleString()}` : 'the specified amount'} each.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseMultipleModal}
                    disabled={creatingMultiple}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingMultiple}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {creatingMultiple ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Gift size={18} />
                        Create {multipleFormData.numberOfCards || 'N'} Gift Card{multipleFormData.numberOfCards && parseInt(multipleFormData.numberOfCards) > 1 ? 's' : ''}
                      </>
                    )}
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

