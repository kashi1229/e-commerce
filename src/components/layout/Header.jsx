// src/components/layout/Header.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  Settings,
  LayoutDashboard,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useUIStore from '../../store/uiStore';
import { useCategories } from '../../hooks/useProducts';
import Button from '../common/Button';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isAuthenticated, profile, logout, isAdmin } = useAuthStore();
  const { items: cartItems, setCartOpen } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { setMobileMenuOpen, setAuthModalOpen } = useUIStore();
  const { categories } = useCategories();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  // Updated navLinks with About Us
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/products?featured=true', label: 'Featured' },
    { href: '/products?newArrivals=true', label: 'New Arrivals' },
    { href: '/about', label: 'About Us' }, // New About Us link
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-white'
        )}
      >
        {/* Top Bar */}
        <div className="bg-[#26323B] text-white py-2 px-4 text-center text-sm">
          <p>Free shipping on orders over $100 | Use code <span className="font-semibold">WELCOME10</span> for 10% off</p>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-[#26323B]" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#26323B] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">KS</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-[#26323B]">
                Elegance
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-[#455A64] hover:text-[#26323B] font-medium transition-colors relative py-2',
                    location.pathname === link.href && 'text-[#26323B]'
                  )}
                >
                  {link.label}
                  {location.pathname === link.href && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#26323B]"
                    />
                  )}
                </Link>
              ))}
              
              {/* Categories Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-[#455A64] hover:text-[#26323B] font-medium transition-colors py-2">
                  Categories
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white rounded-xl shadow-xl border border-[#F7F7F7] p-4 min-w-[200px]">
                    {categories.slice(0, 6).map((category) => (
                      <Link
                        key={category.$id}
                        to={`/products?category=${category.$id}`}
                        className="block px-4 py-2 text-[#455A64] hover:text-[#26323B] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                    {categories.length > 6 && (
                      <Link
                        to="/products"
                        className="block px-4 py-2 text-[#26323B] font-medium hover:bg-[#F7F7F7] rounded-lg transition-colors"
                      >
                        View All →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 text-[#455A64]" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors relative"
              >
                <Heart className="w-5 h-5 text-[#455A64]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#26323B] text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5 text-[#455A64]" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#26323B] text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#26323B] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {profile?.firstName?.[0] || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#455A64] hidden md:block" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#F7F7F7] overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-[#F7F7F7]">
                            <p className="font-medium text-[#26323B]">
                              {profile?.firstName} {profile?.lastName}
                            </p>
                            <p className="text-sm text-[#455A64]">{profile?.email}</p>
                          </div>
                          
                          <div className="p-2">
                            {isAdmin() && (
                              <Link
                                to="/admin"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-[#455A64] hover:text-[#26323B] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                              >
                                <LayoutDashboard className="w-5 h-5" />
                                Admin Dashboard
                              </Link>
                            )}
                            <Link
                              to="/account"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-[#455A64] hover:text-[#26323B] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                            >
                              <User className="w-5 h-5" />
                              My Account
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-[#455A64] hover:text-[#26323B] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                            >
                              <Package className="w-5 h-5" />
                              My Orders
                            </Link>
                            <Link
                              to="/account/settings"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-[#455A64] hover:text-[#26323B] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                            >
                              <Settings className="w-5 h-5" />
                              Settings
                            </Link>
                          </div>
                          
                          <div className="p-2 border-t border-[#F7F7F7]">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <LogOut className="w-5 h-5" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button
                  onClick={() => setAuthModalOpen(true)}
                  size="sm"
                  className="hidden md:flex"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="bg-white py-8 px-4"
            >
              <div className="container mx-auto max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#B0BEC5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    autoFocus
                    className="w-full pl-14 pr-14 py-4 text-lg border-2 border-[#26323B] rounded-full focus:outline-none focus:ring-4 focus:ring-[#26323B]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-[#455A64]" />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-24 md:h-28" />
    </>
  );
}