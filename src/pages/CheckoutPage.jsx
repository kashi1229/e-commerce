// src/pages/CheckoutPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import CheckoutForm from '../components/checkout/CheckoutForm';
import EmptyState from '../components/common/EmptyState';
import { LoadingPage } from '../components/common/Loading';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { items, isLoading: cartLoading } = useCartStore();

  useEffect(() => {
    document.title = 'Checkout - Elegance';
    window.scrollTo(0, 0);
  }, []);

  if (authLoading || cartLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <EmptyState
          icon={Lock}
          title="Sign in to checkout"
          description="Please sign in to complete your purchase."
          action={() => navigate('/')}
          actionLabel="Go Home"
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add some products to your cart before checking out."
          action={() => navigate('/products')}
          actionLabel="Browse Products"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F7F7F7]"
    >
      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Checkout</h1>
            <div className="flex items-center gap-2 text-green-600">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="container mx-auto px-4 py-8">
        <CheckoutForm />
      </div>
    </motion.div>
  );
}