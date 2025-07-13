import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart reducer to handle cart actions
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && 
                item.selectedVolume === action.payload.selectedVolume
      );

      if (existingItemIndex > -1) {
        // Update quantity if item with same volume already exists
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        updatedItems[existingItemIndex].totalPrice = (
          parseFloat(updatedItems[existingItemIndex].selectedPrice) * 
          updatedItems[existingItemIndex].quantity
        ).toFixed(2);

        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + action.payload.quantity,
          totalPrice: calculateTotalPrice(updatedItems)
        };
      } else {
        // Add new item with totalPrice calculated
        const newItem = {
          ...action.payload,
          totalPrice: (parseFloat(action.payload.selectedPrice) * action.payload.quantity).toFixed(2)
        };
        const newItems = [...state.items, newItem];
        return {
          ...state,
          items: newItems,
          totalItems: state.totalItems + action.payload.quantity,
          totalPrice: calculateTotalPrice(newItems)
        };
      }

    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(
        (item, index) => index !== action.payload.index
      );
      return {
        ...state,
        items: filteredItems,
        totalItems: calculateTotalItems(filteredItems),
        totalPrice: calculateTotalPrice(filteredItems)
      };

    case 'UPDATE_QUANTITY':
      const { index, newQuantity } = action.payload;
      if (newQuantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { index } });
      }

      const updatedItems = [...state.items];
      updatedItems[index].quantity = newQuantity;
      updatedItems[index].totalPrice = (
        parseFloat(updatedItems[index].selectedPrice) * newQuantity
      ).toFixed(2);

      return {
        ...state,
        items: updatedItems,
        totalItems: calculateTotalItems(updatedItems),
        totalPrice: calculateTotalPrice(updatedItems)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: '0.00'
      };

    case 'LOAD_CART':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};

// Helper functions
const calculateTotalItems = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => {
    return total + parseFloat(item.totalPrice || 0);
  }, 0).toFixed(2);
};

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: '0.00'
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurantCart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('restaurantCart', JSON.stringify(state));
  }, [state]);

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (index) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { index } });
  };

  const updateQuantity = (index, newQuantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { index, newQuantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.totalPrice;
  };

  const getCartItemCount = () => {
    return state.totalItems;
  };

  const value = {
    cartItems: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
