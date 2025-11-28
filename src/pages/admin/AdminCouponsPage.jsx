// src/pages/admin/AdminCouponsPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Tag,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  RefreshCw,
  X,
  AlertCircle,
  Check,
  Percent,
  Gift,
  Truck,
  Clock,
  ChevronDown,
  Filter,
  BarChart3,
  Zap,
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../../lib/appwrite';
import { formatCurrency, formatDate, formatRelativeTime, parseJSON, cn, debounce } from '../../lib/utils';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { Skeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

// ============================================
// Constants
// ============================================
const COUPON_TYPES = {
  percentage: { label: 'Percentage', icon: Percent, color: 'bg-blue-100 text-blue-700', symbol: '%' },
  fixed: { label: 'Fixed Amount', icon: DollarSign, color: 'bg-green-100 text-green-700', symbol: '$' },
  free_shipping: { label: 'Free Shipping', icon: Truck, color: 'bg-purple-100 text-purple-700', symbol: '🚚' },
  bogo: { label: 'Buy One Get One', icon: Gift, color: 'bg-pink-100 text-pink-700', symbol: '2x' },
};

const COUPON_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' },
  scheduled: { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

// ============================================
// Coupon Modal Component
// ============================================
const CouponModal = ({ isOpen, onClose, coupon, onSave, products, categories }) => {
  const isEditing = Boolean(coupon);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    usageCount: 0,
    perUserLimit: '',
    applicableProducts: [],
    applicableCategories: [],
    excludedProducts: [],
    isActive: true,
    isPublic: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        setFormData({
          code: coupon.code || '',
          description: coupon.description || '',
          type: coupon.type || 'percentage',
          value: coupon.value || '',
          minOrderAmount: coupon.minOrderAmount || '',
          maxDiscountAmount: coupon.maxDiscountAmount || '',
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
          validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
          usageLimit: coupon.usageLimit || '',
          usageCount: coupon.usageCount || 0,
          perUserLimit: coupon.perUserLimit || '',
          applicableProducts: parseJSON(coupon.applicableProducts, []),
          applicableCategories: parseJSON(coupon.applicableCategories, []),
          excludedProducts: parseJSON(coupon.excludedProducts, []),
          isActive: coupon.isActive ?? true,
          isPublic: coupon.isPublic ?? true,
        });
      } else {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setFormData({
          code: '',
          description: '',
          type: 'percentage',
          value: '',
          minOrderAmount: '',
          maxDiscountAmount: '',
          validFrom: now.toISOString().slice(0, 16),
          validUntil: nextWeek.toISOString().slice(0, 16),
          usageLimit: '',
          usageCount: 0,
          perUserLimit: '',
          applicableProducts: [],
          applicableCategories: [],
          excludedProducts: [],
          isActive: true,
          isPublic: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, coupon]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateCode = () => {
    const code = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    handleChange('code', code);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Code must be 50 characters or less';
    }

    if (!formData.type) {
      newErrors.type = 'Discount type is required';
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valid discount value is required';
    } else if (formData.type === 'percentage' && parseFloat(formData.value) > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'End date is required';
    } else if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      newErrors.validUntil = 'End date must be after start date';
    }

    if (formData.minOrderAmount && parseFloat(formData.minOrderAmount) < 0) {
      newErrors.minOrderAmount = 'Cannot be negative';
    }

    if (formData.maxDiscountAmount && parseFloat(formData.maxDiscountAmount) <= 0) {
      newErrors.maxDiscountAmount = 'Must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const couponData = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usageCount: parseInt(formData.usageCount) || 0,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
        applicableProducts: formData.applicableProducts.length > 0 ? JSON.stringify(formData.applicableProducts) : null,
        applicableCategories: formData.applicableCategories.length > 0 ? JSON.stringify(formData.applicableCategories) : null,
        excludedProducts: formData.excludedProducts.length > 0 ? JSON.stringify(formData.excludedProducts) : null,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
      };

      if (isEditing) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.COUPONS,
          coupon.$id,
          couponData
        );
        toast.success('Coupon updated successfully');
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.COUPONS,
          ID.unique(),
          couponData
        );
        toast.success('Coupon created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving coupon:', error);
      if (error.message?.includes('code') || error.message?.includes('unique')) {
        setErrors({ code: 'This coupon code already exists' });
        toast.error('Coupon code already exists');
      } else {
        toast.error('Failed to save coupon');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentType = COUPON_TYPES[formData.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#F7F7F7]">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentType.color)}>
                <currentType.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#26323B]">
                  {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
                </h2>
                <p className="text-sm text-[#455A64]">
                  {isEditing ? 'Update coupon details' : 'Add a new discount coupon'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#455A64]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Coupon Code */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                      placeholder="SAVE20"
                      maxLength={50}
                      className={cn(
                        "flex-1 px-4 py-3 border-2 rounded-xl transition-all",
                        "focus:outline-none focus:ring-4 focus:border-[#26323B]",
                        errors.code
                          ? "border-red-500 bg-red-50/30 focus:ring-red-500/20"
                          : "border-[#E0E0E0] hover:border-[#B0BEC5] focus:ring-[#26323B]/10"
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCode}
                      title="Generate Code"
                      className="px-3"
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                  {errors.code && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#26323B]/10 focus:border-[#26323B]"
                  >
                    {Object.entries(COUPON_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of this coupon..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#26323B]/10 focus:border-[#26323B] resize-none"
                />
                <p className="mt-1 text-xs text-[#B0BEC5] text-right">
                  {formData.description.length}/500
                </p>
              </div>

              {/* Discount Value & Limits */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.type === 'percentage' ? 100 : undefined}
                      value={formData.value}
                      onChange={(e) => handleChange('value', e.target.value)}
                      placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                      className={cn(
                        "w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all",
                        "focus:outline-none focus:ring-4 focus:border-[#26323B]",
                        errors.value
                          ? "border-red-500 bg-red-50/30 focus:ring-red-500/20"
                          : "border-[#E0E0E0] hover:border-[#B0BEC5] focus:ring-[#26323B]/10"
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#455A64] font-medium">
                      {currentType.symbol}
                    </span>
                  </div>
                  {errors.value && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.value}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Min Order Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0BEC5]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minOrderAmount}
                      onChange={(e) => handleChange('minOrderAmount', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border-2 border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#26323B]/10 focus:border-[#26323B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Max Discount Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0BEC5]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => handleChange('maxDiscountAmount', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border-2 border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#26323B]/10 focus:border-[#26323B]"
                    />
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => handleChange('validFrom', e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 border-2 rounded-xl transition-all",
                      "focus:outline-none focus:ring-4 focus:border-[#26323B]",
                      errors.validFrom
                        ? "border-red-500 bg-red-50/30 focus:ring-red-500/20"
                        : "border-[#E0E0E0] hover:border-[#B0BEC5] focus:ring-[#26323B]/10"
                    )}
                  />
                  {errors.validFrom && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.validFrom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => handleChange('validUntil', e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 border-2 rounded-xl transition-all",
                      "focus:outline-none focus:ring-4 focus:border-[#26323B]",
                      errors.validUntil
                        ? "border-red-500 bg-red-50/30 focus:ring-red-500/20"
                        : "border-[#E0E0E0] hover:border-[#B0BEC5] focus:ring-[#26323B]/10"
                    )}
                  />
                  {errors.validUntil && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.validUntil}</p>
                  )}
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => handleChange('usageLimit', e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 border-2 border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#26323B]/10 focus:border-[#26323B]"
                  />
                  <p className="mt-1 text-xs text-[#B0BEC5]">Leave empty for unlimited</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#26323B] mb-1.5">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.perUserLimit}
                    onChange={(e) => handleChange('perUserLimit', e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 border-2 border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#26323B]/10 focus:border-[#26323B]"
                  />
                  <p className="mt-1 text-xs text-[#B0BEC5]">Max uses per customer</p>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#F7F7F7] rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors",
                      formData.isActive ? "bg-green-500" : "bg-[#B0BEC5]"
                    )}>
                      <div className={cn(
                        "w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5",
                        formData.isActive ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-[#26323B]">Active</p>
                    <p className="text-xs text-[#455A64]">Coupon can be used</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => handleChange('isPublic', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors",
                      formData.isPublic ? "bg-blue-500" : "bg-[#B0BEC5]"
                    )}>
                      <div className={cn(
                        "w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5",
                        formData.isPublic ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-[#26323B]">Public</p>
                    <p className="text-xs text-[#455A64]">Visible to all users</p>
                  </div>
                </label>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#F7F7F7]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isLoading}
              icon={isEditing ? Check : Plus}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Delete Confirmation Modal
// ============================================
const DeleteModal = ({ isOpen, onClose, onConfirm, coupon, isLoading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[#26323B] mb-2">
              Delete Coupon
            </h3>
            <p className="text-[#455A64] mb-6">
              Are you sure you want to delete coupon <strong>"{coupon?.code}"</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                isLoading={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Main Component
// ============================================
export default function AdminCouponsPage() {
  // State
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    scheduled: 0,
    totalUsage: 0,
    totalDiscount: 0,
  });

  const ITEMS_PER_PAGE = 15;

  // Fetch coupons
  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(ITEMS_PER_PAGE),
        Query.offset((currentPage - 1) * ITEMS_PER_PAGE),
      ];

      if (typeFilter !== 'all') {
        queries.push(Query.equal('type', typeFilter));
      }

      if (statusFilter === 'active') {
        queries.push(Query.equal('isActive', true));
      } else if (statusFilter === 'inactive') {
        queries.push(Query.equal('isActive', false));
      }

      if (searchQuery.trim()) {
        queries.push(Query.search('code', searchQuery.trim()));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        queries
      );

      setCoupons(response.documents);
      setTotalCoupons(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const allCoupons = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        [Query.limit(5000)]
      );

      const now = new Date();
      const newStats = {
        total: allCoupons.total,
        active: 0,
        expired: 0,
        scheduled: 0,
        totalUsage: 0,
        totalDiscount: 0,
      };

      allCoupons.documents.forEach(coupon => {
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (coupon.isActive && now >= validFrom && now <= validUntil) {
          newStats.active++;
        } else if (now > validUntil) {
          newStats.expired++;
        } else if (now < validFrom) {
          newStats.scheduled++;
        }

        newStats.totalUsage += coupon.usageCount || 0;
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Get coupon status
  const getCouponStatus = (coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) return 'inactive';
    if (now > validUntil) return 'expired';
    if (now < validFrom) return 'scheduled';
    return 'active';
  };

  // Copy code to clipboard
  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied!');
  };

  // Toggle coupon status
  const toggleCouponStatus = async (couponId, currentStatus) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        couponId,
        { isActive: !currentStatus }
      );
      
      toast.success(`Coupon ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchCoupons();
      fetchStats();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete coupon
  const handleDelete = async () => {
    if (!deletingCoupon) return;

    setIsDeleting(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        deletingCoupon.$id
      );
      
      toast.success('Coupon deleted successfully');
      fetchCoupons();
      fetchStats();
      setShowDeleteModal(false);
      setDeletingCoupon(null);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export coupons
  const handleExport = () => {
    const csvContent = [
      ['Code', 'Type', 'Value', 'Valid From', 'Valid Until', 'Usage', 'Status'].join(','),
      ...coupons.map(coupon => [
        coupon.code,
        coupon.type,
        coupon.value,
        formatDate(coupon.validFrom),
        formatDate(coupon.validUntil),
        `${coupon.usageCount}/${coupon.usageLimit || '∞'}`,
        getCouponStatus(coupon),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Coupons exported');
  };

  // Stats cards
  const statsCards = [
    { label: 'Total Coupons', value: stats.total, icon: Tag, color: 'bg-blue-500' },
    { label: 'Active', value: stats.active, icon: Check, color: 'bg-green-500' },
    { label: 'Expired', value: stats.expired, icon: Clock, color: 'bg-red-500' },
    { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'bg-yellow-500' },
    { label: 'Total Usage', value: stats.totalUsage, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Avg. Usage', value: stats.total > 0 ? Math.round(stats.totalUsage / stats.total) : 0, icon: BarChart3, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Discount Coupons</h1>
          <p className="text-[#455A64]">
            Create and manage promotional discount codes • {totalCoupons} total coupons
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            icon={RefreshCw}
            onClick={() => {
              fetchCoupons();
              fetchStats();
            }}
          >
            Refresh
          </Button>
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export
          </Button>
          <Button icon={Plus} onClick={() => {
            setEditingCoupon(null);
            setShowModal(true);
          }}>
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-[#455A64]">{stat.label}</p>
            <p className="text-2xl font-bold text-[#26323B]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
            <input
              type="text"
              placeholder="Search by coupon code..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Types</option>
              {Object.entries(COUPON_TYPES).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {(typeFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F7F7F7]">
            <span className="text-sm text-[#455A64]">Active filters:</span>
            
            {typeFilter !== 'all' && (
              <button
                onClick={() => setTypeFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
              >
                Type: {COUPON_TYPES[typeFilter]?.label}
                <X className="w-3 h-3" />
              </button>
            )}
            
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
              >
                Status: {statusFilter}
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="text-sm text-[#455A64] hover:text-[#26323B] underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-24 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#26323B] mb-2">No coupons found</h3>
            <p className="text-[#455A64] mb-6">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first discount coupon to get started'}
            </p>
            {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
              <Button icon={Plus} onClick={() => setShowModal(true)}>
                Create Coupon
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-[#F7F7F7] border-b border-[#E0E0E0] text-sm font-medium text-[#455A64]">
              <div className="col-span-2">Code</div>
              <div className="col-span-2">Type & Value</div>
              <div className="col-span-3">Validity Period</div>
              <div className="col-span-2">Usage</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#F7F7F7]">
              {coupons.map((coupon, index) => {
                const status = getCouponStatus(coupon);
                const typeInfo = COUPON_TYPES[coupon.type];
                const statusInfo = COUPON_STATUS[status];

                return (
                  <motion.div
                    key={coupon.$id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 lg:py-4 hover:bg-[#F7F7F7]/50 transition-colors"
                  >
                    {/* Code */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-[#26323B] text-white font-mono text-sm font-bold rounded-lg">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCouponCode(coupon.code)}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4 text-[#455A64]" />
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-[#B0BEC5] mt-1 truncate">{coupon.description}</p>
                      )}
                    </div>

                    {/* Type & Value */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", typeInfo.color)}>
                          <typeInfo.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#26323B]">
                            {coupon.value}{typeInfo.symbol}
                          </p>
                          <p className="text-xs text-[#455A64]">{typeInfo.label}</p>
                        </div>
                      </div>
                      {coupon.minOrderAmount && (
                        <p className="text-xs text-[#B0BEC5] mt-1">
                          Min: {formatCurrency(coupon.minOrderAmount)}
                        </p>
                      )}
                    </div>

                    {/* Validity */}
                    <div className="lg:col-span-3 text-sm">
                      <div className="flex items-center gap-1 text-[#455A64]">
                        <Calendar className="w-4 h-4 text-[#B0BEC5]" />
                        <span>{formatDate(coupon.validFrom)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#455A64] mt-0.5">
                        <span className="w-4 text-center">→</span>
                        <span>{formatDate(coupon.validUntil)}</span>
                      </div>
                    </div>

                    {/* Usage */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#455A64]">
                              {coupon.usageCount}/{coupon.usageLimit || '∞'}
                            </span>
                          </div>
                          <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{
                                width: coupon.usageLimit
                                  ? `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%`
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {coupon.perUserLimit && (
                        <p className="text-xs text-[#B0BEC5] mt-1">
                          {coupon.perUserLimit} per user
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="lg:col-span-2">
                      <Badge className={cn("border", statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                      {!coupon.isPublic && (
                        <Badge className="mt-1 bg-gray-100 text-gray-700">
                          Private
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit}
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setShowModal(true);
                        }}
                        title="Edit"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={coupon.isActive ? EyeOff : Eye}
                        onClick={() => toggleCouponStatus(coupon.$id, coupon.isActive)}
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        className={coupon.isActive ? 'text-orange-500' : 'text-green-500'}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => {
                          setDeletingCoupon(coupon);
                          setShowDeleteModal(true);
                        }}
                        title="Delete"
                        className="text-red-500"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && coupons.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#455A64]">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCoupons)} of {totalCoupons} coupons
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <CouponModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCoupon(null);
        }}
        coupon={editingCoupon}
        onSave={() => {
          fetchCoupons();
          fetchStats();
        }}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingCoupon(null);
        }}
        coupon={deletingCoupon}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}