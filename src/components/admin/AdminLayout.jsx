// src/components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  BarChart3,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Folder,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { cn } from '../../lib/utils';
import CategoriesPage from '../../pages/admin/CategoriesPage';
import { LoadingPage } from '../common/Loading';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Folder },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout, isAdmin, isLoading } = useAuthStore();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Check admin access
  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAdmin, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAdmin()) {
    return null;
  }

  const isActiveLink = (href, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E0E0E0] px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-[#F7F7F7] rounded-lg"
          >
            <Menu className="w-6 h-6 text-[#455A64]" />
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#26323B] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="font-bold text-[#26323B]">Admin</span>
          </Link>

          <button className="p-2 hover:bg-[#F7F7F7] rounded-lg relative">
            <Bell className="w-6 h-6 text-[#455A64]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:hidden"
            >
              <SidebarContent
                links={sidebarLinks}
                isActiveLink={isActiveLink}
                profile={profile}
                onLogout={handleLogout}
                onClose={() => setMobileMenuOpen(false)}
                showClose
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-[#E0E0E0] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <SidebarContent
          links={sidebarLinks}
          isActiveLink={isActiveLink}
          profile={profile}
          onLogout={handleLogout}
          collapsed={!sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-16 lg:pt-0 transition-all duration-300",
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-[#E0E0E0] px-6 py-4 sticky top-0 z-20">
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 hover:bg-[#F7F7F7] rounded-lg relative">
              <Bell className="w-5 h-5 text-[#455A64]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Help */}
            <button className="p-2 hover:bg-[#F7F7F7] rounded-lg">
              <HelpCircle className="w-5 h-5 text-[#455A64]" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-[#F7F7F7] rounded-lg"
              >
                <div className="w-8 h-8 bg-[#26323B] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {profile?.firstName?.[0] || 'A'}
                  </span>
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium text-[#26323B]">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <p className="text-xs text-[#455A64]">Administrator</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#455A64]" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-50"
                    >
                      <Link
                        to="/admin/settings"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#455A64] hover:bg-[#F7F7F7]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <Link
                        to="/"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#455A64] hover:bg-[#F7F7F7]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        View Store
                      </Link>
                      <hr className="border-[#E0E0E0]" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Sidebar Content Component
function SidebarContent({
  links,
  isActiveLink,
  profile,
  onLogout,
  onClose,
  showClose = false,
  collapsed = false,
  onToggle,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#26323B] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-[#26323B]">Elegance</span>
              <span className="block text-xs text-[#455A64]">Admin Panel</span>
            </div>
          )}
        </Link>
        
        {showClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F7F7F7] rounded-lg lg:hidden"
          >
            <X className="w-5 h-5 text-[#455A64]" />
          </button>
        )}

        {!showClose && onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-[#F7F7F7] rounded-lg hidden lg:block"
          >
            <Menu className="w-5 h-5 text-[#455A64]" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = isActiveLink(link.href, link.exact);
            
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
                    isActive
                      ? "bg-[#26323B] text-white"
                      : "text-[#455A64] hover:bg-[#F7F7F7]"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{link.label}</span>}
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                    />
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#26323B] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {link.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#E0E0E0]">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 bg-[#F7F7F7] rounded-xl">
            <div className="w-10 h-10 bg-[#26323B] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {profile?.firstName?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#26323B] truncate">
                {profile?.firstName} {profile?.lastName}
              </p>
              <p className="text-xs text-[#455A64]">Administrator</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-[#26323B] rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {profile?.firstName?.[0] || 'A'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-3 w-full mt-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}