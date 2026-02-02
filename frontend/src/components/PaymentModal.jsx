import React, { useState, useEffect, useRef } from 'react';
import { Banknote, Smartphone, Wallet, CreditCard, Calendar, Gift, Search, Building2, ChevronDown, Percent } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';

/**
 * Reusable Payment Modal Component
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the modal
 * @param {number} props.totalAmount - Total amount to be paid
 * @param {Object} props.paymentState - Payment state from usePayment hook
 * @param {Function} props.onProcessPayment - Callback when payment is processed
 * @param {Function} props.onCancel - Callback when payment is cancelled
 * @param {Array} props.customers - Array of customers for BNPL, Store Credit, Loyalty Card
 * @param {Object} props.config - Configuration options
 */
const PaymentModal = ({
  show,
  totalAmount,
  paymentState,
  onProcessPayment,
  onCancel,
  customers = [],
  config = {}
}) => {
  if (!show) return null;

  const {
    paymentMethod,
    setPaymentMethod,
    amountReceived,
    setAmountReceived,
    cashCustomer,
    cashSearchTerm,
    setCashCustomer,
    setCashSearchTerm,
    mobileNumber,
    setMobileNumber,
    phoneValidation,
    setPhoneValidation,
    mobileCustomer,
    mobileSearchTerm,
    setMobileCustomer,
    setMobileSearchTerm,
    splitCashAmount,
    setSplitCashAmount,
    splitMobileAmount,
    setSplitMobileAmount,
    splitCustomer,
    splitSearchTerm,
    setSplitCustomer,
    setSplitSearchTerm,
    bnplDownPayment,
    setBnplDownPayment,
    bnplInstallments,
    setBnplInstallments,
    bnplInterval,
    setBnplInterval,
    bnplCustomer,
    bnplSearchTerm,
    setBnplSearchTerm,
    bnplProviders,
    bnplProvider,
    setBnplProvider,
    bnplProviderSearchTerm,
    setBnplProviderSearchTerm,
    loadingBnplProviders,
    fetchBnplProviders,
    bnplDownPaymentChannel,
    setBnplDownPaymentChannel,
    storeCreditBalance,
    storeCreditUsed,
    setStoreCreditUsed,
    setStoreCreditBalance,
    storeCreditCustomer,
    storeCreditSearchTerm,
    setStoreCreditSearchTerm,
    cashPointsRedeemed,
    setCashPointsRedeemed,
    cashPointsBalance,
    setCashPointsBalance,
    mobilePointsRedeemed,
    setMobilePointsRedeemed,
    mobilePointsBalance,
    setMobilePointsBalance,
    splitPointsRedeemed,
    setSplitPointsRedeemed,
    splitPointsBalance,
    setSplitPointsBalance,
    cardCustomer,
    cardSearchTerm,
    setCardCustomer,
    setCardSearchTerm,
    cardPointsRedeemed,
    setCardPointsRedeemed,
    cardPointsBalance,
    setCardPointsBalance,
    cardTransactionReference,
    setCardTransactionReference,
    loyaltyPointsRate,
    validatePhoneNumber,
    searchCustomer
  } = paymentState;

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/[^\d\s\-\(\)\+]/g, '');
    setMobileNumber(cleaned);
    if (cleaned) {
      setPhoneValidation(validatePhoneNumber(cleaned));
    } else {
      setPhoneValidation(null);
    }
  };

  const handleCashSearch = (value) => {
    const setCashCustomerWithPoints = (foundCustomer) => {
      paymentState.setCashCustomer(foundCustomer);
      if (foundCustomer) {
        const points = parseFloat(foundCustomer.points || 0);
        setCashPointsBalance(points);
        setCashPointsRedeemed(''); // Reset points redeemed when customer changes
      } else {
        setCashPointsBalance(0);
        setCashPointsRedeemed('');
      }
    };
    searchCustomer(value, setCashCustomerWithPoints, setCashSearchTerm);
  };

  const handleMobileSearch = (value) => {
    const setMobileCustomerWithPoints = (foundCustomer) => {
      paymentState.setMobileCustomer(foundCustomer);
      if (foundCustomer) {
        const points = parseFloat(foundCustomer.points || 0);
        setMobilePointsBalance(points);
        setMobilePointsRedeemed(''); // Reset points redeemed when customer changes
      } else {
        setMobilePointsBalance(0);
        setMobilePointsRedeemed('');
      }
    };
    searchCustomer(value, setMobileCustomerWithPoints, setMobileSearchTerm);
  };

  const handleSplitSearch = (value) => {
    const setSplitCustomerWithPoints = (foundCustomer) => {
      paymentState.setSplitCustomer(foundCustomer);
      if (foundCustomer) {
        const points = parseFloat(foundCustomer.points || 0);
        setSplitPointsBalance(points);
        setSplitPointsRedeemed(''); // Reset points redeemed when customer changes
      } else {
        setSplitPointsBalance(0);
        setSplitPointsRedeemed('');
      }
    };
    searchCustomer(value, setSplitCustomerWithPoints, setSplitSearchTerm);
  };

  const handleBnplSearch = (value) => {
    searchCustomer(value, paymentState.setBnplCustomer, setBnplSearchTerm);
  };

  const handleCardSearch = (value) => {
    const setCardCustomerWithPoints = (foundCustomer) => {
      paymentState.setCardCustomer(foundCustomer);
      if (foundCustomer) {
        const points = parseFloat(foundCustomer.points || 0);
        setCardPointsBalance(points);
        setCardPointsRedeemed(''); // Reset points redeemed when customer changes
      } else {
        setCardPointsBalance(0);
        setCardPointsRedeemed('');
      }
    };
    searchCustomer(value, setCardCustomerWithPoints, setCardSearchTerm);
  };

  // BNPL Provider dropdown state
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const providerDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target)) {
        setShowProviderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter providers based on search term
  const filteredProviders = bnplProviders.filter(provider =>
    provider.name?.toLowerCase().includes(bnplProviderSearchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(bnplProviderSearchTerm.toLowerCase()) ||
    provider.phone_number?.includes(bnplProviderSearchTerm)
  );

  const handleProviderSelect = (provider) => {
    setBnplProvider(provider);
    setBnplProviderSearchTerm(provider.name);
    setShowProviderDropdown(false);
  };

  // Calculate final amount with interest
  const calculateFinalAmount = () => {
    if (!bnplProvider || !totalAmount) return totalAmount;
    const interestRate = parseFloat(bnplProvider.interest_rate_percentage || 0);
    return totalAmount * (1 + interestRate / 100);
  };

  const finalAmount = calculateFinalAmount();

  const handleStoreCreditSearch = (value) => {
    // Create a wrapper function that sets both customer and balance
    const setStoreCreditCustomerWithBalance = (foundCustomer) => {
      paymentState.setStoreCreditCustomer(foundCustomer);
      if (foundCustomer) {
        // Set the store credit balance from the customer's available_credit attribute
        // Handle both raw backend format (available_credit) and transformed format (availableCredit)
        const availableCredit = foundCustomer.available_credit || foundCustomer.availableCredit || 0;
        setStoreCreditBalance(parseFloat(availableCredit));
        paymentState.setStoreCreditUsed(totalAmount.toFixed(2));
      } else {
        // Reset balance when no customer is found
        setStoreCreditBalance(0);
      }
    };
    searchCustomer(value, setStoreCreditCustomerWithBalance, setStoreCreditSearchTerm);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 sm:p-8 max-w-5xl w-full my-auto max-h-[95vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5">Payment</h2>
        <div className="mb-4 sm:mb-5">
          <p className="text-sm sm:text-base text-gray-600 mb-2">Total Amount:</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{CURRENCY_SYMBOL} {totalAmount.toFixed(2)}</p>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-4 sm:mb-5">
          <p className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Select Payment Method:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => {
                setPaymentMethod('cash');
                paymentState.setCashCustomer(null);
                setCashSearchTerm('');
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Banknote size={28} />
              <span className="text-sm sm:text-base font-medium">Cash</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('mobile');
                paymentState.setMobileCustomer(null);
                setMobileSearchTerm('');
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'mobile' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Smartphone size={28} />
              <span className="text-sm sm:text-base font-medium">Mpesa</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('cash+mpesa');
                setSplitCashAmount('');
                setSplitMobileAmount('');
                paymentState.setSplitCustomer(null);
                setSplitSearchTerm('');
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors relative ${
                paymentMethod === 'cash+mpesa' ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="relative">
                <Banknote size={22} className="absolute -top-1 -left-1 text-blue-600" />
                <Smartphone size={22} className="absolute -bottom-1 -right-1 text-green-600" />
                <Wallet size={18} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600 bg-white rounded-full" />
              </div>
              <span className="text-sm sm:text-base font-medium">Cash + Mpesa</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('bnpl');
                setBnplDownPayment('');
                setBnplInstallments(10);
                setBnplInterval(1);
                paymentState.setBnplCustomer(null);
                setBnplSearchTerm('');
                setBnplProvider(null);
                setBnplProviderSearchTerm('');
                setBnplDownPaymentChannel('Cash');
                if (bnplProviders.length === 0) {
                  fetchBnplProviders();
                }
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'bnpl' ? 'border-orange-600 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Calendar size={28} />
              <span className="text-sm sm:text-base font-medium text-center">Buy Now<br />Pay Later</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('store-credit');
                paymentState.setStoreCreditUsed(totalAmount.toFixed(2));
                paymentState.setStoreCreditCustomer(null);
                setStoreCreditBalance(0);
                setStoreCreditSearchTerm('');
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'store-credit' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CreditCard size={28} />
              <span className="text-sm sm:text-base font-medium text-center">Store<br />Credit</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('card');
                paymentState.setCardCustomer(null);
                setCardSearchTerm('');
                setCardPointsRedeemed('');
                setCardPointsBalance(0);
                setCardTransactionReference('');
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'card' ? 'border-teal-600 bg-teal-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CreditCard size={28} className="text-teal-600" />
              <span className="text-sm sm:text-base font-medium text-center">Credit/Debit<br />Card</span>
            </button>
          </div>
        </div>

        {/* Cash Payment Section */}
        {paymentMethod === 'cash' && (
          <div className="mb-4 sm:mb-5 space-y-3 sm:space-y-4">
            {/* Customer Search */}
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (Optional - for loyalty points):</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={cashSearchTerm}
                  onChange={(e) => handleCashSearch(e.target.value)}
                  placeholder="Enter card number or phone number"
                  className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              {cashCustomer && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-700 mb-1">
                    <span className="font-semibold">Customer:</span> {cashCustomer.name}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700 mb-1">
                    <span className="font-semibold">Phone:</span> {cashCustomer.phone || 'N/A'}
                  </p>
                  {cashCustomer.loyaltyCardNumber && (
                    <p className="text-xs sm:text-sm text-blue-700 mb-1">
                      <span className="font-semibold">Card Number:</span> {cashCustomer.loyaltyCardNumber}
                    </p>
                  )}
                </div>
              )}
              {!cashCustomer && cashSearchTerm && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700">
                    No customer found. Please check the search term.
                  </p>
                </div>
              )}
            </div>

            {/* Points Redemption */}
            {cashCustomer && cashPointsBalance > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-yellow-800 text-sm sm:text-base flex items-center gap-2">
                      <Gift size={18} />
                      Available Points
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">1 point = {CURRENCY_SYMBOL} {loyaltyPointsRate.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-yellow-900 text-lg sm:text-xl">{cashPointsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base text-yellow-800">Redeem Points (Optional):</label>
                  <input
                    type="number"
                    step="1"
                    value={cashPointsRedeemed}
                    onChange={(e) => {
                      const points = parseInt(e.target.value) || 0;
                      const maxPoints = Math.min(cashPointsBalance, Math.ceil(totalAmount / loyaltyPointsRate));
                      if (points > maxPoints) {
                        setCashPointsRedeemed(maxPoints.toString());
                      } else {
                        setCashPointsRedeemed(e.target.value);
                      }
                    }}
                    placeholder="0"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {cashPointsRedeemed && parseInt(cashPointsRedeemed) > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Points Value: <span className="font-bold">{CURRENCY_SYMBOL} {(parseInt(cashPointsRedeemed || 0) * loyaltyPointsRate).toFixed(2)}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-green-700 font-semibold">
                        Amount After Points: <span className="font-bold">{CURRENCY_SYMBOL} {Math.max(0, totalAmount - (parseInt(cashPointsRedeemed || 0) * loyaltyPointsRate)).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Amount Received:</label>
              <input
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              {amountReceived && (() => {
                const pointsValue = cashPointsRedeemed ? (parseInt(cashPointsRedeemed || 0) * loyaltyPointsRate) : 0;
                const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
                const received = parseFloat(amountReceived);
                if (received >= amountAfterPoints) {
                  return (
                    <p className="mt-2 text-sm sm:text-base text-green-600 font-semibold">
                      Change: {CURRENCY_SYMBOL} {(received - amountAfterPoints).toFixed(2)}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Mobile Payment Section */}
        {paymentMethod === 'mobile' && (
          <div className="mb-4 sm:mb-5 space-y-3 sm:space-y-4">
            {/* Customer Search */}
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (Optional - for loyalty points):</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={mobileSearchTerm}
                  onChange={(e) => handleMobileSearch(e.target.value)}
                  placeholder="Enter card number or phone number"
                  className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
              {mobileCustomer && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-green-700 mb-1">
                    <span className="font-semibold">Customer:</span> {mobileCustomer.name}
                  </p>
                  <p className="text-xs sm:text-sm text-green-700 mb-1">
                    <span className="font-semibold">Phone:</span> {mobileCustomer.phone || 'N/A'}
                  </p>
                  {mobileCustomer.loyaltyCardNumber && (
                    <p className="text-xs sm:text-sm text-green-700 mb-1">
                      <span className="font-semibold">Card Number:</span> {mobileCustomer.loyaltyCardNumber}
                    </p>
                  )}
                </div>
              )}
              {!mobileCustomer && mobileSearchTerm && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700">
                    No customer found. Please check the search term.
                  </p>
                </div>
              )}
            </div>

            {/* Points Redemption */}
            {mobileCustomer && mobilePointsBalance > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-yellow-800 text-sm sm:text-base flex items-center gap-2">
                      <Gift size={18} />
                      Available Points
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">1 point = {CURRENCY_SYMBOL} {loyaltyPointsRate.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-yellow-900 text-lg sm:text-xl">{mobilePointsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base text-yellow-800">Redeem Points (Optional):</label>
                  <input
                    type="number"
                    step="1"
                    value={mobilePointsRedeemed}
                    onChange={(e) => {
                      const points = parseInt(e.target.value) || 0;
                      const maxPoints = Math.min(mobilePointsBalance, Math.ceil(totalAmount / loyaltyPointsRate));
                      if (points > maxPoints) {
                        setMobilePointsRedeemed(maxPoints.toString());
                      } else {
                        setMobilePointsRedeemed(e.target.value);
                      }
                    }}
                    placeholder="0"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {mobilePointsRedeemed && parseInt(mobilePointsRedeemed) > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Points Value: <span className="font-bold">{CURRENCY_SYMBOL} {(parseInt(mobilePointsRedeemed || 0) * loyaltyPointsRate).toFixed(2)}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-green-700 font-semibold">
                        Amount After Points: <span className="font-bold">{CURRENCY_SYMBOL} {Math.max(0, totalAmount - (parseInt(mobilePointsRedeemed || 0) * loyaltyPointsRate)).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Customer Phone Number:</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0712345678"
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg focus:outline-none ${
                  phoneValidation ? 
                    (phoneValidation.valid ? 
                      'border-green-500 focus:border-green-600' : 
                      'border-red-500 focus:border-red-600') : 
                    'border-gray-300 focus:border-blue-500'
                }`}
              />
              {phoneValidation && (
                <p className={`text-xs mt-1 ${
                  phoneValidation.valid ? 
                    'text-green-600' : 
                    'text-red-600'
                }`}>
                  {phoneValidation.valid ? 
                    `✓ Valid: ${phoneValidation.cleaned}` : 
                    phoneValidation.error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cash + Mpesa Section - This is quite large, so I'll include a simplified version */}
        {paymentMethod === 'cash+mpesa' && (
          <div className="mb-4 sm:mb-5">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-purple-200 rounded-lg p-3 sm:p-4 mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wallet size={20} className="text-purple-600" />
                <p className="font-bold text-purple-700 text-sm sm:text-base">Split Payment</p>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 text-center space-y-1">
                <p>
                  Total: <span className="font-bold text-gray-800">{CURRENCY_SYMBOL} {totalAmount.toFixed(2)}</span>
                </p>
                {(() => {
                  const pointsValue = splitPointsRedeemed ? (parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate) : 0;
                  const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
                  return (
                    <>
                      {pointsValue > 0 && (
                        <p>
                          Points Redeemed: <span className="font-bold text-yellow-700">-{CURRENCY_SYMBOL} {pointsValue.toFixed(2)}</span>
                        </p>
                      )}
                      <p className={pointsValue > 0 ? 'mt-1' : ''}>
                        Amount After Points: <span className="font-bold text-green-700">{CURRENCY_SYMBOL} {amountAfterPoints.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        (Cash + Mpesa should equal this amount)
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote size={20} className="text-blue-600" />
                  <label className="font-semibold text-blue-700 text-sm sm:text-base">Cash Amount</label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={splitCashAmount}
                  onChange={(e) => {
                    const cashValue = e.target.value;
                    setSplitCashAmount(cashValue);
                    // Auto-calculate Mpesa amount: Total - Cash - Points
                    const cash = parseFloat(cashValue) || 0;
                    const pointsValue = splitPointsRedeemed ? (parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate) : 0;
                    const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
                    const mpesaAmount = Math.max(0, amountAfterPoints - cash);
                    setSplitMobileAmount(mpesaAmount.toFixed(2));
                  }}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone size={20} className="text-green-600" />
                  <label className="font-semibold text-green-700 text-sm sm:text-base">Mpesa Amount (Auto-calculated)</label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={(() => {
                    // Calculate: Total Amount - Cash Amount - Points Redeemed Value
                    const cash = parseFloat(splitCashAmount || 0);
                    const pointsValue = splitPointsRedeemed ? (parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate) : 0;
                    const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
                    const mpesaAmount = Math.max(0, amountAfterPoints - cash);
                    return mpesaAmount.toFixed(2);
                  })()}
                  readOnly
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-green-100 cursor-not-allowed"
                />
                <p className="text-xs text-green-600 mt-1">
                  Calculated as: Total - Cash - Points
                </p>
                {(() => {
                  const cash = parseFloat(splitCashAmount || 0);
                  const mpesa = parseFloat(splitMobileAmount || 0);
                  const pointsValue = splitPointsRedeemed ? (parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate) : 0;
                  const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
                  const sum = cash + mpesa;
                  const difference = Math.abs(sum - amountAfterPoints);
                  return (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-gray-600">
                        Cash: <span className="font-semibold">{CURRENCY_SYMBOL} {cash.toFixed(2)}</span> + 
                        Mpesa: <span className="font-semibold">{CURRENCY_SYMBOL} {mpesa.toFixed(2)}</span> = 
                        <span className={`font-bold ml-1 ${difference < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          {CURRENCY_SYMBOL} {sum.toFixed(2)}
                        </span>
                      </p>
                      {difference >= 0.01 && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠ Should be {CURRENCY_SYMBOL} {amountAfterPoints.toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Customer Search */}
            <div className="mt-3 sm:mt-4">
              <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (Optional - for loyalty points):</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={splitSearchTerm}
                  onChange={(e) => handleSplitSearch(e.target.value)}
                  placeholder="Enter card number or phone number"
                  className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              {splitCustomer && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-purple-700 mb-1">
                    <span className="font-semibold">Customer:</span> {splitCustomer.name}
                  </p>
                  <p className="text-xs sm:text-sm text-purple-700 mb-1">
                    <span className="font-semibold">Phone:</span> {splitCustomer.phone || 'N/A'}
                  </p>
                  {splitCustomer.loyaltyCardNumber && (
                    <p className="text-xs sm:text-sm text-purple-700">
                      <span className="font-semibold">Card Number:</span> {splitCustomer.loyaltyCardNumber}
                    </p>
                  )}
                </div>
              )}
              {!splitCustomer && splitSearchTerm && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700">
                    No customer found. Please check the search term.
                  </p>
                </div>
              )}
            </div>

            {/* Points Redemption */}
            {splitCustomer && splitPointsBalance > 0 && (
              <div className="mt-3 sm:mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs sm:text-sm text-yellow-700 font-semibold">
                      Available Points
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">1 point = {CURRENCY_SYMBOL} {loyaltyPointsRate.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-yellow-900 text-lg sm:text-xl">{splitPointsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base text-yellow-800">Redeem Points (Optional):</label>
                  <input
                    type="number"
                    step="1"
                    value={splitPointsRedeemed}
                    onChange={(e) => {
                      const points = parseInt(e.target.value) || 0;
                      const maxPoints = Math.min(splitPointsBalance, Math.ceil(totalAmount / loyaltyPointsRate));
                      if (points > maxPoints) {
                        setSplitPointsRedeemed(maxPoints.toString());
                      } else {
                        setSplitPointsRedeemed(e.target.value);
                      }
                      // Recalculate Mpesa amount when points change: Total - Cash - Points
                      const pointsValue = points * loyaltyPointsRate;
                      const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
                      const cash = parseFloat(splitCashAmount || 0);
                      const mpesaAmount = Math.max(0, amountAfterPoints - cash);
                      setSplitMobileAmount(mpesaAmount.toFixed(2));
                    }}
                    placeholder="0"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {splitPointsRedeemed && parseInt(splitPointsRedeemed) > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Points Value: <span className="font-bold">{CURRENCY_SYMBOL} {(parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate).toFixed(2)}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-green-700 font-semibold">
                        Amount After Points: <span className="font-bold">{CURRENCY_SYMBOL} {Math.max(0, totalAmount - (parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate)).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 sm:mt-4">
              <label className="block font-semibold mb-2 text-sm sm:text-base">Customer Phone Number:</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0712345678"
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg focus:outline-none ${
                  phoneValidation ? 
                    (phoneValidation.valid ? 
                      'border-green-500 focus:border-green-600' : 
                      'border-red-500 focus:border-red-600') : 
                    'border-gray-300 focus:border-purple-500'
                }`}
              />
              {phoneValidation && (
                <p className={`text-xs mt-1 ${
                  phoneValidation.valid ? 
                    'text-green-600' : 
                    'text-red-600'
                }`}>
                  {phoneValidation.valid ? 
                    `✓ Valid: ${phoneValidation.cleaned}` : 
                    phoneValidation.error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* BNPL Section */}
        {paymentMethod === 'bnpl' && (
          <div className="mb-4 sm:mb-5">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4 mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar size={20} className="text-orange-600" />
                <p className="font-bold text-orange-700 text-sm sm:text-base">Buy Now, Pay Later</p>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                Total: <span className="font-bold text-gray-800">{CURRENCY_SYMBOL} {totalAmount.toFixed(2)}</span>
              </p>
              {bnplProvider && (
                <div className="mt-2 pt-2 border-t border-orange-300">
                  <p className="text-xs sm:text-sm text-orange-700 text-center">
                    Final Amount (with {bnplProvider.interest_rate_percentage || 0}% interest): <span className="font-bold">{CURRENCY_SYMBOL} {finalAmount.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* BNPL Provider Selection */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Select BNPL Provider:</label>
                <div className="relative" ref={providerDropdownRef}>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={bnplProviderSearchTerm}
                      onChange={(e) => {
                        setBnplProviderSearchTerm(e.target.value);
                        setShowProviderDropdown(true);
                      }}
                      onFocus={() => setShowProviderDropdown(true)}
                      placeholder={loadingBnplProviders ? "Loading providers..." : "Search provider by name, email, or phone"}
                      className="w-full pl-10 pr-10 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      disabled={loadingBnplProviders}
                    />
                    <ChevronDown className="absolute right-3 top-3 text-gray-400" size={18} />
                  </div>
                  
                  {/* Dropdown */}
                  {showProviderDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-orange-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingBnplProviders ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Loading providers...</div>
                      ) : filteredProviders.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No providers found</div>
                      ) : (
                        filteredProviders.map((provider) => (
                          <div
                            key={provider.id}
                            onClick={() => handleProviderSelect(provider)}
                            className={`p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              bnplProvider?.id === provider.id ? 'bg-orange-100' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 text-sm">{provider.name}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <p className="text-xs text-gray-600">
                                    <Percent size={12} className="inline mr-1" />
                                    Down: {provider.down_payment_percentage || 0}%
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    <Percent size={12} className="inline mr-1" />
                                    Interest: {provider.interest_rate_percentage || 0}%
                                  </p>
                                </div>
                                {provider.email && (
                                  <p className="text-xs text-gray-500 mt-1">{provider.email}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Provider Info */}
                {bnplProvider && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-orange-700 mb-1">
                      <span className="font-semibold">Selected Provider:</span> {bnplProvider.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-orange-600">Down Payment:</p>
                        <p className="text-sm font-bold text-orange-800">{bnplProvider.down_payment_percentage || 0}%</p>
                        <p className="text-xs text-orange-600 mt-1">
                          Amount: {CURRENCY_SYMBOL} {((totalAmount * parseFloat(bnplProvider.down_payment_percentage || 0)) / 100).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-600">Interest Rate:</p>
                        <p className="text-sm font-bold text-orange-800">{bnplProvider.interest_rate_percentage || 0}%</p>
                        <p className="text-xs text-orange-600 mt-1">
                          Final: {CURRENCY_SYMBOL} {finalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Search */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (Card Number or Phone Number):</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={bnplSearchTerm}
                    onChange={(e) => handleBnplSearch(e.target.value)}
                    placeholder="Enter card number or phone number"
                    className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
                {bnplCustomer && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-orange-700 mb-1">
                      <span className="font-semibold">Customer:</span> {bnplCustomer.name}
                    </p>
                    <p className="text-xs sm:text-sm text-orange-700 mb-1">
                      <span className="font-semibold">Phone:</span> {bnplCustomer.phone || 'N/A'}
                    </p>
                    <p className="text-xs sm:text-sm text-orange-700 mb-1">
                      <span className="font-semibold">Email:</span> {bnplCustomer.email || 'N/A'}
                    </p>
                    {bnplCustomer.loyaltyCardNumber && (
                      <p className="text-xs sm:text-sm text-orange-700">
                        <span className="font-semibold">Card Number:</span> {bnplCustomer.loyaltyCardNumber}
                      </p>
                    )}
                  </div>
                )}
                {!bnplCustomer && bnplSearchTerm && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-700">
                      No customer found. Please check the search term.
                    </p>
                  </div>
                )}
              </div>

              {/* Down Payment */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">
                  Down Payment {bnplProvider ? `(${bnplProvider.down_payment_percentage || 0}% = ${CURRENCY_SYMBOL} ${((totalAmount * parseFloat(bnplProvider.down_payment_percentage || 0)) / 100).toFixed(2)})` : ''}:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bnplDownPayment}
                  onChange={(e) => {
                    if (!bnplProvider) {
                      const downPayment = parseFloat(e.target.value) || 0;
                      if (downPayment > finalAmount) {
                        setBnplDownPayment(finalAmount.toFixed(2));
                      } else {
                        setBnplDownPayment(e.target.value);
                      }
                    }
                  }}
                  readOnly={!!bnplProvider}
                  placeholder={bnplProvider ? ((totalAmount * parseFloat(bnplProvider.down_payment_percentage || 0)) / 100).toFixed(2) : "0.00"}
                  className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none ${
                    bnplProvider ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                {bnplProvider && (
                  <p className="text-xs text-orange-600 mt-1">
                    Calculated automatically based on provider's {bnplProvider.down_payment_percentage || 0}% down payment requirement
                  </p>
                )}
              </div>

              {/* Down Payment Channel */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Down Payment Channel:</label>
                <select
                  value={bnplDownPaymentChannel}
                  onChange={(e) => setBnplDownPaymentChannel(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Installment Configuration */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base">Number of Payments:</label>
                  <select
                    value={bnplInstallments}
                    onChange={(e) => setBnplInstallments(parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value={10}>10 payments</option>
                    <option value={20}>20 payments</option>
                    <option value={30}>30 payments</option>
                    <option value={40}>40 payments</option>
                    <option value={50}>50 payments</option>
                    <option value={60}>60 payments</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base">Payment Interval:</label>
                  <select
                    value={bnplInterval}
                    onChange={(e) => setBnplInterval(parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value={1}>Every Day</option>
                    <option value={7}>Every Week</option>
                  </select>
                </div>
              </div>

              {/* Installment Breakdown */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
                <p className="font-bold text-orange-700 mb-2 text-sm sm:text-base">Installment Breakdown:</p>
                {(() => {
                  const downPayment = parseFloat(bnplDownPayment) || 0;
                  const remaining = finalAmount - downPayment;
                  const installmentAmount = remaining / bnplInstallments;
                  const intervalText = bnplInterval === 1 ? 'day' : bnplInterval === 7 ? 'week' : 'day';
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm text-gray-600 pb-1 border-b border-orange-300">
                        <span>Order Total:</span>
                        <span>{CURRENCY_SYMBOL} {totalAmount.toFixed(2)}</span>
                      </div>
                      {bnplProvider && (
                        <div className="flex justify-between text-xs sm:text-sm text-gray-600 pb-1">
                          <span>Interest ({bnplProvider.interest_rate_percentage || 0}%):</span>
                          <span>{CURRENCY_SYMBOL} {(finalAmount - totalAmount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs sm:text-sm text-orange-700 font-semibold pt-1 border-t border-orange-300">
                        <span>Final Amount:</span>
                        <span>{CURRENCY_SYMBOL} {finalAmount.toFixed(2)}</span>
                      </div>
                      {downPayment > 0 && (
                        <div className="flex justify-between text-sm sm:text-base pt-2">
                          <span className="text-gray-700">Pay today:</span>
                          <span className="font-bold text-orange-600">{CURRENCY_SYMBOL} {downPayment.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-700">Remaining ({bnplInstallments} payments):</span>
                        <span className="font-bold text-orange-600">{CURRENCY_SYMBOL} {remaining.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-700">Per payment:</span>
                        <span className="font-bold text-orange-600">{CURRENCY_SYMBOL} {installmentAmount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 pt-2 border-t border-orange-300">
                        Every {intervalText}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Store Credit Section */}
        {paymentMethod === 'store-credit' && (
          <div className="mb-4 sm:mb-5">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-3 sm:p-4 mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CreditCard size={20} className="text-indigo-600" />
                <p className="font-bold text-indigo-700 text-sm sm:text-base">Pay with Store Credit</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Customer Search */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (Card Number or Phone Number):</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={storeCreditSearchTerm}
                    onChange={(e) => handleStoreCreditSearch(e.target.value)}
                    placeholder="Enter card number or phone number"
                    className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                {storeCreditCustomer && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-indigo-700 mb-1">
                      <span className="font-semibold">Customer:</span> {storeCreditCustomer.name}
                    </p>
                    <p className="text-xs sm:text-sm text-indigo-700 mb-1">
                      <span className="font-semibold">Phone:</span> {storeCreditCustomer.phone || 'N/A'}
                    </p>
                    <p className="text-xs sm:text-sm text-indigo-700 mb-1">
                      <span className="font-semibold">Email:</span> {storeCreditCustomer.email || 'N/A'}
                    </p>
                    {storeCreditCustomer.loyaltyCardNumber && (
                      <p className="text-xs sm:text-sm text-indigo-700 mb-1">
                        <span className="font-semibold">Card Number:</span> {storeCreditCustomer.loyaltyCardNumber}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-indigo-700">
                      <span className="font-semibold">Total Spent:</span> {CURRENCY_SYMBOL} {(storeCreditCustomer.totalSpent || 0).toFixed(2)}
                    </p>
                  </div>
                )}
                {!storeCreditCustomer && storeCreditSearchTerm && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-700">
                      No customer found. Please check the search term.
                    </p>
                  </div>
                )}
              </div>

              {/* Available Store Credit */}
              {storeCreditCustomer && (
                <>
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-indigo-700 text-sm sm:text-base">Available Store Credit:</span>
                      <span className="font-bold text-indigo-900 text-lg sm:text-xl">{CURRENCY_SYMBOL} {storeCreditBalance.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">This Purchase Uses:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={storeCreditUsed}
                      onChange={(e) => {
                        const used = parseFloat(e.target.value) || 0;
                        if (used > totalAmount) {
                          setStoreCreditUsed(totalAmount.toFixed(2));
                        } else if (used > storeCreditBalance) {
                          setStoreCreditUsed(storeCreditBalance.toFixed(2));
                        } else {
                          setStoreCreditUsed(e.target.value);
                        }
                      }}
                      placeholder={totalAmount.toFixed(2)}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Credit/Debit Card Payment Section */}
        {paymentMethod === 'card' && (
          <div className="mb-4 sm:mb-5 space-y-3 sm:space-y-4">
            {/* Customer Search */}
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (Optional - for loyalty points):</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={cardSearchTerm}
                  onChange={(e) => handleCardSearch(e.target.value)}
                  placeholder="Enter card number or phone number"
                  className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-teal-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              {cardCustomer && (
                <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-teal-700 mb-1">
                    <span className="font-semibold">Customer:</span> {cardCustomer.name}
                  </p>
                  <p className="text-xs sm:text-sm text-teal-700 mb-1">
                    <span className="font-semibold">Phone:</span> {cardCustomer.phone || 'N/A'}
                  </p>
                  {cardCustomer.loyaltyCardNumber && (
                    <p className="text-xs sm:text-sm text-teal-700 mb-1">
                      <span className="font-semibold">Card Number:</span> {cardCustomer.loyaltyCardNumber}
                    </p>
                  )}
                </div>
              )}
              {!cardCustomer && cardSearchTerm && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700">
                    No customer found. Please check the search term.
                  </p>
                </div>
              )}
            </div>

            {/* Points Redemption */}
            {cardCustomer && cardPointsBalance > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-yellow-800 text-sm sm:text-base flex items-center gap-2">
                      <Gift size={18} />
                      Available Points
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">1 point = {CURRENCY_SYMBOL} {loyaltyPointsRate.toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-yellow-900 text-lg sm:text-xl">{cardPointsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base text-yellow-800">Redeem Points (Optional):</label>
                  <input
                    type="number"
                    step="1"
                    value={cardPointsRedeemed}
                    onChange={(e) => {
                      const points = parseInt(e.target.value) || 0;
                      const maxPoints = Math.min(cardPointsBalance, Math.ceil(totalAmount / loyaltyPointsRate));
                      if (points > maxPoints) {
                        setCardPointsRedeemed(maxPoints.toString());
                      } else {
                        setCardPointsRedeemed(e.target.value);
                      }
                    }}
                    placeholder="0"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  {cardPointsRedeemed && parseInt(cardPointsRedeemed) > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Points Value: <span className="font-bold">{CURRENCY_SYMBOL} {(parseInt(cardPointsRedeemed || 0) * loyaltyPointsRate).toFixed(2)}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-green-700 font-semibold">
                        Amount After Points: <span className="font-bold">{CURRENCY_SYMBOL} {Math.max(0, totalAmount - (parseInt(cardPointsRedeemed || 0) * loyaltyPointsRate)).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Reference */}
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Card Transaction Reference *:</label>
              <input
                type="text"
                value={cardTransactionReference}
                onChange={(e) => setCardTransactionReference(e.target.value)}
                placeholder="Enter transaction reference from card terminal"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-teal-300 rounded-lg focus:border-teal-500 focus:outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the transaction reference number from the card payment terminal
              </p>
            </div>
          </div>
        )}

        {/* Loyalty Card Section - REMOVED - Points redemption now integrated into Cash/Mpesa/Cash+Mpesa */}
        {false && paymentMethod === 'loyalty-card' && (
          <div className="mb-4 sm:mb-5">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 rounded-lg p-3 sm:p-4 mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift size={20} className="text-pink-600" />
                <p className="font-bold text-pink-700 text-sm sm:text-base">Pay with Loyalty Card</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Customer Search */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer / Card Number:</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={loyaltySearchTerm}
                    onChange={(e) => handleLoyaltySearch(e.target.value)}
                    placeholder="Enter card number, name, or phone"
                    className="w-full pl-10 pr-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-pink-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>
                {loyaltyCustomer && (
                  <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-pink-700">
                      <span className="font-semibold">Customer:</span> {loyaltyCustomer.name}
                    </p>
                    <p className="text-xs sm:text-sm text-pink-700">
                      <span className="font-semibold">Card:</span> {loyaltyCustomer.loyaltyCardNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Available Points */}
              {loyaltyCustomer && (
                <>
                  <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-pink-700 text-sm sm:text-base">Available Points:</span>
                      <span className="font-bold text-pink-900 text-lg sm:text-xl">{loyaltyPointsBalance.toLocaleString()}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-pink-600 mt-1">
                      Conversion Rate: 1 point = {CURRENCY_SYMBOL} {loyaltyPointsRate.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-sm sm:text-base">Points to Redeem:</label>
                    <input
                      type="number"
                      step="1"
                      value={loyaltyPointsUsed}
                      onChange={(e) => {
                        const points = parseInt(e.target.value) || 0;
                        const maxPoints = loyaltyPointsBalance;
                        if (points > maxPoints) {
                          setLoyaltyPointsUsed(maxPoints.toString());
                        } else {
                          setLoyaltyPointsUsed(e.target.value);
                        }
                      }}
                      placeholder="Enter points"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-pink-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onProcessPayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
          >
            {paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa' ? 'Send STK Push' : 
             paymentMethod === 'bnpl' ? 'Confirm BNPL' :
             paymentMethod === 'store-credit' ? 'Use Store Credit' :
             paymentMethod === 'card' ? 'Complete Card Payment' :
             'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
