// src/hooks/useOrders.js
import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import { generateOrderNumber } from '../lib/utils';
import useCartStore from '../store/cartStore';

export function useOrders(userId) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
        ]
      );
      setOrders(response.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}

export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      
      try {
        setIsLoading(true);
        
        const orderData = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          orderId
        );
        setOrder(orderData);

        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ORDER_ITEMS,
          [Query.equal('orderId', orderId)]
        );
        setItems(itemsResponse.documents);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  return { order, items, isLoading, error };
}

export function useCreateOrder() {
  const [isCreating, setIsCreating] = useState(false);
  const clearCart = useCartStore(state => state.clearCart);

  const createOrder = async (orderData) => {
    try {
      setIsCreating(true);

      // Create order
      const order = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        ID.unique(),
        {
          orderNumber: generateOrderNumber(),
          userId: orderData.userId,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: orderData.paymentMethod,
          shippingAddressId: orderData.shippingAddressId,
          billingAddressId: orderData.billingAddressId,
          shippingAddress: JSON.stringify(orderData.shippingAddress),
          billingAddress: JSON.stringify(orderData.billingAddress),
          itemCount: orderData.items.length,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          shipping: orderData.shipping,
          discount: orderData.discount || 0,
          total: orderData.total,
          currency: 'USD',
          couponCode: orderData.couponCode || null,
          couponDiscount: orderData.couponDiscount || null,
          customerNotes: orderData.notes || null,
        }
      );

      // Create order items
      for (const item of orderData.items) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ORDER_ITEMS,
          ID.unique(),
          {
            orderId: order.$id,
            productId: item.productId,
            variantId: item.variantId || null,
            productName: item.productName,
            productImage: item.productImage || null,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            tax: item.tax || 0,
            discount: item.discount || 0,
            attributes: item.attributes || null,
            isReviewed: false,
          }
        );

        // Update product stock and sold count
        const product = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          item.productId
        );
        
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          item.productId,
          {
            stock: Math.max(0, product.stock - item.quantity),
            soldCount: (product.soldCount || 0) + item.quantity,
          }
        );
      }

      // Clear cart
      await clearCart();

      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  return { createOrder, isCreating };
}