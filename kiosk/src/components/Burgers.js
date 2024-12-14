import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Burgers = () => {
  const dispatch = useDispatch();
  const [burgers, setBurgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [selectedBurger, setSelectedBurger] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  useEffect(() => {
    fetchBurgers();
  }, []);

  const fetchBurgers = async () => {
    try {
      console.log('Fetching burgers...');
      const response = await fetch('http://localhost:5000/api/menu-items');
      if (!response.ok) throw new Error('Failed to fetch burgers');
      const data = await response.json();
      console.log('All menu items:', data);
      // Filter only burger category items
      const burgerItems = data.filter(item => item.category.toLowerCase() === 'burgers');
      console.log('Filtered burger items:', burgerItems);
      setBurgers(burgerItems);
    } catch (error) {
      console.error('Error fetching burgers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (burger) => {
    const extras = selectedExtras[burger.id] || [];
    const size = selectedSize[burger.id];
    
    // Calculate total price including extras and size
    const basePrice = parseFloat(burger.price);
    const extrasTotal = extras.reduce((sum, extra) => sum + parseFloat(extra.price), 0);
    const sizePrice = size ? parseFloat(size.price) : 0;
    const totalPrice = basePrice + extrasTotal + sizePrice;

    // Create cart item with all selected options
    const cartItem = {
      ...burger,
      selectedExtras: extras,
      selectedSize: size,
      price: basePrice,
      totalPrice: totalPrice,
      extrasText: extras.map(extra => `${extra.name} (+R${extra.price.toFixed(2)})`).join(', '),
      sizeText: size ? `${size.name} (+R${size.price.toFixed(2)})` : '',
      itemTotal: totalPrice
    };

    dispatch(addToCart(cartItem));
    
    // Reset selections for this burger
    setSelectedExtras({ ...selectedExtras, [burger.id]: [] });
    setSelectedSize({ ...selectedSize, [burger.id]: null });
  };

  const toggleExtra = (burgerId, extra) => {
    setSelectedExtras(prev => {
      const current = prev[burgerId] || [];
      const exists = current.find(e => e.id === extra.id);
      
      if (exists) {
        return {
          ...prev,
          [burgerId]: current.filter(e => e.id !== extra.id)
        };
      } else {
        return {
          ...prev,
          [burgerId]: [...current, extra]
        };
      }
    });
  };

  const selectSize = (burgerId, size) => {
    setSelectedSize(prev => ({
      ...prev,
      [burgerId]: size
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
          {burgers.map((burger) => (
            <motion.div
              key={burger.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-48">
                <img 
                  src={burger.image_url} 
                  alt={burger.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Burger+Image';
                  }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  R{parseFloat(burger.price).toFixed(2)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{burger.name}</h3>
                <p className="text-gray-600 mb-4">{burger.description}</p>
                
                {burger.extras.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Extras:</h4>
                    <div className="space-y-2">
                      {burger.extras.map((extra) => (
                        <label key={extra.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedExtras[burger.id]?.some(e => e.id === extra.id) || false}
                            onChange={() => toggleExtra(burger.id, extra)}
                            className="form-checkbox text-yellow-500"
                          />
                          <span>{extra.name} (+R{extra.price.toFixed(2)})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {burger.sizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Size:</h4>
                    <div className="space-y-2">
                      {burger.sizes.map((size) => (
                        <label key={size.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`size-${burger.id}`}
                            checked={selectedSize[burger.id]?.id === size.id}
                            onChange={() => selectSize(burger.id, size)}
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
                      burger.price +
                      (selectedExtras[burger.id]?.reduce((sum, extra) => sum + extra.price, 0) || 0) +
                      (selectedSize[burger.id]?.price || 0)
                    ).toFixed(2)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(burger)}
                    disabled={burger.sizes.length > 0 && !selectedSize[burger.id]}
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

export default Burgers;
