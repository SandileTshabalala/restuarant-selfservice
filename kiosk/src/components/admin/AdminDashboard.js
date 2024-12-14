import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MenuItems from './MenuItems';
import Categories from './Categories';
import Orders from './Orders';
import Settings from './settings';
import BusinessIntelligence from './Dashboard/BusinessIntelligence';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login'; // Redirect to login page
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'menu', label: 'Menu Items', icon: '🍽️' },
    { id: 'categories', label: 'Categories', icon: '📑' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'logout', label: 'Logout', icon: '🚪', action: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
      >
        {isSidebarOpen ? '◀️' : '▶️'}
      </button>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="fixed left-0 top-0 h-screen bg-white shadow-lg z-40"
            >
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.action || (() => setActiveTab(item.id))}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          className="flex-1"
          animate={{
            marginLeft: isSidebarOpen ? "256px" : "0px"
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && <BusinessIntelligence key="dashboard" />}
                  {activeTab === 'menu' && <MenuItems key="menu" />}
                  {activeTab === 'categories' && <Categories key="categories" />}
                  {activeTab === 'orders' && <Orders key="orders" />}
                  {activeTab === 'settings' && <Settings key="settings" />}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
