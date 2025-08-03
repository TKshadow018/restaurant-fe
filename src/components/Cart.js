import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'react-bootstrap';
import { db } from "@/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuth } from '@/contexts/AuthContext'; // Adjust path if needed
import '@/styles/theme.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const { i18n } = useTranslation();
  const { currentUser } = useAuth(); // Fix: use currentUser instead of user
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Debug user state
  console.log("Auth currentUser state:", currentUser);
  console.log("CurrentUser type:", typeof currentUser);
  console.log("CurrentUser keys:", currentUser ? Object.keys(currentUser) : 'No currentUser object');

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

  const handleCheckout = async () => {
    // Check if user is logged in
    if (!currentUser) {
      alert(currentLanguage === 'swedish' 
        ? 'Du måste logga in för att slutföra din beställning.' 
        : 'You must be logged in to complete your order.');
      navigate('/login'); // Redirect to login page
      return;
    }
    
    setShowPaymentModal(true);
  };

  const handlePaymentMethod = async (paymentMethod) => {
    setShowPaymentModal(false);
    
    if (paymentMethod === 'online') {
      alert(currentLanguage === 'swedish' 
        ? 'Online betalning är inte tillgänglig just nu. Vänligen välj kontant vid leverans.' 
        : 'Online payment is not available right now. Please choose cash on delivery.');
      return;
    }

    // Cash on delivery - proceed with order
    try {
      // Get user email with proper fallback
      const userEmail = currentUser?.email || 'guest@example.com';
      const userName = currentUser?.displayName || currentUser?.email || 'Guest User';
      
      const orderData = {
        items: cartItems,
        totalPrice,
        paymentMethod: 'cash_on_delivery',
        createdAt: Timestamp.now(),
        userEmail: userEmail,
        userName: userName,
        status: 'pending' // Add default status
      };
      
      console.log("CurrentUser :==>", currentUser);
      console.log("Order data :==>", orderData);
      
      await addDoc(collection(db, "orders"), orderData);
      clearCart();
      alert(currentLanguage === 'swedish' 
        ? 'Din beställning har sparats! Vi kommer att kontakta dig snart.' 
        : 'Your order has been saved! We will contact you soon.');
      // Optionally navigate to a confirmation page
      // navigate('/order-confirmation');
    } catch (error) {
      alert(currentLanguage === 'swedish' 
        ? 'Det gick inte att spara beställningen.' 
        : 'Failed to save order.');
      console.error("Error saving order:", error);
    }
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
                {currentUser 
                  ? (currentLanguage === 'swedish' ? 'Gå till kassan' : 'Proceed to Checkout')
                  : (currentLanguage === 'swedish' ? 'Logga in för att beställa' : 'Login to Order')
                }
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

      {/* Payment Method Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentLanguage === 'swedish' ? 'Välj betalningsmetod' : 'Choose Payment Method'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4">
            {currentLanguage === 'swedish' 
              ? 'Hur vill du betala för din beställning?' 
              : 'How would you like to pay for your order?'}
          </p>
          <div className="d-grid gap-3">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => handlePaymentMethod('online')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-credit-card me-2"></i>
              {currentLanguage === 'swedish' ? 'Betala online' : 'Pay Online'}
            </Button>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => handlePaymentMethod('cash')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-cash me-2"></i>
              {currentLanguage === 'swedish' ? 'Kontant vid leverans' : 'Cash on Delivery'}
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            {currentLanguage === 'swedish' ? 'Avbryt' : 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cart;
