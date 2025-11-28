// src/lib/config.js
export const config = {
  endpoint: import.meta.env.VITE_API_ENDPOINT || 'https://tor.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_PROJECT_ID || '69256e160012a22579e5',
  databaseId: import.meta.env.VITE_DATABASE_ID || 'ecommerce_production',
  
  // Collections
  collections: {
    appSettings: import.meta.env.VITE_APP_SETTINGS || 'app_settings',
    cartItems: import.meta.env.VITE_CART_ITEMS || 'cart_items',
    reviews: import.meta.env.VITE_PRODUCT_REVIEWS || 'product_reviews',
    shoppingCart: import.meta.env.VITE_SHOPPING_CART || 'shopping_cart',
    discountCoupons: import.meta.env.VITE_DISCOUNT_COUPONS || 'discount_coupons',
    notifications: import.meta.env.VITE_NOTIFICATIONS || 'notifications',
    orderItems: import.meta.env.VITE_ORDER_ITEMS || 'order_items',
    orders: import.meta.env.VITE_ORDERS || 'orders',
    payments: import.meta.env.VITE_PAYMENTS || 'payments',
    productCategories: import.meta.env.VITE_PRODUCT_CATEGORIES || 'product_categories',
    productVariants: import.meta.env.VITE_PRODUCT_VARIANTS || 'product_variants',
    products: import.meta.env.VITE_PRODUCTS || 'products',
    transactionLogs: import.meta.env.VITE_TRANSACTION_LOGS || 'transaction_logs',
    userAddresses: import.meta.env.VITE_USER_ADDRESSES || 'user_addresses',
    userProfile: import.meta.env.VITE_USER_PROFILE || 'users_profile',
    wishlists: import.meta.env.VITE_WISHLISTS 
  },
  
  // Buckets
  buckets: {
    productImages: import.meta.env.VITE_PRODUCT_IMAGE_BUCKET || '6925aa580019a30e9253',
  },
};