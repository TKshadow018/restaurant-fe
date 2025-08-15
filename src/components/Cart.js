import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useOrder } from '@/contexts/OrderContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { db } from "@/firebase/config";
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from '@/contexts/AuthContext'; // Adjust path if needed
import '@/styles/theme.css';
import '../styles/Cart.css';
import '../styles/Delivery.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const { refreshOrderStatus } = useOrder();
  const { notifyOrderReceived } = useNotification();
  const { isDeliveryEnabled } = useDelivery();
  const { t, i18n } = useTranslation();
  const { currentUser, userProfile } = useAuth(); // Fix: get both currentUser and userProfile
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    region: '',
    phoneNumber: ''
  });
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDisabled, setCouponDisabled] = useState(false); // New state for disabled coupons
  const [couponDisabledReason, setCouponDisabledReason] = useState(''); // Reason for disabled state

  // Debug user state
  console.log("Auth currentUser state:", currentUser);
  console.log("Auth userProfile state:", userProfile);
  console.log("UserProfile type:", typeof userProfile);
  console.log("UserProfile keys:", userProfile ? Object.keys(userProfile) : 'No userProfile object');
  
  // Debug address fields specifically
  if (userProfile) {
    console.log("Full userProfile object:", userProfile);
    console.log("Address fields debug from userProfile:", {
      street: userProfile.street,
      houseNumber: userProfile.houseNumber,
      postalCode: userProfile.postalCode,
      city: userProfile.city,
      region: userProfile.region,
      address: userProfile.address // Check if address is nested
    });
    
    // Also check if it's stored under a different property name
    console.log("All userProfile properties:", Object.keys(userProfile));
    console.log("Looking for address-like properties:", Object.keys(userProfile).filter(key => 
      key.toLowerCase().includes('address') || 
      key.toLowerCase().includes('street') || 
      key.toLowerCase().includes('city') ||
      key.toLowerCase().includes('postal')
    ));
  }

  // Helper function to get localized text
  const getLocalizedText = (textObj, fallback = 'Unnamed Item') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[currentLanguage] || textObj.english || textObj.swedish || fallback;
  };

  // Helper function to format volume display names
  const formatVolumeName = (volume) => {
    return t(`volume.${volume}`, volume);
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
        setCouponError(t('cart.coupon.invalid'));
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
        setCouponError(t('cart.coupon.expired'));
        return false;
      }

      // Check time restrictions if enabled
      if (campaign.hasTimeRestriction) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.

        // Parse start and end times
        const [startHour, startMin] = campaign.startTime.split(':').map(Number);
        const [endHour, endMin] = campaign.endTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;

        // Check if current day is allowed
        if (!campaign.daysOfWeek.includes(currentDay)) {
          const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const allowedDays = campaign.daysOfWeek
            .sort((a, b) => a - b)
            .map(d => daysNames[d])
            .join(', ');
          setCouponError(t('cart.coupon.invalidDay', { days: allowedDays }) || `This coupon is only valid on: ${allowedDays}`);
          return false;
        }

        // Check if current time is within allowed range
        const isTimeValid = (endTimeMinutes > startTimeMinutes) 
          ? (currentTime >= startTimeMinutes && currentTime <= endTimeMinutes)
          : (currentTime >= startTimeMinutes || currentTime <= endTimeMinutes); // Handle overnight spans

        if (!isTimeValid) {
          setCouponError(t('cart.coupon.invalidTime', { 
            startTime: campaign.startTime, 
            endTime: campaign.endTime 
          }) || `This coupon is only valid between ${campaign.startTime} and ${campaign.endTime}`);
          return false;
        }
      }

      // Check minimum order amount
      const currentTotal = parseFloat(totalPrice);
      const minimumOrder = campaign.minimumOrderAmount || 0;
      
      if (currentTotal < minimumOrder) {
        setCouponError(t('cart.coupon.minimumOrder', { amount: minimumOrder }));
        return false;
      }

      // Check if any cart items are eligible for discount (only for item-specific discounts)
      if (campaign.eligibleDishes && campaign.eligibleDishes.length > 0) {
        const eligibleItems = cartItems.filter(item => 
          campaign.eligibleDishes.includes(item.id)
        );

        if (eligibleItems.length === 0) {
          setCouponError(t('cart.coupon.notEligible'));
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
          setCouponError(t('cart.coupon.maxUsages', { max: campaign.maxUsagesPerUser }));
          return false;
        }
      }

      setAppliedCoupon(campaign);
      return true;
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError(t('cart.coupon.validationError'));
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  // Validate coupon for auto-apply (skips minimum order check)
  const validateCouponForAutoApply = useCallback(async (code) => {
    try {
      // Query campaigns with the coupon code
      const campaignQuery = query(
        collection(db, "campaigns"),
        where("couponCode", "==", code.toUpperCase())
      );
      
      const querySnapshot = await getDocs(campaignQuery);
      
      if (querySnapshot.empty) {
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
        return false;
      }

      // Check time restrictions if enabled
      if (campaign.hasTimeRestriction) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.

        // Parse start and end times
        const [startHour, startMin] = campaign.startTime.split(':').map(Number);
        const [endHour, endMin] = campaign.endTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;

        // Check if current day is allowed
        if (!campaign.daysOfWeek.includes(currentDay)) {
          return false;
        }

        // Check if current time is within allowed range
        const isTimeValid = (endTimeMinutes > startTimeMinutes) 
          ? (currentTime >= startTimeMinutes && currentTime <= endTimeMinutes)
          : (currentTime >= startTimeMinutes || currentTime <= endTimeMinutes); // Handle overnight spans

        if (!isTimeValid) {
          return false;
        }
      }

      // Skip minimum order amount check for auto-apply

      // Check if any cart items are eligible for discount (only for item-specific discounts)
      if (campaign.eligibleDishes && campaign.eligibleDishes.length > 0) {
        const eligibleItems = cartItems.filter(item => 
          campaign.eligibleDishes.includes(item.id)
        );

        if (eligibleItems.length === 0) {
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
          return false;
        }
      }

      setAppliedCoupon(campaign);
      return true;
    } catch (error) {
      console.error('Error validating coupon for auto-apply:', error);
      return false;
    }
  }, [cartItems, currentUser]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(t('cart.coupon.enterCode'));
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
    if (!appliedCoupon || couponDisabled) {
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
        // Disable coupon instead of removing it
        setCouponDisabled(true);
        const remaining = (minimumOrder - currentTotal).toFixed(2);
        setCouponDisabledReason(t('cart.coupon.minimumNotMet', { 
          current: currentTotal.toFixed(2), 
          required: remaining 
        }));
        setCouponError('');
      } else {
        setCouponDisabled(false);
        setCouponDisabledReason('');
      }

      // Check if any cart items are still eligible for discount (only for item-specific discounts)
      if (appliedCoupon.eligibleDishes && appliedCoupon.eligibleDishes.length > 0) {
        const eligibleItems = cartItems.filter(item => 
          appliedCoupon.eligibleDishes.includes(item.id)
        );

        if (eligibleItems.length === 0) {
          // Disable coupon if no eligible items remain
          setCouponDisabled(true);
          setCouponDisabledReason(t('cart.coupon.noEligibleItems'));
          setCouponError('');
        }
      }
    } else if (appliedCoupon && cartItems.length === 0) {
      // Reset states when cart is empty
      setCouponDisabled(false);
      setCouponDisabledReason('');
    }
  }, [cartItems, totalPrice, appliedCoupon, currentLanguage, t]);

  // Auto-apply campaign effect
  useEffect(() => {
    const autoApplyCampaign = async () => {
      // Don't auto-apply if there's already a coupon applied or no items in cart
      if (appliedCoupon || cartItems.length === 0) {
        return;
      }

      try {
        const autoApplyData = localStorage.getItem('autoApplyCampaign');
        if (!autoApplyData) {
          return;
        }

        const campaign = JSON.parse(autoApplyData);
        
        // Validate the campaign is still active and valid (but skip minimum order check)
        const isValid = await validateCouponForAutoApply(campaign.couponCode);
        if (isValid) {
          setCouponCode(campaign.couponCode);
          // Don't show success message for auto-apply to avoid spam
        }
      } catch (error) {
        console.error('Error auto-applying campaign:', error);
      }
    };

    autoApplyCampaign();
  }, [cartItems.length, appliedCoupon, validateCouponForAutoApply]); // Run when cart items change (especially from 0 to some items)

  const handleQuantityChange = (index, change) => {
    const currentQuantity = cartItems[index].quantity;
    const newQuantity = currentQuantity + change;
    updateQuantity(index, newQuantity);
  };

  const handleCheckout = async () => {
    // Check if user is logged in
    if (!currentUser) {
      alert(t('cart.checkout.loginRequired'));
      navigate('/login'); // Redirect to login page
      return;
    }
    
    setShowServiceModal(true);
  };

  const handleServiceSelection = (serviceType) => {
    setSelectedService(serviceType);
    setShowServiceModal(false);
    
    // If home delivery is selected, show address modal (keep existing states)
    if (serviceType === 'home_delivery') {
      setShowAddressModal(true);
    } else {
      // For dine-in and takeout, go directly to payment
      setShowPaymentModal(true);
    }
  };

  const handleAddressFieldChange = (field, value) => {
    // If user starts typing in custom address, deselect profile address
    if (useProfileAddress) {
      setUseProfileAddress(false);
    }
    
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isAddressComplete = () => {
    // If user chose to use profile address, that's always complete
    if (useProfileAddress) return true;
    
    // Otherwise check if custom address is complete
    return deliveryAddress.street.trim() && 
           deliveryAddress.houseNumber.trim() && 
           deliveryAddress.postalCode.trim() && 
           deliveryAddress.city.trim() &&
           deliveryAddress.phoneNumber.trim();
  };

  const handleAddressConfirm = () => {
    setShowAddressModal(false);
    setShowPaymentModal(true);
  };

  const handleUseProfileAddress = () => {
    // Check if profile address is complete - handle nested address structure
    const street = userProfile?.address?.street || userProfile?.street || '';
    const houseNumber = userProfile?.address?.houseNumber || userProfile?.houseNumber || '';
    const postalCode = userProfile?.address?.postalCode || userProfile?.postalCode || '';
    const city = userProfile?.address?.city || userProfile?.city || '';
    
    console.log("Address validation debug:", {
      street,
      houseNumber,
      postalCode,
      city,
      addressObject: userProfile?.address,
      flatStructure: {
        street: userProfile?.street,
        houseNumber: userProfile?.houseNumber,
        postalCode: userProfile?.postalCode,
        city: userProfile?.city
      }
    });
    
    if (!street || !houseNumber || !postalCode || !city) {
      alert(t('delivery.incompleteProfileAddress', 'Please complete your address information in your profile first.'));
      return;
    }
    
    setUseProfileAddress(true);
    // Clear custom address when profile address is selected
    setDeliveryAddress({
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      region: '',
      phoneNumber: ''
    });
  };

  const handlePaymentMethod = async (paymentMethod) => {
    setShowPaymentModal(false);
    
    if (paymentMethod === 'online') {
      alert(t('cart.checkout.onlineNotAvailable'));
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
        serviceType: selectedService, // Add service type (dine_in, takeout, or home_delivery)
        paymentMethod: paymentMethod === 'cash' ? 'cash_on_delivery' : paymentMethod,
        deliveryAddress: selectedService === 'home_delivery' ? {
          useProfileAddress: useProfileAddress,
          customAddress: useProfileAddress ? null : deliveryAddress,
          userProfileAddress: useProfileAddress ? {
            street: userProfile?.street || userProfile?.address?.street || '',
            houseNumber: userProfile?.houseNumber || userProfile?.address?.houseNumber || '',
            postalCode: userProfile?.postalCode || userProfile?.address?.postalCode || '',
            city: userProfile?.city || userProfile?.address?.city || '',
            region: userProfile?.region || userProfile?.address?.region || ''
          } : null
        } : null,
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
      setDeliveryAddress({
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        region: '',
        phoneNumber: ''
      });
      setUseProfileAddress(false);
      
      // Refresh order status to show Orders tab in navbar
      refreshOrderStatus();
      
      // Navigate to dashboard with orders page to show navbar and orders
      navigate('/dashboard?page=orders');
    } catch (error) {
      const errorMessage = selectedService === 'dine_in' 
        ? t('cart.checkout.orderFailedDineIn')
        : selectedService === 'takeout'
        ? t('cart.checkout.orderFailedTakeout')
        : t('cart.checkout.orderFailedDelivery');
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
                {t('cart.empty')}
              </h2>
              <p className="text-muted mb-4">
                {t('cart.emptyHint')}
              </p>
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleContinueShopping}
              >
                {t('cart.continueShopping')}
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
              {t('cart.title')}
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
              {t('cart.clearCart')}
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
                          {t('menu.modal.size')} {formatVolumeName(item.selectedVolume)}
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
                        title={t('common.close')}
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
                                {t('cart.originalSubtotal')} {(parseFloat(item.selectedPrice) * item.quantity).toFixed(2)} SEK
                              </div>
                            )}
                            <strong className={hasDiscount ? "text-success" : "text-primary"}>
                              {t('cart.subtotal')} {itemTotal} SEK
                              {hasDiscount && (
                                <small className="ms-2 text-success">
                                  ({t('cart.youSave')} {(discount * item.quantity).toFixed(2)} SEK)
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
                {t('cart.orderSummary')}
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3">
                <span>{t('cart.items')}</span>
                <span>{cartItems.length}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>{t('cart.totalQuantity')}</span>
                <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
              </div>
              
              {/* Coupon Section */}
              <div className="mb-4">
                <h6 className="mb-3">
                  {t('cart.coupon.title')}
                </h6>
                
                {appliedCoupon ? (
                  <Alert variant={couponDisabled ? "light" : "warning"} className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className={`bi ${couponDisabled ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
                        <strong>{appliedCoupon.couponCode}</strong>
                        {couponDisabled && (
                          <span className="badge bg-warning text-dark ms-2">
                            {t('cart.coupon.notApplicableYet', 'Not Applicable Yet')}
                          </span>
                        )}
                        <div className={`small ${couponDisabled ? 'text-muted' : 'text-success'}`}>
                          {couponDisabled 
                            ? couponDisabledReason
                            : `${t('cart.coupon.applied')} ${getLocalizedText(appliedCoupon.title, 'Discount')}`
                          }
                        </div>
                        <div className="small text-muted">
                          {appliedCoupon.discountType === 'percentage' 
                            ? `${appliedCoupon.discountPercentage}% ${t('orders.discount')}`
                            : `${appliedCoupon.discountFixedAmount} SEK ${t('orders.discount')}`}
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
                        title={t('cart.coupon.remove')}
                      >
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <div className="input-group mb-2">
                    <Form.Control
                      type="text"
                      placeholder={t('cart.coupon.placeholder')}
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
                        t('cart.coupon.apply')
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
                    <span>{t('cart.subtotal')}</span>
                    <span>{totals.originalTotal} SEK</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3 text-success">
                    <span>{t('cart.coupon.discount')}</span>
                    <span>-{totals.totalDiscount} SEK</span>
                  </div>
                </>
              )}
              
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <h5>{t('cart.total')}</h5>
                <h5 className={parseFloat(totals.totalDiscount) > 0 ? "text-success" : "text-primary"}>
                  {totals.total} SEK
                  {parseFloat(totals.totalDiscount) > 0 && (
                    <div className="small text-muted">
                      {t('cart.youSave')} {totals.totalDiscount} SEK
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
                  ? t('cart.proceedToCheckout')
                  : t('cart.loginToOrder')
                }
              </button>
              
              <button 
                className="btn btn-outline-secondary w-100 mt-2"
                onClick={handleContinueShopping}
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Type Selection Modal */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {t('service.selectService')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4">
            {t('service.question')}
          </p>
          
          {/* Show delivery unavailable alert when disabled */}
          {!isDeliveryEnabled && (
            <Alert variant="warning" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {t('service.deliveryUnavailableMessage', 'Delivery service is currently unavailable. No delivery personnel available right now.')}
            </Alert>
          )}
          
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
                  {t('service.dineIn')}
                </div>
                <small className="text-muted">
                  {t('service.dineInDescription', 'Enjoy your meal at the restaurant')}
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
                  {t('service.takeout')}
                </div>
                <small className="text-muted">
                  {t('service.takeoutDescription', 'Pick up your order from the restaurant')}
                </small>
              </div>
            </Button>
            <Button 
              variant={isDeliveryEnabled ? "primary" : "secondary"} 
              size="lg"
              onClick={() => isDeliveryEnabled && handleServiceSelection('home_delivery')}
              disabled={!isDeliveryEnabled}
              className="d-flex align-items-center justify-content-center p-3"
            >
              <i className="bi bi-truck me-3" style={{ fontSize: '1.5rem' }}></i>
              <div className="text-start">
                <div className="fw-bold">
                  {t('service.homeDelivery')}
                </div>
                <small className={isDeliveryEnabled ? "text-white-50" : "text-muted"}>
                  {isDeliveryEnabled 
                    ? t('service.deliveryDescription', 'We deliver to your door')
                    : t('service.deliveryUnavailable', 'No delivery available right now')
                  }
                </small>
              </div>
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowServiceModal(false)}>
            {t('common.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Method Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {t('service.paymentMethod')}
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
                  ? t('service.dineIn')
                  : selectedService === 'takeout'
                  ? t('service.takeout')
                  : t('service.homeDelivery')
                }
              </strong>
            </Alert>
          )}
          <p className="mb-4">
            {t('service.paymentQuestion')}
          </p>
          <div className="d-grid gap-3">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => handlePaymentMethod('online')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-credit-card me-2"></i>
              {t('service.payOnline')}
            </Button>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => handlePaymentMethod('cash')}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-cash me-2"></i>
              {selectedService === 'dine_in' 
                ? t('service.payAtRestaurant', 'Pay at Restaurant')
                : selectedService === 'takeout'
                ? t('service.payOnPickup', 'Pay on Pickup')
                : t('service.cashOnDelivery')
              }
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowPaymentModal(false);
              if (selectedService === 'home_delivery') {
                setShowAddressModal(true);
              } else {
                setShowServiceModal(true);
              }
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            {t('common.back')}
          </Button>
          <Button variant="secondary" onClick={() => {
            setShowPaymentModal(false);
            setSelectedService('');
            setDeliveryAddress({
              street: '',
              houseNumber: '',
              postalCode: '',
              city: '',
              region: '',
              phoneNumber: ''
            });
            setUseProfileAddress(false);
          }}>
            {t('common.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Address Selection Modal for Home Delivery */}
      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered dialogClassName="delivery-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {t('delivery.selectAddress', 'Delivery Address')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4">
            {t('delivery.addressQuestion', 'Where should we deliver your order?')}
          </p>
          
          {/* Show profile address option if user is logged in */}
          {currentUser && userProfile && (
            <div className="mb-4">
              <div className={`card delivery-address-card ${useProfileAddress ? 'border-primary' : ''}`}>
                  <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-house-door me-2"></i>
                    {t('delivery.profileAddress', 'Your Profile Address')}
                    {useProfileAddress && (
                      <span className="badge bg-primary ms-2">
                        <i className="bi bi-check-circle me-1"></i>
                        Selected
                      </span>
                    )}
                  </h6>
                  {(() => {
                    const street = userProfile.address?.street || userProfile.street || '';
                    const houseNumber = userProfile.address?.houseNumber || userProfile.houseNumber || '';
                    const postalCode = userProfile.address?.postalCode || userProfile.postalCode || '';
                    const city = userProfile.address?.city || userProfile.city || '';
                    const region = userProfile.address?.region || userProfile.region || '';
                    
                    const hasCompleteAddress = street && houseNumber && postalCode && city;
                    
                    console.log("Address display debug:", {
                      street,
                      houseNumber,
                      postalCode,
                      city,
                      region,
                      hasCompleteAddress,
                      addressObject: userProfile.address
                    });
                    
                    return (
                      <>
                        <p className="card-text small text-muted mb-3">
                          {hasCompleteAddress ? (
                            <>
                              {street} {houseNumber}<br />
                              {postalCode} {city}
                              {region && <><br />{region}</>}
                            </>
                          ) : (
                            <span className="text-warning">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              {t('delivery.incompleteAddress', 'Address information is incomplete in your profile')}
                            </span>
                          )}
                        </p>
                        {!useProfileAddress ? (
                          <Button 
                            variant={hasCompleteAddress ? "primary" : "outline-warning"} 
                            onClick={handleUseProfileAddress}
                            className="w-100"
                            disabled={!hasCompleteAddress}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            {hasCompleteAddress 
                              ? t('delivery.useThisAddress', 'Use This Address')
                              : t('delivery.completeProfileFirst', 'Complete Profile Address First')
                            }
                          </Button>
                        ) : (
                          <Button 
                            variant="outline-primary" 
                            onClick={() => setUseProfileAddress(false)}
                            className="w-100"
                          >
                            <i className="bi bi-x-circle me-2"></i>
                            Deselect This Address
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {!useProfileAddress && (
                <div className="delivery-or-divider">
                  <span>{t('common.or', 'or')}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Custom address form - only show when profile address is not selected */}
          {!useProfileAddress && (
            <div className="delivery-custom-address">
              <h6 className="mb-3">
                <i className="bi bi-geo-alt me-2"></i>
                {t('delivery.customAddress', 'Enter Delivery Address')}
              </h6>
            
            {/* Street and House Number Row */}
            <div className="row mb-3">
              <div className="col-md-8">
                <Form.Label>{t('profile.street', 'Street Name')} *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('profile.streetPlaceholder', 'e.g., Kungsgatan')}
                  value={deliveryAddress.street}
                  onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <Form.Label>{t('profile.houseNumber', 'House Number')} *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="12A"
                  value={deliveryAddress.houseNumber}
                  onChange={(e) => handleAddressFieldChange('houseNumber', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Postal Code and City Row */}
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Label>{t('profile.postalCode', 'Postal Code')} *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="123 45"
                  value={deliveryAddress.postalCode}
                  onChange={(e) => handleAddressFieldChange('postalCode', e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div className="col-md-6">
                <Form.Label>{t('profile.city', 'City')} *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('profile.cityPlaceholder', 'e.g., Stockholm')}
                  value={deliveryAddress.city}
                  onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Region (Optional) */}
            <div className="mb-3">
              <Form.Label>{t('profile.region', 'Region/County')}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t('profile.regionPlaceholder', 'e.g., Stockholm County')}
                value={deliveryAddress.region}
                onChange={(e) => handleAddressFieldChange('region', e.target.value)}
              />
            </div>

            {/* Phone Number */}
            <div className="mb-3">
              <Form.Label>{t('profile.phoneNumber', 'Phone Number')} *</Form.Label>
              <Form.Control
                type="tel"
                placeholder={t('profile.phoneNumberPlaceholder', 'e.g., +46 70 123 45 67')}
                value={deliveryAddress.phoneNumber}
                onChange={(e) => handleAddressFieldChange('phoneNumber', e.target.value)}
                required
              />
            </div>

              <Form.Text className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                {t('delivery.requiredFieldsHint', 'Fields marked with * are required')}
              </Form.Text>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowAddressModal(false);
              setShowServiceModal(true);
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            {t('common.back', 'Back')}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddressConfirm}
            disabled={!isAddressComplete()}
          >
            <i className="bi bi-arrow-right me-2"></i>
            {t('delivery.continue', 'Continue to Payment')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cart;
