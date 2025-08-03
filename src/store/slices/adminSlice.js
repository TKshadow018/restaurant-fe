import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { isUserAdmin } from '@/utils/adminUtils';

// Async thunk to fetch users
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Determine role based on email
          role: isUserAdmin(data.email) ? 'admin' : 'customer',
          // Convert timestamps to ISO strings for serialization
          joinedAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLoginAt?.toDate()?.toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          // Ensure isActive field exists
          isActive: data.isActive !== undefined ? data.isActive : true
        };
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch orders
export const fetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
          status: data.status || 'pending'
        };
      });
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch foods
export const fetchFoods = createAsyncThunk(
  'admin/fetchFoods',
  async (_, { rejectWithValue }) => {
    try {
      const foodsRef = collection(db, 'foods');
      const q = query(foodsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const foods = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
        };
      });
      
      return foods;
    } catch (error) {
      console.error('Error fetching foods:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update order status
export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      return { orderId, status };
    } catch (error) {
      console.error('Error updating order status:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update user status
export const updateUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ userId, isActive }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
      
      return { userId, isActive };
    } catch (error) {
      console.error('Error updating user status:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update user role
export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role,
        updatedAt: serverTimestamp()
      });
      
      return { userId, role };
    } catch (error) {
      console.error('Error updating user role:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to delete user
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      return userId;
    } catch (error) {
      console.error('Error deleting user:', error);
      return rejectWithValue(error.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: {
      items: [],
      status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
      error: null,
      lastFetched: null
    },
    orders: {
      items: [],
      status: 'idle',
      error: null,
      lastFetched: null
    },
    foods: {
      items: [],
      status: 'idle',
      error: null,
      lastFetched: null
    },
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalFoods: 0,
      availableFoods: 0,
      totalRevenue: 0,
      pendingIncome: 0,
      potentialIncome: 0
    }
  },
  reducers: {
    clearAdminData: (state) => {
      state.users = { items: [], status: 'idle', error: null, lastFetched: null };
      state.orders = { items: [], status: 'idle', error: null, lastFetched: null };
      state.foods = { items: [], status: 'idle', error: null, lastFetched: null };
      state.stats = {
        totalUsers: 0,
        activeUsers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalFoods: 0,
        availableFoods: 0,
        totalRevenue: 0,
        pendingIncome: 0,
        potentialIncome: 0
      };
    },
    calculateStats: (state) => {
      // Calculate stats from cached data
      state.stats.totalUsers = state.users.items.length;
      state.stats.activeUsers = state.users.items.filter(user => user.isActive).length;
      state.stats.totalOrders = state.orders.items.length;
      state.stats.pendingOrders = state.orders.items.filter(order => order.status === 'pending').length;
      state.stats.totalFoods = state.foods.items.length;
      state.stats.availableFoods = state.foods.items.filter(food => food.available !== false).length;
      
      // Calculate completed revenue (only completed orders)
      const completedRevenue = Number(state.orders.items
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => {
          const price = Number(order.totalPrice) || 0;
          return sum + price;
        }, 0)) || 0;
      
      // Calculate pending income (pending orders)
      const pendingIncome = Number(state.orders.items
        .filter(order => order.status === 'pending')
        .reduce((sum, order) => {
          const price = Number(order.totalPrice) || 0;
          return sum + price;
        }, 0)) || 0;
      
      // Total potential income = completed + pending
      state.stats.totalRevenue = completedRevenue;
      state.stats.pendingIncome = pendingIncome;
      state.stats.potentialIncome = completedRevenue + pendingIncome;
    },
    
    // Local food update actions
    updateFoodAvailability: (state, action) => {
      const { foodId, available } = action.payload;
      const food = state.foods.items.find(f => f.id === foodId);
      if (food) {
        food.available = available;
        food.updatedAt = new Date().toISOString();
      }
    },
    
    addFood: (state, action) => {
      const newFood = action.payload;
      state.foods.items.unshift(newFood); // Add to beginning
    },
    
    updateFood: (state, action) => {
      const updatedFood = action.payload;
      const index = state.foods.items.findIndex(f => f.id === updatedFood.id);
      if (index !== -1) {
        state.foods.items[index] = { ...state.foods.items[index], ...updatedFood };
      }
    },
    
    removeFood: (state, action) => {
      const foodId = action.payload;
      state.foods.items = state.foods.items.filter(f => f.id !== foodId);
    }
  },
  extraReducers: (builder) => {
    // Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.users.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.status = 'succeeded';
        state.users.items = action.payload;
        state.users.lastFetched = Date.now();
        state.users.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.status = 'failed';
        state.users.error = action.payload;
      })
      
    // Orders
      .addCase(fetchOrders.pending, (state) => {
        state.orders.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders.status = 'succeeded';
        state.orders.items = action.payload;
        state.orders.lastFetched = Date.now();
        state.orders.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.orders.status = 'failed';
        state.orders.error = action.payload;
      })
      
    // Foods
      .addCase(fetchFoods.pending, (state) => {
        state.foods.status = 'loading';
      })
      .addCase(fetchFoods.fulfilled, (state, action) => {
        state.foods.status = 'succeeded';
        state.foods.items = action.payload;
        state.foods.lastFetched = Date.now();
        state.foods.error = null;
      })
      .addCase(fetchFoods.rejected, (state, action) => {
        state.foods.status = 'failed';
        state.foods.error = action.payload;
      })
      
    // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, status } = action.payload;
        const order = state.orders.items.find(o => o.id === orderId);
        if (order) {
          order.status = status;
          order.updatedAt = new Date().toISOString();
        }
      })
      
    // Update user status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { userId, isActive } = action.payload;
        const user = state.users.items.find(u => u.id === userId);
        if (user) {
          user.isActive = isActive;
          user.updatedAt = new Date().toISOString();
        }
      })
      
    // Update user role
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const { userId, role } = action.payload;
        const user = state.users.items.find(u => u.id === userId);
        if (user) {
          user.role = role;
          user.updatedAt = new Date().toISOString();
        }
      })
      
    // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        const userId = action.payload;
        state.users.items = state.users.items.filter(u => u.id !== userId);
      });
  }
});

