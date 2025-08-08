import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  limit,
  Timestamp
} from 'firebase/firestore';

/**
 * Simple real-time order listener for admin notifications
 * Listens directly to the orders collection
 */
export class SimpleOrderListener {
  constructor() {
    this.unsubscribe = null;
    this.startTime = null;
    this.processedOrders = new Set(); // Track processed orders to avoid duplicates
  }

  /**
   * Start listening for new orders
   * @param {Function} onNewOrder - Callback when new order is placed
   * @param {string} currentUserId - Current user ID to avoid self-notifications
   */
  startListening(onNewOrder, currentUserId = null) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Record start time
    this.startTime = Date.now();
    console.log(`[SimpleOrderListener] Starting to listen for orders at ${new Date().toISOString()}`);

    // Listen to orders collection, ordered by creation time
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(10) // Only get recent orders
    );

    this.unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      console.log(`[SimpleOrderListener] Received snapshot with ${snapshot.docs.length} orders`);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const orderData = { id: change.doc.id, ...change.doc.data() };
          const orderTime = orderData.createdAt?.toMillis() || 0;
          
          console.log(`[SimpleOrderListener] New order detected:`, {
            orderId: orderData.id,
            orderTime: new Date(orderTime),
            startTime: new Date(this.startTime),
            isAfterStart: orderTime > this.startTime,
            userId: orderData.userId,
            currentUserId,
            isDifferentUser: orderData.userId !== currentUserId,
            processed: this.processedOrders.has(orderData.id)
          });

          // Only process orders that:
          // 1. Were created after we started listening
          // 2. Are not from the current user (to avoid self-notifications)
          // 3. Haven't been processed already
          if (
            orderTime > this.startTime && 
            orderData.userId !== currentUserId &&
            !this.processedOrders.has(orderData.id)
          ) {
            console.log(`[SimpleOrderListener] Processing new order notification for admin`);
            this.processedOrders.add(orderData.id);
            onNewOrder(orderData);
          }
        }
      });
    }, (error) => {
      console.error("Error listening for orders:", error);
    });
  }

  /**
   * Stop listening for orders
   */
  stopListening() {
    if (this.unsubscribe) {
      console.log(`[SimpleOrderListener] Stopping order listener`);
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.processedOrders.clear();
  }

  /**
   * Reset processed orders (useful for testing)
   */
  reset() {
    this.processedOrders.clear();
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const simpleOrderListener = new SimpleOrderListener();
