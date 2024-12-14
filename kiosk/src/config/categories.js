export const defaultCategories = [
  { id: 'burgers', name: 'burgers', label: 'Burgers', icon: '🍔', path: '/burgers' },
  { id: 'drinks', name: 'drinks', label: 'Drinks', icon: '🥤', path: '/drinks' },
  { id: 'sides', name: 'sides', label: 'Sides', icon: '🍟', path: '/sides' },
  { id: 'breakfast', name: 'breakfast', label: 'Breakfast', icon: '🍳', path: '/breakfast' },
];

export const isDefaultCategory = (categoryName) => {
  return defaultCategories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
};
