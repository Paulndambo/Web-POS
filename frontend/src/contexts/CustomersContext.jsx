import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';

const CustomersContext = createContext(null);

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
};

// Transform backend customer data to frontend format
const transformCustomerFromBackend = (backendCustomer) => {
  return {
    id: backendCustomer.id?.toString() || backendCustomer.card_number,
    name: backendCustomer.customer_name,
    email: backendCustomer.customer_email,
    phone: backendCustomer.phone_number,
    address: backendCustomer.address || '',
    loyaltyCardNumber: backendCustomer.card_number,
    points: parseFloat(backendCustomer.points || 0),
    totalSpent: parseFloat(backendCustomer.amount_spend || 0),
    availableCredit: parseFloat(backendCustomer.available_credit || 0),
    totalStoreCredit: parseFloat(backendCustomer.total_store_credit || 0),
    status: backendCustomer.status || 'Active',
    createdAt: backendCustomer.created_at || backendCustomer.createdAt || new Date().toISOString(),
    transactions: backendCustomer.transactions || []
  };
};

// Transform frontend customer data to backend format
const transformCustomerToBackend = (frontendCustomer) => {
  return {
    card_number: frontendCustomer.loyaltyCardNumber || frontendCustomer.card_number,
    customer_name: frontendCustomer.name || frontendCustomer.customer_name,
    customer_email: frontendCustomer.email || frontendCustomer.customer_email,
    phone_number: frontendCustomer.phone || frontendCustomer.phone_number,
    address: frontendCustomer.address || '',
    amount_spend: parseFloat(frontendCustomer.totalSpent || frontendCustomer.amount_spend || 0),
    points: parseFloat(frontendCustomer.points || 0),
    status: frontendCustomer.status || 'Active'
  };
};

export const CustomersProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/customers/loyalty-cards/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle paginated response or array response
      const customersArray = data.results || data || [];
      const transformedCustomers = customersArray.map(transformCustomerFromBackend);
      setCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message);
      // Fallback to empty array on error
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for authentication to be ready before fetching
    if (!authLoading && isAuthenticated) {
      fetchCustomers();
    } else if (!authLoading && !isAuthenticated) {
      // If not authenticated, set loading to false
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const addCustomer = async (customerData) => {
    try {
      const customerDataWithDefaults = {
        ...customerData,
        loyaltyCardNumber: customerData.loyaltyCardNumber || generateLoyaltyCardNumber(),
        points: customerData.points || 0,
        totalSpent: customerData.totalSpent || 0
      };
      
      const backendData = transformCustomerToBackend(customerDataWithDefaults);
      
      const response = await apiPost('/customers/loyalty-cards/', backendData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const createdCustomer = await response.json();
      const transformedCustomer = transformCustomerFromBackend(createdCustomer);
      
      // Refresh the list
      await fetchCustomers();
      
      return transformedCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (customerId, updates) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Only send editable fields: customer_name, phone_number, customer_email, address
      const editableFields = {
        customer_name: updates.name || updates.customer_name || customer.name,
        phone_number: updates.phone || updates.phone_number || customer.phone,
        customer_email: updates.email || updates.customer_email || customer.email,
        address: updates.address || customer.address
      };
      
      // Use PATCH on the details endpoint
      const response = await apiPatch(`/customers/loyalty-cards/${customerId}/details/`, editableFields);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const updatedCustomer = await response.json();
      const transformedCustomer = transformCustomerFromBackend(updatedCustomer);
      
      // Refresh the list
      await fetchCustomers();
      
      return transformedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (customerId) => {
    try {
      const response = await apiDelete(`/customers/loyalty-cards/${customerId}/`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  const addPoints = async (customerId, points, moneySpend = 0, transactionId = null, description = '') => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const response = await apiPost('/customers/loyalty-card-update/', {
        card_id: parseInt(customerId),
        card_number: customer.loyaltyCardNumber || customer.card_number,
        action_type: 'add',
        quantity: parseFloat(points),
        money_spend: parseFloat(moneySpend || 0)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list to get updated customer data
      await fetchCustomers();
      
      // Return the customer (the list will be refreshed and component will re-render)
      return customer;
    } catch (error) {
      console.error('Error adding points:', error);
      throw error;
    }
  };

  const redeemPoints = async (customerId, points, description = '') => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      if ((customer.points || 0) < points) {
        throw new Error('Insufficient points');
      }
      
      const response = await apiPost('/customers/loyalty-card-update/', {
        card_id: parseInt(customerId),
        card_number: customer.loyaltyCardNumber || customer.card_number,
        action_type: 'redeem',
        quantity: parseFloat(points),
        money_spend: 0
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list to get updated customer data
      await fetchCustomers();
      
      // Return the customer (the list will be refreshed and component will re-render)
      return customer;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  };

  const addTransaction = async (customerId, transactionData) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const amount = parseFloat(transactionData.amount || 0);
      const newTotalSpent = (customer.totalSpent || 0) + amount;
      // Award points based on purchase (e.g., 1 point per 100 spent)
      const pointsEarned = Math.floor(amount / 100);
      const newPoints = (customer.points || 0) + pointsEarned;
      
      // Update customer's total spent and points via API
      const response = await apiPatch(`/customers/loyalty-cards/${customerId}/`, {
        amount_spend: newTotalSpent,
        points: newPoints
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list
      await fetchCustomers();
      
      // Return updated customer
      const updatedCustomer = await response.json().catch(() => null);
      return updatedCustomer ? transformCustomerFromBackend(updatedCustomer) : { 
        ...customer, 
        totalSpent: newTotalSpent, 
        points: newPoints 
      };
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const generateLoyaltyCardNumber = () => {
    // Generate a 10-digit loyalty card number
    return 'LC' + Date.now().toString().slice(-8);
  };

  return (
    <CustomersContext.Provider
      value={{
        customers,
        loading,
        error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPoints,
        redeemPoints,
        addTransaction,
        generateLoyaltyCardNumber,
        fetchCustomers
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
};

