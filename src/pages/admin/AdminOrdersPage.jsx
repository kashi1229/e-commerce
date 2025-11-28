// src/pages/admin/AdminOrdersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  MoreVertical,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  Printer,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  ArrowUpRight,
  TrendingUp,
  ShoppingBag,
  Ban,
  PlayCircle,
  CheckCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../../lib/appwrite';
import { formatCurrency, formatDate, formatRelativeTime, parseJSON, cn, debounce } from '../../lib/utils';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Input from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../lib/constants';
import toast from 'react-hot-toast';

// ============================================
// Confirmation Modal Component
// ============================================
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = 'bg-red-600 hover:bg-red-700', isLoading }) => {
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
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[#26323B] mb-2">{title}</h3>
            <p className="text-[#455A64] mb-6">{message}</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                isLoading={isLoading}
                className={confirmColor}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Order Details Modal Component
// ============================================
const OrderDetailsModal = ({ 
  isOpen, 
  onClose, 
  order, 
  orderItems, 
  loadingItems,
  onUpdateStatus,
  onUpdatePayment,
  onAddTracking,
  isUpdating 
}) => {
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    trackingUrl: '',
    shippingCarrier: '',
  });

  if (!isOpen || !order) return null;

  const handleAddTracking = async () => {
    if (!trackingData.trackingNumber) {
      toast.error('Please enter a tracking number');
      return;
    }
    await onAddTracking(trackingData);
    setShowTrackingForm(false);
    setTrackingData({ trackingNumber: '', trackingUrl: '', shippingCarrier: '' });
  };

  const shippingAddress = parseJSON(order.shippingAddress, {});

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
            <div>
              <h2 className="text-xl font-bold text-[#26323B] mb-1">
                Order {order.orderNumber}
              </h2>
              <p className="text-sm text-[#455A64]">
                {formatDate(order.$createdAt)} at {new Date(order.$createdAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#455A64]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Status & Payment */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#F7F7F7] rounded-xl p-4">
                <label className="block text-sm font-medium text-[#455A64] mb-2">
                  Order Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.$id, e.target.value)}
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(ORDER_STATUS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#F7F7F7] rounded-xl p-4">
                <label className="block text-sm font-medium text-[#455A64] mb-2">
                  Payment Status
                </label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => onUpdatePayment(order.$id, e.target.value)}
                  disabled={isUpdating}
                  className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Object.entries(PAYMENT_STATUS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#F7F7F7] rounded-xl p-4">
                <h4 className="font-semibold text-[#26323B] mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-[#26323B]">{shippingAddress.fullName || 'N/A'}</p>
                  <p className="text-[#455A64] flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.customerEmail || 'N/A'}
                  </p>
                  <p className="text-[#455A64] flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {shippingAddress.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-[#F7F7F7] rounded-xl p-4">
                <h4 className="font-semibold text-[#26323B] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h4>
                <div className="space-y-1 text-sm text-[#455A64]">
                  <p>{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                  <p>{shippingAddress.country}</p>
                </div>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber ? (
              <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Tracking Information
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-purple-600 mb-1">Carrier</p>
                    <p className="font-medium text-purple-900">{order.shippingCarrier || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-purple-600 mb-1">Tracking Number</p>
                    <p className="font-medium text-purple-900 font-mono">{order.trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-purple-600 mb-1">Shipped Date</p>
                    <p className="font-medium text-purple-900">
                      {order.shippedAt ? formatDate(order.shippedAt) : 'N/A'}
                    </p>
                  </div>
                </div>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-purple-700 hover:text-purple-900 font-medium"
                  >
                    Track Package <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : order.status === 'processing' && !showTrackingForm ? (
              <div className="mb-6">
                <Button
                  variant="outline"
                  icon={Truck}
                  onClick={() => setShowTrackingForm(true)}
                  className="w-full"
                >
                  Add Tracking Information
                </Button>
              </div>
            ) : null}

            {/* Tracking Form */}
            {showTrackingForm && (
              <div className="bg-[#F7F7F7] rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-[#26323B] mb-4">Add Tracking Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                      Shipping Carrier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={trackingData.shippingCarrier}
                      onChange={(e) => setTrackingData({ ...trackingData, shippingCarrier: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                    >
                      <option value="">Select carrier</option>
                      <option value="UPS">UPS</option>
                      <option value="FedEx">FedEx</option>
                      <option value="USPS">USPS</option>
                      <option value="DHL">DHL</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Tracking Number"
                    value={trackingData.trackingNumber}
                    onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number"
                    required
                  />

                  <Input
                    label="Tracking URL (Optional)"
                    value={trackingData.trackingUrl}
                    onChange={(e) => setTrackingData({ ...trackingData, trackingUrl: e.target.value })}
                    placeholder="https://..."
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTrackingForm(false);
                        setTrackingData({ trackingNumber: '', trackingUrl: '', shippingCarrier: '' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddTracking}
                      isLoading={isUpdating}
                      icon={Truck}
                      className="flex-1"
                    >
                      Add & Mark Shipped
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-semibold text-[#26323B] mb-4">
                Order Items ({order.itemCount})
              </h4>
              
              {loadingItems ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.$id} className="flex gap-4 p-4 bg-[#F7F7F7] rounded-xl">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.productImage || 'https://via.placeholder.com/64'}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#26323B] truncate">{item.productName}</p>
                        <p className="text-sm text-[#455A64]">SKU: {item.sku}</p>
                        <p className="text-sm text-[#455A64]">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#26323B]">{formatCurrency(item.total)}</p>
                        <p className="text-sm text-[#455A64]">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-[#F7F7F7] rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-[#26323B] mb-4">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#455A64]">Subtotal</span>
                  <span className="text-[#26323B]">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#455A64]">Shipping</span>
                  <span className="text-[#26323B]">
                    {order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#455A64]">Tax</span>
                  <span className="text-[#26323B]">{formatCurrency(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-[#E0E0E0] text-lg font-bold">
                  <span className="text-[#26323B]">Total</span>
                  <span className="text-[#26323B]">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Customer Notes
                </h4>
                <p className="text-sm text-yellow-800">{order.customerNotes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#F7F7F7]">
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Main Component
// ============================================
export default function AdminOrdersPage() {
  const navigate = useNavigate();
  
  // State
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    orderId: null,
    action: null,
    title: '',
    message: '',
  });

  const ITEMS_PER_PAGE = 15;

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(ITEMS_PER_PAGE),
        Query.offset((currentPage - 1) * ITEMS_PER_PAGE),
      ];

      if (statusFilter !== 'all') {
        queries.push(Query.equal('status', statusFilter));
      }

      if (paymentFilter !== 'all') {
        queries.push(Query.equal('paymentStatus', paymentFilter));
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
        
        if (startDate) {
          queries.push(Query.greaterThanEqual('$createdAt', startDate.toISOString()));
        }
      }

      if (searchQuery.trim()) {
        queries.push(Query.search('orderNumber', searchQuery.trim()));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        queries
      );

      setOrders(response.documents);
      setTotalOrders(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, paymentFilter, dateFilter, searchQuery, currentPage]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const allOrders = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.limit(1000)]
      );

      const newStats = {
        total: allOrders.total,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        revenue: 0,
      };

      allOrders.documents.forEach(order => {
        if (order.status && newStats.hasOwnProperty(order.status)) {
          newStats[order.status]++;
        }
        if (order.paymentStatus === 'paid') {
          newStats.revenue += order.total || 0;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  // Fetch order items
  const fetchOrderItems = async (orderId) => {
    try {
      setLoadingItems(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDER_ITEMS,
        [Query.equal('orderId', orderId)]
      );
      setOrderItems(response.documents);
    } catch (error) {
      console.error('Error fetching order items:', error);
      toast.error('Failed to load order items');
    } finally {
      setLoadingItems(false);
    }
  };

  // View order details
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    await fetchOrderItems(order.$id);
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'shipped') {
        updateData.shippedAt = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updateData.cancelledAt = new Date().toISOString();
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        orderId,
        updateData
      );
      
      setOrders(prev => prev.map(order => 
        order.$id === orderId ? { ...order, ...updateData } : order
      ));

      if (selectedOrder?.$id === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updateData }));
      }
      
      toast.success(`Order status updated to ${ORDER_STATUS[newStatus]?.label || newStatus}`);
      fetchStats();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
      setConfirmModal({ isOpen: false, orderId: null, action: null, title: '', message: '' });
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        orderId,
        { paymentStatus: newStatus }
      );
      
      setOrders(prev => prev.map(order => 
        order.$id === orderId ? { ...order, paymentStatus: newStatus } : order
      ));

      if (selectedOrder?.$id === orderId) {
        setSelectedOrder(prev => ({ ...prev, paymentStatus: newStatus }));
      }
      
      toast.success('Payment status updated');
      fetchStats();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add tracking info
  const handleAddTracking = async (trackingData) => {
    if (!selectedOrder || !trackingData.trackingNumber) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsUpdating(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        selectedOrder.$id,
        {
          trackingNumber: trackingData.trackingNumber,
          trackingUrl: trackingData.trackingUrl || null,
          shippingCarrier: trackingData.shippingCarrier || null,
          status: 'shipped',
          shippedAt: new Date().toISOString(),
        }
      );

      setSelectedOrder(prev => ({
        ...prev,
        ...trackingData,
        status: 'shipped',
        shippedAt: new Date().toISOString(),
      }));

      setOrders(prev => prev.map(order =>
        order.$id === selectedOrder.$id
          ? { ...order, ...trackingData, status: 'shipped' }
          : order
      ));

      toast.success('Tracking information added');
      fetchStats();
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast.error('Failed to add tracking information');
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick action handlers
  const handleQuickAction = (orderId, action) => {
    const order = orders.find(o => o.$id === orderId);
    if (!order) return;

    const confirmations = {
      confirm: {
        title: 'Confirm Order',
        message: `Are you sure you want to confirm order ${order.orderNumber}?`,
        status: 'confirmed',
      },
      process: {
        title: 'Start Processing',
        message: `Mark order ${order.orderNumber} as processing?`,
        status: 'processing',
      },
      cancel: {
        title: 'Cancel Order',
        message: `Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`,
        status: 'cancelled',
      },
      deliver: {
        title: 'Mark as Delivered',
        message: `Confirm that order ${order.orderNumber} has been delivered?`,
        status: 'delivered',
      },
    };

    const config = confirmations[action];
    if (config) {
      setConfirmModal({
        isOpen: true,
        orderId,
        action: config.status,
        title: config.title,
        message: config.message,
      });
    }
  };

  // Export orders
  const handleExport = () => {
    const csvContent = [
      ['Order Number', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Payment'].join(','),
      ...orders.map(order => {
        const shipping = parseJSON(order.shippingAddress, {});
        return [
          order.orderNumber,
          formatDate(order.$createdAt),
          shipping.fullName || 'N/A',
          order.itemCount,
          order.total,
          order.status,
          order.paymentStatus,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Orders exported successfully');
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Stats cards data
  const statsCards = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'bg-[#26323B]' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500', urgent: stats.pending > 5 },
    { label: 'Processing', value: stats.processing, icon: Package, color: 'bg-blue-500' },
    { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'bg-purple-500' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Orders</h1>
          <p className="text-[#455A64]">
            Manage and track customer orders • {totalOrders} total orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            icon={RefreshCw}
            onClick={() => {
              fetchOrders();
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
            className={cn(
              "bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7] relative overflow-hidden",
              stat.urgent && "ring-2 ring-yellow-400"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-[#455A64]">{stat.label}</p>
            <p className="text-2xl font-bold text-[#26323B]">{stat.value}</p>
            {stat.urgent && (
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
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
              placeholder="Search by order number..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Status</option>
              {Object.entries(ORDER_STATUS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Payments</option>
              {Object.entries(PAYMENT_STATUS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {(statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F7F7F7]">
            <span className="text-sm text-[#455A64]">Active filters:</span>
            
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
              >
                Status: {ORDER_STATUS[statusFilter]?.label}
                <X className="w-3 h-3" />
              </button>
            )}
            
            {paymentFilter !== 'all' && (
              <button
                onClick={() => setPaymentFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
              >
                Payment: {PAYMENT_STATUS[paymentFilter]?.label}
                <X className="w-3 h-3" />
              </button>
            )}
            
            {dateFilter !== 'all' && (
              <button
                onClick={() => setDateFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
              >
                Date: {dateFilter}
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => {
                setStatusFilter('all');
                setPaymentFilter('all');
                setDateFilter('all');
              }}
              className="text-sm text-[#455A64] hover:text-[#26323B] underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#26323B] mb-2">No orders found</h3>
            <p className="text-[#455A64]">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-[#F7F7F7] border-b border-[#E0E0E0] text-sm font-medium text-[#455A64]">
              <div className="col-span-2">Order</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Items</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#F7F7F7]">
              {orders.map((order, index) => {
                const shippingAddress = parseJSON(order.shippingAddress, {});
                
                return (
                  <motion.div
                    key={order.$id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 lg:py-4 hover:bg-[#F7F7F7]/50 transition-colors"
                  >
                    {/* Order Number */}
                    <div className="lg:col-span-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="font-semibold text-[#26323B] hover:text-[#455A64] flex items-center gap-1 group"
                      >
                        {order.orderNumber}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-xs text-[#B0BEC5] mt-0.5">
                        {formatRelativeTime(order.$createdAt)}
                      </p>
                    </div>

                    {/* Customer */}
                    <div className="lg:col-span-2">
                      <p className="font-medium text-[#26323B] truncate">
                        {shippingAddress.fullName || 'N/A'}
                      </p>
                      <p className="text-sm text-[#455A64] truncate">
                        {shippingAddress.city}, {shippingAddress.country}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="lg:col-span-2 text-[#455A64] text-sm">
                      <p>{formatDate(order.$createdAt)}</p>
                      <p className="text-xs text-[#B0BEC5]">
                        {new Date(order.$createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="lg:col-span-1">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-[#F7F7F7] rounded-lg text-sm font-medium text-[#26323B]">
                        {order.itemCount}
                      </span>
                    </div>

                    {/* Total & Payment */}
                    <div className="lg:col-span-2">
                      <p className="font-bold text-[#26323B] text-lg">
                        {formatCurrency(order.total)}
                      </p>
                      <Badge 
                        size="sm"
                        className={cn("mt-1", PAYMENT_STATUS[order.paymentStatus]?.color)}
                      >
                        {PAYMENT_STATUS[order.paymentStatus]?.label}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="lg:col-span-1">
                      <Badge className={cn("border", getStatusColor(order.status))}>
                        {ORDER_STATUS[order.status]?.label}
                      </Badge>
                    </div>

                    {/* ✅ QUICK ACTIONS - Most Important Fix */}
                    <div className="lg:col-span-2 flex items-center justify-end gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Check}
                          onClick={() => handleQuickAction(order.$id, 'confirm')}
                          title="Confirm Order"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          Confirm
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={PlayCircle}
                          onClick={() => handleQuickAction(order.$id, 'process')}
                          title="Start Processing"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                        >
                          Process
                        </Button>
                      )}
                      
                      {order.status === 'shipped' && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={CheckCheck}
                          onClick={() => handleQuickAction(order.$id, 'deliver')}
                          title="Mark as Delivered"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          Deliver
                        </Button>
                      )}
                      
                      {!['cancelled', 'delivered', 'refunded'].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Ban}
                          onClick={() => handleQuickAction(order.$id, 'cancel')}
                          title="Cancel Order"
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        >
                          Cancel
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => handleViewOrder(order)}
                        title="View Details"
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
      {!isLoading && orders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#455A64]">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)} of {totalOrders} orders
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, orderId: null, action: null, title: '', message: '' })}
        onConfirm={() => updateOrderStatus(confirmModal.orderId, confirmModal.action)}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.action === 'cancelled' ? 'Cancel Order' : 'Confirm'}
        confirmColor={confirmModal.action === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#26323B] hover:bg-[#1a2329]'}
        isLoading={isUpdating}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
          setOrderItems([]);
        }}
        order={selectedOrder}
        orderItems={orderItems}
        loadingItems={loadingItems}
        onUpdateStatus={updateOrderStatus}
        onUpdatePayment={updatePaymentStatus}
        onAddTracking={handleAddTracking}
        isUpdating={isUpdating}
      />
    </div>
  );
}