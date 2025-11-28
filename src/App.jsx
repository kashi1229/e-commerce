// src/App.jsx
import { useEffect, useState, lazy, Suspense, memo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// ============================================
// Stores (Keep eager - small & needed immediately)
// ============================================
import useAuthStore from './store/authStore';
import useCartStore from './store/cartStore';
import useWishlistStore from './store/wishlistStore';

// ============================================
// Layouts (Keep eager - needed for structure)
// ============================================
import Layout from './components/layout/Layout';

// ============================================
// Critical Components (Keep eager)
// ============================================
import { LoadingPage, PageLoader } from './components/common/Loading';

// ============================================
// Lazy Load Admin Layout (Only for admin users)
// ============================================
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));

// ============================================
// Lazy Load Public Pages
// ============================================
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const UserReviewsPage = lazy(() => import('./pages/UserReviewsPage'));

// ============================================
// Lazy Load Admin Pages (Only when accessed)
// ============================================
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));

// ============================================
// Not Found Page
// ============================================
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ============================================
// Protected Route Component (Memoized)
// ============================================
const ProtectedRoute = memo(function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}) {
  const { isAuthenticated, isLoading, isAdmin, isInitialized } = useAuthStore();

  // Show loading while auth is initializing
  if (!isInitialized || isLoading) {
    return <PageLoader />;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect if admin required but user is not admin
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
});

// ============================================
// Suspense Wrapper for Lazy Components
// ============================================
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

// ============================================
// App Loader Component (Shows before app is ready)
// ============================================
const AppLoader = memo(function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F7F7] to-white">
      <div className="text-center">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto bg-[#26323B] rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-3xl">E</span>
          </div>
          {/* Pulse Animation */}
          <div className="absolute inset-0 w-20 h-20 mx-auto bg-[#26323B]/20 rounded-2xl animate-ping" />
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-bold text-[#26323B] mb-4">Elegance</h1>

        {/* Loading Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-[#26323B] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <p className="text-[#455A64] text-sm mt-4">Loading your experience...</p>
      </div>
    </div>
  );
});

// ============================================
// Main App Component
// ============================================
function App() {
  const { initialize, isAuthenticated, isInitialized, user } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const [isAppReady, setIsAppReady] = useState(false);

  // Initialize auth on app load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        // Small delay for smooth transition
        setTimeout(() => setIsAppReady(true), 300);
      }
    };

    initializeApp();
  }, [initialize]);

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.$id) {
      // Fetch cart and wishlist in parallel
      Promise.all([
        fetchCart(user.$id).catch(console.error),
        fetchWishlist(user.$id).catch(console.error),
      ]);
    }
  }, [isAuthenticated, user?.$id, fetchCart, fetchWishlist]);

  // Show loader until app is ready
  if (!isAppReady || !isInitialized) {
    return <AppLoader />;
  }

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* ====================================== */}
          {/* Public Routes with Main Layout */}
          {/* ====================================== */}
          <Route path="/" element={<Layout />}>
            {/* Home Page */}
            <Route
              index
              element={
                <SuspenseWrapper>
                  <HomePage />
                </SuspenseWrapper>
              }
            />

            {/* Products */}
            <Route
              path="products"
              element={
                <SuspenseWrapper>
                  <ProductsPage />
                </SuspenseWrapper>
              }
            />

            {/* Product Detail */}
            <Route
              path="products/:productId"
              element={
                <SuspenseWrapper>
                  <ProductDetailPage />
                </SuspenseWrapper>
              }
            />

            {/* Search (uses ProductsPage) */}
            <Route
              path="search"
              element={
                <SuspenseWrapper>
                  <ProductsPage />
                </SuspenseWrapper>
              }
            />

            {/* Cart */}
            <Route
              path="cart"
              element={
                <SuspenseWrapper>
                  <CartPage />
                </SuspenseWrapper>
              }
            />

            {/* Wishlist */}
            <Route
              path="wishlist"
              element={
                <SuspenseWrapper>
                  <WishlistPage />
                </SuspenseWrapper>
              }
            />

            {/* About Us */}
            <Route
              path="about"
              element={
                <SuspenseWrapper>
                  <AboutUs />
                </SuspenseWrapper>
              }
            />

            {/* User Reviews */}
            <Route
              path="reviews"
              element={
                <SuspenseWrapper>
                  <UserReviewsPage />
                </SuspenseWrapper>
              }
            />

            {/* ====================================== */}
            {/* Protected User Routes */}
            {/* ====================================== */}
            
            {/* Checkout */}
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <CheckoutPage />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Order Confirmation */}
            <Route
              path="order-confirmation/:orderId"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <OrderConfirmationPage />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Account */}
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AccountPage />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Account with Tab */}
            <Route
              path="account/:tab"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AccountPage />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Orders (redirects to Account) */}
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AccountPage />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ====================================== */}
          {/* Admin Routes with Admin Layout */}
          {/* ====================================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <SuspenseWrapper>
                  <AdminLayout />
                </SuspenseWrapper>
              </ProtectedRoute>
            }
          >
            {/* Admin Dashboard */}
            <Route
              index
              element={
                <SuspenseWrapper>
                  <AdminDashboardPage />
                </SuspenseWrapper>
              }
            />

            {/* Products Management */}
            <Route
              path="products"
              element={
                <SuspenseWrapper>
                  <AdminProductsPage />
                </SuspenseWrapper>
              }
            />

            {/* New Product */}
            <Route
              path="products/new"
              element={
                <SuspenseWrapper>
                  <AdminProductFormPage />
                </SuspenseWrapper>
              }
            />

            {/* Edit Product */}
            <Route
              path="products/:productId/edit"
              element={
                <SuspenseWrapper>
                  <AdminProductFormPage />
                </SuspenseWrapper>
              }
            />

            {/* Orders Management */}
            <Route
              path="orders"
              element={
                <SuspenseWrapper>
                  <AdminOrdersPage />
                </SuspenseWrapper>
              }
            />

            {/* Order Detail */}
            <Route
              path="orders/:orderId"
              element={
                <SuspenseWrapper>
                  <AdminOrdersPage />
                </SuspenseWrapper>
              }
            />

            {/* Categories Management */}
            <Route
              path="categories"
              element={
                <SuspenseWrapper>
                  <CategoriesPage />
                </SuspenseWrapper>
              }
            />

            {/* Customers Management */}
            <Route
              path="customers"
              element={
                <SuspenseWrapper>
                  <AdminCustomersPage />
                </SuspenseWrapper>
              }
            />

            {/* Coupons Management */}
            <Route
              path="coupons"
              element={
                <SuspenseWrapper>
                  <AdminCouponsPage />
                </SuspenseWrapper>
              }
            />

            {/* Reviews Management */}
            <Route
              path="reviews"
              element={
                <SuspenseWrapper>
                  <AdminReviewsPage />
                </SuspenseWrapper>
              }
            />
          </Route>

          {/* ====================================== */}
          {/* 404 Not Found */}
          {/* ====================================== */}
          <Route
            path="*"
            element={
              <SuspenseWrapper>
                <NotFoundPage />
              </SuspenseWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;