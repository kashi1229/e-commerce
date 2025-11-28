// src/services/orderService.js
import { databases, Query, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';

class OrderService {
  /**
   * Get user orders with pagination
   */
  async getUserOrders(userId, options = {}) {
    try {
      const { limit = 10, offset = 0, status = null } = options;

      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (status) {
        queries.push(Query.equal('status', status));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        queries
      );

      return {
        success: true,
        orders: response.documents,
        total: response.total,
        hasMore: response.total > offset + limit
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, orders: [], total: 0, error: error.message };
    }
  }

  /**
   * Get single order with items
   */
  async getOrder(orderId) {
    try {
      const order = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        orderId
      );

      // Get order items
      const itemsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDER_ITEMS,
        [Query.equal('orderId', orderId)]
      );

      return {
        success: true,
        order: { ...order, items: itemsResponse.documents }
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order statistics for user
   */
  async getOrderStats(userId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.equal('userId', userId), Query.limit(1000)]
      );

      const stats = {
        total: response.total,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalSpent: 0
      };

      response.documents.forEach(order => {
        if (order.status) {
          stats[order.status] = (stats[order.status] || 0) + 1;
        }
        if (order.totalAmount && order.status !== 'cancelled') {
          stats.totalSpent += order.totalAmount;
        }
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching order stats:', error);
      return { success: false, stats: null, error: error.message };
    }
  }
}

export const orderService = new OrderService();
export default orderService;