// src/components/products/ProductCard.jsx
import { useState, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingBag, 
  Eye, 
  Star, 
  Check, 
  TrendingUp,
  Package,
  Sparkles
} from 'lucide-react';
import PropTypes from 'prop-types';
import { formatCurrency, calculateDiscount, getImageUrl, parseJSON, cn } from '../../lib/utils';
import { BUCKET_ID } from '../../lib/appwrite';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';

// ============================================
// CONSTANTS
// ============================================
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&q=80';
const MAX_DISPLAY_IMAGES = 2;
const ANIMATION_DURATION = 0.3;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely parse rating value from various formats
 * @param {any} rating - Rating value (string, number, object, or undefined)
 * @returns {number} - Parsed rating between 0 and 5
 */
const parseRating = (rating) => {
  if (rating === null || rating === undefined) return 0;
  
  // Handle object with average/value property
  if (typeof rating === 'object') {
    const val = rating.average || rating.value || rating.avg || rating.score || 0;
    return parseRating(val);
  }
  
  // Parse string to number
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  // Validate and clamp
  if (isNaN(numRating)) return 0;
  return Math.max(0, Math.min(5, numRating));
};

/**
 * Safely parse review count from various formats
 * @param {any} count - Review count value
 * @returns {number} - Parsed count (non-negative integer)
 */
const parseReviewCount = (count) => {
  if (count === null || count === undefined) return 0;
  
  // Handle object with count/total property
  if (typeof count === 'object') {
    const val = count.count || count.total || count.length || 0;
    return parseReviewCount(val);
  }
  
  // Handle array (might be actual reviews array)
  if (Array.isArray(count)) {
    return count.length;
  }
  
  // Parse string to number
  const numCount = typeof count === 'string' ? parseInt(count, 10) : count;
  
  // Validate
  if (isNaN(numCount)) return 0;
  return Math.max(0, Math.floor(numCount));
};

/**
 * Format review count for display
 * @param {number} count - Review count
 * @returns {string} - Formatted string
 */
const formatReviewCount = (count) => {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k reviews`;
  return `${count} reviews`;
};

/**
 * Get stock status configuration
 * @param {number} stock - Current stock
 * @param {number} threshold - Low stock threshold
 * @returns {object|null} - Status config or null
 */
const getStockStatus = (stock, threshold = 5) => {
  if (stock <= 0) {
    return { 
      label: 'Out of Stock', 
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: Package
    };
  }
  if (stock <= threshold) {
    return { 
      label: `Only ${stock} left`, 
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: TrendingUp
    };
  }
  return null;
};

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Star Rating Display Component
 */
const StarRating = memo(function StarRating({ rating, size = 'sm', showEmpty = true }) {
  const parsedRating = parseRating(rating);
  const fullStars = Math.floor(parsedRating);
  const hasHalfStar = parsedRating % 1 >= 0.5;
  
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const starSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <div 
      className="flex items-center gap-0.5" 
      role="img" 
      aria-label={`Rating: ${parsedRating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < fullStars;
        const isHalf = index === fullStars && hasHalfStar;
        
        return (
          <span key={index} className="relative">
            {/* Background star (empty) */}
            {showEmpty && (
              <Star 
                className={cn(
                  starSize,
                  "text-gray-200 fill-gray-200"
                )} 
              />
            )}
            
            {/* Filled star overlay */}
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  starSize,
                  "text-yellow-400 fill-yellow-400",
                  showEmpty && "absolute inset-0"
                )}
                style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </span>
        );
      })}
    </div>
  );
});

StarRating.propTypes = {
  rating: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.object
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  showEmpty: PropTypes.bool
};

/**
 * Product Badge Component
 */
const ProductBadge = memo(function ProductBadge({ type, children, delay = 0 }) {
  const badgeStyles = {
    discount: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
    new: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
    bestseller: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    featured: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
    sale: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
  };

  return (
    <motion.span
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full shadow-lg",
        "ring-1 ring-white/20",
        badgeStyles[type] || badgeStyles.featured
      )}
    >
      {type === 'new' && <Sparkles className="w-3 h-3" />}
      {children}
    </motion.span>
  );
});

ProductBadge.propTypes = {
  type: PropTypes.oneOf(['discount', 'new', 'bestseller', 'featured', 'sale']),
  children: PropTypes.node.isRequired,
  delay: PropTypes.number
};

