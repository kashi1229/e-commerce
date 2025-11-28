// src/lib/appwrite.js
import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite';

// ============================================
// CLIENT INITIALIZATION
// ============================================
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://tor.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '69256e160012a22579e5');

// ============================================
// SERVICE INSTANCES
// ============================================
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// ============================================
// DATABASE & BUCKET IDs
// ============================================
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'ecommerce_production';
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '6925aa580019a30e9253';

// ============================================
// COLLECTION IDs
// ============================================
export const COLLECTIONS = {
  USERS_PROFILE: 'users_profile',
  USER_ADDRESSES: 'user_addresses',
  CATEGORIES: 'product_categories',
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'product_variants',
  REVIEWS: 'product_reviews',
  CART: 'shopping_cart',
  CART_ITEMS: 'cart_items',
  WISHLISTS: 'wishlists',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transaction_logs',
  NOTIFICATIONS: 'notifications',
  COUPONS: 'discount_coupons',
  SETTINGS: 'app_settings',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely get current user without throwing 401 errors to console
 * Returns null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    // 401 is expected when not logged in - return null silently
    if (isAuthError(error)) {
      return null;
    }
    // Log unexpected errors
    console.error('Unexpected auth error:', error);
    return null;
  }
};

/**
 * Check if user has a valid session
 */
export const hasValidSession = async () => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Check if error is authentication related
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  if (!error) return false;
  
  const authErrorCodes = [401, 403];
  const authErrorTypes = [
    'general_unauthorized_scope',
    'user_unauthorized',
    'user_session_not_found',
    'user_session_already_exists',
    'user_blocked',
    'user_invalid_token',
  ];
  
  return (
    authErrorCodes.includes(error.code) ||
    authErrorTypes.includes(error.type) ||
    error.message?.toLowerCase().includes('unauthorized') ||
    error.message?.toLowerCase().includes('not authorized') ||
    error.message?.toLowerCase().includes('session')
  );
};

/**
 * Get image URL from storage
 * @param {string} fileId - File ID
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} gravity - Crop gravity
 * @param {number} quality - Image quality (0-100)
 * @returns {string|null}
 */
export const getImageUrl = (fileId, width = 400, height = 400, gravity = 'center', quality = 100) => {
  if (!fileId) return null;
  
  // If it's already a full URL, return as is
  if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
    return fileId;
  }
  
  try {
    return storage.getFilePreview(
      BUCKET_ID,
      fileId,
      width,
      height,
      gravity,
      quality
    ).href;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

/**
 * Get file download URL
 * @param {string} fileId - File ID
 * @returns {string|null}
 */
export const getFileUrl = (fileId) => {
  if (!fileId) return null;
  
  try {
    return storage.getFileDownload(BUCKET_ID, fileId).href;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};

/**
 * Get file view URL
 * @param {string} fileId - File ID
 * @returns {string|null}
 */
export const getFileViewUrl = (fileId) => {
  if (!fileId) return null;
  
  try {
    return storage.getFileView(BUCKET_ID, fileId).href;
  } catch (error) {
    console.error('Error getting file view URL:', error);
    return null;
  }
};

/**
 * Upload file to storage
 * @param {File} file - File to upload
 * @param {string} fileId - Optional file ID (defaults to unique())
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<object>}
 */
export const uploadFile = async (file, fileId = ID.unique(), onProgress = null) => {
  try {
    const response = await storage.createFile(
      BUCKET_ID,
      fileId,
      file,
      onProgress ? [Permission.read(Role.any())] : undefined
    );
    return { success: true, file: response };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete file from storage
 * @param {string} fileId - File ID to delete
 * @returns {Promise<object>}
 */
export const deleteFile = async (fileId) => {
  try {
    await storage.deleteFile(BUCKET_ID, fileId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format Appwrite date to readable format
 * @param {string} date - ISO date string
 * @returns {string}
 */
export const formatAppwriteDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  const message = error?.message || error?.toString() || 'An unexpected error occurred';
  
  const errorMap = {
    'Invalid credentials': 'Invalid email or password',
    'Invalid email': 'Please enter a valid email address',
    'Password must be': 'Password must be at least 8 characters',
    'User already exists': 'An account with this email already exists',
    'Rate limit': 'Too many attempts. Please try again later',
    'Network request failed': 'Network error. Please check your connection',
    'user_already_exists': 'An account with this email already exists',
    'user_invalid_credentials': 'Invalid email or password',
    'user_unauthorized': 'You are not authorized to perform this action',
    'user_blocked': 'Your account has been blocked',
    'document_not_found': 'The requested resource was not found',
    'collection_not_found': 'Collection not found',
    'database_not_found': 'Database not found',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
};

// ============================================
// EXPORTS
// ============================================
export { client, Query, ID, Permission, Role };

// Also export as default for backwards compatibility
export default client;