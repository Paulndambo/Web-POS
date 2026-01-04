import React, { createContext, useState, useContext, useEffect } from 'react';

const InvoicesContext = createContext(null);

export const useInvoices = () => {
  const context = useContext(InvoicesContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
};

export const InvoicesProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    // Load invoices from localStorage
    const storedInvoices = localStorage.getItem('pos_invoices');
    if (storedInvoices) {
      try {
        const parsedInvoices = JSON.parse(storedInvoices);
        setInvoices(parsedInvoices);
      } catch (error) {
        console.error('Error loading invoices:', error);
      }
    }
  }, []);

  const addInvoice = (invoiceData) => {
    const newInvoice = {
      ...invoiceData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: invoiceData.status || 'pending', // pending, partial, paid
      amountPaid: invoiceData.amountPaid || 0,
      payments: invoiceData.payments || []
    };
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem('pos_invoices', JSON.stringify(updatedInvoices));
    return newInvoice;
  };

  const updateInvoice = (invoiceId, updates) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        const updated = { ...invoice, ...updates };
        // Recalculate status based on amount paid
        if (updated.amountPaid !== undefined) {
          if (updated.amountPaid >= updated.total) {
            updated.status = 'paid';
          } else if (updated.amountPaid > 0) {
            updated.status = 'partial';
          } else {
            updated.status = 'pending';
          }
        }
        return updated;
      }
      return invoice;
    });
    setInvoices(updatedInvoices);
    localStorage.setItem('pos_invoices', JSON.stringify(updatedInvoices));
    return updatedInvoices.find(invoice => invoice.id === invoiceId);
  };

  const addPaymentToInvoice = (invoiceId, paymentData) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    const newPayment = {
      id: Date.now().toString(),
      ...paymentData,
      timestamp: new Date().toISOString()
    };

    const updatedPayments = [...(invoice.payments || []), newPayment];
    const newAmountPaid = invoice.amountPaid + paymentData.amount;

    return updateInvoice(invoiceId, {
      payments: updatedPayments,
      amountPaid: newAmountPaid
    });
  };

  const addItemToInvoice = (invoiceId, item) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    const existingItem = invoice.items.find(i => i.id === item.id);
    let updatedItems;
    
    if (existingItem) {
      updatedItems = invoice.items.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      updatedItems = [...invoice.items, item];
    }

    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return updateInvoice(invoiceId, {
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  const removeItemFromInvoice = (invoiceId, itemId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    const updatedItems = invoice.items.filter(i => i.id !== itemId);
    
    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return updateInvoice(invoiceId, {
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  const updateItemQuantity = (invoiceId, itemId, quantity) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    if (quantity <= 0) {
      return removeItemFromInvoice(invoiceId, itemId);
    }

    const updatedItems = invoice.items.map(i =>
      i.id === itemId ? { ...i, quantity } : i
    );

    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return updateInvoice(invoiceId, {
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  const value = {
    invoices,
    addInvoice,
    updateInvoice,
    addPaymentToInvoice,
    addItemToInvoice,
    removeItemFromInvoice,
    updateItemQuantity,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(invoice => invoice.status === 'paid').length,
    pendingInvoices: invoices.filter(invoice => invoice.status === 'pending').length,
    partialInvoices: invoices.filter(invoice => invoice.status === 'partial').length,
    totalInvoiceAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    totalPaidAmount: invoices.reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0),
    totalPendingAmount: invoices.reduce((sum, invoice) => {
      const pending = invoice.total - (invoice.amountPaid || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0)
  };

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
};

