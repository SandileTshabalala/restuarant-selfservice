import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { addToCart } from '../redux/slices/cartSlice';
import MenuItemCard from './MenuItemCard';

const DynamicCategory = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  
  const category = useSelector(state => 
    state.categories.items.find(cat => cat.id === parseInt(categoryId))
  );

  const { data: items = [], isLoading, error } = useQuery(
    ['menuItems', category?.name],
    async () => {
      if (!category) return [];
      const response = await fetch(`http://localhost:5000/api/menu-items?category=${encodeURIComponent(category.name)}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    }, 
    {
      enabled: !!category,
      staleTime: 300000, // Consider data fresh for 5 minutes
      cacheTime: 3600000, // Keep data in cache for 1 hour
      retry: 2
    }
  );

  const handleAddToCart = (item) => {
    dispatch(addToCart(item));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error: {error.message}
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center p-4">
        Category not found
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DynamicCategory;
