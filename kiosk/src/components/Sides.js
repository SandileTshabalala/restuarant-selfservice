import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Sides = () => {
  const dispatch = useDispatch();
  const [sides, setSides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState({});
  const [selectedExtras, setSelectedExtras] = useState({});
  
  useEffect(() => {
    fetchSides();
  }, []);
 
  const fetchSides = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu-items');
      if (!response.ok) throw new Error('Failed to fetch sides');
      const data = await response.json();
      const sideItems = data.filter(item => item.category.toLowerCase() === 'sides');
      setSides(sideItems);
      const initialExtras = {};
      sideItems.forEach(side => {
        initialExtras[side.id] = [];
      });
      setSelectedExtras(initialExtras);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultOption = (item) => {
    if (item.piece_options && item.piece_options.length > 0) {
      const defaultOption = item.piece_options.find(opt => opt.is_default) || item.piece_options[0];
      return defaultOption.id.toString();
    }
    return item.sizes[0]?.name || 'Regular';
  };

  const handleExtraToggle = (sideId, extra) => {
    setSelectedExtras(prev => {
      const currentExtras = prev[sideId] || [];
      const extraIndex = currentExtras.findIndex(e => e.id === extra.id);
      
      if (extraIndex === -1) {
        return {
          ...prev,
          [sideId]: [...currentExtras, extra]
        };
      } else {
        return {
          ...prev,
          [sideId]: currentExtras.filter(e => e.id !== extra.id)
        };
      }
    });
  };

  const handleSelectAllExtras = (sideId, extras) => {
    setSelectedExtras(prev => ({
      ...prev,
      [sideId]: [...extras]
    }));
  };

  const calculateTotalPrice = (side, selectedValue) => {
    let basePrice;
    if (side.piece_options?.length > 0) {
      const optionDetails = side.piece_options.find(opt => opt.id.toString() === selectedValue);
      basePrice = optionDetails ? parseFloat(optionDetails.price) : parseFloat(side.price);
    } else {
      const selectedSizeObj = side.sizes.find(s => s.name === selectedValue) || side.sizes[0];
      basePrice = selectedSizeObj ? parseFloat(selectedSizeObj.price) : parseFloat(side.price);
    }

    const extrasTotal = (selectedExtras[side.id] || []).reduce((sum, extra) => 
      sum + parseFloat(extra.price), 0
    );

    return basePrice + extrasTotal;
  };

  const handleAddToCart = (side) => {
    const selectedValue = selectedOption[side.id] || getDefaultOption(side);
    let optionDetails;
    let sizeText;
    let basePrice = side.price;
    let totalPrice;

    if (side.piece_options && side.piece_options.length > 0) {
      optionDetails = side.piece_options.find(opt => opt.id.toString() === selectedValue);
      basePrice = parseFloat(side.price);
      totalPrice = parseFloat(optionDetails.price);
      sizeText = `${optionDetails.quantity} pieces`;
    } else {
      const selectedSizeObj = side.sizes.find(s => s.name === selectedValue) || side.sizes[0];
      basePrice = parseFloat(side.price);
      totalPrice = parseFloat(selectedSizeObj.price);
      sizeText = `${selectedSizeObj.name} (+R${(totalPrice - basePrice).toFixed(2)})`;
    }

    const cartItem = {
      ...side,
      selectedOption: side.piece_options?.length > 0 ? selectedValue : null,
      selectedExtras: selectedExtras[side.id] || [],
      selectedSize: side.piece_options?.length > 0 ? null : {
        name: selectedValue,
        price: totalPrice - basePrice
      },
      price: basePrice,
      totalPrice: totalPrice + (selectedExtras[side.id] || []).reduce((sum, extra) => 
        sum + parseFloat(extra.price), 0
      ),
      sizeText: sizeText,
      itemTotal: totalPrice + (selectedExtras[side.id] || []).reduce((sum, extra) => 
        sum + parseFloat(extra.price), 0
      )
    };

    dispatch(addToCart(cartItem));
    setSelectedOption({ ...selectedOption, [side.id]: getDefaultOption(side) });
    setSelectedExtras(prev => ({ ...prev, [side.id]: [] }));
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
          {sides.map((side) => (
            <motion.div
              key={side.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-48">
                <img 
                  src={side.image_url} 
                  alt={side.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Side+Image';
                  }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  {side.piece_options?.length > 0 ? (
                    `From R${Math.min(...side.piece_options.map(opt => opt.price)).toFixed(2)}`
                  ) : (
                    `From R${parseFloat(side.sizes[0]?.price || side.price).toFixed(2)}`
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{side.name}</h3>
                <p className="text-gray-600 mb-4">{side.description}</p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {side.piece_options?.length > 0 ? 'Pieces:' : 'Size:'}
                  </label>
                  <select
                    value={selectedOption[side.id] || getDefaultOption(side)}
                    onChange={(e) => setSelectedOption({
                      ...selectedOption,
                      [side.id]: e.target.value
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                    {side.piece_options?.length > 0 ? (
                      side.piece_options.map(option => (
                        <option key={option.id} value={option.id.toString()}>
                          {option.quantity} pieces (R{parseFloat(option.price).toFixed(2)})
                        </option>
                      ))
                    ) : (
                      side.sizes.map(size => (
                        <option key={size.name} value={size.name}>
                          {size.name} (R{parseFloat(size.price).toFixed(2)})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {side.extras && side.extras.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Extras:</label>
                      <button
                        onClick={() => handleSelectAllExtras(side.id, side.extras)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {side.extras.map(extra => (
                        <label key={extra.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(selectedExtras[side.id] || []).some(e => e.id === extra.id)}
                            onChange={() => handleExtraToggle(side.id, extra)}
                            className="rounded text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-sm text-gray-700">
                            {extra.name} (+R{parseFloat(extra.price).toFixed(2)})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="text-lg font-bold mb-2">
                    Total: R{calculateTotalPrice(
                      side,
                      selectedOption[side.id] || getDefaultOption(side)
                    ).toFixed(2)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddToCart(side)}
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

export default Sides;
