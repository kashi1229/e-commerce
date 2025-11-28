// src/pages/CartPage.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, getImageUrl, cn } from '../lib/utils';
import { BUCKET_ID } from '../lib/appwrite';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import Button from '../components/common/Button';
import OrderSummary from '../components/checkout/OrderSummary';
import EmptyState from '../components/common/EmptyState';
import { Spinner } from '../components/common/Loading';
import toast from 'react-hot-toast';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, items, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();

  useEffect(() => {
    document.title = 'Shopping Cart - Elegance';
    window.scrollTo(0, 0);
    
    if (isAuthenticated && user?.$id) {
      fetchCart(user.$id);
    }
  }, [isAuthenticated, user?.$id, fetchCart]);

  const getImageSrc = (imageId) => {
    if (!imageId) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&q=80';
    if (imageId.startsWith('http')) return imageId;
    return getImageUrl(imageId, BUCKET_ID);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId, itemName) => {
    const result = await removeItem(itemId);
    if (result.success) {
      toast.success(`${itemName} removed from cart`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your cart"
          description="Please sign in to access your shopping cart and continue shopping."
          action={() => navigate('/')}
          actionLabel="Continue Shopping"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="container mx-auto px-4 py-16">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added any items to your cart yet. Start shopping to find amazing products!"
            action={() => navigate('/products')}
            actionLabel="Start Shopping"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#26323B]">Shopping Cart</h1>
          <p className="text-[#455A64] mt-2">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Continue Shopping */}
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-[#455A64] hover:text-[#26323B] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>

            {/* Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-[#F7F7F7] border-b border-[#E0E0E0] text-sm font-medium text-[#455A64]">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items */}
              <div className="divide-y divide-[#F7F7F7]">
                {items.map((item, index) => (
                  <motion.div
                    key={item.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 md:p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="md:col-span-6 flex gap-4">
                        <Link
                          to={`/products/${item.productId}`}
                          className="w-24 h-24 rounded-xl overflow-hidden bg-[#F7F7F7] flex-shrink-0"
                        >
                          <img
                            src={getImageSrc(item.productImage)}
                            alt={item.productName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.productId}`}
                            className="font-semibold text-[#26323B] hover:text-[#455A64] transition-colors line-clamp-2"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-sm text-[#455A64] mt-1">SKU: {item.sku}</p>
                          {item.attributes && (
                            <p className="text-sm text-[#455A64]">
                              {Object.entries(JSON.parse(item.attributes))
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')}
                            </p>
                          )}
                          
                          {/* Mobile Price */}
                          <p className="md:hidden font-semibold text-[#26323B] mt-2">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      {/* Price - Desktop */}
                      <div className="hidden md:block md:col-span-2 text-center">
                        <span className="font-semibold text-[#26323B]">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2 flex items-center justify-center">
                        <div className="flex items-center border border-[#B0BEC5] rounded-xl overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(item.$id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-[#F7F7F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4 text-[#455A64]" />
                          </button>
                          <span className="w-12 text-center font-medium text-[#26323B]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.$id, item.quantity + 1)}
                            className="p-2 hover:bg-[#F7F7F7] transition-colors"
                          >
                            <Plus className="w-4 h-4 text-[#455A64]" />
                          </button>
                        </div>
                      </div>

                      {/* Total & Remove */}
                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-4">
                        <span className="font-bold text-[#26323B] text-lg">
                          {formatCurrency(item.total)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.$id, item.productName)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7]">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-[#26323B]">Secure Checkout</h3>
                  <p className="text-sm text-[#455A64]">
                    Your payment information is processed securely. We do not store credit card details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <OrderSummary
                items={items}
                subtotal={cart?.subtotal || 0}
                tax={cart?.tax || 0}
                shipping={cart?.shipping || 0}
                discount={cart?.discount || 0}
                total={cart?.total || 0}
                couponCode={cart?.couponCode}
              />
              
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full mt-4"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}