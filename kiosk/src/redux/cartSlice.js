import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );

      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += 1;
        state.items[existingItemIndex].itemTotal = 
          state.items[existingItemIndex].quantity * state.items[existingItemIndex].totalPrice;
      } else {
        state.items.push({
          ...action.payload,
          quantity: 1,
          itemTotal: action.payload.totalPrice
        });
      }

      state.total = state.items.reduce((sum, item) => sum + item.itemTotal, 0);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = state.items.reduce((sum, item) => sum + item.itemTotal, 0);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.quantity = quantity;
        item.itemTotal = item.quantity * item.totalPrice;
        state.total = state.items.reduce((sum, item) => sum + item.itemTotal, 0);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
