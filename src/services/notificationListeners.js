import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  Timestamp,
  limit 
} from 'firebase/firestore';

/**
 * Real-time listener for admin notifications from Firestore
 */
export class AdminNotificationListener {
  constructor() {
    this.unsubscribe = null;
    this.lastCheckTime = null;
  }

  /**
   * Start listening for admin notifications
   * @param {Function} onNewNotification - Callback when new notification arrives
   */
  startListening(onNewNotification) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Set initial check time to now (in milliseconds for easier comparison)
    this.lastCheckTime = Date.now();

    // Listen for new admin notifications - simplified query
    const notificationsQuery = query(
      collection(db, "admin_notifications"),
      orderBy("createdAt", "desc"),
      limit(20) // Limit to recent 20 notifications
    );

    this.unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notificationData = { id: change.doc.id, ...change.doc.data() };
          
          // Convert Firestore timestamp to milliseconds
          const notificationTime = notificationData.createdAt?.toMillis() || 0;
          
          // Only process notifications created after we started listening
          if (notificationTime > this.lastCheckTime) {
            console.log("New admin notification received:", notificationData);
            onNewNotification(notificationData);
          }
        }
      });
    }, (error) => {
      console.error("Error listening for admin notifications:", error);
    });
  }

  /**
   * Stop listening for notifications
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Update the last check time
   */
  updateLastCheckTime() {
    this.lastCheckTime = Date.now();
  }
}

/**
 * Real-time listener for customer notifications
 */
export class CustomerNotificationListener {
  constructor() {
    this.unsubscribe = null;
    this.lastCheckTime = null;
  }

  /**
   * Start listening for customer notifications
   * @param {Function} onNewNotification - Callback when new notification arrives
   * @param {string} userId - Current user ID to filter notifications
   */
  startListening(onNewNotification, userId) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (!userId) return;

    this.lastCheckTime = Timestamp.now();

    // Listen for notifications targeted at this user
    const notificationsQuery = query(
      collection(db, "customer_notifications"),
      where("targetAudience", "==", "customer"),
      where("targetUserId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    this.unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notificationData = { id: change.doc.id, ...change.doc.data() };
          
          if (notificationData.createdAt > this.lastCheckTime) {
            onNewNotification(notificationData);
          }
        }
      });
    }, (error) => {
      console.error("Error listening for customer notifications:", error);
    });
  }

  /**
   * Stop listening for notifications
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// Export singleton instances
export const adminNotificationListener = new AdminNotificationListener();
export const customerNotificationListener = new CustomerNotificationListener();
