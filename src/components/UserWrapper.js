import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Home from '@/components/Home';
import Menu from '@/components/Menu';
import Campaign from '@/components/Campaign';
import ContactUs from '@/components/ContactUs';
import Orders from '@/components/Orders';
import ProfileCompletionGuard from '@/components/user/ProfileCompletionGuard';

const COMPONENTS = {
  home: <Home />,
  menu: <Menu />,
  campaign: <Campaign />,
  about: <ContactUs />,
  orders: <Orders />,
};

const UserWrapper = () => {
  const [visible, setVisible] = useState('home');
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Check for page parameter on mount and when search params change
  useEffect(() => {
    const page = searchParams.get('page');
    
    // If we're on root path "/" with page parameters, redirect to dashboard
    if (location.pathname === '/' && page && currentUser) {
      navigate(`/dashboard?page=${page}`, { replace: true });
      return;
    }
    
    // Only allow page parameters on dashboard route for logged-in users
    if (location.pathname === '/dashboard' && currentUser && page && ['home', 'menu', 'campaign', 'about', 'orders'].includes(page)) {
      setVisible(page);
    } else if (location.pathname === '/' && !currentUser) {
      // On root path without login, show home
      setVisible('home');
    } else if (location.pathname === '/dashboard' && currentUser) {
      // On dashboard without page param, show home
      setVisible('home');
    }
  }, [searchParams, location.pathname, currentUser, navigate]);

  // Update URL when visible state changes (but only if it's different from current)
  const handleNavigate = (newPage) => {
    setVisible(newPage);
    const currentPage = searchParams.get('page');
    
    // Only set search params if we're on dashboard route and logged in
    if (location.pathname === '/dashboard' && currentUser && currentPage !== newPage) {
      setSearchParams({ page: newPage });
    } else if (location.pathname === '/' && currentUser) {
      // If on root and logged in, navigate to dashboard with page param
      navigate(`/dashboard?page=${newPage}`);
    }
  };

  return (
    <>
      <Navbar onNavigate={handleNavigate} />
      <ProfileCompletionGuard>
        <div>
          {COMPONENTS[visible]}
        </div>
      </ProfileCompletionGuard>
    </>
  );
};

export default UserWrapper;