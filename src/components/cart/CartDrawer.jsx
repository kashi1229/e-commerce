// src/components/cart/CartDrawer.jsx
import { useState, useEffect } from 'react'; // ✅ FIXED: Added useState
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Truck,
  Loader2,
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';
import { BUCKET_ID } from '../../lib/appwrite';

// Get image URL helper
const getImageUrl = (fileId) => {
  if (!fileId) return null;
  if (fileId.startsWith('http')) return fileId;
  return `https://tor.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=69256e160012a22579e5`;
};

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const {
    cart,
    items,
    isOpen,
    isLoading,
    setCartOpen,
    fetchCart,
    updateQuantity,
    removeItem,
  } = useCartStore();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated && user?.$id) {
      fetchCart(user.$id);
    }
  }, [isAuthenticated, user?.$id, fetchCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle checkout navigation
  const handleCheckout = () => {
    setCartOpen(false);
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=/checkout');
    }
  };

  // Handle coupon apply
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      // TODO: Implement coupon logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      // toast.success('Coupon applied successfully');
    } catch (error) {
      // toast.error('Invalid coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Free shipping calculation
  const freeShippingThreshold = 100;
  const subtotal = cart?.subtotal || 0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F7F7F7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#26323B] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#26323B]">Shopping Cart</h2>
                  <p className="text-sm text-[#455A64]">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-[#455A64]" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="px-4 py-3 bg-[#F7F7F7]">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-[#455A64]" />
                  {remainingForFreeShipping > 0 ? (
                    <p className="text-sm text-[#455A64]">
                      Add{' '}
                      <span className="font-semibold text-[#26323B]">
                        {formatCurrency(remainingForFreeShipping)}
                      </span>{' '}
                      more for free shipping
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 font-medium">
                      🎉 You've unlocked free shipping!
                    </p>
                  )}
                </div>
                <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full transition-colors',
                      freeShippingProgress >= 100 ? 'bg-green-500' : 'bg-[#26323B]'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#26323B] animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <EmptyCartState 
                  onClose={() => setCartOpen(false)} 
                  onNavigate={() => {
                    setCartOpen(false);
                    navigate('/products');
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItem
                        key={item.$id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#F7F7F7] p-4 space-y-4 bg-white">
                {/* Coupon Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0BEC5]" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="w-full pl-10 pr-4 py-2.5 border border-[#B0BEC5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent transition-all"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    isLoading={isApplyingCoupon}
                  >
                    Apply
                  </Button>
                </div>

                {/* Summary */}
                <div className="space-y-2 py-3 border-t border-[#F7F7F7]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#455A64]">Subtotal</span>
                    <span className="font-medium text-[#26323B]">
                      {formatCurrency(cart?.subtotal || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-[#455A64]">Shipping</span>
                    <span className="font-medium text-[#26323B]">
                      {(cart?.shipping || 0) === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatCurrency(cart?.shipping || 0)
                      )}
                    </span>
                  </div>
                  
                  {(cart?.tax || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#455A64]">Tax</span>
                      <span className="font-medium text-[#26323B]">
                        {formatCurrency(cart.tax)}
                      </span>
                    </div>
                  )}
                  
                  {(cart?.discount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(cart.discount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#F7F7F7]">
                    <span className="text-[#26323B]">Total</span>
                    <span className="text-[#26323B]">
                      {formatCurrency(cart?.total || 0)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Proceed to Checkout
                  </Button>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-full text-center text-sm text-[#455A64] hover:text-[#26323B] transition-colors py-2"
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 pt-2 text-xs text-[#B0BEC5]">
                  <span>🔒 Secure Checkout</span>
                  <span>•</span>
                  <span>📦 Free Returns</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Empty Cart State Component
// ============================================
function EmptyCartState({ onClose, onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
        <ShoppingBag className="w-10 h-10 text-[#B0BEC5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#26323B] mb-2">
        Your cart is empty
      </h3>
      <p className="text-sm text-[#455A64] mb-6 max-w-xs">
        Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
      </p>
      <Button onClick={onNavigate} icon={ShoppingBag}>
        Start Shopping
      </Button>
    </div>
  );
}

// ============================================
// Cart Item Component
// ============================================
function CartItem({ item, onUpdateQuantity, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle remove item
  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.$id);
    } catch (error) {
      console.error('Error removing item:', error);
      setIsRemoving(false);
    }
  };

  // Handle quantity update
  const handleUpdateQuantity = async (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > (item.maxQuantity || 99)) return;
    
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.$id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Parse attributes safely
  const parseAttributes = () => {
    if (!item.attributes) return null;
    try {
      const attrs = typeof item.attributes === 'string' 
        ? JSON.parse(item.attributes) 
        : item.attributes;
      return Object.entries(attrs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return null;
    }
  };

  const attributes = parseAttributes();
  const imageUrl = getImageUrl(item.productImage) || item.productImage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      className={cn(
        'flex gap-4 p-3 bg-[#F7F7F7] rounded-xl transition-opacity',
        isRemoving && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Product Image */}
      <Link
        to={`/products/${item.productSlug || item.productId}`}
        className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.productName}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8E8E8]">
            <ShoppingBag className="w-6 h-6 text-[#B0BEC5]" />
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${item.productSlug || item.productId}`}
          className="font-medium text-[#26323B] hover:text-[#455A64] transition-colors line-clamp-2 text-sm"
        >
          {item.productName || 'Unknown Product'}
        </Link>

        {attributes && (
          <p className="text-xs text-[#455A64] mt-0.5 truncate">{attributes}</p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <p className="font-semibold text-[#26323B]">
            {formatCurrency(item.price || 0)}
          </p>
          {item.comparePrice && item.comparePrice > item.price && (
            <p className="text-xs text-[#B0BEC5] line-through">
              {formatCurrency(item.comparePrice)}
            </p>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-[#B0BEC5] rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="p-1.5 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5 text-[#455A64]" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-[#26323B]">
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= (item.maxQuantity || 99)}
              className="p-1.5 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5 text-[#455A64]" />
            </button>
          </div>

          {/* Item Total */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#26323B]">
              {formatCurrency((item.price || 0) * item.quantity)}
            </span>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Remove item"
            >
              {isRemoving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Stock Warning */}
        {item.stock !== undefined && item.stock <= 5 && item.stock > 0 && (
          <p className="text-xs text-orange-600 mt-1">
            Only {item.stock} left in stock
          </p>
        )}
        
        {item.stock === 0 && (
          <p className="text-xs text-red-600 mt-1">Out of stock</p>
        )}
      </div>
    </motion.div>
  );
}