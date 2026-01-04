import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  List, 
  FileText, 
  Users, 
  Package, 
  LayoutDashboard,
  Building2,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(isOpen);

  useEffect(() => {
    setSidebarOpen(isOpen);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'POS', icon: ShoppingCart },
    { path: '/orders', label: 'Orders', icon: List },
    { path: '/invoices', label: 'Invoices', icon: FileText },
    { path: '/businesses', label: 'Businesses', icon: Building2 },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/inventory', label: 'Inventory', icon: Package },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-blue-600 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-500">
            <div className="flex items-center gap-2">
              <ShoppingCart size={24} />
              <div>
                <h1 className="text-lg font-bold">Point of Sale</h1>
                <p className="text-xs text-blue-100">{user?.business_name || 'Smart Retail Store'}</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1 hover:bg-blue-700 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path === '/dashboard' ? '/dashboard' : item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-500">
            <div className="mb-3 px-4">
              <div className="text-sm font-semibold text-blue-100">
                {user?.name || user?.username || 'Admin'}
              </div>
              <div className="text-xs text-blue-200">
                {user?.role || 'User'} • {user?.email || ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

