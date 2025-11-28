// src/pages/WishlistPage.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useWishlistStore from '../store/wishlistStore';
import useCartStore from '../store/cartStore';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { formatCurrency, getImageUrl } from '../lib/utils';
import { BUCKET_ID } from '../lib/appwrite';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { LoadingPage } from '../components/common/Loading';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { items: wishlistItems, fetchWishlist, removeFromWishlist, isLoading } = useWishlistStore();
  const { addToCart, setCartOpen } = useCartStore();
  
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    document.title = 'My Wishlist - Elegance';
    window.scrollTo(0, 0);

    if (isAuthenticated && user?.$id) {
      fetchWishlist(user.$id);
    }
  }, [isAuthenticated, user?.$id, fetchWishlist]);

  // Fetch product details for wishlist items
  useEffect(() => {
    async function fetchProducts() {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      try {
        setLoadingProducts(true);
        const productIds = wishlistItems.map(item => item.productId);
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [Query.equal('$id', productIds)]
        );
        
        setProducts(response.documents);
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [wishlistItems]);

  const getImageSrc = (imageId) => {
    if (!imageId) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80';
    if (imageId.startsWith('http')) return imageId;
    return getImageUrl(imageId, BUCKET_ID);
  };

  const handleRemove = async (wishlistItemId) => {
    const result = await removeFromWishlist(wishlistItemId);
    if (result.success) {
      toast.success('Removed from wishlist');
    }
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add to cart');
      return;
    }

    const result = await addToCart(user.$id, product);
    if (result.success) {
      toast.success('Added to cart!');
      setCartOpen(true);
    } else {
      toast.error(result.error || 'Failed to add to cart');
    }
  };

  if (isLoading || loadingProducts) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <EmptyState
          icon={Heart}
          title="Sign in to view your wishlist"
          description="Save your favorite items and access them anytime."
          action={() => navigate('/')}
          actionLabel="Go Home"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#26323B]">My Wishlist</h1>
          <p className="text-[#455A64] mt-2">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {wishlistItems.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save items you love by clicking the heart icon on any product."
            action={() => navigate('/products')}
            actionLabel="Browse Products"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistItems.map((wishlistItem, index) => {
                const product = products.find(p => p.$id === wishlistItem.productId);
                if (!product) return null;

                return (
                  <motion.div
                    key={wishlistItem.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden group"
                  >
                    {/* Image */}
                    <Link to={`/products/${product.$id}`} className="relative block aspect-square overflow-hidden">
                      <img
                        src={getImageSrc(product.thumbnail)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(wishlistItem.$id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Out of Stock Overlay */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="px-4 py-2 bg-white text-[#26323B] font-medium rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <Link to={`/products/${product.$id}`}>
                        <h3 className="font-semibold text-[#26323B] line-clamp-2 hover:text-[#455A64] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-[#26323B]">
                          {formatCurrency(product.price)}
                        </span>
                        {product.comparePrice > product.price && (
                          <span className="text-sm text-[#B0BEC5] line-through">
                            {formatCurrency(product.comparePrice)}
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        icon={ShoppingBag}
                        className="w-full mt-4"
                        size="sm"
                      >
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}