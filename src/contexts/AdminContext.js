import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { isUserAdmin } from '@/utils/adminUtils';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from Firebase
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Determine role based on email
            role: isUserAdmin(data.email) ? 'admin' : 'customer',
            // Convert timestamps to dates if they exist
            joinedAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLoginAt?.toDate() || new Date(),
            // Ensure isActive field exists
            isActive: data.isActive !== undefined ? data.isActive : true
          };
        });
        setUsers(usersData);
        setError(null);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch orders from Firebase
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        });
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update user status (active/inactive)
  const updateUserStatus = async (userId, isActive) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  };

  // Update user role (admin/customer)
  const updateUserRole = async (userId, role) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const value = {
    users,
    orders,
    loading,
    error,
    updateUserStatus,
    updateUserRole,
    deleteUser
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};