# PaymentModal Component - Usage Guide

## Overview

The `PaymentModal` component and `usePayment` hook provide a reusable payment system that can be used across POS, Orders, and Invoices. This eliminates code duplication and makes it easy to maintain and upgrade payment functionality.

## Components

### 1. `usePayment` Hook (`src/hooks/usePayment.js`)

A custom React hook that manages all payment state and logic.

**Parameters:**
- `totalAmount` (number): Total amount to be paid
- `onPaymentComplete` (function): Callback when payment is completed
- `customers` (array): Array of customers for BNPL, Store Credit, and Loyalty Card
- `config` (object): Additional configuration options

**Returns:**
- Payment state (all payment-related state variables)
- Setters (functions to update state)
- Helper functions (validatePhoneNumber, searchCustomer, processPayment, etc.)

### 2. `PaymentModal` Component (`src/components/PaymentModal.jsx`)

A reusable modal component that displays the payment UI.

**Props:**
- `show` (boolean): Whether to show the modal
- `totalAmount` (number): Total amount to be paid
- `paymentState` (object): Payment state from usePayment hook
- `onProcessPayment` (function): Callback when payment is processed
- `onCancel` (function): Callback when payment is cancelled
- `customers` (array): Array of customers
- `config` (object): Configuration options

## Usage Example

```jsx
import React from 'react';
import { usePayment } from '../hooks/usePayment';
import PaymentModal from '../components/PaymentModal';
import { useCustomers } from '../contexts/CustomersContext';

const MyComponent = () => {
  const { customers } = useCustomers();
  const totalAmount = 1000.00; // Your total amount
  
  const payment = usePayment({
    totalAmount,
    onPaymentComplete: handlePaymentComplete,
    customers
  });

  const handlePaymentComplete = (paymentData) => {
    // Process the payment data
    console.log('Payment data:', paymentData);
    // Submit to your backend API
    // Then close the modal
    payment.closePayment();
  };

  const handleProcessPayment = () => {
    const result = payment.processPayment();
    if (result.success) {
      handlePaymentComplete(result.paymentData);
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <button onClick={payment.openPayment}>
        Process Payment
      </button>
      
      <PaymentModal
        show={payment.showPayment}
        totalAmount={totalAmount}
        paymentState={payment}
        onProcessPayment={handleProcessPayment}
        onCancel={payment.closePayment}
        customers={customers}
      />
    </>
  );
};
```

## Payment Methods Supported

1. **Cash** - Standard cash payment with change calculation
2. **M-Pesa** - Mobile money payment with phone number validation
3. **Cash + Mpesa** - Split payment between cash and mobile money
4. **Buy Now, Pay Later (BNPL)** - Installment payment with customer search
5. **Store Credit** - Payment using store credit with customer search
6. **Loyalty Card** - Payment using loyalty points with customer search

## Integration Steps

### Step 1: Import the hook and component

```jsx
import { usePayment } from '../hooks/usePayment';
import PaymentModal from '../components/PaymentModal';
```

### Step 2: Initialize the hook

```jsx
const payment = usePayment({
  totalAmount: yourTotalAmount,
  onPaymentComplete: handlePaymentComplete,
  customers: customersArray
});
```

### Step 3: Add the modal to your JSX

```jsx
<PaymentModal
  show={payment.showPayment}
  totalAmount={yourTotalAmount}
  paymentState={payment}
  onProcessPayment={handleProcessPayment}
  onCancel={payment.closePayment}
  customers={customersArray}
/>
```

### Step 4: Handle payment processing

```jsx
const handleProcessPayment = () => {
  const result = payment.processPayment();
  if (result.success) {
    // Submit paymentData to your backend
    submitPaymentToBackend(result.paymentData);
    payment.closePayment();
  } else {
    // Show error message
    alert(result.error);
  }
};
```

## Payment Data Structure

The `processPayment()` function returns a payment data object with the following structure:

```javascript
{
  paymentMethod: 'cash' | 'mobile' | 'cash+mpesa' | 'bnpl' | 'store-credit' | 'loyalty-card',
  amountReceived: number,
  change: number,
  mobileNumber: string | null,
  mobileNetwork: string | null,
  splitCashAmount: number | null,
  splitMobileAmount: number | null,
  bnplDownPayment: number | null,
  bnplInstallments: number | null,
  bnplInterval: number | null,
  bnplCustomerId: string | null,
  bnplCustomerName: string | null,
  storeCreditUsed: number | null,
  storeCreditBalance: number | null,
  storeCreditCustomerId: string | null,
  storeCreditCustomerName: string | null,
  loyaltyCardNumber: string | null,
  loyaltyPointsUsed: number | null,
  loyaltyPointsBalance: number | null,
  loyaltyPointsRate: number | null,
  loyaltyCustomerName: string | null,
  status: 'paid' | 'pending'
}
```

## Benefits

1. **Code Reusability** - Use the same payment logic across multiple pages
2. **Easy Maintenance** - Update payment logic in one place
3. **Consistency** - Same payment experience everywhere
4. **Extensibility** - Easy to add new payment methods
5. **Type Safety** - Clear data structures and validation

## Notes

- The hook handles all state management internally
- Phone number validation is built-in
- Customer search is optimized for performance
- All monetary values are rounded to 2 decimal places
- The component is fully responsive
