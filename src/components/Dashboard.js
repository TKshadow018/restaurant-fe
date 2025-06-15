import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserHome from './UserHome';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // Check if user is admin (you can implement your own logic)
  const isAdmin = currentUser?.email === process.env.REACT_APP_ADMIN_EMAIL;

  return (
    <div className="min-vh-100 bg-light">
      <UserHome isAdmin={isAdmin} />
    </div>
  );
};

export default Dashboard;