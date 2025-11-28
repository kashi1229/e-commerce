// src/components/products/QuickView.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ExternalLink,
  Check,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatCurrency, calculateDiscount, getImageUrl, parseJSON, cn } from '../../lib/utils';
import { BUCKET_ID } from '../../lib/appwrite';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import toast from 'react-hot-toast';

export default function QuickView() {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { isQuickViewOpen, quickViewProduct, setQuickView } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addToCart, setCartOpen } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist, getWishlistItem } = useWishlistStore();
  const { setAuthModalOpen } = useUIStore();

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const inWishlist = isInWishlist(product.$id);
  const discount = calculateDiscount(product.price, product.comparePrice);
  const images = parseJSON(product.images, []);
  const allImages = [product.thumbnail, ...images.filter(img => img !== product.thumbnail)].filter(Boolean);

  const getImageSrc = (imageId) => {
    if (!imageId) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&q=80';
    if (imageId.startsWith('http')) return imageId;
    return getImageUrl(imageId, BUCKET_ID);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product.maxOrderQuantity || product.stock)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setQuickView(false);
      setAuthModalOpen(true);
      return;
    }

    if (product.stock <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    setIsAddingToCart(true);

    try {
      const result = await addToCart(user.$id, product, quantity);
      if (result.success) {
        toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart!`);
        setQuickView(false);
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
      setQuickView(false);
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

  const handleClose = () => {
    setQuickView(false);
    setQuantity(1);
    setCurrentImageIndex(0);
  };

  return (
    <Modal
      isOpen={isQuickViewOpen}
      onClose={handleClose}
      size="xl"
      showClose={false}
    >
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-lg"
        >
          <X className="w-5 h-5 text-[#455A64]" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-[#F7F7F7] p-6 md:p-8">
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {discount > 0 && (
                <Badge variant="danger">-{discount}% OFF</Badge>
              )}
              {product.isNewArrival && (
                <Badge variant="primary">NEW</Badge>
              )}
            </div>

            {/* Main Image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-white mb-4">
              <motion.img
                key={currentImageIndex}
                src={getImageSrc(allImages[currentImageIndex])}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 justify-center">
                {allImages.slice(0, 5).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden transition-all",
                      currentImageIndex === index
                        ? "ring-2 ring-[#26323B] ring-offset-2"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <img
                      src={getImageSrc(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Brand */}
            {product.brandName && (
              <span className="text-sm text-[#455A64] uppercase tracking-wider font-medium mb-2">
                {product.brandName}
              </span>
            )}

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-[#26323B] mb-3">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.round(product.rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200 fill-gray-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-[#455A64]">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-[#26323B]">
                {formatCurrency(product.price)}
              </span>
              {product.comparePrice > product.price && (
                <span className="text-lg text-[#B0BEC5] line-through">
                  {formatCurrency(product.comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="success" size="sm">
                  Save {formatCurrency(product.comparePrice - product.price)}
                </Badge>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-[#455A64] mb-6 line-clamp-3">
                {product.shortDescription}
              </p>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock <= 0 ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  <X className="w-4 h-4" />
                  Out of Stock
                </span>
              ) : product.stock <= (product.lowStockThreshold || 10) ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  Only {product.stock} left in stock!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  In Stock
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-[#455A64]">Quantity:</span>
              <div className="flex items-center border-2 border-[#B0BEC5] rounded-xl overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2.5 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4 text-[#455A64]" />
                </button>
                <span className="w-12 text-center font-semibold text-[#26323B]">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.maxOrderQuantity || product.stock)}
                  className="p-2.5 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#455A64]" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                isLoading={isAddingToCart}
                icon={ShoppingBag}
                size="lg"
                className="flex-1"
              >
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <motion.button
                onClick={handleWishlistToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-3.5 rounded-xl border-2 transition-all",
                  inWishlist
                    ? "bg-red-500 border-red-500 text-white"
                    : "border-[#B0BEC5] text-[#455A64] hover:border-red-500 hover:text-red-500"
                )}
              >
                <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
              </motion.button>
            </div>

            {/* View Full Details Link */}
            <Link
              to={`/products/${product.$id}`}
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 text-[#26323B] font-medium hover:text-[#455A64] transition-colors py-3 border-t border-[#F7F7F7]"
            >
              View Full Details
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}