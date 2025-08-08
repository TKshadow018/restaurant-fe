// Notification utility functions

/**
 * Request notification permission from the browser
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show browser notification
 */
export const showBrowserNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/dining.png',
      badge: '/dining.png',
      requireInteraction: true,
      ...options
    };

    const notification = new Notification(title, defaultOptions);
    
    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }
  return null;
};

/**
 * Show order notification for customers
 */
export const showOrderNotification = (orderData, language = 'english') => {
  const isSwedish = language === 'swedish';
  
  const title = isSwedish 
    ? '🎉 Beställning mottagen!' 
    : '🎉 Order Received!';
    
  const body = isSwedish
    ? `Din beställning på ${orderData.finalTotal} SEK har tagits emot. Vi förbereder din mat!`
    : `Your order of ${orderData.finalTotal} SEK has been received. We're preparing your food!`;

  return showBrowserNotification(title, {
    body,
    icon: '/food/combo1.jpg',
    tag: 'order-received',
    data: {
      orderId: orderData.id,
      type: 'order-received'
    }
  });
};

/**
 * Show admin notification for new orders
 */
export const showAdminOrderNotification = (orderData, language = 'english') => {
  const isSwedish = language === 'swedish';
  
  const title = isSwedish 
    ? '🔔 Ny beställning!' 
    : '🔔 New Order!';
    
  const body = isSwedish
    ? `Ny beställning från ${orderData.userName || orderData.userEmail} - ${orderData.finalTotal} SEK`
    : `New order from ${orderData.userName || orderData.userEmail} - ${orderData.finalTotal} SEK`;

  return showBrowserNotification(title, {
    body,
    icon: '/food/combo1.jpg',
    tag: 'new-order-admin',
    requireInteraction: true,
    data: {
      orderId: orderData.id,
      type: 'new-order',
      userId: orderData.userId
    }
  });
};

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
  try {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a simple notification beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

/**
 * Check if notifications are supported and enabled
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Get notification permission status
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};
