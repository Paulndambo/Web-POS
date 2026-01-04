// Currency configuration
// Change this value to update currency across the entire application
export const CURRENCY_SYMBOL = 'KSh';
export const CURRENCY_CODE = 'KES';
export const BASE_URL = 'https://webpos.collegeerp.co.ke';

// Format amount with currency symbol
export const formatCurrency = (amount) => {
  return `${CURRENCY_SYMBOL} ${parseFloat(amount).toFixed(2)}`;
};

// Format amount with currency symbol for display (no decimals for whole numbers)
export const formatCurrencyDisplay = (amount) => {
  const num = parseFloat(amount);
  if (num % 1 === 0) {
    return `${CURRENCY_SYMBOL} ${num.toFixed(0)}`;
  }
  return `${CURRENCY_SYMBOL} ${num.toFixed(2)}`;
};