export const { 
  clearAdminData, 
  calculateStats, 
  updateFoodAvailability, 
  addFood, 
  updateFood, 
  removeFood 
} = adminSlice.actions;

// Selectors with safety checks
export const selectUsers = (state) => state.admin?.users || { items: [], status: 'idle', error: null, lastFetched: null };
export const selectOrders = (state) => state.admin?.orders || { items: [], status: 'idle', error: null, lastFetched: null };
export const selectFoods = (state) => state.admin?.foods || { items: [], status: 'idle', error: null, lastFetched: null };

// Memoized selector for admin stats to prevent unnecessary rerenders
export const selectAdminStats = createSelector(
  [(state) => state.admin?.stats],
  (stats) => {
    const defaultStats = { 
      totalUsers: 0, 
      activeUsers: 0, 
      totalOrders: 0, 
      pendingOrders: 0, 
      totalFoods: 0, 
      availableFoods: 0, 
      totalRevenue: 0, 
      pendingIncome: 0, 
      potentialIncome: 0 
    };
    
    if (!stats) return defaultStats;
    
    return {
      ...defaultStats,
      ...stats,
      totalRevenue: Number(stats.totalRevenue) || 0,
      pendingIncome: Number(stats.pendingIncome) || 0,
      potentialIncome: Number(stats.potentialIncome) || 0
    };
  }
);
export const selectIsAdminDataLoaded = (state) => {
  const admin = state.admin;
  if (!admin) return false;
  return admin.users?.status === 'succeeded' && 
         admin.orders?.status === 'succeeded' && 
         admin.foods?.status === 'succeeded';
};

export default adminSlice.reducer;
