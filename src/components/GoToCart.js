import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from 'react-bootstrap';
import '@/styles/theme.css';
import '../styles/GoToCart.css';

const GoToCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleGoToCart = () => {
    navigate('/cart');
  };

  // Check if on dashboard page or if URL has 'page' parameter on dashboard
  const isDashboard = location.pathname === '/dashboard';
  const hasPageParam = new URLSearchParams(location.search).has('page');
  
  // Show button only if on dashboard (with or without page parameters)
  const shouldShow = isDashboard;

  // Don't show the button if cart is empty OR if not on allowed pages
  if (totalItems === 0 || !shouldShow) {
    return null;
  }

  return (
    <div
      className="goto-cart-container"
    >
      <Button
        variant="primary"
        size="lg"
        onClick={handleGoToCart}
        className="goto-cart-button position-relative shadow-lg"
      >
        <i className="bi bi-cart3 fs-4"></i>
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {totalItems}
        </span>
      </Button>
    </div>
  );
};

export default GoToCart;
