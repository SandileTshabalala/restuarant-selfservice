import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { removeFromCart, updateQuantity, clearCart } from '../redux/slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  
  const handleQuantityChange = (cartId, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart(cartId));
    } else {
      dispatch(updateQuantity({ cartId, quantity: newQuantity }));
    }
  }; 

  const handleCheckout = () => {
    navigate('/payment-processor');
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Your Cart</h2>
          <p className="text-gray-600 mb-6">Your cart is empty</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Browse Menu
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Your Cart</h2>
        
        <div className="space-y-6">
          <AnimatePresence>
            {cart.items.map((item) => (
              <motion.div
                key={item.cartId || `${item.id}_${Date.now()}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image_url || '/placeholder.png'}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 font-medium">Base Price: R{parseFloat(item.price).toFixed(2)}</p>
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Extras: {item.selectedExtras.map(extra => `${extra.name} (+R${extra.price.toFixed(2)})`).join(', ')}
                      </div>
                    )}
                    {item.selectedSize && (
                      <div className="text-sm text-gray-600">
                        Size: {item.selectedSize.name} (+R{item.selectedSize.price.toFixed(2)})
                      </div>
                    )}
                    {item.piece_options && item.selectedOption && (
                      <p className="text-sm text-gray-500">
                        {item.piece_options?.find(opt => opt.id.toString() === item.selectedOption)?.quantity} pieces
                      </p>
                    )}
                    <p className="text-yellow-600 font-semibold mt-1">
                      Cost: R{(item.itemTotal|| 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(item.cartId, item.quantity - 1)}
                      className="p-2 text-gray-500 rounded-lg hover:text-gray-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </motion.button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(item.cartId, item.quantity + 1)}
                     className="p-2 text-gray-500 rounded-lg hover:text-gray-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </motion.button>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => dispatch(removeFromCart(item.cartId))}
                    className="p-2 text-red-500 rounded-lg hover:text-red-700 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-yellow-600">R{cart.total.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch(clearCart())}
              className="px-6 py-3 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-200 transition-colors"
            >
              Clear Cart
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-xl shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200"
            >
              Checkout
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
