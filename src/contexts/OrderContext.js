import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [hasOrders, setHasOrders] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user has any orders
  const checkUserOrders = async (userId) => {
    if (!userId) {
      setHasOrders(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Checking orders for user:', userId);
      
      // Simplified query without orderBy to avoid index requirement
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(ordersQuery);
      console.log('User has orders:', !querySnapshot.empty);
      setHasOrders(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking user orders:', error);
      setHasOrders(false);
    } finally {
      setLoading(false);
    }
  };

  // Update hasOrders when user changes or when a new order is created
  useEffect(() => {
    if (currentUser) {
      checkUserOrders(currentUser.uid);
    } else {
      setHasOrders(false);
    }
  }, [currentUser]);

  // Function to refresh order status (call this after creating a new order)
  const refreshOrderStatus = () => {
    if (currentUser) {
      checkUserOrders(currentUser.uid);
    }
  };

  const value = {
    hasOrders,
    loading,
    refreshOrderStatus
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;
