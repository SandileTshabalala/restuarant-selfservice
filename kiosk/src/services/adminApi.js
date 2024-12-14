const API_URL = 'http://localhost:5000/api/admin';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
});

export const loginAdmin = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
};

// Menu Items
export const getMenuItems = async () => {
  const response = await fetch(`${API_URL}/menu-items`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch menu items');
  }

  return response.json();
};

export const createMenuItem = async (itemData) => {
  const response = await fetch(`${API_URL}/menu-items`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create menu item');
  }

  return response.json();
};

export const updateMenuItem = async (itemId, itemData) => {
  const response = await fetch(`${API_URL}/menu-items/${itemId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update menu item');
  }

  return response.json();
};

export const deleteMenuItem = async (itemId) => {
  const response = await fetch(`${API_URL}/menu-items/${itemId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete menu item');
  }
};

// Categories
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch categories');
  }

  return response.json();
};

export const createCategory = async (categoryData) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }

  return response.json();
};

export const updateCategory = async (categoryId, categoryData) => {
  const response = await fetch(`${API_URL}/categories/${categoryId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }

  return response.json();
};

export const deleteCategory = async (categoryId) => {
  const response = await fetch(`${API_URL}/categories/${categoryId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }
};

// Orders
export const getOrders = async () => {
  const response = await fetch(`${API_URL}/orders`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch orders');
  }

  return response.json();
};

export const updateOrderStatus = async (orderNumber, status) => {
  const response = await fetch(`${API_URL}/orders/${orderNumber}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update order status');
  }

  return response.json();
};
