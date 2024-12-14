import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
};

const calculateItemTotal = (item) => {
  const quantity = item.quantity || 1;
  const extrasTotal = item.selectedExtras?.reduce((sum, extra) => 
    sum + (parseFloat(extra.price) || 0), 0) || 0;

  // For items with piece options
  if (item.selectedOption && item.piece_options?.length > 0) {
    const selectedPieceOption = item.piece_options.find(
      opt => opt.id.toString() === item.selectedOption
    );
    if (selectedPieceOption) {
      const basePrice = parseFloat(selectedPieceOption.price) || 0;
      return (basePrice + extrasTotal) * quantity;
    }
  }

  // For items with size options
  if (item.selectedSize) {
    const basePrice = parseFloat(item.price) || 0;
    const sizePrice = parseFloat(item.selectedSize.price) || 0;
    return (basePrice + sizePrice + extrasTotal) * quantity;
  }

  // For regular items
  const basePrice = parseFloat(item.price) || 0;
  return (basePrice + extrasTotal) * quantity;
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = {
        ...action.payload,
        cartId: `${action.payload.id}_${Date.now()}`, // Add unique cartId
        quantity: 1
      };
      newItem.itemTotal = calculateItemTotal(newItem);
      
      // Check if item with same options exists
      const existingItemIndex = state.items.findIndex(item => 
        item.id === action.payload.id && 
        item.selectedSize?.name === action.payload.selectedSize?.name &&
        item.selectedOption === action.payload.selectedOption && // Add check for piece options
        JSON.stringify(item.selectedExtras) === JSON.stringify(action.payload.selectedExtras)
      );

      if (existingItemIndex !== -1) {
        state.items[existingItemIndex].quantity += 1;
        state.items[existingItemIndex].itemTotal = calculateItemTotal(state.items[existingItemIndex]);
      } else {
        state.items.push(newItem);
      }

      state.total = state.items.reduce((total, item) => total + calculateItemTotal(item), 0);
    },
    removeFromCart: (state, action) => {
      // Use cartId instead of id for removal
      state.items = state.items.filter(item => item.cartId !== action.payload);
      state.total = state.items.reduce((total, item) => total + calculateItemTotal(item), 0);
    },
    updateQuantity: (state, action) => {
      const { cartId, quantity, extras, pieceOptions, sizes } = action.payload;
      const item = state.items.find(item => item.cartId === cartId);
      if (item) {
        item.quantity = quantity;
        item.extras = extras || item.extras;
        item.pieceOptions = pieceOptions || item.pieceOptions;
        item.sizes = sizes || item.sizes; 
        item.itemTotal = calculateItemTotal(item);
      }
      state.total = state.items.reduce((total, item) => total + calculateItemTotal(item), 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
