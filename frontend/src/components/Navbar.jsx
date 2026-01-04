import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, List, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const Navbar = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-blue-600 text-white p-3 md:p-4 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <ShoppingCart className="flex-shrink-0" size={24} />
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">Point of Sale</h1>
            <p className="text-xs md:text-sm text-blue-100 hidden sm:block">Smart Retail Store</p>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6 w-full md:w-auto">
          <nav className="flex items-center gap-2 md:gap-4">
            <Link
              to="/"
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition font-semibold text-sm md:text-base ${
                currentPath === '/' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              POS
            </Link>
            <Link
              to="/orders"
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                currentPath === '/orders' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              <List size={16} />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            <Link
              to="/invoices"
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                currentPath === '/invoices' || currentPath?.startsWith('/invoice/') || currentPath === '/create-invoice' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Invoices</span>
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:gap-4 md:border-l md:border-blue-400 md:pl-6">
            <div className="text-right hidden sm:block">
              <div className="text-xs md:text-sm text-blue-100">
                {user?.role || 'User'}: {user?.name || user?.username || 'Admin'}
              </div>
              <div className="text-xs text-blue-200 hidden md:block">
                {user?.business_name || new Date().toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-lg hover:bg-blue-700 transition flex-shrink-0"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

