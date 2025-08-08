import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useOrder } from '@/contexts/OrderContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { db } from "@/firebase/config";
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from '@/contexts/AuthContext'; // Adjust path if needed
import '@/styles/theme.css';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const { refreshOrderStatus } = useOrder();
  const { notifyOrderReceived, notifyNewOrder } = useNotification();
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth(); // Fix: use currentUser instead of user
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

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

  // Coupon validation function
  const validateCoupon = async (code) => {
    setCouponLoading(true);
    setCouponError('');

    try {
      // Query campaigns with the coupon code
      const campaignQuery = query(
        collection(db, "campaigns"),
        where("couponCode", "==", code.toUpperCase())
      );
      
      const querySnapshot = await getDocs(campaignQuery);
      
      if (querySnapshot.empty) {
        setCouponError(currentLanguage === 'swedish' 
          ? 'Ogiltig kupongkod' 
          : 'Invalid coupon code');
        return false;
      }

      const campaignDoc = querySnapshot.docs[0];
      const campaign = { id: campaignDoc.id, ...campaignDoc.data() };

      // Check if campaign is active
      const now = new Date();
      const startDate = campaign.campainStartDate ? new Date(campaign.campainStartDate) : null;
      const endDate = campaign.campainEndDate ? new Date(campaign.campainEndDate) : null;

      const isActive = (!startDate || startDate <= now) && (!endDate || endDate >= now);

      if (!isActive) {
        setCouponError(currentLanguage === 'swedish' 
          ? 'Denna kupong har gått ut eller är inte aktiv än' 
          : 'This coupon has expired or is not active yet');
        return false;
      }

      // Check minimum order amount
      const currentTotal = parseFloat(totalPrice);
      const minimumOrder = campaign.minimumOrderAmount || 0;
      
      if (currentTotal < minimumOrder) {
        setCouponError(currentLanguage === 'swedish' 
          ? `Minsta beställningsvärde är ${minimumOrder} SEK för denna kupong` 
          : `Minimum order value is ${minimumOrder} SEK for this coupon`);
        return false;
      }

      // Check if any cart items are eligible for discount (only for item-specific discounts)
      if (campaign.eligibleDishes && campaign.eligibleDishes.length > 0) {
        const eligibleItems = cartItems.filter(item => 
          campaign.eligibleDishes.includes(item.id)
        );

        if (eligibleItems.length === 0) {
          setCouponError(currentLanguage === 'swedish' 
            ? 'Denna kupong är inte giltig för artiklar i din varukorg' 
            : 'This coupon is not valid for items in your cart');
          return false;
        }
      }

      // Check user usage limits
      if (currentUser && campaign.maxUsagesPerUser > 0) {
        const usageQuery = query(
          collection(db, "couponUsage"),
          where("userId", "==", currentUser.uid),
          where("couponCode", "==", code.toUpperCase())
        );
        
        const usageSnapshot = await getDocs(usageQuery);
        let currentUsage = 0;
        
        usageSnapshot.forEach(doc => {
          currentUsage += doc.data().usageCount || 1;
        });

        if (currentUsage >= campaign.maxUsagesPerUser) {
          setCouponError(currentLanguage === 'swedish' 
            ? `Du har redan använt denna kupong maximalt antal gånger (${campaign.maxUsagesPerUser})` 
            : `You have already used this coupon the maximum number of times (${campaign.maxUsagesPerUser})`);
          return false;
        }
      }

      setAppliedCoupon(campaign);
      return true;
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError(currentLanguage === 'swedish' 
        ? 'Fel vid validering av kupong' 
        : 'Error validating coupon');
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(currentLanguage === 'swedish' 
        ? 'Vänligen ange en kupongkod' 
        : 'Please enter a coupon code');
      return;
    }

    const isValid = await validateCoupon(couponCode.trim());
    if (isValid) {
      setCouponCode('');
      setCouponError('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Calculate discounted price for an item
  const getDiscountedPrice = (item) => {
    if (!appliedCoupon) {
      return {
        originalPrice: parseFloat(item.selectedPrice),
        discountedPrice: parseFloat(item.selectedPrice),
        discount: 0
      };
    }

    const originalPrice = parseFloat(item.selectedPrice);
    
    // For item-specific coupons, check if this item is eligible
    if (appliedCoupon.eligibleDishes && appliedCoupon.eligibleDishes.length > 0) {
      if (!appliedCoupon.eligibleDishes.includes(item.id)) {
        return {
          originalPrice,
          discountedPrice: originalPrice,
          discount: 0
        };
      }
    }

    // Apply discount based on type
    let discountAmount = 0;
    
    if (appliedCoupon.discountType === 'fixed') {
      // For fixed amount, distribute across eligible items proportionally
      const eligibleItems = cartItems.filter(cartItem => 
        !appliedCoupon.eligibleDishes || 
        appliedCoupon.eligibleDishes.length === 0 || 
        appliedCoupon.eligibleDishes.includes(cartItem.id)
      );
      
      const totalEligibleValue = eligibleItems.reduce((sum, cartItem) => 
        sum + (parseFloat(cartItem.selectedPrice) * cartItem.quantity), 0
      );
      
      const itemValueProportion = (originalPrice * item.quantity) / totalEligibleValue;
      const totalFixedDiscount = Math.min(
        appliedCoupon.discountFixedAmount || 0, 
        totalEligibleValue
      );
      
      discountAmount = (totalFixedDiscount * itemValueProportion) / item.quantity;
    } else {
      // Percentage discount
      const discountPercentage = appliedCoupon.discountPercentage || 0;
      discountAmount = originalPrice * (discountPercentage / 100);
    }

    const discountedPrice = Math.max(0, originalPrice - discountAmount);

    return {
      originalPrice,
      discountedPrice,
      discount: discountAmount
    };
  };

  // Calculate total with discounts
  const calculateTotalWithDiscounts = () => {
    let total = 0;
    let totalDiscount = 0;

    cartItems.forEach(item => {
      const { discountedPrice, discount } = getDiscountedPrice(item);
      total += discountedPrice * item.quantity;
      totalDiscount += discount * item.quantity;
    });

    return {
      total: total.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      originalTotal: totalPrice
    };
  };

  const totals = calculateTotalWithDiscounts();

  // Effect to validate coupon when cart changes
  useEffect(() => {
    if (appliedCoupon && cartItems.length > 0) {
      // Check minimum order amount
      const currentTotal = parseFloat(totalPrice);
      const minimumOrder = appliedCoupon.minimumOrderAmount || 0;
      
      if (currentTotal < minimumOrder) {
        // Remove coupon if minimum order is not met
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError(currentLanguage === 'swedish' 
          ? `Kupong borttagen: Minsta beställningsvärde är ${minimumOrder} SEK` 
          : `Coupon removed: Minimum order value is ${minimumOrder} SEK`);
        return;
      }

      // Check if any cart items are still eligible for discount (only for item-specific discounts)
      if (appliedCoupon.eligibleDishes && appliedCoupon.eligibleDishes.length > 0) {
        const eligibleItems = cartItems.filter(item => 
          appliedCoupon.eligibleDishes.includes(item.id)
        );

        if (eligibleItems.length === 0) {
          // Remove coupon if no eligible items remain
          setAppliedCoupon(null);
          setCouponCode('');
          setCouponError(currentLanguage === 'swedish' 
            ? 'Kupong borttagen: Inga giltiga artiklar kvar i varukorgen' 
            : 'Coupon removed: No eligible items left in cart');
        }
      }
    }
  }, [cartItems, totalPrice, appliedCoupon, currentLanguage]);

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
    
    setShowServiceModal(true);
  };

  const handleServiceSelection = (serviceType) => {
    setSelectedService(serviceType);
    setShowServiceModal(false);
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

    // Proceed with order
    try {
      // Get user email with proper fallback
      const userEmail = currentUser?.email || 'guest@example.com';
      const userName = currentUser?.displayName || currentUser?.email || 'Guest User';
      
      // Calculate final totals with discounts
      const finalTotals = calculateTotalWithDiscounts();
      
      const orderData = {
        userId: currentUser.uid, // Add userId field for querying
        items: cartItems.map(item => ({
          ...item,
          appliedDiscount: appliedCoupon && appliedCoupon.eligibleDishes?.includes(item.id) 
            ? getDiscountedPrice(item) 
            : null
        })),
        originalTotal: totalPrice,
        finalTotal: finalTotals.total,
        totalDiscount: finalTotals.totalDiscount,
        appliedCoupon: appliedCoupon ? {
          id: appliedCoupon.id,
          code: appliedCoupon.couponCode,
          title: appliedCoupon.title,
          discountType: appliedCoupon.discountType,
          discountPercentage: appliedCoupon.discountPercentage,
          discountFixedAmount: appliedCoupon.discountFixedAmount,
          minimumOrderAmount: appliedCoupon.minimumOrderAmount,
          eligibleDishes: appliedCoupon.eligibleDishes
        } : null,
        serviceType: selectedService, // Add service type (dine_in or home_delivery)
        paymentMethod: paymentMethod === 'cash' ? 'cash_on_delivery' : paymentMethod,
        createdAt: Timestamp.now(),
        userEmail: userEmail,
        userName: userName,
        status: 'pending' // Add default status
      };
      
      console.log("CurrentUser :==>", currentUser);
      console.log("Order data :==>", orderData);
      
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Order saved with ID:", docRef.id);
      
      // Create order object with ID for notifications
      const savedOrder = {
        id: docRef.id,
        ...orderData
      };
      
      // Send notifications
      // Customer notification (to the user who placed the order)
      notifyOrderReceived(savedOrder, currentLanguage);
      
      // Admin notifications will be handled automatically by the real-time listener
      // No need to manually send them since admins are listening to the orders collection
      
      // Track coupon usage if a coupon was applied
      if (appliedCoupon && currentUser) {
        try {
          // Check if user already has a usage record for this coupon
          const usageQuery = query(
            collection(db, "couponUsage"),
            where("userId", "==", currentUser.uid),
            where("couponCode", "==", appliedCoupon.couponCode)
          );
          
          const existingUsage = await getDocs(usageQuery);
          
          if (!existingUsage.empty) {
            // Update existing usage count
            const usageDoc = existingUsage.docs[0];
            await updateDoc(doc(db, "couponUsage", usageDoc.id), {
              usageCount: increment(1),
              lastUsed: Timestamp.now()
            });
          } else {
            // Create new usage record
            await addDoc(collection(db, "couponUsage"), {
              userId: currentUser.uid,
              couponCode: appliedCoupon.couponCode,
              campaignId: appliedCoupon.id,
              usageCount: 1,
              firstUsed: Timestamp.now(),
              lastUsed: Timestamp.now()
            });
          }
        } catch (usageError) {
          console.error('Error tracking coupon usage:', usageError);
          // Don't fail the order if usage tracking fails
        }
      }
      
      clearCart();
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
      setSelectedService('');
      
      // Refresh order status to show Orders tab in navbar
      refreshOrderStatus();
      
      // Navigate to dashboard with orders page to show navbar and orders
      navigate('/dashboard?page=orders');
    } catch (error) {
      const errorMessage = selectedService === 'dine_in' 
        ? (currentLanguage === 'swedish' 
          ? 'Det gick inte att spara beställningen för restaurangen.' 
          : 'Failed to save restaurant order.')
        : selectedService === 'takeout'
        ? (currentLanguage === 'swedish' 
          ? 'Det gick inte att spara avhämtningsbeställningen.' 
          : 'Failed to save takeout order.')
        : (currentLanguage === 'swedish' 
          ? 'Det gick inte att spara leveransbeställningen.' 
          : 'Failed to save delivery order.');
      alert(errorMessage);
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
              onClick={() => {
                clearCart();
                setAppliedCoupon(null);
                setCouponCode('');
                setCouponError('');
              }}
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
                        className="cart-item-image img-fluid rounded"
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
                      {(() => {
                        const { originalPrice, discountedPrice, discount } = getDiscountedPrice(item);
                        const hasDiscount = discount > 0;
                        
                        return (
                          <div className="text-end">
                            {hasDiscount ? (
                              <>
                                <div className="text-muted text-decoration-line-through small">
                                  {originalPrice} SEK
                                </div>
                                <div className="h6 text-success mb-0">
                                  {discountedPrice.toFixed(2)} SEK
                                </div>
                                <small className="text-success">
                                  -{discount.toFixed(2)} SEK
                                </small>
                              </>
                            ) : (
                              <span className="h6 text-primary">{originalPrice} SEK</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-md-3">
                      <div className="d-flex align-items-center justify-content-center">
                        <div className="input-group cart-quantity-group">
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
                      {(() => {
                        const { discountedPrice, discount } = getDiscountedPrice(item);
                        const itemTotal = (discountedPrice * item.quantity).toFixed(2);
                        const hasDiscount = discount > 0;
                        
                        return (
                          <div>
                            {hasDiscount && (
                              <div className="small text-muted text-decoration-line-through mb-1">
                                {currentLanguage === 'swedish' ? 'Ursprunglig subtotal:' : 'Original subtotal:'} {(parseFloat(item.selectedPrice) * item.quantity).toFixed(2)} SEK
                              </div>
                            )}
                            <strong className={hasDiscount ? "text-success" : "text-primary"}>
                              {currentLanguage === 'swedish' ? 'Subtotal:' : 'Subtotal:'} {itemTotal} SEK
                              {hasDiscount && (
                                <small className="ms-2 text-success">
                                  ({currentLanguage === 'swedish' ? 'Du sparar' : 'You save'} {(discount * item.quantity).toFixed(2)} SEK)
                                </small>
                              )}
                            </strong>
                          </div>
                        );
                      })()}
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
              
              {/* Coupon Section */}
              <div className="mb-4">
                <h6 className="mb-3">
                  {currentLanguage === 'swedish' ? 'Kupongkod' : 'Coupon Code'}
                </h6>
                
                {appliedCoupon ? (
                  <Alert variant="success" className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-check-circle me-2"></i>
                        <strong>{appliedCoupon.couponCode}</strong>
                        <div className="small text-success">
                          {currentLanguage === 'swedish' 
                            ? `Kupong tillämpad: ${appliedCoupon.title?.swedish || appliedCoupon.title?.english || 'Discount'}` 
                            : `Coupon applied: ${appliedCoupon.title?.english || appliedCoupon.title?.swedish || 'Discount'}`}
                        </div>
                        <div className="small text-muted">
                          {appliedCoupon.discountType === 'percentage' 
                            ? `${appliedCoupon.discountPercentage}% ${currentLanguage === 'swedish' ? 'rabatt' : 'discount'}`
                            : `${appliedCoupon.discountFixedAmount} SEK ${currentLanguage === 'swedish' ? 'rabatt' : 'discount'}`}
                          {appliedCoupon.minimumOrderAmount > 0 && (
                            <span className="ms-2">
                              (Min: {appliedCoupon.minimumOrderAmount} SEK)
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        title={currentLanguage === 'swedish' ? 'Ta bort kupong' : 'Remove coupon'}
                      >
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <div className="input-group mb-2">
                    <Form.Control
                      type="text"
                      placeholder={currentLanguage === 'swedish' ? 'Ange kupongkod' : 'Enter coupon code'}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      disabled={couponLoading}
                    />
                    <Button 
                      variant="outline-primary"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? (
                        <i className="bi bi-hourglass-split"></i>
                      ) : (
                        currentLanguage === 'swedish' ? 'Använd' : 'Apply'
                      )}
                    </Button>
                  </div>
                )}
                
                {couponError && (
                  <Alert variant="danger" className="p-2 mt-2">
                    <small>{couponError}</small>
                  </Alert>
                )}
              </div>
              
              {/* Price Summary */}
              {parseFloat(totals.totalDiscount) > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-2">
                    <span>{currentLanguage === 'swedish' ? 'Subtotal:' : 'Subtotal:'}</span>
                    <span>{totals.originalTotal} SEK</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3 text-success">
                    <span>{currentLanguage === 'swedish' ? 'Kupongrabatt:' : 'Coupon Discount:'}</span>
                    <span>-{totals.totalDiscount} SEK</span>
                  </div>
                </>
              )}
              
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <h5>{currentLanguage === 'swedish' ? 'Totalt:' : 'Total:'}</h5>
                <h5 className={parseFloat(totals.totalDiscount) > 0 ? "text-success" : "text-primary"}>
                  {totals.total} SEK
                  {parseFloat(totals.totalDiscount) > 0 && (
                    <div className="small text-muted">
                      {currentLanguage === 'swedish' ? 'Du sparar' : 'You save'} {totals.totalDiscount} SEK
                    </div>
                  )}
                </h5>
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

      {/* Service Type Selection Modal */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentLanguage === 'swedish' ? 'Välj servicealternativ' : 'Choose Service Option'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4">
            {currentLanguage === 'swedish' 
              ? 'Hur vill du få din beställning?' 
              : 'How would you like to receive your order?'}
          </p>
          <div className="d-grid gap-3">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => handleServiceSelection('dine_in')}
              className="d-flex align-items-center justify-content-center p-3"
            >
              <i className="bi bi-shop me-3" style={{ fontSize: '1.5rem' }}></i>
              <div className="text-start">
                <div className="fw-bold">
                  {currentLanguage === 'swedish' ? 'Äta på plats' : 'Dine In'}
                </div>
                <small className="text-muted">
                  {currentLanguage === 'swedish' 
                    ? 'Ät din måltid på restaurangen' 
                    : 'Enjoy your meal at the restaurant'}
                </small>
              </div>
            </Button>
            <Button 
              variant="outline-success" 
              size="lg"
              onClick={() => handleServiceSelection('takeout')}
              className="d-flex align-items-center justify-content-center p-3"
            >
              <i className="bi bi-bag me-3" style={{ fontSize: '1.5rem' }}></i>
              <div className="text-start">
                <div className="fw-bold">
                  {currentLanguage === 'swedish' ? 'Avhämtning' : 'Takeout'}
                </div>
                <small className="text-muted">
                  {currentLanguage === 'swedish' 
                    ? 'Hämta din beställning på restaurangen' 
                    : 'Pick up your order from the restaurant'}
                </small>
              </div>
            </Button>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => handleServiceSelection('home_delivery')}
              className="d-flex align-items-center justify-content-center p-3"
            >
              <i className="bi bi-truck me-3" style={{ fontSize: '1.5rem' }}></i>
              <div className="text-start">
                <div className="fw-bold">
                  {currentLanguage === 'swedish' ? 'Hemleverans' : 'Home Delivery'}
                </div>
                <small className="text-white-50">
                  {currentLanguage === 'swedish' 
                    ? 'Vi levererar till din dörr' 
                    : 'We deliver to your door'}
                </small>
              </div>
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowServiceModal(false)}>
            {currentLanguage === 'swedish' ? 'Avbryt' : 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Method Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentLanguage === 'swedish' ? 'Välj betalningsmetod' : 'Choose Payment Method'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedService && (
            <Alert variant="info" className="mb-3">
              <i className={`bi ${
                selectedService === 'dine_in' ? 'bi-shop' : 
                selectedService === 'takeout' ? 'bi-bag' : 
                'bi-truck'
              } me-2`}></i>
              <strong>
                {selectedService === 'dine_in' 
                  ? (currentLanguage === 'swedish' ? 'Äta på plats' : 'Dine In')
                  : selectedService === 'takeout'
                  ? (currentLanguage === 'swedish' ? 'Avhämtning' : 'Takeout')
                  : (currentLanguage === 'swedish' ? 'Hemleverans' : 'Home Delivery')
                }
              </strong>
            </Alert>
          )}
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
              {selectedService === 'dine_in' 
                ? (currentLanguage === 'swedish' ? 'Betala på plats' : 'Pay at Restaurant')
                : selectedService === 'takeout'
                ? (currentLanguage === 'swedish' ? 'Betala vid avhämtning' : 'Pay on Pickup')
                : (currentLanguage === 'swedish' ? 'Kontant vid leverans' : 'Cash on Delivery')
              }
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowPaymentModal(false);
              setShowServiceModal(true);
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            {currentLanguage === 'swedish' ? 'Tillbaka' : 'Back'}
          </Button>
          <Button variant="secondary" onClick={() => {
            setShowPaymentModal(false);
            setSelectedService('');
          }}>
            {currentLanguage === 'swedish' ? 'Avbryt' : 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cart;
