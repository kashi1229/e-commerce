// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import CartDrawer from '../cart/CartDrawer';
import AuthModal from '../auth/AuthModal';
import QuickView from '../products/QuickView';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#26323B',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      {/* Header */}
      <Header />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Auth Modal */}
      <AuthModal />

      {/* Quick View Modal */}
      <QuickView />
    </div>
  );
}