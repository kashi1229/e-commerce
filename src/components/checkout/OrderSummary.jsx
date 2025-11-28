// src/components/checkout/OrderSummary.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Loader2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Gift,
  Percent
} from 'lucide-react';
import { formatCurrency, cn, getImageUrl } from '../../lib/utils';
import { BUCKET_ID } from '../../lib/appwrite';
import useCartStore from '../../store/cartStore';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function OrderSummary({
  items = [],
  subtotal = 0,
  tax = 0,
  shipping = 0,
  discount = 0,
  total = 0,
  couponCode = null,
  showItems = true,
  showCoupon = true,
  isCheckout = false,
}) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(couponCode);
  
  const { applyCoupon, cart } = useCartStore();

  const displayedItems = showAllItems ? items : items.slice(0, 3);
  const hasMoreItems = items.length > 3;

  const getImageSrc = (imageId) => {
    if (!imageId) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=100&q=80';
    if (imageId.startsWith('http')) return imageId;
    return getImageUrl(imageId, BUCKET_ID);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      const result = await applyCoupon(couponInput.trim().toUpperCase());
      
      if (result.success) {
        setAppliedCoupon(couponInput.trim().toUpperCase());
        setCouponInput('');
        toast.success(`Coupon applied! You saved ${formatCurrency(result.discount)}`, {
          icon: '🎉',
          duration: 4000,
        });
      } else {
        setCouponError(result.error || 'Invalid coupon code');
        toast.error(result.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon. Please try again.');
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      // Reset coupon in cart store
      setAppliedCoupon(null);
      setCouponInput('');
      toast.success('Coupon removed');
    } catch (error) {
      toast.error('Failed to remove coupon');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  // Calculate savings
  const totalSavings = discount + (items.reduce((acc, item) => {
    const comparePrice = item.comparePrice || item.price;
    return acc + ((comparePrice - item.price) * item.quantity);
  }, 0));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] sticky top-28 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#F7F7F7] bg-gradient-to-r from-[#26323B] to-[#455A64]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Order Summary
        </h2>
        <p className="text-white/70 text-sm mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your order
        </p>
      </div>

      {/* Items List */}
      {showItems && items.length > 0 && (
        <div className="p-4 border-b border-[#F7F7F7]">
          <AnimatePresence>
            <div className="space-y-3">
              {displayedItems.map((item, index) => (
                <motion.div
                  key={item.$id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 p-3 bg-[#F7F7F7] rounded-xl"
                >
                  {/* Product Image */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <img
                      src={getImageSrc(item.productImage)}
                      alt={item.productName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {/* Quantity Badge */}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#26323B] text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#26323B] text-sm line-clamp-2 leading-tight">
                      {item.productName}
                    </h4>
                    
                    {/* Variant Attributes */}
                    {item.attributes && (
                      <p className="text-xs text-[#455A64] mt-0.5">
                        {typeof item.attributes === 'string' 
                          ? Object.entries(JSON.parse(item.attributes))
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')
                          : Object.entries(item.attributes)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')
                        }
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold text-[#26323B] text-sm">
                        {formatCurrency(item.total || item.price * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-[#B0BEC5]">
                          ({formatCurrency(item.price)} × {item.quantity})
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Show More/Less Button */}
          {hasMoreItems && (
            <motion.button
              onClick={() => setShowAllItems(!showAllItems)}
              className="w-full mt-3 py-2 text-sm font-medium text-[#455A64] hover:text-[#26323B] transition-colors flex items-center justify-center gap-1"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {showAllItems ? (
                <>
                  Show Less
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show {items.length - 3} More Items
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </motion.button>
          )}
        </div>
      )}

      {/* Coupon Section */}
      {showCoupon && (
        <div className="p-4 border-b border-[#F7F7F7]">
          {appliedCoupon || cart?.couponCode ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Percent className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <span className="font-semibold text-green-700 text-sm">
                    {appliedCoupon || cart?.couponCode}
                  </span>
                  <p className="text-xs text-green-600">
                    Coupon applied successfully
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="p-1.5 hover:bg-green-100 rounded-full transition-colors"
                title="Remove coupon"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#455A64]">
                Have a coupon code?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0BEC5]" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter code"
                    maxLength={20}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm uppercase tracking-wide",
                      "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent transition-all",
                      couponError 
                        ? "border-red-500 bg-red-50" 
                        : "border-[#B0BEC5] hover:border-[#455A64]"
                    )}
                  />
                </div>
                <Button
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || isApplyingCoupon}
                  variant="outline"
                  size="sm"
                  className="px-4"
                >
                  {isApplyingCoupon ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
              
              {/* Coupon Error */}
              <AnimatePresence>
                {couponError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    {couponError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Coupon Hint */}
              <p className="text-xs text-[#B0BEC5]">
                Try: WELCOME10, SAVE20, FREESHIP
              </p>
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      <div className="p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#455A64]">Subtotal</span>
          <span className="font-medium text-[#26323B]">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#455A64] flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Shipping
          </span>
          <span className={cn(
            "font-medium",
            shipping === 0 ? "text-green-600" : "text-[#26323B]"
          )}>
            {shipping === 0 ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                FREE
              </span>
            ) : (
              formatCurrency(shipping)
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#455A64]">Estimated Tax</span>
          <span className="font-medium text-[#26323B]">
            {formatCurrency(tax)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-green-600 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Discount
              {(appliedCoupon || cart?.couponCode) && (
                <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded">
                  {appliedCoupon || cart?.couponCode}
                </span>
              )}
            </span>
            <span className="font-medium text-green-600">
              -{formatCurrency(discount)}
            </span>
          </motion.div>
        )}

        {/* Divider */}
        <div className="border-t border-dashed border-[#E0E0E0] my-3" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#26323B]">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-[#26323B]">
              {formatCurrency(total)}
            </span>
            {totalSavings > 0 && (
              <p className="text-xs text-green-600 font-medium mt-0.5">
                You're saving {formatCurrency(totalSavings)}!
              </p>
            )}
          </div>
        </div>

        {/* Tax Note */}
        <p className="text-xs text-[#B0BEC5] text-center">
          * Tax calculated at checkout based on shipping address
        </p>
      </div>

      {/* Trust Badges */}
      <div className="p-4 bg-[#F7F7F7] border-t border-[#E0E0E0]">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center text-center p-2">
            <ShieldCheck className="w-5 h-5 text-[#455A64] mb-1" />
            <span className="text-xs text-[#455A64] font-medium">Secure Payment</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <Truck className="w-5 h-5 text-[#455A64] mb-1" />
            <span className="text-xs text-[#455A64] font-medium">Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <RotateCcw className="w-5 h-5 text-[#455A64] mb-1" />
            <span className="text-xs text-[#455A64] font-medium">Easy Returns</span>
          </div>
        </div>
      </div>

      {/* Checkout Note for Cart Page */}
      {!isCheckout && (
        <div className="p-4 border-t border-[#F7F7F7]">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Your order is protected by our <strong>100% satisfaction guarantee</strong>. 
              If you're not happy, we'll make it right.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}