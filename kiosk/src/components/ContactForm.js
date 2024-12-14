import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { completeOrder } from '../services/api';
import { clearCart } from '../redux/cartSlice';

const ContactForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const totalAmount = useSelector((state) => state.cart.total);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Get payment intent from location state
  const paymentIntent = location.state?.paymentIntent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    console.log('Cart Items before submission:', cartItems);
    console.log('Cart Items in ContactForm:', cartItems);

    try {
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('Cart is empty. Please add items before completing order.');
      }
      if (!totalAmount) {
        throw new Error('Total amount is missing. Please try again.');
      }
      if (!paymentIntent) {
        throw new Error('Payment information is missing. Please complete payment first.');
      }

      console.log('Submitting order with:', {
        email,
        phone,
        items: cartItems,
        amount: totalAmount,
        paymentIntent
      });

      const orderData = {
        email: email || '',
        phone: phone || '',
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedExtras: item.selectedExtras || [],
          selectedSize: item.selectedSize || {},
          selectedOption: item.selectedOption || null
        })),
        amount: totalAmount,
        paymentIntent: paymentIntent
      };

      const result = await completeOrder(orderData);
      
      if (!result.success) {
        console.error('Order completion failed:', result);
        throw new Error(result.error || 'Failed to process order');
      }

      console.log('Order completed successfully:', result);
      
      // Clear the cart after successful order
      dispatch(clearCart());
      
      // Navigate to success page with order number
      navigate('/order-success', { 
        state: { 
          orderNumber: result.order_number,
          totalAmount,
          email,
          phone
        }
      });
    } catch (err) {
      console.error('Order completion error:', err);
      setError(err.message || 'Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Complete Your Order
      </h2>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email (Optional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label 
            htmlFor="phone" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="+27 XX XXX XXXX"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-600'}
            transition-colors duration-200`}
        >
          {isSubmitting ? 'Processing...' : 'Complete Order'}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ContactForm;
