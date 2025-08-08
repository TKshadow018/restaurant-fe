import { db } from '@/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Service to send notifications that can be picked up by all admin clients
 */
export class AdminNotificationService {
  /**
   * Send a notification to all admins by storing it in Firestore
   * This will be picked up by all admin clients listening for admin notifications
   */
  static async notifyAllAdmins(orderData, language = 'english') {
    try {
      const isSwedish = language === 'swedish';
      
      // Create a notification document that all admin clients can listen to
      const notificationData = {
        type: 'new-order',
        title: isSwedish ? 'Ny beställning!' : 'New Order!',
        message: isSwedish
          ? `Ny beställning från ${orderData.userName || orderData.userEmail} - ${orderData.finalTotal} SEK`
          : `New order from ${orderData.userName || orderData.userEmail} - ${orderData.finalTotal} SEK`,
        orderId: orderData.id,
        orderUserId: orderData.userId,
        orderData: {
          finalTotal: orderData.finalTotal,
          userName: orderData.userName,
          userEmail: orderData.userEmail,
          items: orderData.items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            selectedPrice: item.selectedPrice
          })) || []
        },
        createdAt: Timestamp.now(),
        language,
        // This helps identify which notifications are for admins
        targetAudience: 'admin'
      };

      // Store in admin_notifications collection
      const docRef = await addDoc(collection(db, "admin_notifications"), notificationData);
      console.log("Admin notification sent with ID:", docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }
  }

  /**
   * Send order status update to customer
   */
  static async notifyCustomer(orderData, status, language = 'english') {
    try {
      const isSwedish = language === 'swedish';
      
      let title, message;
      switch (status) {
        case 'confirmed':
          title = isSwedish ? 'Beställning bekräftad!' : 'Order Confirmed!';
          message = isSwedish 
            ? `Din beställning (${orderData.id?.slice(-8)}) har bekräftats och tillagas nu.`
            : `Your order (${orderData.id?.slice(-8)}) has been confirmed and is being prepared.`;
          break;
        case 'ready':
          title = isSwedish ? 'Beställning klar!' : 'Order Ready!';
          message = isSwedish 
            ? `Din beställning (${orderData.id?.slice(-8)}) är klar för upphämtning!`
            : `Your order (${orderData.id?.slice(-8)}) is ready for pickup!`;
          break;
        case 'delivered':
          title = isSwedish ? 'Beställning levererad!' : 'Order Delivered!';
          message = isSwedish 
            ? `Din beställning (${orderData.id?.slice(-8)}) har levererats. Tack för din beställning!`
            : `Your order (${orderData.id?.slice(-8)}) has been delivered. Thank you for your order!`;
          break;
        default:
          title = isSwedish ? 'Beställningsuppdatering' : 'Order Update';
          message = isSwedish 
            ? `Din beställning (${orderData.id?.slice(-8)}) har uppdaterats.`
            : `Your order (${orderData.id?.slice(-8)}) has been updated.`;
      }

      const notificationData = {
        type: 'order-update',
        title,
        message,
        orderId: orderData.id,
        targetUserId: orderData.userId,
        status,
        createdAt: Timestamp.now(),
        language,
        targetAudience: 'customer'
      };

      const docRef = await addDoc(collection(db, "customer_notifications"), notificationData);
      console.log("Customer notification sent with ID:", docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error("Error sending customer notification:", error);
      throw error;
    }
  }
}

export default AdminNotificationService;
