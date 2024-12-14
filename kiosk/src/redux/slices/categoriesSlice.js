import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Create async thunk for fetching categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await fetch('http://localhost:5000/api/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data;
  }
);

// Load categories from localStorage if available
const savedCategories = JSON.parse(localStorage.getItem('categories')) || [];

const initialState = {
  items: savedCategories,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.items = action.payload;
      state.status = 'succeeded';
      localStorage.setItem('categories', JSON.stringify(action.payload));
    },
    addCategory: (state, action) => {
      // Check if category with same path already exists
      const exists = state.items.some(cat => cat.path === action.payload.path);
      if (!exists) {
        state.items.push(action.payload);
        localStorage.setItem('categories', JSON.stringify(state.items));
      }
    },
    updateCategory: (state, action) => {
      const index = state.items.findIndex(cat => cat.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        localStorage.setItem('categories', JSON.stringify(state.items));
      }
    },
    removeCategory: (state, action) => {
      state.items = state.items.filter(cat => cat.id !== action.payload);
      localStorage.setItem('categories', JSON.stringify(state.items));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        localStorage.setItem('categories', JSON.stringify(action.payload));
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setCategories, addCategory, updateCategory, removeCategory } = categoriesSlice.actions;

export default categoriesSlice.reducer;