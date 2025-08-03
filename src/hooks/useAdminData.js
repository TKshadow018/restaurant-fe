import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchUsers, 
  fetchOrders, 
  fetchFoods, 
  calculateStats,
  selectUsers,
  selectOrders,
  selectFoods,
  selectAdminStats,
  selectIsAdminDataLoaded,
  updateOrderStatus as updateOrderStatusAction,
  updateUserStatus as updateUserStatusAction,
  updateUserRole as updateUserRoleAction,
  deleteUser as deleteUserAction,
  updateFoodAvailability,
  addFood,
  updateFood,
  removeFood
} from '@/store/slices/adminSlice';

export const useAdminData = () => {
  const dispatch = useDispatch();
  
  const users = useSelector(selectUsers);
  const orders = useSelector(selectOrders);
  const foods = useSelector(selectFoods);
  const stats = useSelector(selectAdminStats);
  const isDataLoaded = useSelector(selectIsAdminDataLoaded);

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const loadAdminData = async (forceRefresh = false) => {
    const now = Date.now();
    
    try {
      // Check if we need to fetch users
      if (forceRefresh || 
          users.status === 'idle' || 
          (users.lastFetched && now - users.lastFetched > CACHE_DURATION)) {
        dispatch(fetchUsers());
      }
      
      // Check if we need to fetch orders
      if (forceRefresh || 
          orders.status === 'idle' || 
          (orders.lastFetched && now - orders.lastFetched > CACHE_DURATION)) {
        dispatch(fetchOrders());
      }
      
      // Check if we need to fetch foods
      if (forceRefresh || 
          foods.status === 'idle' || 
          (foods.lastFetched && now - foods.lastFetched > CACHE_DURATION)) {
        dispatch(fetchFoods());
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  // Calculate stats whenever data changes
  useEffect(() => {
    if (users.status === 'succeeded' && orders.status === 'succeeded' && foods.status === 'succeeded') {
      dispatch(calculateStats());
    }
  }, [users.status, orders.status, foods.status, dispatch]);

  // Helper functions for admin actions
  const updateOrderStatus = async (orderId, status) => {
    try {
      await dispatch(updateOrderStatusAction({ orderId, status })).unwrap();
      // Recalculate stats after updating
      dispatch(calculateStats());
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      await dispatch(updateUserStatusAction({ userId, isActive })).unwrap();
      // Recalculate stats after updating
      dispatch(calculateStats());
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await dispatch(updateUserRoleAction({ userId, role })).unwrap();
      // Recalculate stats after updating
      dispatch(calculateStats());
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await dispatch(deleteUserAction(userId)).unwrap();
      // Recalculate stats after deleting
      dispatch(calculateStats());
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  // Food management functions that update store locally
  const updateFoodAvailabilityLocal = (foodId, available) => {
    dispatch(updateFoodAvailability({ foodId, available }));
    dispatch(calculateStats()); // Recalculate stats
  };

  const addFoodLocal = (foodData) => {
    dispatch(addFood(foodData));
    dispatch(calculateStats()); // Recalculate stats
  };

  const updateFoodLocal = (foodData) => {
    dispatch(updateFood(foodData));
    dispatch(calculateStats()); // Recalculate stats
  };

  const removeFoodLocal = (foodId) => {
    dispatch(removeFood(foodId));
    dispatch(calculateStats()); // Recalculate stats
  };

  return {
    // Data with fallbacks
    users: users?.items || [],
    orders: orders?.items || [],
    foods: foods?.items || [],
    stats: stats || { totalUsers: 0, activeUsers: 0, totalOrders: 0, pendingOrders: 0, totalFoods: 0, availableFoods: 0, totalRevenue: 0, pendingIncome: 0, potentialIncome: 0 },
    
    // Loading states
    usersLoading: users?.status === 'loading',
    ordersLoading: orders?.status === 'loading',
    foodsLoading: foods?.status === 'loading',
    isLoading: users?.status === 'loading' || orders?.status === 'loading' || foods?.status === 'loading',
    isDataLoaded: isDataLoaded || false,
    
    // Error states
    usersError: users?.error || null,
    ordersError: orders?.error || null,
    foodsError: foods?.error || null,
    
    // Actions
    loadAdminData,
    updateOrderStatus,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    
    // Food management actions
    updateFoodAvailabilityLocal,
    addFoodLocal,
    updateFoodLocal,
    removeFoodLocal
  };
};

export default useAdminData;
