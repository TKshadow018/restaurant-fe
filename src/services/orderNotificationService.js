import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  Timestamp 
} from 'firebase/firestore';

/**
 * Real-time order listener for admin notifications
 */
export class OrderNotificationService {
  constructor() {
    this.unsubscribe = null;
    this.lastCheckTime = null;
  }

  /**
   * Start listening for new orders
   * @param {Function} onNewOrder - Callback function when new order is received
   * @param {string} currentUserId - Current user ID to avoid self-notifications
   */
  startListening(onNewOrder, currentUserId = null) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Set initial check time to now to avoid getting all historical orders
    this.lastCheckTime = Timestamp.now();

    // Listen for new orders created after this moment
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    this.unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const orderData = { id: change.doc.id, ...change.doc.data() };
          
          // Only notify about orders created after we started listening
          // and not from the current user (to avoid self-notifications)
          if (
            orderData.createdAt > this.lastCheckTime &&
            orderData.userId !== currentUserId
          ) {
            onNewOrder(orderData);
          }
        }
      });
    }, (error) => {
      console.error("Error listening for new orders:", error);
    });
  }

  /**
   * Stop listening for new orders
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Update the last check time (useful when marking orders as seen)
   */
  updateLastCheckTime() {
    this.lastCheckTime = Timestamp.now();
  }
}

// Export singleton instance
export const orderNotificationService = new OrderNotificationService();
