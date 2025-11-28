// src/store/accountStore.js
import { create } from 'zustand';
import { 
  client,
  DATABASE_ID,
} from '../lib/appwrite';
import { appwriteConfig } from '../config/appwrite.config';
import { apiLogger } from '../lib/logger';
import { addressService } from '../services/addressService';
import { notificationService } from '../services/notificationService';
import { settingsService } from '../services/settingsService';

const COLLECTIONS = appwriteConfig.collections;

const useAccountStore = create((set, get) => ({
  // ==================== STATE ====================
  
  // Orders
  orders: [],
  ordersLoading: false,
  ordersError: null,
  ordersTotal: 0,
  orderStats: null,

  // Addresses
  addresses: [],
  addressesLoading: false,
  addressesError: null,

  // Notifications
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  unreadCount: 0,

  // Settings/Preferences
  userPreferences: {},
  preferencesLoading: false,

  // Subscriptions
  subscriptions: [],

  // ==================== ADDRESSES ====================
  
  fetchAddresses: async (userId) => {
    if (!userId) {
      apiLogger.error('fetchAddresses: userId is required');
      return { success: false, error: 'User ID required' };
    }

    try {
      set({ addressesLoading: true, addressesError: null });

      const result = await addressService.getUserAddresses(userId);

      if (result.success) {
        set({ 
          addresses: result.addresses, 
          addressesLoading: false 
        });
      } else {
        set({ 
          addressesLoading: false, 
          addressesError: result.error 
        });
      }

      return result;
    } catch (error) {
      set({ addressesLoading: false, addressesError: error.message });
      return { success: false, error: error.message };
    }
  },

  addAddress: async (userId, data) => {
    try {
      apiLogger.info('Adding address for user:', userId);

      const result = await addressService.createAddress(userId, data);

      if (result.success) {
        // If new address is default, update all addresses
        if (data.isDefault) {
          set(state => ({
            addresses: [
              result.address,
              ...state.addresses.map(a => ({ ...a, isDefault: false }))
            ]
          }));
        } else {
          set(state => ({
            addresses: [result.address, ...state.addresses]
          }));
        }
      }

      return result;
    } catch (error) {
      apiLogger.error('Error adding address:', error);
      return { success: false, error: error.message };
    }
  },

  updateAddress: async (addressId, data) => {
    try {
      apiLogger.info('Updating address:', addressId);

      const result = await addressService.updateAddress(addressId, data);

      if (result.success) {
        set(state => {
          // If setting as default, unset others
          if (data.isDefault) {
            return {
              addresses: state.addresses.map(a =>
                a.$id === addressId 
                  ? result.address 
                  : { ...a, isDefault: false }
              )
            };
          }
          
          return {
            addresses: state.addresses.map(a =>
              a.$id === addressId ? result.address : a
            )
          };
        });
      }

      return result;
    } catch (error) {
      apiLogger.error('Error updating address:', error);
      return { success: false, error: error.message };
    }
  },

  deleteAddress: async (addressId) => {
    try {
      apiLogger.info('Deleting address:', addressId);

      const result = await addressService.deleteAddress(addressId);

      if (result.success) {
        set(state => ({
          addresses: state.addresses.filter(a => a.$id !== addressId)
        }));
      }

      return result;
    } catch (error) {
      apiLogger.error('Error deleting address:', error);
      return { success: false, error: error.message };
    }
  },

  setDefaultAddress: async (userId, addressId) => {
    try {
      apiLogger.info('Setting default address:', addressId);

      const result = await addressService.setDefaultAddress(userId, addressId);

      if (result.success) {
        set(state => ({
          addresses: state.addresses.map(a => ({
            ...a,
            isDefault: a.$id === addressId
          }))
        }));
      }

      return result;
    } catch (error) {
      apiLogger.error('Error setting default address:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== NOTIFICATIONS ====================
  
  fetchNotifications: async (userId, options = {}) => {
    if (!userId) {
      apiLogger.error('fetchNotifications: userId is required');
      return { success: false, error: 'User ID required' };
    }

    try {
      set({ notificationsLoading: true, notificationsError: null });

      const result = await notificationService.getUserNotifications(userId, options);

      if (result.success) {
        set({ 
          notifications: result.notifications,
          unreadCount: result.unreadCount,
          notificationsLoading: false 
        });
      } else {
        set({ 
          notificationsLoading: false, 
          notificationsError: result.error 
        });
      }

      return result;
    } catch (error) {
      set({ notificationsLoading: false, notificationsError: error.message });
      return { success: false, error: error.message };
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);

      if (result.success) {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.$id === notificationId 
              ? { ...n, isRead: true, readAt: new Date().toISOString() } 
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      }

      return result;
    } catch (error) {
      apiLogger.error('Error marking notification read:', error);
      return { success: false, error: error.message };
    }
  },

  markAllNotificationsRead: async (userId) => {
    try {
      const result = await notificationService.markAllAsRead(userId);

      if (result.success) {
        set(state => ({
          notifications: state.notifications.map(n => ({
            ...n, 
            isRead: true,
            readAt: n.readAt || new Date().toISOString()
          })),
          unreadCount: 0
        }));
      }

      return result;
    } catch (error) {
      apiLogger.error('Error marking all notifications read:', error);
      return { success: false, error: error.message };
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      // Get notification before deleting to check if unread
      const notification = get().notifications.find(n => n.$id === notificationId);
      
      const result = await notificationService.deleteNotification(notificationId);

      if (result.success) {
        set(state => ({
          notifications: state.notifications.filter(n => n.$id !== notificationId),
          unreadCount: notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        }));
      }

      return result;
    } catch (error) {
      apiLogger.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },

  deleteAllNotifications: async (userId) => {
    try {
      const result = await notificationService.deleteAllNotifications(userId);

      if (result.success) {
        set({ notifications: [], unreadCount: 0 });
      }

      return result;
    } catch (error) {
      apiLogger.error('Error deleting all notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== SETTINGS/PREFERENCES ====================
  
  fetchUserPreferences: async (userId) => {
    if (!userId) return { success: false, error: 'User ID required' };

    try {
      set({ preferencesLoading: true });

      const result = await settingsService.getUserPreferences(userId);

      if (result.success) {
        set({ 
          userPreferences: result.preferences,
          preferencesLoading: false 
        });
      } else {
        set({ preferencesLoading: false });
      }

      return result;
    } catch (error) {
      set({ preferencesLoading: false });
      return { success: false, error: error.message };
    }
  },

  setUserPreference: async (userId, key, value, type = 'string') => {
    try {
      const result = await settingsService.setUserPreference(userId, key, value, type);

      if (result.success) {
        set(state => ({
          userPreferences: {
            ...state.userPreferences,
            [`${userId}_${key}`]: {
              value,
              type,
              category: `user_${userId}`
            }
          }
        }));
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getUserPreference: async (userId, key, defaultValue = null) => {
    // Check cache first
    const cached = get().userPreferences[`${userId}_${key}`];
    if (cached) return cached.value;

    // Fetch from service
    return await settingsService.getUserPreference(userId, key, defaultValue);
  },

  // ==================== ORDERS ====================
  // (Keep existing order functions)
  
  orders: [],
  ordersLoading: false,
  ordersTotal: 0,
  orderStats: null,

  fetchOrders: async (userId, options = {}) => {
    if (!userId) return { success: false, error: 'User ID required' };

    try {
      set({ ordersLoading: true });

      const { databases, Query } = await import('../lib/appwrite');
      
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(options.limit || 20),
        Query.offset(options.offset || 0)
      ];

      if (options.status) {
        queries.push(Query.equal('status', options.status));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.orders,
        queries
      );

      set({
        orders: response.documents,
        ordersTotal: response.total,
        ordersLoading: false
      });

      return { success: true, orders: response.documents, total: response.total };
    } catch (error) {
      set({ ordersLoading: false });
      apiLogger.error('Error fetching orders:', error);
      return { success: false, error: error.message, orders: [] };
    }
  },

  fetchOrderStats: async (userId) => {
    if (!userId) return { success: false };

    try {
      const { databases, Query } = await import('../lib/appwrite');

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.orders,
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
        const status = order.status?.toLowerCase();
        if (stats[status] !== undefined) {
          stats[status]++;
        }
        if (order.totalAmount && status !== 'cancelled') {
          stats.totalSpent += parseFloat(order.totalAmount) || 0;
        }
      });

      set({ orderStats: stats });

      return { success: true, stats };
    } catch (error) {
      apiLogger.error('Error fetching order stats:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== REALTIME SUBSCRIPTIONS ====================
  
  subscribeToUpdates: (userId) => {
    if (!userId) return;

    const { subscriptions } = get();
    
    // Cleanup existing subscriptions
    subscriptions.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });

    const newSubscriptions = [];

    try {
      // Subscribe to addresses
      const addressUnsub = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.userAddresses}.documents`,
        (response) => {
          if (response.payload?.userId === userId) {
            apiLogger.debug('Address update:', response.events);
            
            if (response.events.some(e => e.includes('.create'))) {
              set(state => ({
                addresses: [response.payload, ...state.addresses.filter(a => a.$id !== response.payload.$id)]
              }));
            } else if (response.events.some(e => e.includes('.update'))) {
              set(state => ({
                addresses: state.addresses.map(a =>
                  a.$id === response.payload.$id ? response.payload : a
                )
              }));
            } else if (response.events.some(e => e.includes('.delete'))) {
              set(state => ({
                addresses: state.addresses.filter(a => a.$id !== response.payload.$id)
              }));
            }
          }
        }
      );
      newSubscriptions.push(addressUnsub);

      // Subscribe to notifications
      const notifUnsub = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.notifications}.documents`,
        (response) => {
          if (response.payload?.userId === userId) {
            apiLogger.debug('Notification update:', response.events);
            
            if (response.events.some(e => e.includes('.create'))) {
              set(state => ({
                notifications: [response.payload, ...state.notifications],
                unreadCount: !response.payload.isRead ? state.unreadCount + 1 : state.unreadCount
              }));
            } else if (response.events.some(e => e.includes('.update'))) {
              set(state => {
                const oldNotif = state.notifications.find(n => n.$id === response.payload.$id);
                const wasUnread = oldNotif && !oldNotif.isRead;
                const isNowRead = response.payload.isRead;
                
                return {
                  notifications: state.notifications.map(n =>
                    n.$id === response.payload.$id ? response.payload : n
                  ),
                  unreadCount: wasUnread && isNowRead 
                    ? Math.max(0, state.unreadCount - 1) 
                    : state.unreadCount
                };
              });
            } else if (response.events.some(e => e.includes('.delete'))) {
              set(state => {
                const notif = state.notifications.find(n => n.$id === response.payload.$id);
                return {
                  notifications: state.notifications.filter(n => n.$id !== response.payload.$id),
                  unreadCount: notif && !notif.isRead 
                    ? Math.max(0, state.unreadCount - 1) 
                    : state.unreadCount
                };
              });
            }
          }
        }
      );
      newSubscriptions.push(notifUnsub);

      // Subscribe to orders
      const orderUnsub = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.orders}.documents`,
        (response) => {
          if (response.payload?.userId === userId) {
            apiLogger.debug('Order update:', response.events);
            
            if (response.events.some(e => e.includes('.create'))) {
              set(state => ({
                orders: [response.payload, ...state.orders],
                ordersTotal: state.ordersTotal + 1
              }));
            } else if (response.events.some(e => e.includes('.update'))) {
              set(state => ({
                orders: state.orders.map(o =>
                  o.$id === response.payload.$id ? response.payload : o
                )
              }));
            }
          }
        }
      );
      newSubscriptions.push(orderUnsub);

      set({ subscriptions: newSubscriptions });
      apiLogger.success('Subscribed to account updates');
    } catch (error) {
      apiLogger.error('Error subscribing to updates:', error);
    }
  },

  unsubscribeFromUpdates: () => {
    const { subscriptions } = get();
    subscriptions.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    set({ subscriptions: [] });
    apiLogger.info('Unsubscribed from account updates');
  },

  // ==================== INITIALIZATION ====================
  
  initializeAccountData: async (userId) => {
    if (!userId) return { success: false, error: 'User ID required' };

    try {
      apiLogger.info('Initializing account data for user:', userId);

      // Fetch all data in parallel
      const results = await Promise.allSettled([
        get().fetchAddresses(userId),
        get().fetchNotifications(userId),
        get().fetchOrders(userId),
        get().fetchOrderStats(userId),
        get().fetchUserPreferences(userId),
      ]);

      // Subscribe to realtime updates
      get().subscribeToUpdates(userId);

      apiLogger.success('Account data initialized');

      return { 
        success: true,
        results: results.map((r, i) => ({
          operation: ['addresses', 'notifications', 'orders', 'orderStats', 'preferences'][i],
          success: r.status === 'fulfilled' && r.value?.success
        }))
      };
    } catch (error) {
      apiLogger.error('Error initializing account data:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== RESET ====================
  
  reset: () => {
    get().unsubscribeFromUpdates();
    set({
      orders: [],
      ordersLoading: false,
      ordersError: null,
      ordersTotal: 0,
      orderStats: null,
      addresses: [],
      addressesLoading: false,
      addressesError: null,
      notifications: [],
      notificationsLoading: false,
      notificationsError: null,
      unreadCount: 0,
      userPreferences: {},
      preferencesLoading: false,
      subscriptions: [],
    });
    apiLogger.info('Account store reset');
  },
}));

export default useAccountStore;