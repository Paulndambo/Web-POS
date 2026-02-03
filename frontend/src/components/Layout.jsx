import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { Menu } from 'lucide-react';

const Layout = ({ children, hideSidebar = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      {!hideSidebar && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}

      {/* Main content */}
      <div className={`transition-all duration-300 ${hideSidebar ? 'ml-0' : sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top bar with toggle button */}
        {!hideSidebar && (
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={hideSidebar ? '' : 'p-4 sm:p-6 lg:p-8'}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

