import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage';

const getDefaultOption = (item) => {
  if (item.piece_options && item.piece_options.length > 0) {
    const defaultOption = item.piece_options.find(opt => opt.is_default) || item.piece_options[0];
    return defaultOption.id.toString();
  }
  if (item.sizes && item.sizes.length > 0) {
    return item.sizes[0].name;
  }
  return null;
};
 
const MenuItemCard = ({ item, onAddToCart }) => {
  const [selectedOption, setSelectedOption] = useState(getDefaultOption(item));
  const [selectedExtras, setSelectedExtras] = useState([]);

  const handleExtraToggle = (extra) => {
    setSelectedExtras(prev => {
      const extraIndex = prev.findIndex(e => e.id === extra.id);
      if (extraIndex === -1) {
        return [...prev, extra];
      } else {
        return prev.filter(e => e.id !== extra.id);
      }
    });
  };

  const calculateTotalPrice = () => {
    let totalPrice = parseFloat(item.price || 0);

    if (item.piece_options?.length > 0 && selectedOption) {
      const selectedPieceOption = item.piece_options.find(opt => opt.id.toString() === selectedOption);
      totalPrice = parseFloat(selectedPieceOption?.price || item.price);
    } else if (item.sizes?.length > 0 && selectedOption) {
      const selectedSize = item.sizes.find(s => s.name === selectedOption);
      totalPrice = parseFloat(selectedSize?.price || item.price);
    }

    const extrasTotal = selectedExtras.reduce((sum, extra) => 
      sum + parseFloat(extra.price), 0
    );

    return totalPrice + extrasTotal;
  };

  const handleAddToCart = () => {
    let cartItem = {
      ...item,
      selectedExtras,
      totalPrice: calculateTotalPrice(),
      itemTotal: calculateTotalPrice()
    };

    if (item.piece_options?.length > 0 && selectedOption) {
      const selectedPieceOption = item.piece_options.find(opt => opt.id.toString() === selectedOption);
      cartItem = {
        ...cartItem,
        selectedOption,
        sizeText: `${selectedPieceOption?.quantity} pieces`
      };
    } else if (item.sizes?.length > 0 && selectedOption) {
      const selectedSize = item.sizes.find(s => s.name === selectedOption);
      cartItem = {
        ...cartItem,
        selectedSize: {
          name: selectedOption,
          price: parseFloat(selectedSize?.price || item.price) - parseFloat(item.price)
        },
        sizeText: selectedSize ? `${selectedSize.name} (+R${(parseFloat(selectedSize.price) - parseFloat(item.price)).toFixed(2)})` : ''
      };
    }

    onAddToCart(cartItem);
    setSelectedOption(getDefaultOption(item));
    setSelectedExtras([]);
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-48">
          <LazyImage
            src={item.image_url}
            alt={item.name}
            className="h-48"
            fallbackSrc="https://via.placeholder.com/400x300?text=Loading..."
          />
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full">
            R{calculateTotalPrice().toFixed(2)}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
          <p className="text-gray-600 mb-4">{item.description}</p>
          
          {(item.piece_options?.length > 0 || item.sizes?.length > 0) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {item.piece_options?.length > 0 ? 'Pieces:' : 'Size:'}
              </label>
              <select
                value={selectedOption || ''}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {item.piece_options?.length > 0 ? (
                  item.piece_options.map(option => (
                    <option key={option.id} value={option.id.toString()}>
                      {option.quantity} pieces (R{parseFloat(option.price).toFixed(2)})
                    </option>
                  ))
                ) : (
                  item.sizes?.map(size => (
                    <option key={size.name} value={size.name}>
                      {size.name} (R{parseFloat(size.price).toFixed(2)})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {item.extras && item.extras.length > 0 && (
            <div className="mb-4">
              <div className="space-y-2">
                {item.extras.map(extra => (
                  <label key={extra.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedExtras.some(e => e.id === extra.id)}
                      onChange={() => handleExtraToggle(extra)}
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
              Total: R{calculateTotalPrice().toFixed(2)}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddToCart(item)}
              className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add to Cart
          </motion.button>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
