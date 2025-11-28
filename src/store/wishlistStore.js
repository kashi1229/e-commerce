// src/store/wishlistStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { databases, account, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      // ✅ Helper to check if user is authenticated
      checkAuth: async () => {
        try {
          const user = await account.get();
          return user;
        } catch {
          return null;
        }
      },

      // ✅ Fetch wishlist with proper auth check
      fetchWishlist: async (userId) => {
        if (!userId) {
          set({ items: [], isLoading: false });
          return;
        }

        try {
          set({ isLoading: true, error: null });

          // Verify user is authenticated before fetching
          const currentUser = await get().checkAuth();
          
          if (!currentUser) {
            console.warn('User not authenticated, using local wishlist only');
            set({ isLoading: false });
            return;
          }

          // Ensure the userId matches the authenticated user
          if (currentUser.$id !== userId) {
            console.warn('User ID mismatch, clearing wishlist');
            set({ items: [], isLoading: false });
            return;
          }

          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.WISHLISTS,
            [Query.equal('userId', userId)]
          );
          
          set({ items: response.documents, isLoading: false });
        } catch (error) {
          console.error('Error fetching wishlist:', error);
          
          // Handle specific error cases
          if (error.code === 401 || error.type === 'user_unauthorized') {
            // User not authorized - clear items and use local storage only
            set({ items: [], isLoading: false, error: 'Please login to sync your wishlist' });
          } else {
            set({ isLoading: false, error: error.message });
          }
        }
      },

      // ✅ Add to wishlist with auth check
      addToWishlist: async (userId, productId) => {
        const { items, checkAuth } = get();

        // Check if already in wishlist (local check first)
        const exists = items.find(item => item.productId === productId);
        if (exists) {
          return { success: false, error: 'Already in wishlist' };
        }

        // If no userId, store locally only
        if (!userId) {
          const localItem = {
            $id: `local_${Date.now()}`,
            userId: null,
            productId,
            notifyOnDiscount: false,
            notifyOnRestock: false,
            isLocal: true,
          };
          set({ items: [...items, localItem] });
          return { success: true, isLocal: true };
        }

        try {
          // Verify authentication
          const currentUser = await checkAuth();
          
          if (!currentUser || currentUser.$id !== userId) {
            // Store locally if not authenticated
            const localItem = {
              $id: `local_${Date.now()}`,
              userId,
              productId,
              notifyOnDiscount: false,
              notifyOnRestock: false,
              isLocal: true,
            };
            set({ items: [...items, localItem] });
            return { success: true, isLocal: true, message: 'Saved locally. Login to sync.' };
          }

          const newItem = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.WISHLISTS,
            ID.unique(),
            {
              userId,
              productId,
              notifyOnDiscount: false,
              notifyOnRestock: false,
            }
          );

          set({ items: [...items, newItem] });
          return { success: true };
        } catch (error) {
          console.error('Error adding to wishlist:', error);
          
          // Fallback to local storage on error
          if (error.code === 401) {
            const localItem = {
              $id: `local_${Date.now()}`,
              userId,
              productId,
              notifyOnDiscount: false,
              notifyOnRestock: false,
              isLocal: true,
            };
            set({ items: [...items, localItem] });
            return { success: true, isLocal: true, message: 'Saved locally. Login to sync.' };
          }
          
          return { success: false, error: error.message };
        }
      },

      // ✅ Remove from wishlist with auth check
      removeFromWishlist: async (itemId) => {
        const { items, checkAuth } = get();
        const item = items.find(i => i.$id === itemId);

        if (!item) {
          return { success: false, error: 'Item not found' };
        }

        // If it's a local item, just remove from state
        if (item.isLocal || itemId.startsWith('local_')) {
          set({ items: items.filter(i => i.$id !== itemId) });
          return { success: true };
        }

        try {
          // Verify authentication for server-side deletion
          const currentUser = await checkAuth();
          
          if (!currentUser) {
            // Just remove locally if not authenticated
            set({ items: items.filter(i => i.$id !== itemId) });
            return { success: true, isLocal: true };
          }

          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.WISHLISTS,
            itemId
          );

          set({ items: items.filter(i => i.$id !== itemId) });
          return { success: true };
        } catch (error) {
          console.error('Error removing from wishlist:', error);
          
          // Remove locally even if server fails
          if (error.code === 401 || error.code === 404) {
            set({ items: items.filter(i => i.$id !== itemId) });
            return { success: true, isLocal: true };
          }
          
          return { success: false, error: error.message };
        }
      },

      // ✅ Sync local items to server after login
      syncLocalItems: async (userId) => {
        if (!userId) return;

        const { items, checkAuth } = get();
        const localItems = items.filter(item => item.isLocal);

        if (localItems.length === 0) return;

        try {
          const currentUser = await checkAuth();
          if (!currentUser || currentUser.$id !== userId) return;

          const syncedItems = [];
          const failedItems = [];

          for (const localItem of localItems) {
            try {
              // Check if item already exists on server
              const existing = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.WISHLISTS,
                [
                  Query.equal('userId', userId),
                  Query.equal('productId', localItem.productId),
                ]
              );

              if (existing.documents.length > 0) {
                // Already exists, use server version
                syncedItems.push(existing.documents[0]);
              } else {
                // Create new item on server
                const newItem = await databases.createDocument(
                  DATABASE_ID,
                  COLLECTIONS.WISHLISTS,
                  ID.unique(),
                  {
                    userId,
                    productId: localItem.productId,
                    notifyOnDiscount: localItem.notifyOnDiscount || false,
                    notifyOnRestock: localItem.notifyOnRestock || false,
                  }
                );
                syncedItems.push(newItem);
              }
            } catch (error) {
              console.error('Error syncing item:', error);
              failedItems.push(localItem);
            }
          }

          // Update state: remove local items, add synced items
          const nonLocalItems = items.filter(item => !item.isLocal);
          set({ items: [...nonLocalItems, ...syncedItems, ...failedItems] });

          return {
            success: true,
            synced: syncedItems.length,
            failed: failedItems.length,
          };
        } catch (error) {
          console.error('Error syncing wishlist:', error);
          return { success: false, error: error.message };
        }
      },

      // ✅ Toggle wishlist item
      toggleWishlist: async (userId, productId) => {
        const { items, addToWishlist, removeFromWishlist, getWishlistItem } = get();
        const existingItem = getWishlistItem(productId);

        if (existingItem) {
          return await removeFromWishlist(existingItem.$id);
        } else {
          return await addToWishlist(userId, productId);
        }
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.productId === productId);
      },

      getWishlistItem: (productId) => {
        const { items } = get();
        return items.find(item => item.productId === productId);
      },

      // ✅ Clear wishlist on logout
      clearWishlist: () => {
        set({ items: [], error: null });
      },

      // ✅ Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useWishlistStore;