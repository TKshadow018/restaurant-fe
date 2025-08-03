import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from 'react-bootstrap';
import '@/styles/theme.css';

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

  // Check if on dashboard page or if URL has 'page' parameter
  const isDashboard = location.pathname === '/dashboard';
  const hasPageParam = new URLSearchParams(location.search).has('page');
  
  // Show button if on dashboard OR if URL has 'page' parameter
  const shouldShow = isDashboard || hasPageParam;

  // Don't show the button if cart is empty OR if not on allowed pages
  if (totalItems === 0 || !shouldShow) {
    return null;
  }

  return (
    <div 
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1050 }}
    >
      <Button
        variant="primary"
        size="lg"
        onClick={handleGoToCart}
        className="position-relative shadow-lg p-3"
        style={{
          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
          border: 'none',
          animation: 'pulse 2s infinite',
          width: '60px',
          height: '60px'
        }}
      >
        <i className="bi bi-cart3 fs-4"></i>
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {totalItems}
        </span>
      </Button>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default GoToCart;
