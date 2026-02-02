import { useState, useEffect } from 'react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import { apiGet } from '../utils/api.js';

/**
 * Custom hook for managing payment state and logic
 * @param {Object} options - Configuration options
 * @param {number} options.totalAmount - Total amount to be paid
 * @param {Function} options.onPaymentComplete - Callback when payment is completed
 * @param {Array} options.customers - Array of customers for BNPL, Store Credit, and Loyalty Card
 * @param {Object} options.config - Additional configuration
 * @returns {Object} Payment state and handlers
 */
export const usePayment = ({
  totalAmount,
  onPaymentComplete,
  customers = [],
  config = {}
}) => {
  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Cash payment state
  const [amountReceived, setAmountReceived] = useState('');
  const [cashCustomer, setCashCustomer] = useState(null);
  const [cashSearchTerm, setCashSearchTerm] = useState('');
  const [cashPointsRedeemed, setCashPointsRedeemed] = useState('');
  const [cashPointsBalance, setCashPointsBalance] = useState(0);
  
  // Mobile payment state
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneValidation, setPhoneValidation] = useState(null);
  const [mobileCustomer, setMobileCustomer] = useState(null);
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [mobilePointsRedeemed, setMobilePointsRedeemed] = useState('');
  const [mobilePointsBalance, setMobilePointsBalance] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stkPushSent, setStkPushSent] = useState(false);
  
  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMobileAmount, setSplitMobileAmount] = useState('');
  const [splitCustomer, setSplitCustomer] = useState(null);
  const [splitSearchTerm, setSplitSearchTerm] = useState('');
  const [splitPointsRedeemed, setSplitPointsRedeemed] = useState('');
  const [splitPointsBalance, setSplitPointsBalance] = useState(0);
  
  // Points conversion rate
  const loyaltyPointsRate = 1; // 1 point = 1 KES
  
  // BNPL state
  const [bnplDownPayment, setBnplDownPayment] = useState('');
  const [bnplInstallments, setBnplInstallments] = useState(10);
  const [bnplInterval, setBnplInterval] = useState(1); // 1 = Every Day, 7 = Every Week
  const [bnplCustomer, setBnplCustomer] = useState(null);
  const [bnplSearchTerm, setBnplSearchTerm] = useState('');
  const [bnplProviders, setBnplProviders] = useState([]);
  const [bnplProvider, setBnplProvider] = useState(null);
  const [bnplProviderSearchTerm, setBnplProviderSearchTerm] = useState('');
  const [loadingBnplProviders, setLoadingBnplProviders] = useState(false);
  const [bnplDownPaymentChannel, setBnplDownPaymentChannel] = useState('Cash');
  
  // Store Credit state
  const [storeCreditBalance, setStoreCreditBalance] = useState(10000);
  const [storeCreditUsed, setStoreCreditUsed] = useState('');
  const [storeCreditCustomer, setStoreCreditCustomer] = useState(null);
  const [storeCreditSearchTerm, setStoreCreditSearchTerm] = useState('');
  
  // Card payment state
  const [cardCustomer, setCardCustomer] = useState(null);
  const [cardSearchTerm, setCardSearchTerm] = useState('');
  const [cardPointsRedeemed, setCardPointsRedeemed] = useState('');
  const [cardPointsBalance, setCardPointsBalance] = useState(0);
  const [cardTransactionReference, setCardTransactionReference] = useState('');

  // Fetch BNPL providers
  const fetchBnplProviders = async () => {
    try {
      setLoadingBnplProviders(true);
      const response = await apiGet('/bnpl/service-providers/');
      if (response.ok) {
        const data = await response.json();
        setBnplProviders(data.results || data || []);
      }
    } catch (error) {
      console.error('Error fetching BNPL providers:', error);
    } finally {
      setLoadingBnplProviders(false);
    }
  };

  // Fetch providers when BNPL payment method is selected
  useEffect(() => {
    if (paymentMethod === 'bnpl' && bnplProviders.length === 0) {
      fetchBnplProviders();
    }
  }, [paymentMethod]);

  // Auto-calculate down payment when provider is selected
  useEffect(() => {
    if (bnplProvider && totalAmount) {
      const downPaymentPercentage = parseFloat(bnplProvider.down_payment_percentage || 0);
      const calculatedDownPayment = (totalAmount * downPaymentPercentage) / 100;
      setBnplDownPayment(calculatedDownPayment.toFixed(2));
    }
  }, [bnplProvider, totalAmount]);

  // Helper function to round monetary values
  const roundMoney = (value) => Math.round(value * 100) / 100;

  // Validate phone number
  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
      return { valid: false, error: 'Phone number is required' };
    }

    const normalized = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d+$/.test(normalized)) {
      return { valid: false, error: 'Phone number should contain only digits' };
    }

    let cleanedNumber = normalized;
    if (cleanedNumber.startsWith('254')) {
      if (cleanedNumber.length !== 12) {
        return { valid: false, error: 'Invalid international format. Should be 254 followed by 9 digits' };
      }
      cleanedNumber = cleanedNumber.substring(3);
    } else if (cleanedNumber.startsWith('0')) {
      if (cleanedNumber.length !== 10) {
        return { valid: false, error: 'Invalid local format. Should be 0 followed by 9 digits (10 digits total)' };
      }
      cleanedNumber = cleanedNumber.substring(1);
    }

    if (cleanedNumber.length !== 9) {
      if (normalized.length < 9) {
        return { valid: false, error: 'Phone number is too short. Expected 9-12 digits' };
      } else if (normalized.length > 12) {
        return { valid: false, error: 'Phone number is too long. Expected 9-12 digits' };
      } else {
        return { valid: false, error: `Invalid length. Got ${cleanedNumber.length} digits, expected 9 after removing country code` };
      }
    }

    const firstDigit = cleanedNumber[0];
    const validPrefixes = ['1', '7'];
    if (!validPrefixes.includes(firstDigit)) {
      return { valid: false, error: 'Invalid phone number format. Kenyan mobile numbers start with 1 or 7 (after removing country code)' };
    }

    return { valid: true, cleaned: '0' + cleanedNumber };
  };

  // Search customer helper - exact matches only for card number or phone number
  const searchCustomer = (searchTerm, setCustomer, setSearchTerm) => {
    const search = searchTerm.trim();
    setSearchTerm(search);
    
    if (!search) {
      setCustomer(null);
      return;
    }
    
    if (customers && customers.length > 0) {
      // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
      const normalizePhone = (phone) => {
        if (!phone) return '';
        return phone.replace(/[\s\-\(\)\+]/g, '');
      };
      
      const normalizedSearch = normalizePhone(search);
      
      // Exact match only for card number or phone number
      const found = customers.find(c => {
        // Exact match for card number (case-insensitive)
        if (c.loyaltyCardNumber?.toLowerCase() === search.toLowerCase()) {
          return true;
        }
        
        // Exact match for phone number (normalized)
        const customerPhone = normalizePhone(c.phone);
        if (customerPhone && customerPhone === normalizedSearch) {
          return true;
        }
        
        // Also check if customer phone matches when search is in different format
        // Handle cases where search might be with/without country code
        if (customerPhone && normalizedSearch) {
          // If search starts with 254, check if it matches customer phone with 254
          if (normalizedSearch.startsWith('254') && customerPhone.startsWith('254')) {
            return customerPhone === normalizedSearch;
          }
          // If search starts with 0, check if it matches customer phone starting with 0
          if (normalizedSearch.startsWith('0') && customerPhone.startsWith('0')) {
            return customerPhone === normalizedSearch;
          }
          // If search is 9 digits, check if it matches last 9 digits of customer phone
          if (normalizedSearch.length === 9 && customerPhone.length >= 9) {
            const customerLast9 = customerPhone.slice(-9);
            return customerLast9 === normalizedSearch;
          }
        }
        
        return false;
      });
      
      setCustomer(found || null);
    } else {
      setCustomer(null);
    }
  };

  // Process payment
  const processPayment = () => {
    if (!paymentMethod) {
      return { success: false, error: 'Please select a payment method' };
    }

    if (paymentMethod === 'cash') {
      // Calculate amount after points redemption
      const pointsValue = cashCustomer && cashPointsRedeemed ? (parseInt(cashPointsRedeemed || 0) * loyaltyPointsRate) : 0;
      const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < amountAfterPoints) {
        return { success: false, error: `Insufficient amount received. Amount after points: ${CURRENCY_SYMBOL} ${amountAfterPoints.toFixed(2)}` };
      }
    } else if (paymentMethod === 'mobile') {
      const validation = validatePhoneNumber(mobileNumber);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    } else if (paymentMethod === 'cash+mpesa') {
      // Calculate amount after points redemption
      const pointsValue = splitCustomer && splitPointsRedeemed ? (parseInt(splitPointsRedeemed || 0) * loyaltyPointsRate) : 0;
      const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
      const cashAmount = parseFloat(splitCashAmount || 0);
      const mobileAmount = parseFloat(splitMobileAmount || 0);
      const sum = cashAmount + mobileAmount;
      if (Math.abs(sum - amountAfterPoints) > 0.01) {
        return { 
          success: false, 
          error: `Payment amounts don't match total after points. Cash: ${CURRENCY_SYMBOL} ${cashAmount.toFixed(2)} + Mpesa: ${CURRENCY_SYMBOL} ${mobileAmount.toFixed(2)} = ${CURRENCY_SYMBOL} ${sum.toFixed(2)}, but amount after points is ${CURRENCY_SYMBOL} ${amountAfterPoints.toFixed(2)}` 
        };
      }
      const validation = validatePhoneNumber(mobileNumber);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    } else if (paymentMethod === 'bnpl') {
      if (!bnplCustomer) {
        return { success: false, error: 'Please search and select a customer' };
      }
      if (!bnplProvider) {
        return { success: false, error: 'Please select a BNPL service provider' };
      }
      const downPayment = parseFloat(bnplDownPayment || 0);
      if (downPayment > totalAmount) {
        return { success: false, error: 'Down payment cannot exceed total amount' };
      }
      if (downPayment < 0) {
        return { success: false, error: 'Down payment cannot be negative' };
      }
    } else if (paymentMethod === 'store-credit') {
      if (!storeCreditCustomer) {
        return { success: false, error: 'Please search and select a customer' };
      }
      const creditUsed = parseFloat(storeCreditUsed || 0);
      if (isNaN(creditUsed) || creditUsed <= 0) {
        return { success: false, error: 'Please enter a valid credit amount' };
      }
      if (creditUsed > totalAmount) {
        return { success: false, error: 'Credit amount cannot exceed purchase total' };
      }
      if (creditUsed > storeCreditBalance) {
        return { success: false, error: `Insufficient store credit. Available: ${CURRENCY_SYMBOL} ${storeCreditBalance.toFixed(2)}` };
      }
    } else if (paymentMethod === 'card') {
      if (!cardTransactionReference || !cardTransactionReference.trim()) {
        return { success: false, error: 'Please enter the card transaction reference' };
      }
    }

    // Validate points redemption if customer is found
    if (paymentMethod === 'cash' && cashCustomer && cashPointsRedeemed) {
      const points = parseInt(cashPointsRedeemed || 0);
      if (points > cashPointsBalance) {
        return { success: false, error: `Insufficient points. Available: ${cashPointsBalance.toLocaleString()} points` };
      }
      const pointsValue = points * loyaltyPointsRate;
      if (pointsValue > totalAmount) {
        return { success: false, error: `Points value (${CURRENCY_SYMBOL} ${pointsValue.toFixed(2)}) cannot exceed purchase total` };
      }
    }
    if (paymentMethod === 'mobile' && mobileCustomer && mobilePointsRedeemed) {
      const points = parseInt(mobilePointsRedeemed || 0);
      if (points > mobilePointsBalance) {
        return { success: false, error: `Insufficient points. Available: ${mobilePointsBalance.toLocaleString()} points` };
      }
      const pointsValue = points * loyaltyPointsRate;
      if (pointsValue > totalAmount) {
        return { success: false, error: `Points value (${CURRENCY_SYMBOL} ${pointsValue.toFixed(2)}) cannot exceed purchase total` };
      }
    }
    if (paymentMethod === 'cash+mpesa' && splitCustomer && splitPointsRedeemed) {
      const points = parseInt(splitPointsRedeemed || 0);
      if (points > splitPointsBalance) {
        return { success: false, error: `Insufficient points. Available: ${splitPointsBalance.toLocaleString()} points` };
      }
      const pointsValue = points * loyaltyPointsRate;
      if (pointsValue > totalAmount) {
        return { success: false, error: `Points value (${CURRENCY_SYMBOL} ${pointsValue.toFixed(2)}) cannot exceed purchase total` };
      }
    }
    if (paymentMethod === 'card' && cardCustomer && cardPointsRedeemed) {
      const points = parseInt(cardPointsRedeemed || 0);
      if (points > cardPointsBalance) {
        return { success: false, error: `Insufficient points. Available: ${cardPointsBalance.toLocaleString()} points` };
      }
      const pointsValue = points * loyaltyPointsRate;
      if (pointsValue > totalAmount) {
        return { success: false, error: `Points value (${CURRENCY_SYMBOL} ${pointsValue.toFixed(2)}) cannot exceed purchase total` };
      }
    }

    // Build payment data
    const paymentData = buildPaymentData();
    
    return { success: true, paymentData };
  };

  // Build payment data object
  const buildPaymentData = () => {
    const cashReceived = paymentMethod === 'cash' ? parseFloat(amountReceived) : 0;
    
    // Get points redeemed and calculate points value
    let pointsRedeemed = 0;
    let pointsBalance = 0;
    if (paymentMethod === 'cash' && cashCustomer) {
      pointsRedeemed = parseInt(cashPointsRedeemed || 0);
      pointsBalance = cashPointsBalance;
    } else if (paymentMethod === 'mobile' && mobileCustomer) {
      pointsRedeemed = parseInt(mobilePointsRedeemed || 0);
      pointsBalance = mobilePointsBalance;
    } else if (paymentMethod === 'cash+mpesa' && splitCustomer) {
      pointsRedeemed = parseInt(splitPointsRedeemed || 0);
      pointsBalance = splitPointsBalance;
    } else if (paymentMethod === 'card' && cardCustomer) {
      pointsRedeemed = parseInt(cardPointsRedeemed || 0);
      pointsBalance = cardPointsBalance;
    }
    
    const pointsValue = pointsRedeemed * loyaltyPointsRate;
    const amountAfterPoints = Math.max(0, totalAmount - pointsValue);
    
    return {
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? roundMoney(cashReceived) : roundMoney(amountAfterPoints),
      change: paymentMethod === 'cash' ? roundMoney(cashReceived - amountAfterPoints) : 0,
      mobileNumber: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? mobileNumber : null,
      mobileNetwork: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? 'Safaricom' : null,
      splitCashAmount: paymentMethod === 'cash+mpesa' ? roundMoney(parseFloat(splitCashAmount || 0)) : null,
      splitMobileAmount: paymentMethod === 'cash+mpesa' ? roundMoney(parseFloat(splitMobileAmount || 0)) : null,
      bnplDownPayment: paymentMethod === 'bnpl' ? roundMoney(parseFloat(bnplDownPayment || 0)) : null,
      bnplInstallments: paymentMethod === 'bnpl' ? bnplInstallments : null,
      bnplInterval: paymentMethod === 'bnpl' ? bnplInterval : null,
      bnplProviderId: paymentMethod === 'bnpl' && bnplProvider ? parseInt(bnplProvider.id) : null,
      bnplProviderName: paymentMethod === 'bnpl' && bnplProvider ? bnplProvider.name : null,
      bnplInterestRate: paymentMethod === 'bnpl' && bnplProvider ? parseFloat(bnplProvider.interest_rate_percentage || 0) : null,
      downPaymentChannel: paymentMethod === 'bnpl' ? bnplDownPaymentChannel : null,
      customerId: paymentMethod === 'cash' ? (cashCustomer?.id ? parseInt(cashCustomer.id) : null) :
                  paymentMethod === 'mobile' ? (mobileCustomer?.id ? parseInt(mobileCustomer.id) : null) :
                  paymentMethod === 'cash+mpesa' ? (splitCustomer?.id ? parseInt(splitCustomer.id) : null) :
                  paymentMethod === 'bnpl' ? (bnplCustomer?.id ? parseInt(bnplCustomer.id) : null) : 
                  paymentMethod === 'store-credit' ? (storeCreditCustomer?.id ? parseInt(storeCreditCustomer.id) : null) :
                  paymentMethod === 'card' ? (cardCustomer?.id ? parseInt(cardCustomer.id) : null) : null,
      customerName: paymentMethod === 'cash' ? (cashCustomer?.name || '') :
                    paymentMethod === 'mobile' ? (mobileCustomer?.name || '') :
                    paymentMethod === 'cash+mpesa' ? (splitCustomer?.name || '') :
                    paymentMethod === 'bnpl' ? (bnplCustomer?.name || '') : 
                    paymentMethod === 'store-credit' ? (storeCreditCustomer?.name || '') :
                    paymentMethod === 'card' ? (cardCustomer?.name || '') : null,
      cardNumber: paymentMethod === 'cash' ? (cashCustomer?.loyaltyCardNumber || cashCustomer?.card_number || '') :
                  paymentMethod === 'mobile' ? (mobileCustomer?.loyaltyCardNumber || mobileCustomer?.card_number || '') :
                  paymentMethod === 'cash+mpesa' ? (splitCustomer?.loyaltyCardNumber || splitCustomer?.card_number || '') :
                  paymentMethod === 'bnpl' ? (bnplCustomer?.loyaltyCardNumber || bnplCustomer?.card_number || '') :
                  paymentMethod === 'store-credit' ? (storeCreditCustomer?.loyaltyCardNumber || storeCreditCustomer?.card_number || '') :
                  paymentMethod === 'card' ? (cardCustomer?.loyaltyCardNumber || cardCustomer?.card_number || '') : '',
      cardTransactionReference: paymentMethod === 'card' ? cardTransactionReference : null,
      storeCreditUsed: paymentMethod === 'store-credit' ? roundMoney(parseFloat(storeCreditUsed || 0)) : null,
      storeCreditBalance: paymentMethod === 'store-credit' ? roundMoney(storeCreditBalance) : null,
      loyaltyPointsUsed: pointsRedeemed > 0 ? pointsRedeemed : null,
      loyaltyPointsBalance: pointsBalance > 0 ? pointsBalance : null,
      loyaltyPointsRate: pointsRedeemed > 0 ? loyaltyPointsRate : null,
      loyaltyPointsValue: pointsValue > 0 ? roundMoney(pointsValue) : null,
      status: paymentMethod === 'bnpl' ? 'pending' : 'paid'
    };
  };

  // Reset all payment state
  const resetPayment = () => {
    setShowPayment(false);
    setPaymentMethod('');
    setAmountReceived('');
    setCashCustomer(null);
    setCashSearchTerm('');
    setCashPointsRedeemed('');
    setCashPointsBalance(0);
    setMobileNumber('');
    setPhoneValidation(null);
    setMobileCustomer(null);
    setMobileSearchTerm('');
    setMobilePointsRedeemed('');
    setMobilePointsBalance(0);
    setSplitCashAmount('');
    setSplitMobileAmount('');
    setSplitCustomer(null);
    setSplitSearchTerm('');
    setSplitPointsRedeemed('');
    setSplitPointsBalance(0);
    setBnplDownPayment('');
    setBnplInstallments(10);
    setBnplInterval(1);
    setBnplCustomer(null);
    setBnplSearchTerm('');
    setBnplProvider(null);
    setBnplProviderSearchTerm('');
    setBnplDownPaymentChannel('Cash');
    setStoreCreditUsed('');
    setStoreCreditCustomer(null);
    setStoreCreditSearchTerm('');
    setCardCustomer(null);
    setCardSearchTerm('');
    setCardPointsRedeemed('');
    setCardPointsBalance(0);
    setCardTransactionReference('');
    setPaymentProcessing(false);
    setStkPushSent(false);
  };

  // Open payment modal
  const openPayment = () => {
    setShowPayment(true);
    // Auto-set store credit amount if using store credit
    if (paymentMethod === 'store-credit') {
      setStoreCreditUsed(totalAmount.toFixed(2));
    }
  };

  // Close payment modal
  const closePayment = () => {
    resetPayment();
  };

  return {
    // State
    showPayment,
    paymentMethod,
    amountReceived,
    cashCustomer,
    cashSearchTerm,
    cashPointsRedeemed,
    cashPointsBalance,
    mobileNumber,
    phoneValidation,
    mobileCustomer,
    mobileSearchTerm,
    mobilePointsRedeemed,
    mobilePointsBalance,
    paymentProcessing,
    stkPushSent,
    splitCashAmount,
    splitMobileAmount,
    splitCustomer,
    splitSearchTerm,
    splitPointsRedeemed,
    splitPointsBalance,
    bnplDownPayment,
    bnplInstallments,
    bnplInterval,
    bnplCustomer,
    bnplSearchTerm,
    bnplProviders,
    bnplProvider,
    bnplProviderSearchTerm,
    loadingBnplProviders,
    bnplDownPaymentChannel,
    storeCreditBalance,
    storeCreditUsed,
    storeCreditCustomer,
    storeCreditSearchTerm,
    cardCustomer,
    cardSearchTerm,
    cardPointsRedeemed,
    cardPointsBalance,
    cardTransactionReference,
    loyaltyPointsRate,
    
    // Setters
    setShowPayment,
    setPaymentMethod,
    setAmountReceived,
    setCashCustomer,
    setCashSearchTerm,
    setCashPointsRedeemed,
    setCashPointsBalance,
    setMobileNumber,
    setPhoneValidation,
    setMobileCustomer,
    setMobileSearchTerm,
    setMobilePointsRedeemed,
    setMobilePointsBalance,
    setPaymentProcessing,
    setStkPushSent,
    setSplitCashAmount,
    setSplitMobileAmount,
    setSplitCustomer,
    setSplitSearchTerm,
    setSplitPointsRedeemed,
    setSplitPointsBalance,
    setBnplDownPayment,
    setBnplInstallments,
    setBnplInterval,
    setBnplCustomer,
    setBnplSearchTerm,
    setBnplProvider,
    setBnplProviderSearchTerm,
    fetchBnplProviders,
    setBnplDownPaymentChannel,
    setStoreCreditBalance,
    setStoreCreditUsed,
    setStoreCreditCustomer,
    setStoreCreditSearchTerm,
    setCardCustomer,
    setCardSearchTerm,
    setCardPointsRedeemed,
    setCardPointsBalance,
    setCardTransactionReference,
    
    // Helpers
    validatePhoneNumber,
    searchCustomer,
    processPayment,
    buildPaymentData,
    resetPayment,
    openPayment,
    closePayment,
    roundMoney
  };
};
