import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  return useContext(AdminContext);
};

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState([
    {
      id: 1,
      email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@example.com',
      displayName: 'John Doe',
      role: 'customer',
      isActive: true,
      joinedAt: new Date('2024-01-10'),
      lastLogin: new Date('2024-12-01'),
    }
  ]);
  const [orders, setOrders] = useState([
    {
      id: 1,
      userId: 1,
      items: [{ name: 'Margherita Pizza', quantity: 2, price: 12.99 }],
      total: 25.98,
      status: 'completed',
      orderDate: new Date('2024-12-01'),
    },
    {
      id: 2,
      userId: 2,
      items: [{ name: 'Caesar Salad', quantity: 1, price: 8.99 }],
      total: 8.99,
      status: 'pending',
      orderDate: new Date('2024-12-02'),
    },
  ]);

  const updateUserStatus = (userId, isActive) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive } : user
    ));
  };

  const updateUserRole = (userId, role) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role } : user
    ));
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const value = {
    users,
    orders,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    updateOrderStatus,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};