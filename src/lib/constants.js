// src/lib/constants.js

// ============================================
// COLORS
// ============================================
export const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F7F7F7',
  gray: '#B0BEC5',
  darkGray: '#455A64',
  dark: '#26323B',
};

// ============================================
// ORDER STATUS
// ============================================
export const ORDER_STATUS = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500'
  },
  processing: { 
    label: 'Processing', 
    color: 'bg-indigo-100 text-indigo-800',
    dotColor: 'bg-indigo-500'
  },
  shipped: { 
    label: 'Shipped', 
    color: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500'
  },
  delivered: { 
    label: 'Delivered', 
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  refunded: { 
    label: 'Refunded', 
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500'
  },
};

// ============================================
// PAYMENT STATUS
// ============================================
export const PAYMENT_STATUS = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Clock'
  },
  paid: { 
    label: 'Paid', 
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle'
  },
  failed: { 
    label: 'Failed', 
    color: 'bg-red-100 text-red-800',
    icon: 'XCircle'
  },
  refunded: { 
    label: 'Refunded', 
    color: 'bg-gray-100 text-gray-800',
    icon: 'RefreshCw'
  },
};

// ============================================
// PRODUCT STATUS
// ============================================
export const PRODUCT_STATUS = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500'
  },
  out_of_stock: { 
    label: 'Out of Stock', 
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  discontinued: { 
    label: 'Discontinued', 
    color: 'bg-orange-100 text-orange-800',
    dotColor: 'bg-orange-500'
  },
  draft: { 
    label: 'Draft', 
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
};

// ============================================
// CUSTOMER ROLES & STATUS
// ============================================
export const CUSTOMER_ROLES = {
  customer: { 
    label: 'Customer', 
    color: 'bg-blue-100 text-blue-700',
    permissions: ['shop', 'view_orders', 'manage_profile']
  },
  vip: { 
    label: 'VIP', 
    color: 'bg-purple-100 text-purple-700',
    permissions: ['shop', 'view_orders', 'manage_profile', 'exclusive_deals', 'priority_support']
  },
  admin: { 
    label: 'Admin', 
    color: 'bg-orange-100 text-orange-700',
    permissions: ['all']
  },
};

export const CUSTOMER_STATUS = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  banned: {
    label: 'Banned',
    color: 'bg-red-100 text-red-700 border-red-200',
  },
};

// ============================================
// CATEGORY STATUS
// ============================================
export const CATEGORY_STATUS = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-500'
  },
};

// ============================================
// SORT OPTIONS
// ============================================
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

// ============================================
// SHIPPING METHODS
// ============================================
export const SHIPPING_METHODS = {
  standard: {
    label: 'Standard Shipping',
    price: 5.99,
    estimatedDays: '5-7 business days',
    description: 'Regular delivery',
  },
  express: {
    label: 'Express Shipping',
    price: 12.99,
    estimatedDays: '2-3 business days',
    description: 'Faster delivery',
  },
  overnight: {
    label: 'Overnight',
    price: 24.99,
    estimatedDays: '1 business day',
    description: 'Next day delivery',
  },
  free: {
    label: 'Free Shipping',
    price: 0,
    estimatedDays: '7-10 business days',
    description: 'Orders over $100',
  },
};

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHODS = {
  card: {
    label: 'Credit/Debit Card',
    icon: 'CreditCard',
    description: 'Pay securely with your card',
  },
  paypal: {
    label: 'PayPal',
    icon: 'Wallet',
    description: 'Pay with your PayPal account',
  },
  cod: {
    label: 'Cash on Delivery',
    icon: 'Banknote',
    description: 'Pay when you receive',
  },
  stripe: {
    label: 'Stripe',
    icon: 'CreditCard',
    description: 'Secure payment via Stripe',
  },
};

// ============================================
// DISCOUNT TYPES
// ============================================
export const DISCOUNT_TYPES = {
  percentage: {
    label: 'Percentage',
    symbol: '%',
    description: 'Discount by percentage',
  },
  fixed: {
    label: 'Fixed Amount',
    symbol: '$',
    description: 'Fixed dollar discount',
  },
  free_shipping: {
    label: 'Free Shipping',
    symbol: '🚚',
    description: 'Free shipping on order',
  },
  buy_one_get_one: {
    label: 'BOGO',
    symbol: '🎁',
    description: 'Buy one get one',
  },
};

// ============================================
// NOTIFICATION TYPES
// ============================================
export const NOTIFICATION_TYPES = {
  order: {
    label: 'Order Update',
    color: 'bg-blue-100 text-blue-700',
    icon: 'ShoppingBag',
  },
  payment: {
    label: 'Payment',
    color: 'bg-green-100 text-green-700',
    icon: 'DollarSign',
  },
  promotion: {
    label: 'Promotion',
    color: 'bg-purple-100 text-purple-700',
    icon: 'Tag',
  },
  system: {
    label: 'System',
    color: 'bg-gray-100 text-gray-700',
    icon: 'Bell',
  },
  alert: {
    label: 'Alert',
    color: 'bg-red-100 text-red-700',
    icon: 'AlertCircle',
  },
};

