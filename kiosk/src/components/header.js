import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCategories } from '../redux/slices/categoriesSlice';

// Define default categories with standardized names
const defaultCategories = [
  { name: 'burgers', label: 'Burgers', icon: '🍔', path: '/burgers' },
  { name: 'drinks', label: 'Drinks', icon: '🥤', path: '/drinks' },
  { name: 'sides', label: 'Sides', icon: '🍟', path: '/sides' },
  { name: 'breakfast', label: 'Breakfast', icon: '🍳', path: '/breakfast' }
];

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const categories = useSelector((state) => state.categories);
  const customCategories = categories?.items || [];
  const status = categories?.status || 'idle';

  useEffect(() => {
    // Only fetch if we haven't already loaded or failed
    if (status === 'idle') {
      console.log('Fetching categories...');
      dispatch(fetchCategories()).catch(err => {
        console.error('Error fetching categories:', err);
      });
    }
  }, [status, dispatch]);

  // Combine default and custom categories for navigation
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    ...defaultCategories.map(cat => ({
      path: cat.path,
      label: cat.label,
      icon: cat.icon
    })),
    ...(status === 'succeeded' && customCategories
      ? customCategories
          .filter(cat => {
            const catNameLower = cat.name.toLowerCase().trim();
            return !defaultCategories.some(def => def.name.toLowerCase() === catNameLower);
          })
          .map(cat => ({
            path: `/category/${cat.id}`,
            label: cat.name,
            icon: cat.icon || '🍽️'
          }))
      : [])
  ];

  // Add console logs for debugging
  console.log('Categories Status:', status);
  console.log('Custom Categories:', customCategories);
  console.log('Nav Items:', navItems);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 lg:hidden"
          >
            <div className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <Link to="/" className="text-2xl font-bold text-yellow-500">
                  KIOSK
                </Link>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <nav className="flex-1">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                          isActive(item.path)
                            ? 'bg-yellow-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <Link
                to="/cart"
                onClick={() => setIsSidebarOpen(false)}
                className="mt-auto flex items-center space-x-3 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
              >
                <span className="text-xl">🛒</span>
                <span>Cart</span>
                {cart.items.length > 0 && (
                  <span className="ml-auto bg-white text-yellow-500 px-2 py-1 rounded-full text-sm font-bold">
                    {cart.items.length}
                  </span>
                )}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Link to="/" className="text-2xl font-bold text-yellow-500">
              KIOSK
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-yellow-500'
                      : 'text-gray-600 hover:text-yellow-500'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cart.items.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
