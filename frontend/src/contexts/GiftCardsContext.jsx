import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiPatch } from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';

const GiftCardsContext = createContext(null);

export const useGiftCards = () => {
  const context = useContext(GiftCardsContext);
  if (!context) {
    throw new Error('useGiftCards must be used within a GiftCardsProvider');
  }
  return context;
};

// Transform backend gift card data to frontend format
const transformGiftCardFromBackend = (backendCard) => {
  return {
    id: backendCard.id?.toString() || backendCard.card_number,
    cardNumber: backendCard.card_number,
    recipientName: backendCard.customer_name,
    recipientEmail: backendCard.customer_email,
    recipientPhone: backendCard.phone_number,
    amount: parseFloat(backendCard.amount || 0),
    balance: parseFloat(backendCard.balance || backendCard.amount || 0),
    issuer: backendCard.issuer || 'Store',
    partnerName: backendCard.partner_name || '',
    expiryDate: backendCard.expiry_date || '',
    status: backendCard.status || 'Active',
    issuedAt: backendCard.created_at || backendCard.issued_at || new Date().toISOString(),
    transactions: backendCard.transactions || []
  };
};

// Transform frontend gift card data to backend format
const transformGiftCardToBackend = (frontendCard) => {
  return {
    card_number: frontendCard.cardNumber || frontendCard.card_number,
    customer_name: frontendCard.recipientName || frontendCard.customer_name,
    customer_email: frontendCard.recipientEmail || frontendCard.customer_email,
    phone_number: frontendCard.recipientPhone || frontendCard.phone_number,
    issuer: frontendCard.issuer || 'Store',
    partner_name: frontendCard.partnerName || frontendCard.partner_name || null,
    amount: parseFloat(frontendCard.amount || 0),
    expiry_date: frontendCard.expiryDate || frontendCard.expiry_date || null,
    status: frontendCard.status || 'Active'
  };
};

export const GiftCardsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both paginated and non-paginated responses
      let allCards = [];
      let nextEndpoint = '/customers/gift-cards/';

      while (nextEndpoint) {
        const response = await apiGet(nextEndpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // If the backend returns a plain array, use it directly and stop
        if (Array.isArray(data)) {
          allCards = data;
          break;
        }

        // Otherwise, assume a paginated structure with results + next
        const pageResults = data.results || [];
        allCards = allCards.concat(pageResults);

        // Handle DRF-style absolute or relative URLs in `next`
        if (data.next) {
          try {
            const nextUrl = new URL(data.next);
            nextEndpoint = `${nextUrl.pathname}${nextUrl.search}`;
          } catch {
            // If it's already a relative URL, use it as-is
            nextEndpoint = data.next;
          }
        } else {
          nextEndpoint = null;
        }
      }

      const transformedCards = allCards.map(transformGiftCardFromBackend);
      setGiftCards(transformedCards);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      setError(error.message);
      // Fallback to empty array on error
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for authentication to be ready before fetching
    if (!authLoading && isAuthenticated) {
      fetchGiftCards();
    } else if (!authLoading && !isAuthenticated) {
      // If not authenticated, set loading to false
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const issueGiftCard = async (giftCardData) => {
    try {
      const cardData = {
        ...giftCardData,
        cardNumber: giftCardData.cardNumber || generateGiftCardNumber(),
        amount: parseFloat(giftCardData.amount || giftCardData.balance || 0),
        balance: parseFloat(giftCardData.balance || giftCardData.amount || 0)
      };
      
      const backendData = transformGiftCardToBackend(cardData);
      
      const response = await apiPost('/customers/gift-cards/', backendData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const createdCard = await response.json();
      const transformedCard = transformGiftCardFromBackend(createdCard);
      
      // Refresh the list
      await fetchGiftCards();
      
      return transformedCard;
    } catch (error) {
      console.error('Error issuing gift card:', error);
      throw error;
    }
  };

  const updateGiftCard = async (giftCardId, updates) => {
    try {
      const giftCard = giftCards.find(gc => gc.id === giftCardId);
      if (!giftCard) {
        throw new Error('Gift card not found');
      }
      
      // Only send editable fields: customer_name, phone_number, customer_email, issuer, partner_name, expiry_date
      const editableFields = {
        customer_name: updates.recipientName || updates.customer_name || giftCard.recipientName,
        phone_number: updates.recipientPhone || updates.phone_number || giftCard.recipientPhone,
        customer_email: updates.recipientEmail || updates.customer_email || giftCard.recipientEmail,
        issuer: updates.issuer || giftCard.issuer,
        partner_name: updates.partnerName || updates.partner_name || giftCard.partnerName || null,
        expiry_date: updates.expiryDate || updates.expiry_date || giftCard.expiryDate || null
      };
      
      // Use PATCH on the details endpoint
      const response = await apiPatch(`/customers/gift-cards/${giftCardId}/details/`, editableFields);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const updatedCard = await response.json();
      const transformedCard = transformGiftCardFromBackend(updatedCard);
      
      // Refresh the list
      await fetchGiftCards();
      
      return transformedCard;
    } catch (error) {
      console.error('Error updating gift card:', error);
      throw error;
    }
  };

  const deleteGiftCard = async (giftCardId) => {
    try {
      const response = await apiDelete(`/customers/gift-cards/${giftCardId}/`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list
      await fetchGiftCards();
    } catch (error) {
      console.error('Error deleting gift card:', error);
      throw error;
    }
  };

  const redeemGiftCard = async (cardNumber, amount, transactionId = null, description = '') => {
    try {
      const giftCard = giftCards.find(gc => gc.cardNumber === cardNumber);
      if (!giftCard) {
        throw new Error('Gift card not found');
      }
      if (giftCard.status !== 'Active') {
        throw new Error('Gift card is not active');
      }
      if (giftCard.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const response = await apiPost('/customers/gift-card-update/', {
        card_number: cardNumber,
        action_type: 'redeem',
        amount: parseFloat(amount)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list
      await fetchGiftCards();
      
      // Return updated card (refresh will update the gift card data)
      return giftCard;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      throw error;
    }
  };

  const reloadGiftCard = async (cardNumber, amount, description = '') => {
    try {
      const giftCard = giftCards.find(gc => gc.cardNumber === cardNumber);
      if (!giftCard) {
        throw new Error('Gift card not found');
      }
      if (giftCard.status !== 'Active') {
        throw new Error('Gift card is not active');
      }

      const response = await apiPost('/customers/gift-card-update/', {
        card_number: cardNumber,
        action_type: 'reload',
        amount: parseFloat(amount)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the list
      await fetchGiftCards();
      
      // Return updated card (refresh will update the gift card data)
      return giftCard;
    } catch (error) {
      console.error('Error reloading gift card:', error);
      throw error;
    }
  };

  const generateGiftCardNumber = () => {
    // Generate a 16-digit gift card number
    const randomPart = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    return 'GC' + randomPart;
  };

  return (
    <GiftCardsContext.Provider
      value={{
        giftCards,
        loading,
        error,
        issueGiftCard,
        updateGiftCard,
        deleteGiftCard,
        redeemGiftCard,
        reloadGiftCard,
        generateGiftCardNumber,
        fetchGiftCards
      }}
    >
      {children}
    </GiftCardsContext.Provider>
  );
};