// ============================================
// REVIEW RATINGS
// ============================================
export const REVIEW_RATINGS = [
  { value: 5, label: '5 Stars', color: 'text-green-600' },
  { value: 4, label: '4 Stars', color: 'text-blue-600' },
  { value: 3, label: '3 Stars', color: 'text-yellow-600' },
  { value: 2, label: '2 Stars', color: 'text-orange-600' },
  { value: 1, label: '1 Star', color: 'text-red-600' },
];

// ============================================
// PAGINATION
// ============================================
export const ITEMS_PER_PAGE = 12;
export const ITEMS_PER_PAGE_OPTIONS = [12, 24, 36, 48];

export const ADMIN_ITEMS_PER_PAGE = 15;
export const ADMIN_ITEMS_PER_PAGE_OPTIONS = [15, 30, 50, 100];

// ============================================
// CURRENCY
// ============================================
export const CURRENCY = {
  symbol: '$',
  code: 'USD',
  locale: 'en-US',
};

// ============================================
// DATE FORMATS
// ============================================
export const DATE_FORMATS = {
  short: 'MMM dd, yyyy',
  long: 'MMMM dd, yyyy',
  full: 'EEEE, MMMM dd, yyyy',
  time: 'hh:mm a',
  datetime: 'MMM dd, yyyy hh:mm a',
};

// ============================================
// VALIDATION RULES
// ============================================
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  postalCode: /^\d{5}(-\d{4})?$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  },
};

// ============================================
// FEATURE FLAGS
// ============================================
export const FEATURES = {
  wishlist: true,
  reviews: true,
  loyalty: true,
  guestCheckout: true,
  socialLogin: false,
  multiCurrency: false,
  liveChat: false,
  analytics: true,
};

// ============================================
// ERROR MESSAGES
// ============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  GENERIC: 'Something went wrong. Please try again.',
};

// ============================================
// SUCCESS MESSAGES
// ============================================
export const SUCCESS_MESSAGES = {
  PRODUCT_ADDED: 'Product added successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  ORDER_PLACED: 'Order placed successfully',
  ORDER_UPDATED: 'Order updated successfully',
  CUSTOMER_UPDATED: 'Customer updated successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  EMAIL_SENT: 'Email sent successfully',
};

// ============================================
// LINKS
// ============================================
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  twitter: 'https://twitter.com',
  linkedin: 'https://linkedin.com',
};

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
};

// ============================================
// PRODUCT BADGES
// ============================================
export const PRODUCT_BADGES = {
  new: {
    label: 'New',
    color: 'bg-blue-500 text-white',
  },
  sale: {
    label: 'Sale',
    color: 'bg-red-500 text-white',
  },
  featured: {
    label: 'Featured',
    color: 'bg-purple-500 text-white',
  },
  bestseller: {
    label: 'Bestseller',
    color: 'bg-green-500 text-white',
  },
  limited: {
    label: 'Limited',
    color: 'bg-orange-500 text-white',
  },
  exclusive: {
    label: 'Exclusive',
    color: 'bg-pink-500 text-white',
  },
};

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULTS = {
  currency: 'USD',
  locale: 'en-US',
  timezone: 'America/New_York',
  itemsPerPage: 12,
  maxCartQuantity: 99,
  minOrderAmount: 10,
  freeShippingThreshold: 100,
  loyaltyPointsRatio: 100, // $1 = 100 points
  taxRate: 0.08, // 8%
};

// ============================================
// ANIMATION DURATIONS (in ms)
// ============================================
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// ============================================
// BREAKPOINTS (matching Tailwind)
// ============================================
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// ============================================
// LOCAL STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'elegance_auth_token',
  USER: 'elegance_user',
  CART: 'elegance_cart',
  WISHLIST: 'elegance_wishlist',
  RECENT_SEARCHES: 'elegance_recent_searches',
  THEME: 'elegance_theme',
  LANGUAGE: 'elegance_language',
};

// ============================================
// API ENDPOINTS (if needed)
// ============================================
export const API_ENDPOINTS = {
  products: '/products',
  categories: '/categories',
  orders: '/orders',
  customers: '/customers',
  reviews: '/reviews',
  auth: '/auth',
};

// ============================================
// GENDER OPTIONS
// ============================================
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// ============================================
// COUNTRY LIST (abbreviated - add more as needed)
// ============================================
export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  // Add more countries as needed
];

// ============================================
// TIME PERIODS (for analytics/filters)
// ============================================
export const TIME_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

// ============================================
// EXPORT ALL
// ============================================
export default {
  COLORS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  CUSTOMER_ROLES,
  CUSTOMER_STATUS,
  CATEGORY_STATUS,
  SORT_OPTIONS,
  SHIPPING_METHODS,
  PAYMENT_METHODS,
  DISCOUNT_TYPES,
  NOTIFICATION_TYPES,
  REVIEW_RATINGS,
  ITEMS_PER_PAGE,
  ITEMS_PER_PAGE_OPTIONS,
  ADMIN_ITEMS_PER_PAGE,
  ADMIN_ITEMS_PER_PAGE_OPTIONS,
  CURRENCY,
  DATE_FORMATS,
  VALIDATION,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SOCIAL_LINKS,
  FOOTER_LINKS,
  PRODUCT_BADGES,
  DEFAULTS,
  ANIMATION,
  BREAKPOINTS,
  STORAGE_KEYS,
  API_ENDPOINTS,
  GENDER_OPTIONS,
  COUNTRIES,
  TIME_PERIODS,
};