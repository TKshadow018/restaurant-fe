import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Home from '@/components/Home';
import Menu from '@/components/Menu';
import Campaign from '@/components/Campaign';
import ContactUs from '@/components/ContactUs';

const COMPONENTS = {
  home: <Home />,
  menu: <Menu />,
  campaign: <Campaign />,
  about: <ContactUs />,
};

const UserWrapper = () => {
  const [visible, setVisible] = useState('home');
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for page parameter on mount and when search params change
  useEffect(() => {
    const page = searchParams.get('page');
    if (page && ['home', 'menu', 'campaign', 'about'].includes(page)) {
      setVisible(page);
    }
  }, [searchParams]);

  // Update URL when visible state changes (but only if it's different from current)
  const handleNavigate = (newPage) => {
    setVisible(newPage);
    const currentPage = searchParams.get('page');
    if (currentPage !== newPage) {
      setSearchParams({ page: newPage });
    }
  };

  return (
    <>
      <Navbar onNavigate={handleNavigate} />
      <div>
        {COMPONENTS[visible]}
      </div>
    </>
  );
};

export default UserWrapper;