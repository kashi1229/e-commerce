// src/services/notificationService.js
import { 
  databases, 
  DATABASE_ID, 
  ID,
  Query,
} from '../lib/appwrite';
import { appwriteConfig } from '../config/appwrite.config';
import { apiLogger } from '../lib/logger';

const COLLECTION_ID = appwriteConfig.collections.notifications;

class NotificationService {
  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    if (!userId) {
      apiLogger.error('getUserNotifications: userId is required');
      return { success: false, error: 'User ID required', notifications: [], total: 0, unreadCount: 0 };
    }

    try {
      const { 
        limit = 20, 
        offset = 0, 
        unreadOnly = false 
      } = options;

      apiLogger.info('Fetching notifications for user:', userId);

      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (unreadOnly) {
        queries.push(Query.equal('isRead', false));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      // Count unread
      const unreadResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false),
          Query.limit(1)
        ]
      );

      apiLogger.success(`Fetched ${response.documents.length} notifications (${unreadResponse.total} unread)`);

      return { 
        success: true, 
        notifications: response.documents,
        total: response.total,
        unreadCount: unreadResponse.total
      };
    } catch (error) {
      apiLogger.error('Error fetching notifications:', error);
      return { success: false, error: error.message, notifications: [], total: 0, unreadCount: 0 };
    }
  }

  /**
   * Get single notification
   */
  async getNotification(notificationId) {
    if (!notificationId) {
      return { success: false, error: 'Notification ID required' };
    }

    try {
      const notification = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId
      );

      return { success: true, notification };
    } catch (error) {
      apiLogger.error('Error fetching notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification
   */
  async createNotification(userId, data) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      apiLogger.info('Creating notification for user:', userId);

      const notificationData = {
        userId,
        type: data.type || 'general',
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl || null,
        actionUrl: data.actionUrl || null,
        actionLabel: data.actionLabel || null,
        data: data.data ? JSON.stringify(data.data) : null,
        isRead: false,
        readAt: null,
        sentVia: data.sentVia || 'app',
        priority: data.priority || 'normal',
        expiresAt: data.expiresAt || null,
      };

      const notification = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        notificationData
      );

      apiLogger.success('Notification created:', notification.$id);

      return { success: true, notification };
    } catch (error) {
      apiLogger.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    if (!notificationId) {
      return { success: false, error: 'Notification ID required' };
    }

    try {
      apiLogger.info('Marking notification as read:', notificationId);

      const notification = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId,
        { 
          isRead: true, 
          readAt: new Date().toISOString() 
        }
      );

      apiLogger.success('Notification marked as read:', notificationId);

      return { success: true, notification };
    } catch (error) {
      apiLogger.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      apiLogger.info('Marking all notifications as read for user:', userId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false),
          Query.limit(100)
        ]
      );

      const readAt = new Date().toISOString();

      const promises = response.documents.map(notif =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          notif.$id,
          { isRead: true, readAt }
        )
      );

      await Promise.all(promises);

      apiLogger.success(`Marked ${response.documents.length} notifications as read`);

      return { success: true, count: response.documents.length };
    } catch (error) {
      apiLogger.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    if (!notificationId) {
      return { success: false, error: 'Notification ID required' };
    }

    try {
      apiLogger.info('Deleting notification:', notificationId);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId
      );

      apiLogger.success('Notification deleted:', notificationId);

      return { success: true };
    } catch (error) {
      apiLogger.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete all notifications for user
   */
  async deleteAllNotifications(userId) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      apiLogger.info('Deleting all notifications for user:', userId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.limit(100)
        ]
      );

      const promises = response.documents.map(notif =>
        databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID,
          notif.$id
        )
      );

      await Promise.all(promises);

      apiLogger.success(`Deleted ${response.documents.length} notifications`);

      return { success: true, count: response.documents.length };
    } catch (error) {
      apiLogger.error('Error deleting all notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    if (!userId) {
      return { success: false, count: 0 };
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false),
          Query.limit(1)
        ]
      );

      return { success: true, count: response.total };
    } catch (error) {
      apiLogger.error('Error getting unread count:', error);
      return { success: false, count: 0 };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;