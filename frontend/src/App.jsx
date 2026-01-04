import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { OrdersProvider } from './contexts/OrdersContext.jsx';
import { InvoicesProvider } from './contexts/InvoicesContext.jsx';
import { UsersProvider } from './contexts/UsersContext.jsx';
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
import Users from './pages/Users.jsx';
import Inventory from './pages/Inventory.jsx';
import Creditors from './pages/Creditors.jsx';
import ViewCreditor from './pages/ViewCreditor.jsx';
import Categories from './pages/Categories.jsx';

function App() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <InvoicesProvider>
          <UsersProvider>
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
                  path="/categories"
                  element={
                    <ProtectedRoute>
                      <Categories />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </UsersProvider>
        </InvoicesProvider>
      </OrdersProvider>
    </AuthProvider>
  );
}

export default App;
