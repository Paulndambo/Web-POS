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
  X,
  LogOut,
  UserCheck,
  Tag,
  UserMinus,
  Receipt,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Settings,
  CreditCard,
  Star,
  Gift,
  UtensilsCrossed,
  Store,
  Truck,
  ClipboardList,
  ShoppingBag,
  Link2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const MENU_STRUCTURE = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    type: 'single'
  },
  {
    key: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    type: 'group',
    children: [
      { path: '/pos', label: 'POS', icon: ShoppingCart },
      { path: '/orders', label: 'Orders', icon: List },
    ]
  },
  {
    key: 'invoices',
    label: 'Invoices',
    icon: FileText,
    type: 'group',
    children: [
      { path: '/invoices', label: 'Customer invoices', icon: FileText },
      { path: '/supplier-invoices', label: 'Supplier invoices', icon: FileText },
    ]
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: Package,
    type: 'group',
    children: [
      { path: '/inventory', label: 'Products', icon: Package },
      { path: '/categories', label: 'Categories', icon: Tag },
      { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
    ]
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: DollarSign,
    type: 'group',
    children: [
      { path: '/creditors', label: 'Creditors', icon: UserCheck },
      { path: '/debtors', label: 'Debtors', icon: UserMinus },
      { path: '/expenses', label: 'Expenses', icon: Receipt },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/business-ledger', label: 'Business ledger', icon: BookOpen },
    ]
  },
  {
    key: 'loyalty',
    label: 'Customers',
    icon: Star,
    type: 'group',
    children: [
      { path: '/customers', label: 'Customers', icon: Users },
      { path: '/gift-cards', label: 'Gift Cards', icon: Gift },
    ]
  },
  {
    key: 'supply-chain',
    label: 'Supply Chain',
    icon: Truck,
    type: 'group',
    children: [
      { path: '/suppliers', label: 'Suppliers', icon: Building2 },
      { path: '/product-suppliers', label: 'Product Suppliers', icon: Link2 },
      { path: '/supply-requests', label: 'Supply Requests', icon: ClipboardList },
      { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag },
      { path: '/goods-receipt', label: 'Goods Receipt', icon: Package },
    ]
  },
  {
    key: 'management',
    label: 'Management',
    icon: Settings,
    type: 'group',
    children: [
      { path: '/businesses', label: 'Businesses', icon: Building2 },
      { path: '/branches', label: 'Branches', icon: Store },
      { path: '/users', label: 'Users', icon: Users },
    ]
  }
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState({
    sales: true,
    invoices: false,
    inventory: false,
    finance: false,
    loyalty: false,
    'supply-chain': false,
    management: false
  });

  // Auto-expand menu based on current path
  useEffect(() => {
    const path = location.pathname;
    const menuMapping = {
      sales: ['/pos', '/order'],
      invoices: ['/invoice', '/supplier-invoice'],
      inventory: ['/inventory', '/categories', '/menu'],
      finance: ['/creditor', '/debtor', '/expense', '/payment'],
      loyalty: ['/customer', '/gift-card'],
      'supply-chain': ['/supplier', '/product-supplier', '/supply-request', '/purchase-order', '/goods-receipt'],
      management: ['/business', '/branch', '/user']
    };

    Object.entries(menuMapping).forEach(([key, paths]) => {
      if (paths.some(p => path.includes(p))) {
        setOpenMenus(prev => ({ ...prev, [key]: true }));
      }
    });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isGroupActive = (children) => {
    return children.some(child => isActive(child.path));
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-blue-600 text-white z-50 w-64 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {MENU_STRUCTURE.map((item) => {
                if (item.type === 'single') {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={closeSidebarOnMobile}
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
                }

                // Group menu item
                const Icon = item.icon;
                const isOpen = openMenus[item.key];
                const hasActiveChild = isGroupActive(item.children);
                
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                        hasActiveChild
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    
                    {/* Submenu */}
                    {isOpen && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.path);
                          return (
                            <li key={child.path}>
                              <Link
                                to={child.path}
                                onClick={closeSidebarOnMobile}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                  childActive
                                    ? 'bg-blue-800 text-white shadow-sm'
                                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                                }`}
                              >
                                <ChildIcon size={18} />
                                <span className="font-medium">{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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