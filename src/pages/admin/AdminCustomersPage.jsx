// src/pages/admin/AdminCustomersPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Award,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  TrendingUp,
  Crown,
  Star,
  X,
  ChevronDown,
  AlertCircle,
  UserCheck,
  UserX,
  Clock,
  Send,
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../../lib/appwrite';
import { formatCurrency, formatDate, formatRelativeTime, parseJSON, cn, debounce } from '../../lib/utils';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { Skeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

// Customer status colors
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  banned: 'bg-red-100 text-red-700 border-red-200',
};

// Customer roles
const CUSTOMER_ROLES = {
  customer: { label: 'Customer', color: 'bg-blue-100 text-blue-700' },
  vip: { label: 'VIP', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-orange-100 text-orange-700' },
};

// ============================================
// Customer Details Modal Component
// ============================================
const CustomerDetailsModal = ({ isOpen, onClose, customer, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (customer) {
      setEditData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        role: customer.role || 'customer',
        isActive: customer.isActive ?? true,
        loyaltyPoints: customer.loyaltyPoints || 0,
      });
    }
  }, [customer]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        customer.$id,
        editData
      );
      toast.success('Customer updated successfully');
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !customer) return null;

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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#26323B]">
                  {customer.firstName} {customer.lastName}
                </h2>
                <p className="text-sm text-[#455A64]">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#455A64]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{customer.totalOrders || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(customer.totalSpent || 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Loyalty Points</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">{customer.loyaltyPoints || 0}</p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-[#F7F7F7] rounded-xl p-4">
                <h3 className="font-semibold text-[#26323B] mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Personal Information
                </h3>
                
                {isEditing ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editData.firstName}
                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editData.lastName}
                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Role
                      </label>
                      <select
                        value={editData.role}
                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                      >
                        <option value="customer">Customer</option>
                        <option value="vip">VIP</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Loyalty Points
                      </label>
                      <input
                        type="number"
                        value={editData.loyaltyPoints}
                        onChange={(e) => setEditData({ ...editData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#B0BEC5]" />
                      <span className="text-[#455A64]">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#B0BEC5]" />
                        <span className="text-[#455A64]">{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#B0BEC5]" />
                      <span className="text-[#455A64]">
                        Joined {formatDate(customer.$createdAt)}
                      </span>
                    </div>
                    {customer.lastLoginAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B0BEC5]" />
                        <span className="text-[#455A64]">
                          Last login {formatRelativeTime(customer.lastLoginAt)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Status */}
              <div className="bg-[#F7F7F7] rounded-xl p-4">
                <h3 className="font-semibold text-[#26323B] mb-4">Account Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    {customer.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Inactive</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {customer.isEmailVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-[#455A64]">Email Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-[#455A64]">Email Unverified</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {customer.isPhoneVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-[#455A64]">Phone Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-[#455A64]">Phone Unverified</span>
                      </>
                    )}
                  </div>
                  <Badge className={CUSTOMER_ROLES[customer.role]?.color || 'bg-gray-100'}>
                    {CUSTOMER_ROLES[customer.role]?.label || customer.role}
                  </Badge>
                </div>
              </div>

              {/* Metadata */}
              {customer.metadata && (
                <div className="bg-[#F7F7F7] rounded-xl p-4">
                  <h3 className="font-semibold text-[#26323B] mb-2">Additional Info</h3>
                  <pre className="text-xs text-[#455A64] bg-white p-3 rounded-lg overflow-auto">
                    {JSON.stringify(parseJSON(customer.metadata, {}), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#F7F7F7]">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    firstName: customer.firstName || '',
                    lastName: customer.lastName || '',
                    email: customer.email || '',
                    phone: customer.phone || '',
                    role: customer.role || 'customer',
                    isActive: customer.isActive ?? true,
                    loyaltyPoints: customer.loyaltyPoints || 0,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                isLoading={isUpdating}
              >
                Save Changes
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Main Component
// ============================================
export default function AdminCustomersPage() {
  // State
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    vip: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });

  const ITEMS_PER_PAGE = 15;

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(ITEMS_PER_PAGE),
        Query.offset((currentPage - 1) * ITEMS_PER_PAGE),
      ];

      if (roleFilter !== 'all') {
        queries.push(Query.equal('role', roleFilter));
      }

      if (statusFilter === 'active') {
        queries.push(Query.equal('isActive', true));
      } else if (statusFilter === 'inactive') {
        queries.push(Query.equal('isActive', false));
      }

      if (searchQuery.trim()) {
        queries.push(Query.search('email', searchQuery.trim()));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        queries
      );

      setCustomers(response.documents);
      setTotalCustomers(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const allCustomers = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        [Query.limit(5000)]
      );

      const newStats = {
        total: allCustomers.total,
        active: allCustomers.documents.filter(c => c.isActive).length,
        inactive: allCustomers.documents.filter(c => !c.isActive).length,
        vip: allCustomers.documents.filter(c => c.role === 'vip').length,
        totalRevenue: allCustomers.documents.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
        averageOrderValue: 0,
      };

      const totalOrders = allCustomers.documents.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
      newStats.averageOrderValue = totalOrders > 0 ? newStats.totalRevenue / totalOrders : 0;

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  // Toggle customer status
  const toggleCustomerStatus = async (customerId, currentStatus) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        customerId,
        { isActive: !currentStatus }
      );
      
      toast.success(`Customer ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchCustomers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.USERS_PROFILE,
        customerId
      );
      
      toast.success('Customer deleted');
      fetchCustomers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  // Send email (placeholder)
  const sendEmail = (customer) => {
    toast.success(`Email draft opened for ${customer.email}`);
    // Implement actual email sending logic
  };

  // Export customers
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Orders', 'Total Spent', 'Loyalty Points', 'Joined'].join(','),
      ...customers.map(customer => [
        `${customer.firstName} ${customer.lastName}`,
        customer.email,
        customer.phone || '',
        customer.role,
        customer.isActive ? 'Active' : 'Inactive',
        customer.totalOrders || 0,
        customer.totalSpent || 0,
        customer.loyaltyPoints || 0,
        formatDate(customer.$createdAt),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Customers exported');
  };

  // Stats cards
  const statsCards = [
    { label: 'Total Customers', value: stats.total, icon: Users, color: 'bg-blue-500' },
    { label: 'Active', value: stats.active, icon: UserCheck, color: 'bg-green-500' },
    { label: 'VIP Members', value: stats.vip, icon: Crown, color: 'bg-purple-500' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Avg Order Value', value: formatCurrency(stats.averageOrderValue), icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Customers</h1>
          <p className="text-[#455A64]">
            Manage customer accounts and relationships • {totalCustomers} total customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            icon={RefreshCw}
            onClick={() => {
              fetchCustomers();
              fetchStats();
            }}
          >
            Refresh
          </Button>
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export
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
              placeholder="Search by email, name..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vip">VIP</option>
              <option value="admin">Admin</option>
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

        {(roleFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F7F7F7]">
            <span className="text-sm text-[#455A64]">Active filters:</span>
            
            {roleFilter !== 'all' && (
              <button
                onClick={() => setRoleFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
              >
                Role: {roleFilter}
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
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="text-sm text-[#455A64] hover:text-[#26323B] underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#26323B] mb-2">No customers found</h3>
            <p className="text-[#455A64]">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Customers will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-[#F7F7F7] border-b border-[#E0E0E0] text-sm font-medium text-[#455A64]">
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-1">Orders</div>
              <div className="col-span-2">Total Spent</div>
              <div className="col-span-1">Points</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#F7F7F7]">
              {customers.map((customer, index) => (
                <motion.div
                  key={customer.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 lg:py-4 hover:bg-[#F7F7F7]/50 transition-colors"
                >
                  {/* Customer Info */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {customer.firstName?.[0]}{customer.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#26323B] truncate">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-[#455A64] truncate">{customer.email}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="lg:col-span-2">
                    {customer.phone ? (
                      <div className="flex items-center gap-2 text-sm text-[#455A64]">
                        <Phone className="w-4 h-4 text-[#B0BEC5]" />
                        {customer.phone}
                      </div>
                    ) : (
                      <span className="text-sm text-[#B0BEC5]">No phone</span>
                    )}
                  </div>

                  {/* Orders */}
                  <div className="lg:col-span-1">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-[#F7F7F7] rounded-lg text-sm font-medium text-[#26323B]">
                      {customer.totalOrders || 0}
                    </span>
                  </div>

                  {/* Total Spent */}
                  <div className="lg:col-span-2">
                    <p className="font-bold text-[#26323B]">
                      {formatCurrency(customer.totalSpent || 0)}
                    </p>
                    <p className="text-xs text-[#455A64]">
                      Avg: {formatCurrency((customer.totalSpent || 0) / (customer.totalOrders || 1))}
                    </p>
                  </div>

                  {/* Loyalty Points */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-[#26323B]">{customer.loyaltyPoints || 0}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2 flex items-center gap-2">
                    <Badge className={cn("border", customer.isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive)}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={CUSTOMER_ROLES[customer.role]?.color || 'bg-gray-100'}>
                      {CUSTOMER_ROLES[customer.role]?.label || customer.role}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Eye}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowDetails(true);
                      }}
                      title="View Details"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Mail}
                      onClick={() => sendEmail(customer)}
                      title="Send Email"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={customer.isActive ? Ban : CheckCircle}
                      onClick={() => toggleCustomerStatus(customer.$id, customer.isActive)}
                      title={customer.isActive ? 'Deactivate' : 'Activate'}
                      className={customer.isActive ? 'text-red-500' : 'text-green-500'}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && customers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#455A64]">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCustomers)} of {totalCustomers} customers
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onUpdate={() => {
          fetchCustomers();
          fetchStats();
        }}
      />
    </div>
  );
}