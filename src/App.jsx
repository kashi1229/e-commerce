// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import UserReviewsPage from './pages/UserReviewsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';

// Stores
import useAuthStore from './store/authStore';
import useCartStore from './store/cartStore';
import useWishlistStore from './store/wishlistStore';
import CategoriesPage from './pages/admin/CategoriesPage';
import AboutUs from './pages/AboutUs'

// Layouts
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccountPage from './pages/AccountPage';
import WishlistPage from './pages/WishlistPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';

// Components
import { LoadingPage } from './components/common/Loading';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuthStore();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { initialize, isAuthenticated, user } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();

  // Initialize auth on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.$id) {
      fetchCart(user.$id);
      fetchWishlist(user.$id);
    }
  }, [isAuthenticated, user?.$id, fetchCart, fetchWishlist]);

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:productId" element={<ProductDetailPage />} />
            <Route path="search" element={<ProductsPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="about" element={<AboutUs/>} />

            
            
            {/* Protected Routes */}
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="order-confirmation/:orderId"
              element={
                <ProtectedRoute>
                  <OrderConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/:tab"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:productId/edit" element={<AdminProductFormPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:orderId" element={<AdminOrdersPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />}
            />

        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/coupons" element={<AdminCouponsPage/>} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />

          </Route>
          

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;