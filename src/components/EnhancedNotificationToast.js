import React, { useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { voiceNotificationService } from '@/utils/voiceNotificationUtils';
import '@/styles/notifications.css';

const EnhancedNotificationToast = () => {
  const { notifications, removeNotification, markAsRead } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-dismiss notifications for admin users
  useEffect(() => {
    if (user?.role === 'admin') {
      notifications.forEach((notification) => {
        // Set shorter timeout for admin notifications
        const timeout = notification.type === 'new-order' ? 10000 : 2000; // 3s for orders, 2s for others
        
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, timeout);

        // Store timer ID on notification for cleanup
        notification.timerId = timer;
      });

      // Cleanup function
      return () => {
        notifications.forEach((notification) => {
          if (notification.timerId) {
            clearTimeout(notification.timerId);
          }
        });
      };
    }
  }, [notifications, user, removeNotification]);

  const getVariantClass = (variant) => {
    switch (variant) {
      case 'success':
        return 'bg-success text-white';
      case 'error':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning text-dark';
      case 'info':
      default:
        return 'bg-primary text-white';
    }
  };

  const getIcon = (type, variant) => {
    if (type === 'order-received') return '🎉';
    if (type === 'new-order') return '🔔';
    
    switch (variant) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const handleClose = (id) => {
    markAsRead(id);
    removeNotification(id);
  };

  const handleVoiceAnnouncement = (notification, event) => {
    event.stopPropagation(); // Prevent toast click
    
    if (notification.type === 'new-order' && notification.orderDetails) {
      const { customerName, totalAmount } = notification.orderDetails;
      const mockOrderData = {
        userName: customerName,
        finalTotal: totalAmount
      };
      
      voiceNotificationService.announceNewOrder(mockOrderData, 'english')
        .then(() => {
          console.log('Manual voice announcement completed');
        })
        .catch(error => {
          console.error('Manual voice announcement failed:', error);
        });
    }
  };

  const handleNotificationClick = (notification) => {
    // Clear any auto-dismiss timer
    if (notification.timerId) {
      clearTimeout(notification.timerId);
    }

    // Mark as read
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.type === 'new-order') {
      // Navigate to admin panel orders page
      navigate('/admin', { 
        state: { 
          activeTab: 'orders',
          highlightOrderId: notification.orderId 
        } 
      });
    } else if (notification.type === 'order-received') {
      // Navigate to user's orders page
      navigate('/dashboard?page=orders');
    }

    // Remove notification immediately when clicked
    removeNotification(notification.id);
  };

  return (
    <ToastContainer 
      position="top-end" 
      className="p-3"
      style={{ zIndex: 9999 }}
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          show={true}
          onClose={() => handleClose(notification.id)}
          className={`toast-notification ${notification.variant} ${getVariantClass(notification.variant)} shadow-lg`}
          style={{
            minWidth: '350px',
            maxWidth: '450px',
            cursor: notification.type === 'new-order' || notification.type === 'order-received' ? 'pointer' : 'default'
          }}
          onClick={() => handleNotificationClick(notification)}
        >
          <Toast.Header 
            className={`${getVariantClass(notification.variant)} border-0`}
            closeButton={true}
            closeVariant={notification.variant === 'warning' ? 'dark' : 'white'}
          >
            <span className="me-2" style={{ fontSize: '1.2em' }}>
              {getIcon(notification.type, notification.variant)}
            </span>
            <strong className="me-auto">
              {notification.title}
            </strong>
            <small className="text-muted">
              {notification.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </small>
          </Toast.Header>
          <Toast.Body className={getVariantClass(notification.variant)}>
            <div className="d-flex align-items-start">
              <div className="flex-grow-1">
                <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                  {notification.message}
                </p>
                
                {/* Enhanced details for order notifications */}
                {notification.type === 'new-order' && notification.orderDetails && (
                  <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <small className="d-block">
                      <strong>Items:</strong> {notification.orderDetails.itemCount} items
                    </small>
                    {notification.orderDetails.mainItems && (
                      <small className="d-block text-truncate" title={notification.orderDetails.mainItems}>
                        <strong>Includes:</strong> {notification.orderDetails.mainItems}
                      </small>
                    )}
                  </div>
                )}
                
                {notification.orderId && (
                  <small className="d-block mt-2 opacity-75">
                    Order ID: {notification.orderId.slice(-8)}
                  </small>
                )}
                
                {/* Click hint for actionable notifications */}
                {(notification.type === 'new-order' || notification.type === 'order-received') && (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className="fst-italic opacity-75">
                      👆 Click to view details
                    </small>
                    {notification.type === 'new-order' && (
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={(e) => handleVoiceAnnouncement(notification, e)}
                        title="Speak order details"
                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default EnhancedNotificationToast;
