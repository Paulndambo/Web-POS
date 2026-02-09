import React, { useState, useEffect } from 'react';
import { useOrders } from '../contexts/OrdersContext.jsx';
import { useInvoices } from '../contexts/InvoicesContext.jsx';
import { apiGet } from '../utils/api.js';
import { 
  ShoppingCart, 
  Receipt, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../config/currency.js';
import Layout from '../components/Layout.jsx';
import { showError } from '../utils/toast.js';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { orders } = useOrders();
  const { invoices } = useInvoices();

  // Fetch metrics from API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiGet('/core/metrics/');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError(error.message);
        showError(`Failed to load metrics: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Use metrics from API if available, otherwise use defaults
  const stats = metrics ? [
    {
      title: 'Total Revenue',
      value: ((metrics.orders_total_paid ?? 0) + (metrics.invoices_paid_amount ?? 0)).toFixed(2),
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-600'
    },
    {
      title: 'Pending Revenue',
      value: ((metrics.orders_total_pending ?? 0) + (metrics.invoices_pending_amount ?? 0)).toFixed(2),
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-600'
    },
    {
      title: 'Total Orders',
      value: metrics.orders_count ?? 0,
      subtitle: `${metrics.paid_orders ?? 0} paid, ${metrics.pending_orders ?? 0} pending`,
      icon: Receipt,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-600'
    },
    {
      title: 'Today\'s Revenue',
      value: (metrics.revenue_today ?? 0).toFixed(2),
      subtitle: `Combined orders and invoices`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-600'
    },
    {
      title: 'Total Invoices',
      value: metrics.invoices_count ?? 0,
      subtitle: `${metrics.paid_invoices ?? 0} paid, ${metrics.pending_invoices ?? 0} pending`,
      icon: FileText,
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-600'
    },
    {
      title: 'Invoice Amount',
      value: (metrics.invoices_total ?? 0).toFixed(2),
      subtitle: `${CURRENCY_SYMBOL} ${(metrics.invoices_paid_amount ?? 0).toFixed(2)} paid, ${CURRENCY_SYMBOL} ${(metrics.invoices_pending_amount ?? 0).toFixed(2)} pending`,
      icon: DollarSign,
      color: 'teal',
      bgColor: 'bg-teal-100',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-600'
    }
  ] : [];

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet('/core/metrics/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError(error.message);
      showError(`Failed to load metrics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Overview of your POS system</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error loading metrics: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !metrics && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center mb-6">
            <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading metrics...</p>
          </div>
        )}

        {/* Stats Grid */}
        {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${stat.borderColor} hover:shadow-lg transition`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.iconColor}`}>
                      {stat.color === 'green' || stat.color === 'yellow' || stat.color === 'purple' || stat.color === 'teal'
                        ? `${CURRENCY_SYMBOL} ${stat.value}`
                        : stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon size={28} className={stat.iconColor} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
            {orders.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        Receipt #{order.receiptNo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        order.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {CURRENCY_SYMBOL} {(order.total ?? 0).toFixed(2)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        order.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'paid' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={12} />
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No orders yet</p>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Invoices</h2>
              <FileText className="text-indigo-600" size={24} />
            </div>
            {invoices.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        Invoice #{invoice.invoiceNo || invoice.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.customerName || 'Customer'} • {new Date(invoice.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-600">
                        {CURRENCY_SYMBOL} {(invoice.total ?? 0).toFixed(2)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {invoice.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No invoices yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

