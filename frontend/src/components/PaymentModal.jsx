import React from 'react';
import { Banknote, Smartphone, Wallet, CreditCard, Calendar, Gift, Search } from 'lucide-react';
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
    mobileNumber,
    setMobileNumber,
    phoneValidation,
    setPhoneValidation,
    splitCashAmount,
    setSplitCashAmount,
    splitMobileAmount,
    setSplitMobileAmount,
    bnplDownPayment,
    setBnplDownPayment,
    bnplInstallments,
    setBnplInstallments,
    bnplInterval,
    setBnplInterval,
    bnplCustomer,
    bnplSearchTerm,
    setBnplSearchTerm,
    storeCreditBalance,
    storeCreditUsed,
    setStoreCreditUsed,
    storeCreditCustomer,
    storeCreditSearchTerm,
    setStoreCreditSearchTerm,
    loyaltyPointsUsed,
    setLoyaltyPointsUsed,
    loyaltyPointsBalance,
    loyaltyPointsRate,
    loyaltyCustomer,
    loyaltySearchTerm,
    setLoyaltySearchTerm,
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

  const handleBnplSearch = (value) => {
    searchCustomer(value, paymentState.setBnplCustomer, setBnplSearchTerm);
  };

  const handleStoreCreditSearch = (value) => {
    searchCustomer(value, paymentState.setStoreCreditCustomer, setStoreCreditSearchTerm);
    if (paymentState.storeCreditCustomer) {
      paymentState.setStoreCreditUsed(totalAmount.toFixed(2));
    }
  };

  const handleLoyaltySearch = (value) => {
    searchCustomer(value, paymentState.setLoyaltyCustomer, setLoyaltySearchTerm);
    if (paymentState.loyaltyCustomer) {
      const found = paymentState.loyaltyCustomer;
      paymentState.setLoyaltyCardNumber(found.loyaltyCardNumber || '');
      paymentState.setLoyaltyPointsBalance(found.points || 0);
      const pointsNeeded = Math.ceil(totalAmount / loyaltyPointsRate);
      if (pointsNeeded <= (found.points || 0)) {
        setLoyaltyPointsUsed(pointsNeeded.toString());
      } else {
        setLoyaltyPointsUsed('');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 sm:p-8 max-w-3xl w-full my-auto max-h-[95vh] overflow-y-auto">
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
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Banknote size={28} />
              <span className="text-sm sm:text-base font-medium">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('mobile')}
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
                setBnplInstallments(3);
                setBnplInterval(2);
                paymentState.setBnplCustomer(null);
                setBnplSearchTerm('');
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
                setPaymentMethod('loyalty-card');
                paymentState.setLoyaltyCardNumber('');
                setLoyaltyPointsUsed('');
                paymentState.setLoyaltyCustomer(null);
                setLoyaltySearchTerm('');
              }}
              className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col items-center gap-2 sm:gap-3 transition-colors ${
                paymentMethod === 'loyalty-card' ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Gift size={28} />
              <span className="text-sm sm:text-base font-medium text-center">Loyalty<br />Card</span>
            </button>
          </div>
        </div>

        {/* Cash Payment Section */}
        {paymentMethod === 'cash' && (
          <div className="mb-4 sm:mb-5">
            <label className="block font-semibold mb-2 text-sm sm:text-base">Amount Received:</label>
            <input
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            {amountReceived && parseFloat(amountReceived) >= totalAmount && (
              <p className="mt-2 text-sm sm:text-base text-green-600 font-semibold">
                Change: {CURRENCY_SYMBOL} {(parseFloat(amountReceived) - totalAmount).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Mobile Payment Section */}
        {paymentMethod === 'mobile' && (
          <div className="mb-4 sm:mb-5 space-y-3">
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
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                Total: <span className="font-bold text-gray-800">{CURRENCY_SYMBOL} {totalAmount.toFixed(2)}</span>
              </p>
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
                    const cash = parseFloat(cashValue) || 0;
                    const remaining = Math.max(0, totalAmount - cash);
                    setSplitMobileAmount(remaining.toFixed(2));
                  }}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone size={20} className="text-green-600" />
                  <label className="font-semibold text-green-700 text-sm sm:text-base">Mpesa Amount</label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={splitMobileAmount}
                  onChange={(e) => {
                    const mobileValue = e.target.value;
                    setSplitMobileAmount(mobileValue);
                    const mobile = parseFloat(mobileValue) || 0;
                    const remaining = Math.max(0, totalAmount - mobile);
                    setSplitCashAmount(remaining.toFixed(2));
                  }}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                />
              </div>
            </div>

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
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Customer Search */}
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (ID Number, Name, Phone, or Card Number):</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={bnplSearchTerm}
                    onChange={(e) => handleBnplSearch(e.target.value)}
                    placeholder="Enter ID number, name, phone, or card number"
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
                <label className="block font-semibold mb-2 text-sm sm:text-base">Down Payment (Optional):</label>
                <input
                  type="number"
                  step="0.01"
                  value={bnplDownPayment}
                  onChange={(e) => {
                    const downPayment = parseFloat(e.target.value) || 0;
                    if (downPayment > totalAmount) {
                      setBnplDownPayment(totalAmount.toFixed(2));
                    } else {
                      setBnplDownPayment(e.target.value);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                />
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
                    <option value={2}>2 payments</option>
                    <option value={3}>3 payments</option>
                    <option value={4}>4 payments</option>
                    <option value={6}>6 payments</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm sm:text-base">Payment Interval:</label>
                  <select
                    value={bnplInterval}
                    onChange={(e) => setBnplInterval(parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value={1}>Every week</option>
                    <option value={2}>Every 2 weeks</option>
                    <option value={4}>Every month</option>
                  </select>
                </div>
              </div>

              {/* Installment Breakdown */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
                <p className="font-bold text-orange-700 mb-2 text-sm sm:text-base">Installment Breakdown:</p>
                {(() => {
                  const downPayment = parseFloat(bnplDownPayment) || 0;
                  const remaining = totalAmount - downPayment;
                  const installmentAmount = remaining / bnplInstallments;
                  const intervalText = bnplInterval === 1 ? 'week' : bnplInterval === 2 ? '2 weeks' : 'month';
                  
                  return (
                    <div className="space-y-2">
                      {downPayment > 0 && (
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-700">Pay today:</span>
                          <span className="font-bold text-orange-600">{CURRENCY_SYMBOL} {downPayment.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-700">{bnplInstallments} payments of:</span>
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
                <label className="block font-semibold mb-2 text-sm sm:text-base">Search Customer (ID Number, Name, Phone, or Card Number):</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={storeCreditSearchTerm}
                    onChange={(e) => handleStoreCreditSearch(e.target.value)}
                    placeholder="Enter ID number, name, phone, or card number"
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

        {/* Loyalty Card Section */}
        {paymentMethod === 'loyalty-card' && (
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
             paymentMethod === 'loyalty-card' ? 'Redeem Points' :
             'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
