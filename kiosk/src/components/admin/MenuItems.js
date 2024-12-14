import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultCategories } from '../../config/categories';

const MenuItems = () => {
  const [items, setItems] = useState([]);  
  const [customCategories, setCustomCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);  
  const [isSaving, setIsSaving] = useState(false);  
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [extras, setExtras] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [pieceOptions, setPieceOptions] = useState([]);
  const [extraInput, setExtraInput] = useState({ name: '', price: '' });
  const [sizeInput, setSizeInput] = useState({ name: '', price: '' });
  const [pieceInput, setPieceInput] = useState({ quantity: '', price: '', is_default: false });
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    is_available: true,
    extras: [],
    sizes: [],
    piece_options: []
  });
  const [editingItem, setEditingItem] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const allCategories = useMemo(() => {
    return ['all', ...defaultCategories.map(cat => cat.name), ...customCategories.map(cat => cat.name)];
  }, [customCategories]);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    setImagePreview(newItem.image_url);
  }, [newItem.image_url]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/menu-items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);  
    } catch (error) {
      setError(error.message);
      setItems([]);  
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      const customCats = data.filter(cat => 
        !defaultCategories.some(defaultCat => 
          defaultCat.name.toLowerCase() === cat.name.toLowerCase()
        )
      );
      setCustomCategories(customCats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCustomCategories([]);  
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newItem.name.trim()) errors.name = 'Name is required';
    if (!newItem.description.trim()) errors.description = 'Description is required';
    if (!newItem.category) errors.category = 'Category is required';
    if (!newItem.image_url.trim()) errors.image_url = 'Image URL is required';
    
    const price = parseFloat(newItem.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a positive number';
    }

    // Validate piece options if present
    if (pieceOptions.length > 0) {
      const hasDefault = pieceOptions.some(opt => opt.is_default);
      if (!hasDefault) {
        errors.pieceOptions = 'One piece option must be set as default';
      }
    }

    try {
      new URL(newItem.image_url);
    } catch {
      errors.image_url = 'Invalid image URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddExtra = () => {
    if (extraInput.name && extraInput.price) {
      const price = parseFloat(extraInput.price);
      if (!isNaN(price) && price > 0) {
        setExtras([...extras, { ...extraInput, price }]);
        setExtraInput({ name: '', price: '' });
      }
    }
  };

  const handleAddSize = () => {
    if (sizeInput.name && sizeInput.price) {
      const price = parseFloat(sizeInput.price);
      if (!isNaN(price) && price > 0) {
        setSizes([...sizes, { name: sizeInput.name, price }]);
        setSizeInput({ name: '', price: '' });
      }
    }
  };

  const handleAddPieceOption = () => {
    if (pieceInput.quantity && pieceInput.price) {
      const quantity = parseInt(pieceInput.quantity);
      const price = parseFloat(pieceInput.price);
      if (!isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 0) {
        // If this is the first option, make it default
        const isDefault = pieceOptions.length === 0 ? true : pieceInput.is_default;
        // If this is being set as default, remove default from others
        const updatedOptions = isDefault ? 
          pieceOptions.map(opt => ({ ...opt, is_default: false })) : 
          [...pieceOptions];
        
        setPieceOptions([
          ...updatedOptions, 
          { 
            quantity, 
            price, 
            is_default: isDefault 
          }
        ]);
        setPieceInput({ quantity: '', price: '', is_default: false });
      }
    }
  };

  const handleRemoveExtra = (index) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const handleRemoveSize = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleRemovePieceOption = (index) => {
    const removedOption = pieceOptions[index];
    const remainingOptions = pieceOptions.filter((_, i) => i !== index);
    
    // If we removed the default option and there are remaining options,
    // make the first remaining option the default
    if (removedOption.is_default && remainingOptions.length > 0) {
      remainingOptions[0].is_default = true;
    }
    
    setPieceOptions(remainingOptions);
  };

  const toggleDefaultPieceOption = (index) => {
    setPieceOptions(pieceOptions.map((option, i) => ({
      ...option,
      is_default: i === index
    })));
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      is_available: true,
      extras: [],
      sizes: [],
      piece_options: []
    });
    setExtras([]);
    setSizes([]);
    setPieceOptions([]);
    setExtraInput({ name: '', price: '' });
    setSizeInput({ name: '', price: '' });
    setPieceInput({ quantity: '', price: '', is_default: false });
    setEditingItem(null);
    setImagePreview(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      const itemData = {
        ...newItem,
        extras,
        sizes,
        piece_options: pieceOptions
      };

      const url = editingItem
        ? `http://localhost:5000/api/admin/menu-items/${editingItem._id}`
        : 'http://localhost:5000/api/admin/menu-items';

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save menu item');
      }

      // Reset form
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        is_available: true,
        extras: [],
        sizes: [],
        piece_options: []
      });
      setExtras([]);
      setSizes([]);
      setPieceOptions([]);
      setImagePreview(null);
      setEditingItem(null);
      setFormErrors({});
      
      // Refresh menu items
      await fetchMenuItems();
    } catch (err) {
      console.error('Error saving menu item:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNewItem({ 
      ...item,
      category: item.category.toLowerCase().trim() 
    });
    setExtras(item.extras || []);
    setSizes(item.sizes || []);
    setPieceOptions(item.piece_options || []);
    setImagePreview(item.image_url);
    setFormErrors({});
  };

  const getCategoryIcon = (categoryName) => {
    if (categoryName === 'all') return '🔍';
    
    const defaultCat = defaultCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (defaultCat) return defaultCat.icon;

    const customCat = customCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return customCat?.icon || '📋'; 
  };

  const getCategoryLabel = (categoryName) => {
    if (categoryName === 'all') return 'All Items';
    
    const defaultCat = defaultCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (defaultCat) return defaultCat.label;

    const customCat = customCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return customCat?.label || categoryName;
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this item? This action cannot be undone.');
    if (!confirmDelete) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/menu-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      await fetchMenuItems();
    } catch (error) {
      setError(error.message);
      console.error('Error deleting menu item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      let compareA = a[sortBy];
      let compareB = b[sortBy];
      
      if (sortBy === 'price') {
        compareA = parseFloat(compareA);
        compareB = parseFloat(compareB);
      } else {
        compareA = compareA.toLowerCase();
        compareB = compareB.toLowerCase();
      }
      
      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];  
    if (selectedCategory === 'all') return items;
    return items.filter(item => 
      item?.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [items, selectedCategory]);

  const sortedItems = useMemo(() => {
    if (!Array.isArray(filteredItems)) return [];  
    return sortItems(filteredItems);
  }, [filteredItems, sortBy, sortOrder, sortItems]);

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Name"
                value={newItem.name}
                onChange={(e) => {
                  setNewItem({ ...newItem, name: e.target.value });
                  setFormErrors({ ...formErrors, name: null });
                }}
                className={`p-2 border rounded w-full ${formErrors.name ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Base Price"
                  value={newItem.price}
                  onChange={(e) => {
                    setNewItem({ ...newItem, price: e.target.value });
                    setFormErrors({ ...formErrors, price: null });
                  }}
                  className={`p-2 border rounded w-full ${formErrors.price ? 'border-red-500' : ''}`}
                  required
                />

              </div>
              {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
            </div>

            <div>
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => {
                  setNewItem({ ...newItem, description: e.target.value });
                  setFormErrors({ ...formErrors, description: null });
                }}
                className={`p-2 border rounded w-full ${formErrors.description ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <select
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  formErrors.category ? 'border-red-500' : ''
                }`}
                value={newItem.category}
                onChange={(e) => {
                  setNewItem({ ...newItem, category: e.target.value });
                  setFormErrors({ ...formErrors, category: null });
                }}
                required
              >
                <option value="">Select a category</option>
                <optgroup label="Default Categories">
                  {defaultCategories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </optgroup>
                {customCategories.length > 0 && (
                  <optgroup label="Custom Categories">
                    {customCategories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.icon || '📋'} {category.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Extras</h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Extra name"
                    value={extraInput.name}
                    onChange={(e) => setExtraInput({ ...extraInput, name: e.target.value })}
                    className="p-2 border rounded flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={extraInput.price}
                    onChange={(e) => setExtraInput({ ...extraInput, price: e.target.value })}
                    className="p-2 border rounded w-24"
                    min="0"
                    step="0.01"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAddExtra}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Add
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {extras.map((extra, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span>{extra.name} - R{parseFloat(extra.price).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtra(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Sizes</h4>
                <div className="flex gap-2 mb-2">
                  <select
                    value={sizeInput.name}
                    onChange={(e) => setSizeInput({ ...sizeInput, name: e.target.value })}
                    className="p-2 border rounded flex-1"
                  >
                    <option value="">Select size</option>
                    <option value="Regular">Regular</option>
                    <option value="Large">Large</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    value={sizeInput.price}
                    onChange={(e) => setSizeInput({ ...sizeInput, price: e.target.value })}
                    className="p-2 border rounded w-24"
                    min="0"
                    step="0.01"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAddSize}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Add
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {sizes.map((size, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span>{size.name} - R{parseFloat(size.price).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Piece Options</h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={pieceInput.quantity}
                    onChange={(e) => setPieceInput({ ...pieceInput, quantity: e.target.value })}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={pieceInput.price}
                    onChange={(e) => setPieceInput({ ...pieceInput, price: e.target.value })}
                    className="p-2 border rounded"
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pieceInput.is_default}
                      onChange={(e) => setPieceInput({ ...pieceInput, is_default: e.target.checked })}
                      className="mr-2"
                    />
                    Default
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAddPieceOption}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Add
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {pieceOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>{option.quantity} pieces - R{option.price.toFixed(2)}</span>
                      <label className="flex items-center mx-2">
                        <input
                          type="radio"
                          checked={option.is_default}
                          onChange={() => toggleDefaultPieceOption(index)}
                          className="mr-1"
                        />
                        Default
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemovePieceOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Image Url</h4>
              <input
                type="text"
                placeholder="Image URL"
                value={newItem.image_url}
                onChange={(e) => {
                  setNewItem({ ...newItem, image_url: e.target.value });
                  setFormErrors({ ...formErrors, image_url: null });
                }}
                className={`p-2 border rounded w-full ${formErrors.image_url ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.image_url && <p className="text-red-500 text-sm mt-1">{formErrors.image_url}</p>}
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded"
                  onError={() => setFormErrors({ ...formErrors, image_url: 'Invalid image URL' })}
                />
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newItem.is_available}
                onChange={(e) => setNewItem({ ...newItem, is_available: e.target.checked })}
                className="mr-2"
              />
              <label>Available</label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {allCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {getCategoryIcon(category)} {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 items-center">
          <span className="font-semibold">Sort by:</span>
          {['name', 'price', 'category'].map(field => (
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={field}
              onClick={() => handleSort(field)}
              className={`px-3 py-1 rounded ${
                sortBy === field ? 'bg-yellow-500 text-white' : 'bg-gray-200'
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {sortBy === field && (
                <span className="ml-1">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sortedItems || []).map(item => (  
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border p-4 rounded shadow hover:shadow-lg transition-shadow"
              >
                <div className="relative pb-[60%] mb-2">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                    onLoadStart={() => setImageLoading(true)}
                    onLoad={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="animate-spin">🔄</span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                <p className="text-green-600 font-bold text-lg">R{parseFloat(item.price).toFixed(2)}</p>
                <p className="text-gray-500">
                  {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
                </p>
                {item.extras.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-semibold">Extras:</h4>
                    <ul className="list-disc pl-4">
                      {item.extras.map(extra => (
                        <li key={extra.id}>{extra.name} - R{parseFloat(extra.price).toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.sizes.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-semibold">Sizes:</h4>
                    <ul className="list-disc pl-4">
                      {item.sizes.map(size => (
                        <li key={size.id}>{size.name} - R{parseFloat(size.price).toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.piece_options.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-semibold">Piece Options:</h4>
                    <ul className="list-disc pl-4">
                      {item.piece_options.map(option => (
                        <li key={option.id}>{option.quantity} pieces - R{parseFloat(option.price).toFixed(2)} {option.is_default ? '(Default)' : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className={`${item.is_available ? 'text-green-500' : 'text-red-500'} font-medium`}>
                  {item.is_available ? '✓ Available' : '✗ Not Available'}
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default MenuItems;
