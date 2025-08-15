import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Card, Badge, Spinner, Alert } from 'react-bootstrap';
import '@/styles/theme.css';

const Orders = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle order selection with smooth scroll to details
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    
    // Smooth scroll to order details section on smaller screens
    setTimeout(() => {
      const detailsSection = document.getElementById('order-details-section');
      if (detailsSection) {
        detailsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }
    }, 100); // Small delay to ensure state is updated
  };

  // Helper function to get localized text
  const getLocalizedText = (textObj, fallback = 'Unnamed Item') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[currentLanguage] || textObj.english || textObj.swedish || fallback;
  };

  // Fetch all orders for the current user
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) {
        setError(t('orders.errors.loginRequired'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching orders for user:', currentUser.uid);
        
        // Simplified query without orderBy to avoid index requirement
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid)
        );

        const querySnapshot = await getDocs(ordersQuery);
        console.log('Query snapshot size:', querySnapshot.size);
        
        if (!querySnapshot.empty) {
          // Get all orders and sort them by createdAt in JavaScript
          const allOrders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort by createdAt (newest first)
          allOrders.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
          });
          
          console.log('Found orders:', allOrders);
          
          // Convert Firestore timestamps to dates
          const processedOrders = allOrders.map(order => ({
            ...order,
            createdAt: order.createdAt?.toDate?.() ? order.createdAt.toDate() : new Date(order.createdAt)
          }));
          
          setOrders(processedOrders);
          setSelectedOrder(processedOrders[0]); // Select the latest order by default
          setError(null);
        } else {
          console.log('No orders found for user:', currentUser.uid);
          setError(t('orders.errors.notFound'));
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(t('orders.errors.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser, currentLanguage, t]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    return t(`orders.status.${status}`, status);
  };

  const getServiceTypeText = (serviceType) => {
    const serviceTypeMap = {
      dine_in: 'dineIn',
      takeout: 'takeout',
      home_delivery: 'homeDelivery'
    };
    const mappedType = serviceTypeMap[serviceType] || serviceType;
    return t(`orders.serviceType.${mappedType}`, serviceType);
  };

  const getServiceTypeIcon = (serviceType) => {
    const serviceIcons = {
      dine_in: 'bi-shop',
      takeout: 'bi-bag',
      home_delivery: 'bi-truck'
    };
    return serviceIcons[serviceType] || 'bi-question-circle';
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
    return new Intl.DateTimeFormat(i18n.language === 'sv' ? 'sv-SE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: i18n.language !== 'sv'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">
              {t('common.loading')}
            </span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <Alert variant="warning" className="text-center">
          <i className="bi bi-exclamation-triangle display-4 d-block mb-3"></i>
          <h4>{error}</h4>
          {!currentUser && (
            <p className="mb-0">
              {t('orders.errors.pleaseLogin')}
            </p>
          )}
        </Alert>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <i className="bi bi-receipt display-1 text-muted mb-4"></i>
          <h2 className="text-muted mb-3">
            {t('orders.noOrders')}
          </h2>
          <p className="text-muted">
            {t('orders.noOrdersHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        {/* Left side - Orders list */}
        <div className="col-lg-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 text-primary">
              {t('orders.title')}
            </h1>
            <Badge variant="primary" className="fs-6">
              {orders.length}
            </Badge>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {orders.map((order, index) => (
                <div 
                  key={order.id} 
                  className={`p-3 border-bottom cursor-pointer ${selectedOrder?.id === order.id ? 'bg-light border-primary border-3' : ''}`}
                  onClick={() => handleOrderSelect(order)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold">
                        {t('orders.order')} #{order.id.slice(-6)}
                      </h6>
                      <small className="text-muted d-block">
                        {formatDateTime(order.createdAt)}
                      </small>
                      <div className="mt-2">
                        <Badge bg={getStatusColor(order.status)} className="me-2">
                          {getStatusText(order.status)}
                        </Badge>
                        {order.serviceType && (
                          <Badge bg="info" className="me-2">
                            <i className={`${getServiceTypeIcon(order.serviceType)} me-1`}></i>
                            {getServiceTypeText(order.serviceType)}
                          </Badge>
                        )}
                        <small className="text-muted">
                          {order.items.length} {t('orders.items')}
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold text-primary">
                        {order.finalTotal || order.totalPrice} SEK
                      </div>
                      {parseFloat(order.totalDiscount || 0) > 0 && (
                        <small className="text-success">
                          -{order.totalDiscount} SEK
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Selected order details */}
        <div className="col-lg-8" id="order-details-section">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 text-primary">
              {t('orders.orderDetails')}
            </h1>
            <Badge bg={getStatusColor(selectedOrder.status)} className="fs-6">
              {getStatusText(selectedOrder.status)}
            </Badge>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <div className="row">
                <div className="col-md-6">
                  <h5 className="mb-1">
                    {t('orders.order')} #{selectedOrder.id}
                  </h5>
                  <small className="text-muted">
                    {formatDateTime(selectedOrder.createdAt)}
                  </small>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="text-muted small mb-1">
                    {t('orders.payment')} {selectedOrder.paymentMethod?.replace('_', ' ') || 'N/A'}
                  </div>
                  <div className="text-muted small">
                    {getServiceTypeIcon(selectedOrder.serviceType)} {getServiceTypeText(selectedOrder.serviceType)}
                  </div>
                </div>
              </div>
            </Card.Header>
            
            <Card.Body>
              <h6 className="text-muted mb-3">
                {t('orders.orderedItems')}
              </h6>
              
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{getLocalizedText(item.name)}</div>
                    <small className="text-muted">
                      {item.selectedVolume && (
                        <span>
                          {t('orders.size')} {item.selectedVolume} • 
                        </span>
                      )}
                      {t('orders.quantity')} {item.quantity}
                    </small>
                    {item.appliedDiscount && (
                      <div className="small text-success">
                        <i className="bi bi-tag me-1"></i>
                        {t('orders.discountApplied')}
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold">{item.totalPrice} SEK</div>
                    {item.appliedDiscount && (
                      <small className="text-muted text-decoration-line-through">
                        {(parseFloat(item.selectedPrice) * item.quantity).toFixed(2)} SEK
                      </small>
                    )}
                  </div>
                </div>
              ))}

              {/* Applied Coupon */}
              {selectedOrder.appliedCoupon && (
                <div className="alert alert-success mt-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-tag-fill me-2"></i>
                      <strong>
                        {getLocalizedText(selectedOrder.appliedCoupon.title, 'Coupon Applied')}
                      </strong>
                      <div className="small">
                        {selectedOrder.appliedCoupon.discountType === 'percentage' 
                          ? `${selectedOrder.appliedCoupon.discountPercentage}% ${t('orders.discount')}`
                          : `${selectedOrder.appliedCoupon.discountFixedAmount} SEK ${t('orders.discount')}`}
                      </div>
                    </div>
                    <div className="text-success fw-semibold">
                      -{selectedOrder.totalDiscount} SEK
                    </div>
                  </div>
                </div>
              )}

              {/* Order Total */}
              <div className="border-top pt-3 mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {parseFloat(selectedOrder.totalDiscount || 0) > 0 && (
                      <div className="small text-muted">
                        {t('orders.originalTotal')} {selectedOrder.originalTotal} SEK
                      </div>
                    )}
                    <h5 className="mb-0">
                      {t('orders.total')}
                    </h5>
                  </div>
                  <div className="text-end">
                    {parseFloat(selectedOrder.totalDiscount || 0) > 0 && (
                      <div className="small text-success">
                        {t('orders.youSaved')} {selectedOrder.totalDiscount} SEK
                      </div>
                    )}
                    <h5 className="mb-0 text-primary">
                      {selectedOrder.finalTotal || selectedOrder.totalPrice} SEK
                    </h5>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Order Status Information */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Body>
              <h6 className="mb-3">
                {t('orders.orderStatus')}
              </h6>
              <div className="row text-center">
                <div className="col">
                  <div className={`mb-2 ${selectedOrder.status === 'pending' ? 'text-warning' : 'text-muted'}`}>
                    <i className="bi bi-clock-history display-6"></i>
                  </div>
                  <small className={selectedOrder.status === 'pending' ? 'fw-bold' : 'text-muted'}>
                    {t('orders.status.received')}
                  </small>
                </div>
                <div className="col">
                  <div className={`mb-2 ${selectedOrder.status === 'preparing' ? 'text-info' : 'text-muted'}`}>
                    <i className="bi bi-gear display-6"></i>
                  </div>
                  <small className={['preparing'].includes(selectedOrder.status) ? 'fw-bold' : 'text-muted'}>
                    {t('orders.status.preparing')}
                  </small>
                </div>
                <div className="col">
                  <div className={`mb-2 ${selectedOrder.status === 'ready' ? 'text-primary' : 'text-muted'}`}>
                    <i className="bi bi-check-circle display-6"></i>
                  </div>
                  <small className={['ready'].includes(selectedOrder.status) ? 'fw-bold' : 'text-muted'}>
                    {t('orders.status.ready')}
                  </small>
                </div>
                <div className="col">
                  <div className={`mb-2 ${selectedOrder.status === 'completed' ? 'text-success' : 'text-muted'}`}>
                    <i className="bi bi-check-circle-fill display-6"></i>
                  </div>
                  <small className={['completed'].includes(selectedOrder.status) ? 'fw-bold' : 'text-muted'}>
                    {t('orders.status.completed')}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Orders;
