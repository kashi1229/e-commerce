// src/components/layout/MobileNav.jsx
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  ShoppingBag,
  Heart,
  User,
  LogIn,
  Package,
  Settings,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  icons,
  Info,
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { useCategories } from '../../hooks/useProducts';
import AboutUs from '../../pages/AboutUs';

export default function MobileNav() {
  const location = useLocation();
  const { isMobileMenuOpen, setMobileMenuOpen, setAuthModalOpen } = useUIStore();
  const { isAuthenticated, profile, logout, isAdmin } = useAuthStore();
  const { categories } = useCategories();

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location, setMobileMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const menuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Shop All', icon: ShoppingBag },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/orders', label: 'My Orders', icon: Package },
    { href: '/account', label: 'Account', icon: User },
    { href: '/account/settings', label: 'Settings', icon: Settings },
    { href: 'about', label: 'About Us', icon: Info }
  
  ];

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white shadow-2xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#F7F7F7]">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#26323B] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                  <span className="text-xl font-bold text-[#26323B]">Elegance</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-[#455A64]" />
                </button>
              </div>

              {/* User Info */}
              {isAuthenticated && profile && (
                <div className="p-4 bg-[#F7F7F7]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#26323B] rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {profile.firstName?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#26323B]">
                        {profile.firstName} {profile.lastName}
                      </p>
                      <p className="text-sm text-[#455A64]">{profile.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-4 space-y-1">
                  {isAdmin() && (
                    <Link
                      to="/admin"
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-[#26323B] bg-[#F7F7F7] font-medium"
                    >
                      <span className="flex items-center gap-3">
                        <LayoutDashboard className="w-5 h-5" />
                        Admin Dashboard
                      </span>
                      <ChevronRight className="w-5 h-5 text-[#B0BEC5]" />
                    </Link>
                  )}

                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                        location.pathname === link.href
                          ? 'bg-[#26323B] text-white'
                          : 'text-[#455A64] hover:bg-[#F7F7F7]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <link.icon className="w-5 h-5" />
                        {link.label}
                      </span>
                      <ChevronRight className="w-5 h-5 opacity-50" />
                    </Link>
                  ))}
                </nav>

                {/* Categories */}
                <div className="px-4 mt-6">
                  <h3 className="px-4 text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider mb-2">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category.$id}
                        to={`/products?category=${category.$id}`}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[#455A64] hover:bg-[#F7F7F7] transition-colors"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="w-4 h-4 text-[#B0BEC5]" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-[#F7F7F7]">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#26323B] text-white font-medium hover:bg-[#455A64] transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}