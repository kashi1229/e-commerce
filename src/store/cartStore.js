// src/store/cartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      items: [],
      isLoading: false,
      isOpen: false,

      setCartOpen: (isOpen) => set({ isOpen }),

      fetchCart: async (userId) => {
        if (!userId) return;
        
        try {
          set({ isLoading: true });
          
          // Get or create cart
          let cartResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CART,
            [Query.equal('userId', userId)]
          );

          let cart = cartResponse.documents[0];
          
          if (!cart) {
            cart = await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.CART,
              ID.unique(),
              {
                userId,
                itemCount: 0,
                subtotal: 0,
                tax: 0,
                shipping: 0,
                discount: 0,
                total: 0,
              }
            );
          }

          // Get cart items
          const itemsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CART_ITEMS,
            [Query.equal('cartId', cart.$id)]
          );

          set({ cart, items: itemsResponse.documents, isLoading: false });
        } catch (error) {
          console.error('Error fetching cart:', error);
          set({ isLoading: false });
        }
      },

      addToCart: async (userId, product, quantity = 1, variant = null) => {
        try {
          const { cart, items, updateCartTotals } = get();
          if (!cart) {
            await get().fetchCart(userId);
          }
          
          const currentCart = get().cart;
          if (!currentCart) return { success: false, error: 'Cart not found' };

          // Check if item already exists
          const existingItem = items.find(
            item => item.productId === product.$id && 
            (variant ? item.variantId === variant.$id : !item.variantId)
          );

          if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            const newTotal = (variant?.price || product.price) * newQuantity;
            
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.CART_ITEMS,
              existingItem.$id,
              {
                quantity: newQuantity,
                total: newTotal,
              }
            );

            const updatedItems = items.map(item =>
              item.$id === existingItem.$id
                ? { ...item, quantity: newQuantity, total: newTotal }
                : item
            );
            set({ items: updatedItems });
          } else {
            // Add new item
            const price = variant?.price || product.price;
            const newItem = await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.CART_ITEMS,
              ID.unique(),
              {
                cartId: currentCart.$id,
                userId,
                productId: product.$id,
                variantId: variant?.$id || null,
                productName: product.name,
                productImage: product.thumbnail || null,
                sku: variant?.sku || product.sku,
                price,
                quantity,
                total: price * quantity,
                attributes: variant?.attributes || null,
              }
            );

            set({ items: [...items, newItem] });
          }

          await updateCartTotals();
          return { success: true };
        } catch (error) {
          console.error('Error adding to cart:', error);
          return { success: false, error: error.message };
        }
      },

      updateQuantity: async (itemId, quantity) => {
        try {
          const { items, updateCartTotals } = get();
          const item = items.find(i => i.$id === itemId);
          if (!item) return;

          if (quantity <= 0) {
            return get().removeItem(itemId);
          }

          const newTotal = item.price * quantity;
          
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CART_ITEMS,
            itemId,
            { quantity, total: newTotal }
          );

          const updatedItems = items.map(i =>
            i.$id === itemId ? { ...i, quantity, total: newTotal } : i
          );
          set({ items: updatedItems });
          await updateCartTotals();
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      removeItem: async (itemId) => {
        try {
          const { items, updateCartTotals } = get();
          
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.CART_ITEMS,
            itemId
          );

          const updatedItems = items.filter(i => i.$id !== itemId);
          set({ items: updatedItems });
          await updateCartTotals();
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      updateCartTotals: async () => {
        try {
          const { cart, items } = get();
          if (!cart) return;

          const subtotal = items.reduce((sum, item) => sum + item.total, 0);
          const tax = subtotal * 0.1; // 10% tax
          const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
          const total = subtotal + tax + shipping - (cart.discount || 0);

          const updatedCart = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CART,
            cart.$id,
            {
              itemCount: items.length,
              subtotal,
              tax,
              shipping,
              total,
            }
          );

          set({ cart: updatedCart });
        } catch (error) {
          console.error('Error updating cart totals:', error);
        }
      },

      applyCoupon: async (couponCode) => {
        try {
          const { cart, updateCartTotals } = get();
          if (!cart) return { success: false, error: 'Cart not found' };

          // Validate coupon
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.COUPONS,
            [
              Query.equal('code', couponCode.toUpperCase()),
              Query.equal('isActive', true),
            ]
          );

          const coupon = response.documents[0];
          if (!coupon) {
            return { success: false, error: 'Invalid coupon code' };
          }

          // Check validity dates
          const now = new Date();
          if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
            return { success: false, error: 'Coupon has expired' };
          }

          // Check minimum order amount
          if (coupon.minOrderAmount && cart.subtotal < coupon.minOrderAmount) {
            return { success: false, error: `Minimum order amount is $${coupon.minOrderAmount}` };
          }

          // Calculate discount
          let discount = 0;
          if (coupon.type === 'percentage') {
            discount = cart.subtotal * (coupon.value / 100);
            if (coupon.maxDiscountAmount) {
              discount = Math.min(discount, coupon.maxDiscountAmount);
            }
          } else if (coupon.type === 'fixed') {
            discount = coupon.value;
          }

          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CART,
            cart.$id,
            {
              couponCode: coupon.code,
              couponDiscount: discount,
              discount,
            }
          );

          await updateCartTotals();
          return { success: true, discount };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      clearCart: async () => {
        try {
          const { cart, items } = get();
          if (!cart) return;

          // Delete all cart items
          for (const item of items) {
            await databases.deleteDocument(
              DATABASE_ID,
              COLLECTIONS.CART_ITEMS,
              item.$id
            );
          }

          // Reset cart totals
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CART,
            cart.$id,
            {
              itemCount: 0,
              subtotal: 0,
              tax: 0,
              shipping: 0,
              discount: 0,
              total: 0,
              couponCode: null,
              couponDiscount: null,
            }
          );

          set({ items: [], cart: { ...cart, itemCount: 0, subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 } });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, cart: state.cart }),
    }
  )
);

export default useCartStore;