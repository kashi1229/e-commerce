// src/pages/AccountPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  Heart,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Edit,
  Camera,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Shield,
  AlertCircle,
  Star,
  Tag,
  Globe,
  ExternalLink,
  Home,
  Building,
} from 'lucide-react';

import useAuthStore from '../store/authStore';
import useAccountStore from '../store/accountStore';
import useWishlistStore from '../store/wishlistStore';
import Button from '../components/common/Button';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { profileService } from '../services/profileService';
import toast from 'react-hot-toast';

// ============================================
// CONSTANTS
// ============================================
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RefreshCw },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 
  'Germany', 'France', 'Japan', 'India', 'Brazil', 'Mexico'
];

// ============================================
// UTILITY COMPONENTS
// ============================================

function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={cn('animate-spin text-slate-400', sizes[size], className)} />;
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}

function FormInput({ label, error, required, className, ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2.5 border rounded-xl transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
          error ? "border-red-500 bg-red-50" : "border-slate-300",
          props.disabled && "bg-slate-100 cursor-not-allowed text-slate-500"
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, error, required, options, className, ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        className={cn(
          "w-full px-4 py-2.5 border rounded-xl bg-white transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
          error ? "border-red-500 bg-red-50" : "border-slate-300",
          props.disabled && "bg-slate-100 cursor-not-allowed text-slate-500"
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ============================================
// AVATAR UPLOAD COMPONENT
// ============================================

function AvatarUpload({ profile, onUpload, isUploading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    onUpload(file);
  };

  const avatarUrl = profile?.avatar ? profileService.getAvatarUrl(profile.avatar) : null;
  const initials = profile?.firstName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-4 ring-white/20">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-4xl font-bold">{initials}</span>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ============================================
// ORDER CARD COMPONENT
// ============================================

function OrderCard({ order, onView }) {
  const status = ORDER_STATUS[order.status?.toLowerCase()] || ORDER_STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-slate-900">
            Order #{order.orderNumber || order.$id?.slice(-8).toUpperCase()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.$createdAt)}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <p className="text-sm text-slate-500">{order.itemCount || 0} items</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onView(order)}>
          View Details
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// ADDRESS CARD COMPONENT
// ============================================

function AddressCard({ address, onEdit, onDelete, onSetDefault, isDeleting }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative bg-white border-2 rounded-xl p-4",
        address.isDefault ? "border-slate-900 bg-slate-50" : "border-slate-200"
      )}
    >
      {address.isDefault && (
        <span className="absolute -top-3 left-4 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full">
          DEFAULT
        </span>
      )}
      
      {address.label && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded mb-2">
          {address.type === 'billing' ? <Building className="w-3 h-3" /> : <Home className="w-3 h-3" />}
          {address.label}
        </span>
      )}
      
      <div className="mb-3 pt-1">
        <p className="font-semibold text-slate-900">{address.fullName}</p>
        <p className="text-sm text-slate-600 mt-1">{address.addressLine1}</p>
        {address.addressLine2 && <p className="text-sm text-slate-600">{address.addressLine2}</p>}
        <p className="text-sm text-slate-600">
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="text-sm text-slate-600">{address.country}</p>
        {address.phone && (
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {address.phone}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
        <button
          onClick={() => onEdit(address)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </button>
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.$id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Default
          </button>
        )}
        <button
          onClick={() => onDelete(address.$id)}
          disabled={isDeleting}
          className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// ADDRESS MODAL COMPONENT
// ============================================

function AddressModal({ isOpen, onClose, address, onSave, isSaving }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    type: 'shipping',
    label: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (address) {
        setForm({
          fullName: address.fullName || '',
          phone: address.phone || '',
          addressLine1: address.addressLine1 || '',
          addressLine2: address.addressLine2 || '',
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || 'United States',
          type: address.type || 'shipping',
          label: address.label || '',
          isDefault: address.isDefault || false,
        });
      } else {
        setForm({
          fullName: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'United States',
          type: 'shipping',
          label: '',
          isDefault: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, address]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!form.postalCode.trim()) e.postalCode = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
    }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{address ? 'Edit Address' : 'Add Address'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormInput
            label="Full Name"
            required
            value={form.fullName}
            onChange={(e) => updateForm('fullName', e.target.value)}
            error={errors.fullName}
            placeholder="John Doe"
          />

          <FormInput
            label="Phone"
            required
            type="tel"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            error={errors.phone}
            placeholder="+1 (555) 123-4567"
          />

          <FormInput
            label="Address Line 1"
            required
            value={form.addressLine1}
            onChange={(e) => updateForm('addressLine1', e.target.value)}
            error={errors.addressLine1}
            placeholder="123 Main Street"
          />

          <FormInput
            label="Address Line 2"
            value={form.addressLine2}
            onChange={(e) => updateForm('addressLine2', e.target.value)}
            placeholder="Apt, Suite, etc. (optional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="City"
              required
              value={form.city}
              onChange={(e) => updateForm('city', e.target.value)}
              error={errors.city}
              placeholder="New York"
            />
            <FormInput
              label="State"
              required
              value={form.state}
              onChange={(e) => updateForm('state', e.target.value)}
              error={errors.state}
              placeholder="NY"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Postal Code"
              required
              value={form.postalCode}
              onChange={(e) => updateForm('postalCode', e.target.value)}
              error={errors.postalCode}
              placeholder="10001"
            />
            <FormSelect
              label="Country"
              required
              value={form.country}
              onChange={(e) => updateForm('country', e.target.value)}
              options={COUNTRIES.map(c => ({ value: c, label: c }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Type"
              value={form.type}
              onChange={(e) => updateForm('type', e.target.value)}
              options={[
                { value: 'shipping', label: 'Shipping' },
                { value: 'billing', label: 'Billing' },
              ]}
            />
            <FormInput
              label="Label"
              value={form.label}
              onChange={(e) => updateForm('label', e.target.value)}
              placeholder="Home, Work, etc."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => updateForm('isDefault', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <label htmlFor="isDefault" className="text-sm text-slate-700">
              Set as default address
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              {address ? 'Update' : 'Add'} Address
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// NOTIFICATION ITEM COMPONENT
// ============================================

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const icons = {
    order: Package,
    shipping: Truck,
    promo: Tag,
    alert: AlertCircle,
  };
  const Icon = icons[notification.type] || Bell;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-start gap-4 p-4 border-b last:border-0",
        !notification.isRead && "bg-blue-50/50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        notification.isRead ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"
      )}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.isRead && "font-medium")}>
          {notification.title}
        </p>
        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
        
        {notification.actionUrl && (
          <a
            href={notification.actionUrl}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
          >
            {notification.actionLabel || 'View'}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(notification.$createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.$id)}
            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.$id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// SETTINGS TOGGLE COMPONENT
// ============================================

function SettingsToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-slate-900" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

// ============================================
// MAIN ACCOUNT PAGE COMPONENT
// ============================================

export default function AccountPage() {
  const navigate = useNavigate();

  // Auth Store
  const {
    isAuthenticated,
    profile,
    user,
    isLoading: authLoading,
    isInitialized,
    logout,
    updateProfile,
    uploadAvatar,
    refreshProfile,
    initialize,
  } = useAuthStore();

  // Account Store
  const {
    orders,
    ordersLoading,
    ordersTotal,
    addresses,
    addressesLoading,
    notifications,
    notificationsLoading,
    unreadCount,
    fetchOrders,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    initializeAccountData,
    reset: resetAccountStore,
  } = useAccountStore();

  // Wishlist Store
  const { items: wishlistItems, fetchWishlist, isLoading: wishlistLoading } = useWishlistStore();

  // Local State
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });

  // Settings
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newArrivals: false,
    priceDrops: false,
  });

  // Initialize auth
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Sync profile form
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: profile.gender || '',
      });
    }
  }, [profile]);

  // Load account data
  useEffect(() => {
    if (user?.$id && isAuthenticated && !dataLoaded) {
      initializeAccountData(user.$id);
      setDataLoaded(true);
    }
  }, [user?.$id, isAuthenticated, dataLoaded, initializeAccountData]);

  // Fetch tab data
  useEffect(() => {
    if (!user?.$id) return;

    switch (activeTab) {
      case 'orders':
        fetchOrders(user.$id);
        break;
      case 'addresses':
        fetchAddresses(user.$id);
        break;
      case 'notifications':
        fetchNotifications(user.$id);
        break;
      case 'wishlist':
        fetchWishlist(user.$id);
        break;
    }
  }, [activeTab, user?.$id]);

  // Page title
  useEffect(() => {
    document.title = 'My Account - Elegance';
  }, []);

  // Handlers
  const handleLogout = async () => {
    await logout();
    resetAccountStore();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleSaveProfile = async () => {
    if (!profile?.$id) {
      toast.error('Profile not found');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile(profileForm);
      if (result.success) {
        toast.success('Profile updated');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(file);
      if (result.success) {
        toast.success('Avatar updated');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveAddress = async (data) => {
    setIsSaving(true);
    try {
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.$id, data);
      } else {
        result = await addAddress(user.$id, data);
      }

      if (result.success) {
        toast.success(editingAddress ? 'Address updated' : 'Address added');
        setAddressModalOpen(false);
        setEditingAddress(null);
      } else {
        toast.error(result.error || 'Save failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setDeletingAddressId(addressId);
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        toast.success('Address deleted');
      } else {
        toast.error(result.error || 'Delete failed');
      }
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    const result = await setDefaultAddress(user.$id, addressId);
    if (result.success) {
      toast.success('Default address updated');
    } else {
      toast.error(result.error || 'Update failed');
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead(user.$id);
    if (result.success) {
      toast.success('All marked as read');
    }
  };

  // Loading state
  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to continue</h1>
          <p className="text-slate-500 mb-6">Access your account, orders, and more.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <AvatarUpload
              profile={profile}
              onUpload={handleAvatarUpload}
              isUploading={isUploadingAvatar}
            />

            <div className="text-white flex-1">
              <h1 className="text-3xl font-bold">
                {profile?.firstName || 'User'} {profile?.lastName || ''}
              </h1>
              <p className="text-white/70 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {profile?.email || user?.email}
              </p>
              <p className="text-white/50 flex items-center gap-2 mt-1 text-sm">
                <Calendar className="w-4 h-4" />
                Member since {formatDate(user?.$createdAt)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{profile?.totalOrders || 0}</p>
                <p className="text-sm text-white/70">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{profile?.loyaltyPoints || 0}</p>
                <p className="text-sm text-white/70">Points</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{formatCurrency(profile?.totalSpent || 0)}</p>
                <p className="text-sm text-white/70">Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden sticky top-24">
              <nav className="p-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      activeTab === tab.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'notifications' && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              
              <div className="p-2 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Personal Information</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => refreshProfile()}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveProfile} isLoading={isSaving}>
                            Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormInput
                      label="First Name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                      disabled={!isEditing}
                    />
                    <FormInput
                      label="Last Name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                      disabled={!isEditing}
                    />
                    <FormInput
                      label="Email"
                      value={profile?.email || ''}
                      disabled
                    />
                    <FormInput
                      label="Phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                    />
                    <FormInput
                      label="Date of Birth"
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      disabled={!isEditing}
                    />
                    <FormSelect
                      label="Gender"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                      disabled={!isEditing}
                      options={[
                        { value: '', label: 'Select gender' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </div>

                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5" />
                      Account Security
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-slate-500">Last changed: Never</p>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-slate-500">Add extra security</p>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Order History</h2>
                    <span className="text-sm text-slate-500">{ordersTotal} orders</span>
                  </div>

                  {ordersLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : orders.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No orders yet"
                      description="When you place orders, they will appear here."
                      action={<Link to="/products"><Button>Start Shopping</Button></Link>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <OrderCard
                          key={order.$id}
                          order={order}
                          onView={(o) => navigate(`/orders/${o.$id}`)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>

                  {wishlistLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : wishlistItems?.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="Your wishlist is empty"
                      description="Save items you love to your wishlist."
                      action={<Link to="/products"><Button>Browse Products</Button></Link>}
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistItems?.map((item) => (
                        <div key={item.$id} className="bg-slate-50 rounded-xl p-4 border">
                          <p className="text-sm font-medium">Product ID: {item.productId}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Added {formatDate(item.$createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Saved Addresses</h2>
                    <Button onClick={() => { setEditingAddress(null); setAddressModalOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </div>

                  {addressesLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <EmptyState
                      icon={MapPin}
                      title="No addresses saved"
                      description="Add addresses for faster checkout."
                      action={
                        <Button onClick={() => { setEditingAddress(null); setAddressModalOpen(true); }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Address
                        </Button>
                      }
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <AddressCard
                          key={address.$id}
                          address={address}
                          onEdit={(a) => { setEditingAddress(a); setAddressModalOpen(true); }}
                          onDelete={handleDeleteAddress}
                          onSetDefault={handleSetDefaultAddress}
                          isDeleting={deletingAddressId === address.$id}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                >
                  <div className="flex items-center justify-between p-6 border-b">
                    <div>
                      <h2 className="text-2xl font-bold">Notifications</h2>
                      <p className="text-sm text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark all read
                      </Button>
                    )}
                  </div>

                  {notificationsLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={Bell}
                        title="No notifications"
                        description="You're all caught up!"
                      />
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notif) => (
                        <NotificationItem
                          key={notif.$id}
                          notification={notif}
                          onMarkRead={markNotificationRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >
                  <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select className="w-full max-w-xs px-4 py-2.5 border rounded-xl">
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <select className="w-full max-w-xs px-4 py-2.5 border rounded-xl">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <SettingsToggle
                          label="Order Updates"
                          description="Get notified about order status"
                          checked={settings.orderUpdates}
                          onChange={(v) => setSettings(s => ({ ...s, orderUpdates: v }))}
                        />
                        <SettingsToggle
                          label="Promotions"
                          description="Receive deals and offers"
                          checked={settings.promotions}
                          onChange={(v) => setSettings(s => ({ ...s, promotions: v }))}
                        />
                        <SettingsToggle
                          label="New Arrivals"
                          description="Know about new products"
                          checked={settings.newArrivals}
                          onChange={(v) => setSettings(s => ({ ...s, newArrivals: v }))}
                        />
                        <SettingsToggle
                          label="Price Drops"
                          description="Alerts for wishlist items on sale"
                          checked={settings.priceDrops}
                          onChange={(v) => setSettings(s => ({ ...s, priceDrops: v }))}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-900 font-medium mb-2">Delete Account</p>
                        <p className="text-sm text-red-700 mb-4">
                          This action cannot be undone.
                        </p>
                        <Button variant="danger" size="sm">Delete My Account</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => { setAddressModalOpen(false); setEditingAddress(null); }}
        address={editingAddress}
        onSave={handleSaveAddress}
        isSaving={isSaving}
      />
    </div>
  );
}