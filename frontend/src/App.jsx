import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { OrdersProvider } from './contexts/OrdersContext.jsx';
import { InvoicesProvider } from './contexts/InvoicesContext.jsx';
import { UsersProvider } from './contexts/UsersContext.jsx';
import { CustomersProvider } from './contexts/CustomersContext.jsx';
import { GiftCardsProvider } from './contexts/GiftCardsContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './components/Login.jsx';
import POS from './POS.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import CreateOrder from './pages/CreateOrder.jsx';
import ViewOrder from './pages/ViewOrder.jsx';
import Invoices from './pages/Invoices.jsx';
import CreateInvoice from './pages/CreateInvoice.jsx';
import ViewInvoice from './pages/ViewInvoice.jsx';
import Businesses from './pages/Businesses.jsx';
import Branches from './pages/Branches.jsx';
import Users from './pages/Users.jsx';
import Inventory from './pages/Inventory.jsx';
import Creditors from './pages/Creditors.jsx';
import ViewCreditor from './pages/ViewCreditor.jsx';
import Debtors from './pages/Debtors.jsx';
import ViewDebtor from './pages/ViewDebtor.jsx';
import Expenses from './pages/Expenses.jsx';
import Payments from './pages/Payments.jsx';
import Categories from './pages/Categories.jsx';
import Menu from './pages/Menu.jsx';
import Customers from './pages/Customers.jsx';
import ViewCustomer from './pages/ViewCustomer.jsx';
import GiftCards from './pages/GiftCards.jsx';
import ViewGiftCard from './pages/ViewGiftCard.jsx';
import Suppliers from './pages/Suppliers.jsx';
import ProductSuppliers from './pages/ProductSuppliers.jsx';
import SupplyRequests from './pages/SupplyRequests.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import ViewPurchaseOrder from './pages/ViewPurchaseOrder.jsx';

function App() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <InvoicesProvider>
          <UsersProvider>
            <CustomersProvider>
              <GiftCardsProvider>
                <Router>
                  <Toaster />
                  <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-order"
                  element={
                    <ProtectedRoute>
                      <CreateOrder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order/:id"
                  element={
                    <ProtectedRoute>
                      <ViewOrder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-invoice"
                  element={
                    <ProtectedRoute>
                      <CreateInvoice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoice/:id"
                  element={
                    <ProtectedRoute>
                      <ViewInvoice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/businesses"
                  element={
                    <ProtectedRoute>
                      <Businesses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/branches"
                  element={
                    <ProtectedRoute>
                      <Branches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/creditors"
                  element={
                    <ProtectedRoute>
                      <Creditors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/creditor/:id"
                  element={
                    <ProtectedRoute>
                      <ViewCreditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/debtors"
                  element={
                    <ProtectedRoute>
                      <Debtors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/debtor/:id"
                  element={
                    <ProtectedRoute>
                      <ViewDebtor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <ProtectedRoute>
                      <Expenses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute>
                      <Categories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute>
                      <Menu />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/:id"
                  element={
                    <ProtectedRoute>
                      <ViewCustomer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gift-cards"
                  element={
                    <ProtectedRoute>
                      <GiftCards />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gift-card/:id"
                  element={
                    <ProtectedRoute>
                      <ViewGiftCard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute>
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/product-suppliers"
                  element={
                    <ProtectedRoute>
                      <ProductSuppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/supply-requests"
                  element={
                    <ProtectedRoute>
                      <SupplyRequests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchase-orders"
                  element={
                    <ProtectedRoute>
                      <PurchaseOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchase-order/:id"
                  element={
                    <ProtectedRoute>
                      <ViewPurchaseOrder />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
                </Router>
              </GiftCardsProvider>
            </CustomersProvider>
          </UsersProvider>
        </InvoicesProvider>
      </OrdersProvider>
    </AuthProvider>
  );
}

export default App;
