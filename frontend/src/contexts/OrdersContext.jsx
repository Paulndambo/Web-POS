import React, { createContext, useState, useContext, useEffect } from 'react';

const OrdersContext = createContext(null);

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Load orders from localStorage
    const storedOrders = localStorage.getItem('pos_orders');
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders);
        // Ensure all orders have a status field (backward compatibility)
        const ordersWithStatus = parsedOrders.map(order => ({
          ...order,
          status: order.status || 'paid' // Default old orders to 'paid'
        }));
        setOrders(ordersWithStatus);
        // Update localStorage with status fields
        if (ordersWithStatus.some(order => !parsedOrders.find(o => o.id === order.id && o.status))) {
          localStorage.setItem('pos_orders', JSON.stringify(ordersWithStatus));
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    }
  }, []);

  const addOrder = (orderData) => {
    const newOrder = {
      ...orderData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: orderData.status || 'paid' // Default to 'paid' for POS orders, 'pending' for created orders
    };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('pos_orders', JSON.stringify(updatedOrders));
    return newOrder;
  };

  const updateOrder = (orderId, updates) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updated = { ...order, ...updates };
        // Recalculate totals if items changed
        if (updated.items) {
          const roundMoney = (value) => Math.round(value * 100) / 100;
          const roundMoneyUpToWhole = (value) => Math.ceil(value); // Round total upwards to whole number (no cents)
          updated.subtotal = roundMoney(updated.items.reduce((sum, item) => sum + (item.price * item.quantity), 0));
          updated.tax = roundMoney(updated.subtotal * 0.08);
          updated.total = roundMoneyUpToWhole(updated.subtotal + updated.tax);
        }
        return updated;
      }
      return order;
    });
    setOrders(updatedOrders);
    localStorage.setItem('pos_orders', JSON.stringify(updatedOrders));
    return updatedOrders.find(order => order.id === orderId);
  };

  const addItemToOrder = (orderId, item) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const existingItem = order.items.find(i => i.id === item.id);
    let updatedItems;
    
    if (existingItem) {
      updatedItems = order.items.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      updatedItems = [...order.items, item];
    }

    return updateOrder(orderId, { items: updatedItems });
  };

  const removeItemFromOrder = (orderId, itemId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const updatedItems = order.items.filter(i => i.id !== itemId);
    return updateOrder(orderId, { items: updatedItems });
  };

  const updateItemQuantity = (orderId, itemId, quantity) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    if (quantity <= 0) {
      return removeItemFromOrder(orderId, itemId);
    }

    const updatedItems = order.items.map(i =>
      i.id === itemId ? { ...i, quantity } : i
    );

    return updateOrder(orderId, { items: updatedItems });
  };

  const value = {
    orders,
    addOrder,
    updateOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    totalOrders: orders.length,
    paidOrders: orders.filter(order => (order.status || 'paid') === 'paid').length,
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    totalRevenue: orders.filter(order => (order.status || 'paid') === 'paid').reduce((sum, order) => sum + order.total, 0),
    pendingRevenue: orders.filter(order => order.status === 'pending').reduce((sum, order) => sum + order.total, 0)
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

