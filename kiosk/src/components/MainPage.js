import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { images } from '../constant/images';

const MainPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather] = useState({
    temperature: 21,
    condition: 'Cloudy'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();

        // Map default images to categories
        const categoriesWithImages = data.map(category => {
          let image;
          let path;
          switch(category.name.toLowerCase()) {
            case 'burgers':
              image = images.burger;
              path = '/burgers';
              break;
            case 'drinks':
              image = images.drinkks;
              path = '/drinks';
              break;
            case 'sides':
              image = images.sides;
              path = '/sides';
              break;
            case 'breakfast':
              image = images.breakfast;
              path = '/breakfast';
              break;
            default:
              image = category.image_url || images.default;
              path = `/category/${category.id}`;
          }

          return {
            ...category,
            image,
            path
          };
        });
        
        setCategories(categoriesWithImages);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8"
      >
        <div className="flex justify-center items-center space-x-12">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-lg font-medium text-gray-600">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="w-px h-16 bg-gray-200"></div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {weather.temperature}°C
            </div>
            <div className="text-lg font-medium text-gray-600">
              {weather.condition}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-yellow-600 mb-8 text-center"
      >
        Welcome to KIOSK
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="relative group"
          >
            <Link
              to={category.path}
              key={category.id}
              className="relative group overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {category.label || category.name}
                    </h2>
                    <p className="text-white/90">
                      {category.description || `Explore our ${category.name} selection`}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MainPage;