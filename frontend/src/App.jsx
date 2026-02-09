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
import OnboardingSuccess from './components/OnboardingSuccess.jsx';
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
import SupplierInvoices from './pages/SupplierInvoices.jsx';
import ViewSupplierInvoice from './pages/ViewSupplierInvoice.jsx';
import GoodsReceipt from './pages/GoodsReceipt.jsx';
import BusinessLedger from './pages/BusinessLedger.jsx';
import BNPLProviders from './pages/BNPLProviders.jsx';
import BNPLPurchases from './pages/BNPLPurchases.jsx';
import ViewBNPLPurchase from './pages/ViewBNPLPurchase.jsx';
import ViewBNPLProvider from './pages/ViewBNPLProvider.jsx';
import DataExport from './pages/DataExport.jsx';
import DataImport from './pages/DataImport.jsx';
import SalesReports from './pages/SalesReports.jsx';
import InventoryReports from './pages/InventoryReports.jsx';
import FinancialReports from './pages/FinancialReports.jsx';

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
                <Route path="/onboarding-success" element={<OnboardingSuccess />} />
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
                  path="/business-ledger"
                  element={
                    <ProtectedRoute>
                      <BusinessLedger />
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
                <Route
                  path="/supplier-invoices"
                  element={
                    <ProtectedRoute>
                      <SupplierInvoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/supplier-invoice/:id"
                  element={
                    <ProtectedRoute>
                      <ViewSupplierInvoice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/goods-receipt"
                  element={
                    <ProtectedRoute>
                      <GoodsReceipt />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bnpl-providers"
                  element={
                    <ProtectedRoute>
                      <BNPLProviders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bnpl-provider/:id"
                  element={
                    <ProtectedRoute>
                      <ViewBNPLProvider />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bnpl-loans"
                  element={
                    <ProtectedRoute>
                      <BNPLPurchases />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bnpl-loan/:id"
                  element={
                    <ProtectedRoute>
                      <ViewBNPLPurchase />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/data-export"
                  element={
                    <ProtectedRoute>
                      <DataExport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/data-import"
                  element={
                    <ProtectedRoute>
                      <DataImport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-reports"
                  element={
                    <ProtectedRoute>
                      <SalesReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory-reports"
                  element={
                    <ProtectedRoute>
                      <InventoryReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financial-reports"
                  element={
                    <ProtectedRoute>
                      <FinancialReports />
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
