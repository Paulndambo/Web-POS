import { useState } from 'react';
import { CURRENCY_SYMBOL } from '../config/currency.js';

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
  
  // Mobile payment state
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneValidation, setPhoneValidation] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stkPushSent, setStkPushSent] = useState(false);
  
  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMobileAmount, setSplitMobileAmount] = useState('');
  
  // BNPL state
  const [bnplDownPayment, setBnplDownPayment] = useState('');
  const [bnplInstallments, setBnplInstallments] = useState(3);
  const [bnplInterval, setBnplInterval] = useState(2); // weeks
  const [bnplCustomer, setBnplCustomer] = useState(null);
  const [bnplSearchTerm, setBnplSearchTerm] = useState('');
  
  // Store Credit state
  const [storeCreditBalance, setStoreCreditBalance] = useState(10000);
  const [storeCreditUsed, setStoreCreditUsed] = useState('');
  const [storeCreditCustomer, setStoreCreditCustomer] = useState(null);
  const [storeCreditSearchTerm, setStoreCreditSearchTerm] = useState('');
  
  // Loyalty Card state
  const [loyaltyCardNumber, setLoyaltyCardNumber] = useState('');
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState('');
  const [loyaltyPointsBalance, setLoyaltyPointsBalance] = useState(0);
  const [loyaltyPointsRate, setLoyaltyPointsRate] = useState(1); // 1 point = 1 KES
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null);
  const [loyaltySearchTerm, setLoyaltySearchTerm] = useState('');

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

  // Search customer helper
  const searchCustomer = (searchTerm, setCustomer, setSearchTerm) => {
    const search = searchTerm.trim();
    setSearchTerm(search);
    
    if (!search) {
      setCustomer(null);
      return;
    }
    
    if (customers && customers.length > 0) {
      // Try exact match first (for IDs and card numbers)
      let found = customers.find(c => 
        c.id?.toString() === search ||
        c.loyaltyCardNumber?.toLowerCase() === search.toLowerCase()
      );
      
      // If no exact match, try partial match for names and phones
      if (!found) {
        found = customers.find(c => 
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.replace(/\s/g, '').includes(search.replace(/\s/g, ''))
        );
      }
      
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
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < totalAmount) {
        return { success: false, error: 'Insufficient amount received' };
      }
    } else if (paymentMethod === 'mobile') {
      const validation = validatePhoneNumber(mobileNumber);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    } else if (paymentMethod === 'cash+mpesa') {
      const cashAmount = parseFloat(splitCashAmount || 0);
      const mobileAmount = parseFloat(splitMobileAmount || 0);
      const sum = cashAmount + mobileAmount;
      if (Math.abs(sum - totalAmount) > 0.01) {
        return { 
          success: false, 
          error: `Payment amounts don't match total. Cash: ${CURRENCY_SYMBOL} ${cashAmount.toFixed(2)} + Mpesa: ${CURRENCY_SYMBOL} ${mobileAmount.toFixed(2)} = ${CURRENCY_SYMBOL} ${sum.toFixed(2)}, but total is ${CURRENCY_SYMBOL} ${totalAmount.toFixed(2)}` 
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
    } else if (paymentMethod === 'loyalty-card') {
      if (!loyaltyCustomer) {
        return { success: false, error: 'Please search and select a customer with a loyalty card' };
      }
      const points = parseInt(loyaltyPointsUsed || 0);
      if (isNaN(points) || points <= 0) {
        return { success: false, error: 'Please enter a valid number of points' };
      }
      if (points > loyaltyPointsBalance) {
        return { success: false, error: `Insufficient points. Available: ${loyaltyPointsBalance.toLocaleString()} points` };
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
    
    return {
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? roundMoney(cashReceived) : roundMoney(totalAmount),
      change: paymentMethod === 'cash' ? roundMoney(cashReceived - totalAmount) : 0,
      mobileNumber: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? mobileNumber : null,
      mobileNetwork: (paymentMethod === 'mobile' || paymentMethod === 'cash+mpesa') ? 'Safaricom' : null,
      splitCashAmount: paymentMethod === 'cash+mpesa' ? roundMoney(parseFloat(splitCashAmount || 0)) : null,
      splitMobileAmount: paymentMethod === 'cash+mpesa' ? roundMoney(parseFloat(splitMobileAmount || 0)) : null,
      bnplDownPayment: paymentMethod === 'bnpl' ? roundMoney(parseFloat(bnplDownPayment || 0)) : null,
      bnplInstallments: paymentMethod === 'bnpl' ? bnplInstallments : null,
      bnplInterval: paymentMethod === 'bnpl' ? bnplInterval : null,
      bnplCustomerId: paymentMethod === 'bnpl' ? (bnplCustomer?.id || null) : null,
      bnplCustomerName: paymentMethod === 'bnpl' ? (bnplCustomer?.name || '') : null,
      storeCreditUsed: paymentMethod === 'store-credit' ? roundMoney(parseFloat(storeCreditUsed || 0)) : null,
      storeCreditBalance: paymentMethod === 'store-credit' ? roundMoney(storeCreditBalance) : null,
      storeCreditCustomerId: paymentMethod === 'store-credit' ? (storeCreditCustomer?.id || null) : null,
      storeCreditCustomerName: paymentMethod === 'store-credit' ? (storeCreditCustomer?.name || '') : null,
      loyaltyCardNumber: paymentMethod === 'loyalty-card' ? loyaltyCardNumber : null,
      loyaltyPointsUsed: paymentMethod === 'loyalty-card' ? parseInt(loyaltyPointsUsed || 0) : null,
      loyaltyPointsBalance: paymentMethod === 'loyalty-card' ? loyaltyPointsBalance : null,
      loyaltyPointsRate: paymentMethod === 'loyalty-card' ? loyaltyPointsRate : null,
      loyaltyCustomerName: paymentMethod === 'loyalty-card' ? (loyaltyCustomer?.name || '') : null,
      status: paymentMethod === 'bnpl' ? 'pending' : 'paid'
    };
  };

  // Reset all payment state
  const resetPayment = () => {
    setShowPayment(false);
    setPaymentMethod('');
    setAmountReceived('');
    setMobileNumber('');
    setPhoneValidation(null);
    setSplitCashAmount('');
    setSplitMobileAmount('');
    setBnplDownPayment('');
    setBnplInstallments(3);
    setBnplInterval(2);
    setBnplCustomer(null);
    setBnplSearchTerm('');
    setStoreCreditUsed('');
    setStoreCreditCustomer(null);
    setStoreCreditSearchTerm('');
    setLoyaltyCardNumber('');
    setLoyaltyPointsUsed('');
    setLoyaltyCustomer(null);
    setLoyaltySearchTerm('');
    setLoyaltyPointsBalance(0);
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
    mobileNumber,
    phoneValidation,
    paymentProcessing,
    stkPushSent,
    splitCashAmount,
    splitMobileAmount,
    bnplDownPayment,
    bnplInstallments,
    bnplInterval,
    bnplCustomer,
    bnplSearchTerm,
    storeCreditBalance,
    storeCreditUsed,
    storeCreditCustomer,
    storeCreditSearchTerm,
    loyaltyCardNumber,
    loyaltyPointsUsed,
    loyaltyPointsBalance,
    loyaltyPointsRate,
    loyaltyCustomer,
    loyaltySearchTerm,
    
    // Setters
    setShowPayment,
    setPaymentMethod,
    setAmountReceived,
    setMobileNumber,
    setPhoneValidation,
    setPaymentProcessing,
    setStkPushSent,
    setSplitCashAmount,
    setSplitMobileAmount,
    setBnplDownPayment,
    setBnplInstallments,
    setBnplInterval,
    setBnplCustomer,
    setBnplSearchTerm,
    setStoreCreditBalance,
    setStoreCreditUsed,
    setStoreCreditCustomer,
    setStoreCreditSearchTerm,
    setLoyaltyCardNumber,
    setLoyaltyPointsUsed,
    setLoyaltyPointsBalance,
    setLoyaltyPointsRate,
    setLoyaltyCustomer,
    setLoyaltySearchTerm,
    
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
