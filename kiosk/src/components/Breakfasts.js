import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Breakfasts = () => {
  const dispatch = useDispatch();
  const [breakfasts, setBreakfasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [selectedSize, setSelectedSize] = useState({});
 
  useEffect(() => {
    fetchBreakfasts();
  }, []);

  const fetchBreakfasts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu-items');
      if (!response.ok) throw new Error('Failed to fetch breakfasts');
      const data = await response.json();
      // Filter only breakfast category items
      const breakfastItems = data.filter(item => item.category.toLowerCase() === 'breakfast');
      setBreakfasts(breakfastItems);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (breakfast) => {
    const extras = selectedExtras[breakfast.id] || [];
    const size = selectedSize[breakfast.id];
    
    // Calculate total price including extras and size
    const basePrice = parseFloat(breakfast.price);
    const extrasTotal = extras.reduce((sum, extra) => sum + parseFloat(extra.price), 0);
    const sizePrice = size ? parseFloat(size.price) : 0;
    const totalPrice = basePrice + extrasTotal + sizePrice;

    // Create cart item with all selected options
    const cartItem = {
      ...breakfast,
      selectedExtras: extras,
      selectedSize: size,
      price: basePrice,
      totalPrice: totalPrice,
      extrasText: extras.map(extra => `${extra.name} (+R${extra.price.toFixed(2)})`).join(', '),
      sizeText: size ? `${size.name} (+R${size.price.toFixed(2)})` : '',
      itemTotal: totalPrice
    };

    dispatch(addToCart(cartItem));
    
    // Reset selections for this breakfast
    setSelectedExtras({ ...selectedExtras, [breakfast.id]: [] });
    setSelectedSize({ ...selectedSize, [breakfast.id]: null });
  };

  const toggleExtra = (breakfastId, extra) => {
    setSelectedExtras(prev => {
      const current = prev[breakfastId] || [];
      const exists = current.find(e => e.id === extra.id);
      
      if (exists) {
        return {
          ...prev,
          [breakfastId]: current.filter(e => e.id !== extra.id)
        };
      } else {
        return {
          ...prev,
          [breakfastId]: [...current, extra]
        };
      }
    });
  };

  const selectSize = (breakfastId, size) => {
    setSelectedSize(prev => ({
      ...prev,
      [breakfastId]: size
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {breakfasts.map((breakfast) => (
            <motion.div
              key={breakfast.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-48">
                <img 
                  src={breakfast.image_url} 
                  alt={breakfast.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Breakfast+Image';
                  }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  R{parseFloat(breakfast.price).toFixed(2)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{breakfast.name}</h3>
                <p className="text-gray-600 mb-4">{breakfast.description}</p>
                
                {breakfast.extras.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Extras:</h4>
                    <div className="space-y-2">
                      {breakfast.extras.map((extra) => (
                        <label key={extra.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedExtras[breakfast.id]?.some(e => e.id === extra.id) || false}
                            onChange={() => toggleExtra(breakfast.id, extra)}
                            className="form-checkbox text-yellow-500"
                          />
                          <span>{extra.name} (+R{extra.price.toFixed(2)})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {breakfast.sizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Size:</h4>
                    <div className="space-y-2">
                      {breakfast.sizes.map((size) => (
                        <label key={size.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`size-${breakfast.id}`}
                            checked={selectedSize[breakfast.id]?.id === size.id}
                            onChange={() => selectSize(breakfast.id, size)}
                            className="form-radio text-yellow-500"
                          />
                          <span>{size.name} (R{size.price.toFixed(2)})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="text-lg font-bold mb-2">
                    Total: R{(
                      parseFloat(breakfast.price) +
                      (selectedExtras[breakfast.id]?.reduce((sum, extra) => sum + parseFloat(extra.price), 0) || 0) +
                      (selectedSize[breakfast.id]?.price || 0)
                    ).toFixed(2)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(breakfast)}
                    disabled={breakfast.sizes.length > 0 && !selectedSize[breakfast.id]}
                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Breakfasts;