/**
 * Action Button Component
 */
const ActionButton = memo(function ActionButton({ 
  onClick, 
  isLoading, 
  isSuccess, 
  disabled, 
  variant = 'primary',
  children,
  className,
  ...props 
}) {
  const variants = {
    primary: cn(
      "bg-slate-900 text-white hover:bg-slate-800",
      "disabled:bg-gray-400 disabled:cursor-not-allowed"
    ),
    secondary: "bg-white/90 text-slate-900 hover:bg-white",
    success: "bg-emerald-500 text-white",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        "flex items-center justify-center gap-2",
        "px-4 py-3 rounded-xl font-medium text-sm",
        "shadow-lg backdrop-blur-sm",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500",
        isSuccess ? variants.success : variants[variant],
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Added!</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

ActionButton.propTypes = {
  onClick: PropTypes.func,
  isLoading: PropTypes.bool,
  isSuccess: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger']),
  children: PropTypes.node,
  className: PropTypes.string
};

// ============================================
// MAIN COMPONENT
// ============================================

function ProductCard({ product, variant = 'default', className }) {
  // ============================================
  // STATE
  // ============================================
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ============================================
  // STORE HOOKS
  // ============================================
  const { isAuthenticated, user } = useAuthStore();
  const { addToCart, setCartOpen } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItem } = useWishlistStore();
  const { setQuickView, setAuthModalOpen } = useUIStore();

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  
  const productData = useMemo(() => {
    // Parse rating - handle multiple possible field names
    const rating = parseRating(
      product.rating ?? 
      product.averageRating ?? 
      product.avgRating ?? 
      product.stars ?? 
      product.score ?? 
      0
    );

    // Parse review count - handle multiple possible field names
    const reviewCount = parseReviewCount(
      product.reviewCount ?? 
      product.reviewsCount ?? 
      product.totalReviews ?? 
      product.numReviews ?? 
      product.reviews ?? 
      0
    );

    // Parse images
    const images = parseJSON(product.images, []);
    const thumbnail = product.thumbnail || (images.length > 0 ? images[0] : null);
    
    // Get display images (thumbnail + additional)
    const displayImages = [
      thumbnail,
      ...images.filter(img => img !== thumbnail)
    ].filter(Boolean).slice(0, MAX_DISPLAY_IMAGES);

    // Calculate discount
    const discount = calculateDiscount(product.price, product.comparePrice);
    
    // Get stock status
    const stockStatus = getStockStatus(
      product.stock ?? product.quantity ?? 0,
      product.lowStockThreshold ?? 5
    );

    // Determine if product is available
    const isAvailable = (product.stock ?? product.quantity ?? 0) > 0;

    return {
      id: product.$id || product.id,
      name: product.name || 'Untitled Product',
      price: product.price || 0,
      comparePrice: product.comparePrice || 0,
      rating,
      reviewCount,
      images: displayImages,
      thumbnail,
      discount,
      stockStatus,
      isAvailable,
      brandName: product.brandName || product.brand || null,
      shortDescription: product.shortDescription || product.description || null,
      soldCount: product.soldCount || product.sold || 0,
      isNewArrival: Boolean(product.isNewArrival || product.isNew),
      isBestseller: Boolean(product.isBestseller || product.bestseller),
      isFeatured: Boolean(product.isFeatured || product.featured),
      hasVariants: Boolean(product.hasVariants || product.variants?.length > 0),
      variants: product.variants || []
    };
  }, [product]);

  const inWishlist = useMemo(
    () => isInWishlist(productData.id),
    [isInWishlist, productData.id]
  );

  // ============================================
  // CALLBACKS
  // ============================================
  
  const getImageSrc = useCallback((imageId) => {
    if (!imageId || imageError) return PLACEHOLDER_IMAGE;
    if (imageId.startsWith('http')) return imageId;
    return getImageUrl(imageId, BUCKET_ID);
  }, [imageError]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (!productData.isAvailable) {
      toast.error('Product is out of stock');
      return;
    }

    setIsAddingToCart(true);

    try {
      const result = await addToCart(user.$id, product);
      
      if (result.success) {
        setAddedToCart(true);
        toast.success(`${productData.name} added to cart!`, {
          icon: '🛒',
          duration: 2000
        });
        
        setTimeout(() => {
          setAddedToCart(false);
          setCartOpen(true);
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    isAuthenticated, 
    productData.isAvailable, 
    productData.name, 
    user, 
    product, 
    addToCart, 
    setCartOpen, 
    setAuthModalOpen
  ]);

  const handleWishlistToggle = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (inWishlist) {
        const item = getWishlistItem(productData.id);
        if (item) {
          const result = await removeFromWishlist(item.$id);
          if (result.success) {
            toast.success('Removed from wishlist', { icon: '💔' });
          }
        }
      } else {
        const result = await addToWishlist(user.$id, productData.id);
        if (result.success) {
          toast.success('Added to wishlist!', { icon: '❤️' });
        }
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Something went wrong');
    }
  }, [
    isAuthenticated,
    inWishlist,
    productData.id,
    user,
    getWishlistItem,
    addToWishlist,
    removeFromWishlist,
    setAuthModalOpen
  ]);

  const handleQuickView = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickView(true, product);
  }, [product, setQuickView]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // ============================================
  // ANIMATION VARIANTS
  // ============================================
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <motion.article
      variants={cardVariants}
      className={cn("h-full", className)}
      role="article"
      aria-label={`Product: ${productData.name}`}
    >
      <Link
        to={`/products/${productData.id}`}
        className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 rounded-2xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cn(
          "relative bg-white rounded-2xl overflow-hidden h-full flex flex-col",
          "shadow-sm hover:shadow-xl transition-all duration-500",
          "border border-slate-100 hover:border-slate-200"
        )}>
          
          {/* ====== IMAGE SECTION ====== */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
            
            {/* Skeleton Loader */}
            <AnimatePresence>
              {!imageLoaded && (
                <motion.div
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Product Images */}
            <div className="relative w-full h-full">
              {productData.images.length > 0 ? (
                productData.images.map((img, index) => (
                  <motion.img
                    key={`${productData.id}-img-${index}`}
                    src={getImageSrc(img)}
                    alt={`${productData.name} - Image ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover",
                      index === 0 ? "z-10" : "z-0"
                    )}
                    initial={{ opacity: index === 0 ? 1 : 0 }}
                    animate={{
                      opacity: isHovered && index === 1 ? 1 : index === 0 ? 1 : 0,
                      scale: isHovered ? 1.05 : 1
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    onLoad={() => index === 0 && setImageLoaded(true)}
                    onError={handleImageError}
                  />
                ))
              ) : (
                <img
                  src={PLACEHOLDER_IMAGE}
                  alt={productData.name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
              )}
            </div>

            {/* Hover Overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20",
              "pointer-events-none"
            )} />

            {/* ====== BADGES ====== */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-30">
              {productData.discount > 0 && (
                <ProductBadge type="discount" delay={0}>
                  -{productData.discount}% OFF
                </ProductBadge>
              )}
              {productData.isNewArrival && (
                <ProductBadge type="new" delay={0.1}>
                  NEW
                </ProductBadge>
              )}
              {productData.isBestseller && (
                <ProductBadge type="bestseller" delay={0.15}>
                  BESTSELLER
                </ProductBadge>
              )}
              {productData.isFeatured && !productData.isNewArrival && !productData.isBestseller && (
                <ProductBadge type="featured" delay={0.1}>
                  FEATURED
                </ProductBadge>
              )}
            </div>

            {/* Stock Status Badge */}
            {productData.stockStatus && (
              <div className="absolute top-3 right-14 z-30">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border",
                  productData.stockStatus.color
                )}>
                  {productData.stockStatus.icon && (
                    <productData.stockStatus.icon className="w-3 h-3" />
                  )}
                  {productData.stockStatus.label}
                </span>
              </div>
            )}

            {/* Wishlist Button */}
            <motion.button
              onClick={handleWishlistToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={inWishlist}
              className={cn(
                "absolute top-3 right-3 z-30 p-2.5 rounded-full",
                "shadow-lg backdrop-blur-sm transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                inWishlist
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white/90 text-slate-600 hover:bg-red-500 hover:text-white"
              )}
            >
              <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
            </motion.button>

            {/* ====== QUICK ACTIONS OVERLAY ====== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 20
              }}
              transition={{ duration: ANIMATION_DURATION, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 p-4 z-30"
            >
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={handleAddToCart}
                  isLoading={isAddingToCart}
                  isSuccess={addedToCart}
                  disabled={!productData.isAvailable}
                  variant="primary"
                  className="flex-1"
                  aria-label={productData.isAvailable ? "Add to cart" : "Out of stock"}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{productData.isAvailable ? 'Add to Cart' : 'Out of Stock'}</span>
                </ActionButton>

                <motion.button
                  onClick={handleQuickView}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Quick view"
                  className={cn(
                    "p-3 bg-white/90 backdrop-blur-sm text-slate-900 rounded-xl",
                    "hover:bg-white transition-colors shadow-lg",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  )}
                >
                  <Eye className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>

            {/* Image Pagination Dots */}
            {productData.images.length > 1 && (
              <div className={cn(
                "absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-25",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )}>
                {productData.images.map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      (index === 0 && !isHovered) || (index === 1 && isHovered)
                        ? "bg-white w-3"
                        : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ====== PRODUCT INFO SECTION ====== */}
          <div className="p-4 flex-1 flex flex-col">
            
            {/* Brand & Sales Info */}
            <div className="flex items-center justify-between mb-2">
              {productData.brandName && (
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium truncate">
                  {productData.brandName}
                </span>
              )}
              {productData.soldCount > 50 && (
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {productData.soldCount}+ sold
                </span>
              )}
            </div>

            {/* Product Name */}
            <h3 className={cn(
              "font-semibold text-slate-900 mb-2 line-clamp-2 leading-snug",
              "group-hover:text-slate-700 transition-colors",
              "min-h-[2.75rem]"
            )}>
              {productData.name}
            </h3>

            {/* Short Description */}
            {productData.shortDescription && variant !== 'compact' && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">
                {productData.shortDescription}
              </p>
            )}

            {/* ====== RATING & REVIEWS SECTION ====== */}
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={productData.rating} size="sm" />
              
              <span className="text-sm font-semibold text-slate-700">
                {productData.rating.toFixed(1)}
              </span>
              
              <span className="text-sm text-slate-400">
                ({formatReviewCount(productData.reviewCount)})
              </span>
            </div>

            {/* ====== PRICE SECTION ====== */}
            <div className={cn(
              "flex items-end justify-between mt-auto pt-3",
              "border-t border-slate-100"
            )}>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(productData.price)}
                </span>
                {productData.comparePrice > productData.price && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(productData.comparePrice)}
                  </span>
                )}
              </div>

              {/* Savings Badge */}
              {productData.discount > 0 && (
                <span className={cn(
                  "text-xs font-semibold text-emerald-700 bg-emerald-50",
                  "px-2 py-1 rounded-full border border-emerald-100"
                )}>
                  Save {formatCurrency(productData.comparePrice - productData.price)}
                </span>
              )}
            </div>

            {/* Color Variants Preview */}
            {productData.hasVariants && productData.variants.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                {productData.variants.slice(0, 4).map((variant, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200"
                    style={{ backgroundColor: variant.color || '#ccc' }}
                    title={variant.name}
                  />
                ))}
                {productData.variants.length > 4 && (
                  <span className="text-xs text-slate-400 ml-1">
                    +{productData.variants.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ============================================
// PROP TYPES
// ============================================

ProductCard.propTypes = {
  product: PropTypes.shape({
    $id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    comparePrice: PropTypes.number,
    rating: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.object
    ]),
    averageRating: PropTypes.number,
    reviewCount: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.array
    ]),
    totalReviews: PropTypes.number,
    images: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]),
    thumbnail: PropTypes.string,
    stock: PropTypes.number,
    quantity: PropTypes.number,
    lowStockThreshold: PropTypes.number,
    brandName: PropTypes.string,
    brand: PropTypes.string,
    shortDescription: PropTypes.string,
    description: PropTypes.string,
    soldCount: PropTypes.number,
    isNewArrival: PropTypes.bool,
    isBestseller: PropTypes.bool,
    isFeatured: PropTypes.bool,
    hasVariants: PropTypes.bool,
    variants: PropTypes.array
  }).isRequired,
  variant: PropTypes.oneOf(['default', 'compact', 'featured']),
  className: PropTypes.string
};

ProductCard.defaultProps = {
  variant: 'default',
  className: ''
};

// ============================================
// EXPORT
// ============================================

export default memo(ProductCard);