import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from 'react-i18next';
import '@/styles/theme.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';

  // Helper function to get localized text
  const getLocalizedText = (textObj, fallback = 'Unnamed Item') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[currentLanguage] || textObj.english || textObj.swedish || fallback;
  };

  // Helper function to format volume display names
  const formatVolumeName = (volume) => {
    const volumeNames = {
      small: currentLanguage === 'swedish' ? 'Liten' : 'Small',
      medium: currentLanguage === 'swedish' ? 'Mellan' : 'Medium', 
      large: currentLanguage === 'swedish' ? 'Stor' : 'Large',
      normal: currentLanguage === 'swedish' ? 'Normal' : 'Normal'
    };
    return volumeNames[volume] || volume;
  };

  const handleContinueShopping = () => {
    navigate('/?page=menu');
  };

  const handleQuantityChange = (index, change) => {
    const currentQuantity = cartItems[index].quantity;
    const newQuantity = currentQuantity + change;
    updateQuantity(index, newQuantity);
  };

  const handleCheckout = () => {
    // TODO: Implement checkout functionality
    alert(currentLanguage === 'swedish' 
      ? 'Kassan är inte implementerad ännu!' 
      : 'Checkout is not implemented yet!');
  };

  if (cartItems.length === 0) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center py-5">
              <i className="bi bi-cart-x display-1 text-muted mb-4"></i>
              <h2 className="text-muted mb-3">
                {currentLanguage === 'swedish' ? 'Din varukorg är tom' : 'Your cart is empty'}
              </h2>
              <p className="text-muted mb-4">
                {currentLanguage === 'swedish' 
                  ? 'Lägg till några läckra rätter från vår meny!' 
                  : 'Add some delicious items from our menu!'}
              </p>
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleContinueShopping}
              >
                {currentLanguage === 'swedish' ? 'Fortsätt handla' : 'Continue Shopping'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 text-primary">
              {currentLanguage === 'swedish' ? 'Din varukorg' : 'Your Cart'}
            </h1>
            <button 
              className="btn btn-outline-danger"
              onClick={clearCart}
            >
              <i className="bi bi-trash me-2"></i>
              {currentLanguage === 'swedish' ? 'Töm varukorg' : 'Clear Cart'}
            </button>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.selectedVolume}-${index}`} className="border-bottom p-4">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      <img 
                        src={item.image} 
                        alt={getLocalizedText(item.name)}
                        className="img-fluid rounded"
                        style={{ height: '80px', width: '80px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="col-md-4">
                      <h5 className="mb-1">{getLocalizedText(item.name)}</h5>
                      <p className="text-muted mb-1">
                        {getLocalizedText(item.description, 'No description available')}
                      </p>
                      {item.selectedVolume && item.selectedVolume !== 'normal' && (
                        <small className="text-primary">
                          {currentLanguage === 'swedish' ? 'Storlek:' : 'Size:'} {formatVolumeName(item.selectedVolume)}
                        </small>
                      )}
                    </div>
                    <div className="col-md-2">
                      <span className="h6 text-primary">{item.selectedPrice} SEK</span>
                    </div>
                    <div className="col-md-3">
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="input-group" style={{ maxWidth: '140px' }}>
                          <button
                            className="btn btn-outline-primary"
                            type="button"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={item.quantity <= 1}
                            style={{ 
                              borderRadius: '8px 0 0 8px',
                              borderRight: 'none',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-dash fw-bold"></i>
                          </button>
                          <div 
                            className="form-control text-center fw-bold bg-light btn-outline-primary" 
                            style={{ 
                              borderLeft: 'none',
                              borderRight: 'none',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              color: '#0d6efd'
                            }}
                          >
                            {item.quantity}
                          </div>
                          <button
                            className="btn btn-outline-primary"
                            type="button"
                            onClick={() => handleQuantityChange(index, 1)}
                            style={{ 
                              borderRadius: '0 8px 8px 0',
                              borderLeft: 'none',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-plus fw-bold"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-1">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeFromCart(index)}
                        title={currentLanguage === 'swedish' ? 'Ta bort' : 'Remove'}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-12 text-end">
                      <strong className="text-primary">
                        {currentLanguage === 'swedish' ? 'Subtotal:' : 'Subtotal:'} {item.totalPrice} SEK
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {currentLanguage === 'swedish' ? 'Ordersammanfattning' : 'Order Summary'}
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3">
                <span>{currentLanguage === 'swedish' ? 'Artiklar:' : 'Items:'}</span>
                <span>{cartItems.length}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>{currentLanguage === 'swedish' ? 'Totalt antal:' : 'Total Quantity:'}</span>
                <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <h5>{currentLanguage === 'swedish' ? 'Totalt:' : 'Total:'}</h5>
                <h5 className="text-primary">{totalPrice} SEK</h5>
              </div>
              
              <button 
                className="btn btn-primary w-100 btn-lg"
                onClick={handleCheckout}
              >
                <i className="bi bi-credit-card me-2"></i>
                {currentLanguage === 'swedish' ? 'Gå till kassan' : 'Proceed to Checkout'}
              </button>
              
              <button 
                className="btn btn-outline-secondary w-100 mt-2"
                onClick={handleContinueShopping}
              >
                {currentLanguage === 'swedish' ? 'Fortsätt handla' : 'Continue Shopping'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
