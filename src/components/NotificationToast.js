import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useNotification } from '@/contexts/NotificationContext';
import '@/styles/notifications.css';

const NotificationToast = () => {
  const { notifications, removeNotification, markAsRead } = useNotification();

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
    setTimeout(() => removeNotification(id), 300);
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
            minWidth: '300px',
            maxWidth: '400px'
          }}
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
                <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                  {notification.message}
                </p>
                {notification.orderId && (
                  <small className="d-block mt-1 opacity-75">
                    Order ID: {notification.orderId.slice(-8)}
                  </small>
                )}
              </div>
            </div>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default NotificationToast;
