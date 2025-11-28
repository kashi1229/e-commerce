// src/config/appwrite.config.js

/**
 * Appwrite Configuration
 * Centralizes all Appwrite-related configuration
 */

// Validate required environment variables
const requiredEnvVars = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_BUCKET_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file and ensure all required variables are set.'
  );
}

/**
 * Appwrite configuration object
 */
export const appwriteConfig = {
  // Connection
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,

  // Database
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,

  // Storage
  buckets: {
    default: import.meta.env.VITE_APPWRITE_BUCKET_ID,
    avatars: import.meta.env.VITE_APPWRITE_AVATAR_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID,
    products: import.meta.env.VITE_APPWRITE_PRODUCT_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID,
    documents: import.meta.env.VITE_APPWRITE_DOCUMENT_BUCKET_ID || import.meta.env.VITE_APPWRITE_BUCKET_ID,
  },

  // Collections
  collections: {
    usersProfile: 'users_profile',
    userAddresses: 'user_addresses',
    categories: 'product_categories',
    products: 'products',
    productVariants: 'product_variants',
    reviews: 'product_reviews',
    cart: 'shopping_cart',
    cartItems: 'cart_items',
    wishlists: 'wishlists',
    orders: 'orders',
    orderItems: 'order_items',
    payments: 'payments',
    transactions: 'transaction_logs',
    notifications: 'notifications',
    coupons: 'discount_coupons',
    settings: 'app_settings',
  },

  // Limits
  limits: {
    fileSize: {
      avatar: 5 * 1024 * 1024, // 5MB
      product: 10 * 1024 * 1024, // 10MB
      document: 20 * 1024 * 1024, // 20MB
    },
    query: {
      default: 25,
      max: 100,
    },
  },

  // Image sizes
  imageSizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    avatar: { width: 200, height: 200 },
  },

  // Feature flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    logging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },

  // App info
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Elegance',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    env: import.meta.env.VITE_APP_ENV || 'development',
  },
};

// Freeze config to prevent modifications
Object.freeze(appwriteConfig);
Object.freeze(appwriteConfig.buckets);
Object.freeze(appwriteConfig.collections);
Object.freeze(appwriteConfig.limits);
Object.freeze(appwriteConfig.imageSizes);
Object.freeze(appwriteConfig.features);
Object.freeze(appwriteConfig.app);

export default appwriteConfig;