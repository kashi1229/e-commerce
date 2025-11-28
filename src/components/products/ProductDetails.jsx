// src/components/products/ProductDetails.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  Share2,
  Check,
  Minus,
  Plus,
  Package,
  Clock,
} from 'lucide-react';
import { formatCurrency, calculateDiscount, parseJSON, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useUIStore from '../../store/uiStore';
import Button from '../common/Button';
import Badge from '../common/Badge';
import toast from 'react-hot-toast';

export default function ProductDetails({ product, variants = [] }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const { isAuthenticated, user } = useAuthStore();
  const { addToCart, setCartOpen } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItem } = useWishlistStore();
  const { setAuthModalOpen } = useUIStore();

  const inWishlist = isInWishlist(product.$id);
  const discount = calculateDiscount(product.price, product.comparePrice);
  const specifications = parseJSON(product.specifications, {});
  const attributes = parseJSON(product.attributes, {});
  const tags = parseJSON(product.tags, []);

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock <= 0;

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product.maxOrderQuantity || currentStock)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    if (product.hasVariants && !selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    setIsAddingToCart(true);

    try {
      const result = await addToCart(user.$id, product, quantity, selectedVariant);
      if (result.success) {
        toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart!`);
        setCartOpen(true);
      } else {
        toast.error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (inWishlist) {
        const item = getWishlistItem(product.$id);
        await removeFromWishlist(item.$id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(user.$id, product.$id);
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {discount > 0 && (
          <Badge variant="danger">-{discount}% OFF</Badge>
        )}
        {product.isNewArrival && (
          <Badge variant="primary">NEW ARRIVAL</Badge>
        )}
        {product.isBestseller && (
          <Badge className="bg-yellow-100 text-yellow-800">BESTSELLER</Badge>
        )}
        {product.isFeatured && (
          <Badge className="bg-purple-100 text-purple-800">FEATURED</Badge>
        )}
      </div>

      {/* Brand */}
      {product.brandName && (
        <p className="text-sm text-[#455A64] uppercase tracking-wider font-medium">
          {product.brandName}
        </p>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-[#26323B] leading-tight">
        {product.name}
      </h1>

      {/* Rating & Reviews */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < Math.round(product.rating || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200 fill-gray-200"
                )}
              />
            ))}
          </div>
          <span className="font-semibold text-[#26323B]">
            {(product.rating || 0).toFixed(1)}
          </span>
        </div>
        <span className="text-[#455A64]">
          {product.reviewCount || 0} reviews
        </span>
        <span className="text-[#B0BEC5]">|</span>
        <span className="text-[#455A64]">
          {product.soldCount || 0} sold
        </span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-4">
        <span className="text-4xl font-bold text-[#26323B]">
          {formatCurrency(currentPrice)}
        </span>
        {product.comparePrice > currentPrice && (
          <span className="text-xl text-[#B0BEC5] line-through">
            {formatCurrency(product.comparePrice)}
          </span>
        )}
        {discount > 0 && (
          <span className="text-lg font-semibold text-green-600">
            Save {formatCurrency(product.comparePrice - currentPrice)}
          </span>
        )}
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-lg text-[#455A64] leading-relaxed">
          {product.shortDescription}
        </p>
      )}

      {/* Stock Status */}
      <div className="flex items-center gap-3">
        {isOutOfStock ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700">
            <Package className="w-4 h-4" />
            <span className="font-medium">Out of Stock</span>
          </div>
        ) : currentStock <= (product.lowStockThreshold || 10) ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Only {currentStock} left in stock!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700">
            <Check className="w-4 h-4" />
            <span className="font-medium">In Stock</span>
          </div>
        )}
        <span className="text-sm text-[#B0BEC5]">SKU: {product.sku}</span>
      </div>

      {/* Variants */}
      {product.hasVariants && variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-[#26323B]">Select Variant</h3>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => {
              const variantAttrs = parseJSON(variant.attributes, {});
              const isSelected = selectedVariant?.$id === variant.$id;
              const isAvailable = variant.stock > 0;

              return (
                <button
                  key={variant.$id}
                  onClick={() => isAvailable && setSelectedVariant(variant)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 transition-all relative",
                    isSelected
                      ? "border-[#26323B] bg-[#26323B] text-white"
                      : isAvailable
                      ? "border-[#B0BEC5] hover:border-[#455A64] text-[#26323B]"
                      : "border-[#F7F7F7] bg-[#F7F7F7] text-[#B0BEC5] cursor-not-allowed"
                  )}
                >
                  <span className="font-medium">{variant.name}</span>
                  {variant.price && variant.price !== product.price && (
                    <span className="block text-sm mt-0.5">
                      {formatCurrency(variant.price)}
                    </span>
                  )}
                  {!isAvailable && (
                    <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      Sold out
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#455A64]">Quantity:</span>
          <div className="flex items-center border-2 border-[#B0BEC5] rounded-xl overflow-hidden">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="p-3 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4 text-[#455A64]" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.min(Math.max(1, val), product.maxOrderQuantity || currentStock));
              }}
              className="w-16 text-center font-semibold text-[#26323B] border-x-2 border-[#B0BEC5] py-3 focus:outline-none"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= (product.maxOrderQuantity || currentStock)}
              className="p-3 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4 text-[#455A64]" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-1 flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || (product.hasVariants && !selectedVariant)}
            isLoading={isAddingToCart}
            icon={ShoppingBag}
            size="lg"
            className="flex-1"
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          <motion.button
            onClick={handleWishlistToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-4 rounded-xl border-2 transition-all",
              inWishlist
                ? "bg-red-500 border-red-500 text-white"
                : "border-[#B0BEC5] text-[#455A64] hover:border-red-500 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-6 h-6", inWishlist && "fill-current")} />
          </motion.button>

          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-xl border-2 border-[#B0BEC5] text-[#455A64] hover:border-[#26323B] hover:text-[#26323B] transition-all"
          >
            <Share2 className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 py-6 border-y border-[#F7F7F7]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F7F7F7] flex items-center justify-center">
            <Truck className="w-6 h-6 text-[#26323B]" />
          </div>
          <div>
            <p className="font-semibold text-[#26323B] text-sm">Free Shipping</p>
            <p className="text-xs text-[#455A64]">On orders over $100</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F7F7F7] flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-[#26323B]" />
          </div>
          <div>
            <p className="font-semibold text-[#26323B] text-sm">Easy Returns</p>
            <p className="text-xs text-[#455A64]">30-day return policy</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F7F7F7] flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#26323B]" />
          </div>
          <div>
            <p className="font-semibold text-[#26323B] text-sm">Secure Payment</p>
            <p className="text-xs text-[#455A64]">100% protected</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-[#F7F7F7]">
          {[
            { id: 'description', label: 'Description' },
            { id: 'specifications', label: 'Specifications' },
            { id: 'shipping', label: 'Shipping & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-4 font-medium transition-all relative",
                activeTab === tab.id
                  ? "text-[#26323B]"
                  : "text-[#455A64] hover:text-[#26323B]"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#26323B]"
                />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'description' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-lg max-w-none"
            >
              <p className="text-[#455A64] leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-[#26323B] mb-3">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#F7F7F7] text-[#455A64] text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'specifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {Object.keys(specifications).length > 0 ? (
                <div className="grid gap-3">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex py-3 border-b border-[#F7F7F7] last:border-0"
                    >
                      <span className="w-1/3 font-medium text-[#26323B] capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="flex-1 text-[#455A64]">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#455A64]">No specifications available.</p>
              )}
            </motion.div>
          )}

          {activeTab === 'shipping' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h4 className="font-semibold text-[#26323B] mb-2">Shipping</h4>
                <ul className="space-y-2 text-[#455A64]">
                  <li>• Free standard shipping on orders over $100</li>
                  <li>• Standard shipping (5-7 business days): $10</li>
                  <li>• Express shipping (2-3 business days): $20</li>
                  <li>• Next-day delivery available in select areas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#26323B] mb-2">Returns</h4>
                <ul className="space-y-2 text-[#455A64]">
                  <li>• 30-day return policy for unused items</li>
                  <li>• Free returns on all orders</li>
                  <li>• Refund processed within 5-7 business days</li>
                  <li>• Original packaging required</li>
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}