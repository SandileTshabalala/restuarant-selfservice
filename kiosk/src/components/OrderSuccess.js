import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const OrderSuccess = () => {
  const location = useLocation();
  const { orderNumber, email, phone } = location.state || {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
      >
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>

      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Order Successful!
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <p className="text-xl font-semibold text-gray-700 mb-4">
          Your Order Number:
        </p>
        <p className="text-3xl font-bold text-yellow-500 mb-6">
          {orderNumber}
        </p>

        {email && (
          <p className="text-gray-600 mb-2">
            Order confirmation sent to: {email}
          </p>
        )}
        
        {phone && (
          <p className="text-gray-600">
            Order number sent to: {phone}
          </p>
        )}
      </div>

      <p className="text-gray-600 mb-8">
        Thank you for your order! You'll receive your confirmation details shortly.
      </p>

      <Link
        to="/"
        className="inline-block bg-yellow-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-yellow-600 transition-colors duration-200"
      >
        Return to Home
      </Link>
    </motion.div>
  );
};

export default OrderSuccess;
