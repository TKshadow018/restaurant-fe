import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Async thunk for fetching menu items
export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'foods'));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return items;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  menuItems: [],
  loading: false,
  error: null,
  lastFetched: null,
  // Filter states
  searchTerm: '',
  filterCategory: 'all',
  filterAvailability: 'all',
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuItems: (state, action) => {
      state.menuItems = action.payload;
      state.lastFetched = Date.now();
    },
    clearError: (state) => {
      state.error = null;
    },
    updateMenuItem: (state, action) => {
      const index = state.menuItems.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.menuItems[index] = { ...state.menuItems[index], ...action.payload };
      }
    },
    addMenuItem: (state, action) => {
      state.menuItems.push(action.payload);
    },
    removeMenuItem: (state, action) => {
      state.menuItems = state.menuItems.filter(item => item.id !== action.payload);
    },
    // Filter actions
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilterCategory: (state, action) => {
      state.filterCategory = action.payload;
    },
    setFilterAvailability: (state, action) => {
      state.filterAvailability = action.payload;
    },
    clearFilters: (state) => {
      state.searchTerm = '';
      state.filterCategory = 'all';
      state.filterAvailability = 'all';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load menu items';
      });
  },
});

export const {
  setMenuItems,
  clearError,
  updateMenuItem,
  addMenuItem,
  removeMenuItem,
  setSearchTerm,
  setFilterCategory,
  setFilterAvailability,
  clearFilters,
} = menuSlice.actions;

export default menuSlice.reducer;