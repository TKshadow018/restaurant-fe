import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isUserAdmin } from '@/utils/adminUtils';
import { simpleOrderListener } from '@/services/simpleOrderListener';
import { voiceNotificationService } from '@/utils/voiceNotificationUtils';
import { 
  requestNotificationPermission, 
  showOrderNotification, 
  showAdminOrderNotification,
  playNotificationSound 
} from '@/utils/notificationUtils';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();

  // Request notification permission on mount and setup listeners
  useEffect(() => {
    const initNotifications = async () => {
      const permission = await requestNotificationPermission();
      setHasPermission(permission);
    };

    if (currentUser) {
      initNotifications();
      
      const isAdmin = isUserAdmin(currentUser.email);
      console.log(`[NotificationContext] User ${currentUser.email} is admin: ${isAdmin}`);
      
      if (isAdmin) {
        // Setup simple order listener for admins
        const handleNewOrder = (orderData) => {
          console.log(`[NotificationContext] Admin received new order notification:`, orderData);
          
          // Create enhanced notification data
          const customerName = orderData.userName || orderData.userEmail?.split('@')[0] || 'Customer';
          const itemCount = orderData.items?.length || 0;
          const mainItems = orderData.items?.slice(0, 2).map(item => 
            `${item.quantity}x ${item.name}`
          ).join(', ') || 'items';
          
          // Show browser notification
          if (hasPermission) {
            showAdminOrderNotification(orderData, 'english');
          }

          // Add enhanced notification to list
          addNotification({
            type: 'new-order',
            title: '🔔 New Order Alert!',
            message: `${customerName} placed an order worth ${orderData.finalTotal} SEK`,
            variant: 'info',
            orderId: orderData.id,
            userId: orderData.userId,
            orderDetails: {
              itemCount,
              mainItems: mainItems + (itemCount > 2 ? ` and ${itemCount - 2} more` : ''),
              customerName,
              totalAmount: orderData.finalTotal
            }
          });

          // Voice announcement for admin
          if (voiceEnabled && voiceNotificationService.isSupported()) {
            console.log('[NotificationContext] Triggering voice announcement for new order');
            voiceNotificationService.announceNewOrder(orderData, 'english')
              .then(() => {
                console.log('[NotificationContext] Voice announcement completed successfully');
              })
              .catch(error => {
                console.error('[NotificationContext] Voice notification failed:', error);
              });
          } else {
            console.log('[NotificationContext] Voice notifications disabled or not supported');
          }

          // Play sound
          playNotificationSound();
        };
        
        console.log(`[NotificationContext] Starting order listener for admin`);
        simpleOrderListener.startListening(handleNewOrder, currentUser.uid);
      }
    }

    // Cleanup function
    return () => {
      console.log(`[NotificationContext] Cleaning up listeners`);
      simpleOrderListener.stopListening();
    };
  }, [currentUser, hasPermission]);

  // Add a new notification to the list
  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto remove after 10 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 10000);

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Show order confirmation notification for customers
  const notifyOrderReceived = (orderData, language = 'english') => {
    if (!currentUser) return;

    // Show browser notification
    if (hasPermission) {
      showOrderNotification(orderData, language);
    }

    // Add to notification list
    const isSwedish = language === 'swedish';
    addNotification({
      type: 'order-received',
      title: isSwedish ? 'Beställning mottagen!' : 'Order Received!',
      message: isSwedish 
        ? `Din beställning på ${orderData.finalTotal} SEK har tagits emot.`
        : `Your order of ${orderData.finalTotal} SEK has been received.`,
      variant: 'success',
      orderId: orderData.id
    });

    // Play sound
    playNotificationSound();
  };

  // Show new order notification for admins
  const notifyNewOrder = (orderData, language = 'english') => {
    const isAdmin = isUserAdmin(currentUser?.email);
    if (!currentUser || !isAdmin) return;

    // Show browser notification
    if (hasPermission) {
      showAdminOrderNotification(orderData, language);
    }

    // Add to notification list
    const isSwedish = language === 'swedish';
    addNotification({
      type: 'new-order',
      title: isSwedish ? 'Ny beställning!' : 'New Order!',
      message: isSwedish
        ? `Ny beställning från ${orderData.userName || orderData.userEmail} - ${orderData.finalTotal} SEK`
        : `New order from ${orderData.userName || orderData.userEmail} - ${orderData.finalTotal} SEK`,
      variant: 'info',
      orderId: orderData.id,
      userId: orderData.userId
    });

    // Play sound
    playNotificationSound();
  };

  // Show general notification
  const showNotification = (title, message, variant = 'info', options = {}) => {
    return addNotification({
      type: 'general',
      title,
      message,
      variant,
      ...options
    });
  };

  // Enable/disable voice notifications
  const toggleVoiceNotifications = (enabled) => {
    setVoiceEnabled(enabled);
    voiceNotificationService.setEnabled(enabled);
    if (!enabled) {
      voiceNotificationService.stop();
    }
  };

  // Test voice notification
  const testVoiceNotification = async () => {
    console.log('[NotificationContext] Testing voice notification...');
    
    if (voiceNotificationService.isSupported()) {
      try {
        const success = await voiceNotificationService.testAnnouncement();
        if (success) {
          showNotification('Voice Test', 'Voice notifications are working correctly!', 'success');
        } else {
          showNotification('Voice Test', 'Voice test failed. Please check your browser settings.', 'error');
        }
      } catch (error) {
        console.error('[NotificationContext] Voice test error:', error);
        showNotification('Voice Test', 'Voice test failed. Please check your browser settings.', 'error');
      }
    } else {
      showNotification('Voice Test', 'Voice notifications are not supported in this browser.', 'error');
    }
  };

  const value = {
    hasPermission,
    voiceEnabled,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    notifyOrderReceived,
    notifyNewOrder,
    showNotification,
    toggleVoiceNotifications,
    testVoiceNotification,
    requestPermission: () => requestNotificationPermission().then(setHasPermission)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
