import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHome from '@/components/UserHome';
import { isUserAdmin } from '@/utils/adminUtils';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // Check if user is admin using utility function
  const isAdmin = isUserAdmin(currentUser?.email);

  return (
    <div className="min-vh-100 bg-light">
      <UserHome isAdmin={isAdmin} />
    </div>
  );
};

export default Dashboard;