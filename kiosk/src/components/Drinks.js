import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Drinks = () => {
  const dispatch = useDispatch();
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState({});

  useEffect(() => {
    fetchDrinks();
  }, []);

  const fetchDrinks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu-items');
      if (!response.ok) throw new Error('Failed to fetch drinks');
      const data = await response.json();
      const drinkItems = data.filter(item => item.category.toLowerCase() === 'drinks');
      // console.log('Filtered drink items:', drinkItems);
      setDrinks(drinkItems);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAddToCart = (drink) => {
    const size = selectedOption[drink.id] || 'Regular';
    const selectedSizeObj = drink.sizes.find(s => s.name === size) || drink.sizes[0];
    const basePrice = parseFloat(drink.price);
    const totalPrice = parseFloat(selectedSizeObj.price);

    const cartItem = {
      ...drink,
      selectedSize: { 
        name: size, 
        price: totalPrice - basePrice // Price difference from base price
      },
      price: basePrice,
      totalPrice: totalPrice,
      sizeText: `${size} (+R${(totalPrice - basePrice).toFixed(2)})`,
      itemTotal: totalPrice
    };

    dispatch(addToCart(cartItem));
    setSelectedOption({ ...selectedOption, [drink.id]: 'Regular' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
          {drinks.map((drink) => (
            <motion.div
              key={drink.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-48">
                <img 
                  src={drink.image_url} 
                  alt={drink.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Drink+Image';
                  }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  R{parseFloat(drink.price).toFixed(2)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{drink.name}</h3>
                <p className="text-gray-600 mb-4">{drink.description}</p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size:
                  </label>
                  <select
                    value={selectedOption[drink.id] || 'Regular'}
                    onChange={(e) => setSelectedOption({
                      ...selectedOption,
                      [drink.id]: e.target.value
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                    {drink.sizes.map(size => (
                      <option key={size.name} value={size.name}>
                        {size.name} (R{parseFloat(size.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <div className="text-lg font-bold mb-2">
                    Total: R{parseFloat(drink.sizes.find(s => 
                      s.name === (selectedOption[drink.id] || 'Regular')
                    )?.price || drink.price).toFixed(2)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(drink)}
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

export default Drinks;
