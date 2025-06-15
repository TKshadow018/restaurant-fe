import { useState } from 'react';
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

  return (
    <>
      <Navbar onNavigate={setVisible} />
      <div>
        {COMPONENTS[visible]}
      </div>
    </>
  );
};

export default UserWrapper;