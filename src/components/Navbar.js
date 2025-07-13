import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { isUserAdmin } from '@/utils/adminUtils';
import '@/styles/theme.css';
import '@/styles/navbar.css';

const Navbar = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const { cartItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      if (onNavigate) onNavigate('home');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleNavigation = (key) => {
    if (onNavigate) {
      onNavigate(key);
    }
    // Close navbar collapse on mobile
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
    }
    
    // Handle direct navigation for login and admin
    if (key === 'login' || key === 'admin') {
      navigate(`/${key}`);
    } else if (key === 'cart') {
      navigate('/cart');
    }
  };

  // Check if user is admin using utility function
  const isAdmin = isUserAdmin(currentUser?.email);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="px-5 container-fluid">
        <div className="navbar-brand fw-bold d-flex flex-column bg-white py-1 px-2 text-center">
          {process.env.REACT_APP_APP_TITLE?.split(' ').map((word, index) => (
            <span 
              key={index} 
              className={index % 2 === 0 ? 'navbar-title-top' : 'navbar-title-bottom'}
            >
              {word}
            </span>
          ))}
        </div>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0 fs-5 fw-bold"
                onClick={() => handleNavigation('home')}
              >
                {t('navbar.home')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0 fs-5 fw-bold"
                onClick={() => handleNavigation('menu')}
              >
                {t('navbar.menu')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0 fs-5 fw-bold"
                onClick={() => handleNavigation('campaign')}
              >
                {t('navbar.campaign')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-link text-white nav-link border-0 fs-5 fw-bold"
                onClick={() => handleNavigation('about')}
              >
                {t('navbar.about')}
              </button>
            </li>
          </ul>
          
          <div className="navbar-nav ms-auto d-flex align-items-left gap-2">
            {/* Cart Button */}
            <button
              className="btn btn-outline-light position-relative fs-5 fw-bold"
              onClick={() => handleNavigation('cart')}
              title={t('navbar.cart', 'Cart')}
            >
              <i className="bi bi-cart3"></i>
              {cartItems.length > 0 && (
                <>
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                    <span className="visually-hidden">items in cart</span>
                  </span>
                  <small className="d-none d-sm-inline ms-2">
                    {totalPrice} SEK
                  </small>
                </>
              )}
            </button>
            
            <LanguageSwitcher />
            {currentUser ? (
              <>
                {isAdmin && (
                  <button
                    className="btn btn-warning fs-5 fw-bold"
                    onClick={() => handleNavigation('admin')}
                    style={{ minWidth: '120px', maxWidth: '150px' }}
                  >
                    {t('navbar.adminPanel')}
                  </button>
                )}
                <button 
                  className="btn btn-danger fs-5 fw-bold" 
                  onClick={handleLogout}
                  style={{ minWidth: '120px', maxWidth: '150px' }}
                >
                  {t('navbar.logout')}
                </button>
              </>
            ) : (
              <button 
                className="btn btn-success fs-5 fw-bold" 
                onClick={() => handleNavigation('login')}
                style={{ minWidth: '120px' }}
              >
                {t('navbar.signIn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;