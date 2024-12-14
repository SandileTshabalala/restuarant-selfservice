import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultCategories, isDefaultCategory } from '../../config/categories';

const emojiCategories = {
  mainDishes: {
    title: 'Main Dishes',
    emojis: ['🍔', '🌭', '🍕', '🥪', '🌮', '🌯', '🥙', '🥘', '🍜', '🍲', 
             '🥩', '🍗', '🍖', '🥓', '🧆', '🥗', '🥫', '🍱', '🍛', '🍝']
  },
  sidesAndSnacks: {
    title: 'Sides & Snacks',
    emojis: ['🍟', '🥨', '🥯', '🥖', '🥐', '🥟', '🥠', '🍤', '🫔', '🥞']
  },
  breakfast: {
    title: 'Breakfast',
    emojis: ['🍳', '🥚', '🥞', '🧇', '🥐', '🥖', '🥯', '🥓', '🥪']
  },
  desserts: {
    title: 'Desserts',
    emojis: ['🍦', '🍧', '🍨', '🍩', '🧁', '🍪', '🎂', '🍰', '🥧', 
             '🍫', '🍬', '🍭', '🍮', '🍯', '🍡']
  },
  drinks: {
    title: 'Drinks',
    emojis: ['🥤', '🧃', '🧋', '☕', '🫖', '🍵', '🥛', '🧉', '🍶', 
             '🍺', '🍷', '🥂', '🍸', '🍹', '🧊']
  },
  fruitsAndHealthy: {
    title: 'Fruits & Healthy',
    emojis: ['🍎', '🍇', '🍌', '🥝', '🥑', '🥗', '🥥', '🍓']
  },
  special: {
    title: 'Special',
    emojis: ['🆕', '⭐', '🏆', '💫', '🌟']
  }
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    icon: '📋',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Filter out default categories and only keep custom ones
      const customCategories = data.filter(cat => !isDefaultCategory(cat.name));
      setCategories(customCategories);
      
      // Check for missing default categories and add them silently
      const existingCategories = new Set(data.map(cat => cat.name.toLowerCase()));
      const missingDefaultCategories = defaultCategories.filter(
        cat => !existingCategories.has(cat.name.toLowerCase())
      );

      // Add missing default categories without updating the UI
      if (missingDefaultCategories.length > 0) {
        for (const category of missingDefaultCategories) {
          try {
            await fetch('http://localhost:5000/api/admin/categories', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(category),
            });
          } catch (err) {
            console.error(`Error adding default category ${category.name}:`, err);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if the category name conflicts with default categories
    if (isDefaultCategory(formData.name)) {
      setError('Cannot create a category with a default category name');
      return;
    }

    try {
      const url = editingCategory
        ? `http://localhost:5000/api/admin/categories/${editingCategory.id}`
        : 'http://localhost:5000/api/admin/categories';
      
      // Ensure the category has a path
      const categoryData = {
        ...formData,
        path: formData.path || `/${formData.name.toLowerCase().replace(/\s+/g, '-')}`,
      };

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', image_url: '', icon: '📋' });
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      icon: '📋',
    });
    setEditingCategory(null);
    setShowEmojiPicker(false);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      icon: category.icon || '📋',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Categories Management</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Category
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-full">
          <h3 className="text-xl font-bold mb-4">Custom Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No custom categories yet. Add your first one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={category.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 p-2 flex space-x-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-all transform hover:scale-105 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all transform hover:scale-105 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{category.icon || '📋'}</span>
                      <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
                    </div>
                    {category.description && (
                      <p className="text-gray-600 mt-2 line-clamp-2">{category.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 border rounded"
                    >
                      {formData.icon}
                    </button>
                    <span className="text-sm text-gray-500">Click to choose an icon</span>
                  </div>
                  {showEmojiPicker && (
                    <div className="mt-2 p-4 border rounded bg-white shadow-lg max-h-64 overflow-y-auto">
                      <div className="space-y-4">
                        {Object.entries(emojiCategories).map(([key, category]) => (
                          <div key={key}>
                            <h4 className="text-sm font-semibold text-gray-600 mb-2">{category.title}</h4>
                            <div className="grid grid-cols-8 gap-1">
                              {category.emojis.map((emoji, index) => (
                                <button
                                  key={`${key}-${emoji}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, icon: emoji });
                                    setShowEmojiPicker(false);
                                  }}
                                  className="p-2 hover:bg-blue-50 rounded text-xl transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categories;
