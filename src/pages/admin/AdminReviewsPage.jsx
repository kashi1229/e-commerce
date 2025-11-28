// src/pages/admin/AdminReviewsPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Search,
  Filter,
  Eye,
  Check,
  X,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Flag,
  ThumbsUp,
  Package,
  User,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import useReviewStore from '../../store/reviewStore';
import Button from '../../components/common/Button';
import {Spinner } from '../../components/common/Loading';
import { cn, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

// Star Rating Display
const StarRating = ({ rating, size = 'sm' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            rating >= star
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-[#B0BEC5]"
          )}
        />
      ))}
    </div>
  );
};

// Stats Card
const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[#455A64] mb-1">{title}</p>
        <p className="text-3xl font-bold text-[#26323B]">{value}</p>
        {trend && (
          <p className={cn(
            "text-sm mt-1",
            trend > 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        color
      )}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

// Review Detail Modal
const ReviewDetailModal = ({ review, isOpen, onClose, onApprove, onReject, onRespond }) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (review?.response) {
      setResponse(review.response);
    } else {
      setResponse('');
    }
  }, [review]);

  const images = review?.images ? JSON.parse(review.images) : [];
  const pros = review?.pros ? JSON.parse(review.pros) : [];
  const cons = review?.cons ? JSON.parse(review.cons) : [];

  const handleRespond = async () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRespond(review.$id, response);
      toast.success('Response added successfully');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#F7F7F7]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#26323B]">Review Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Review Info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={review.rating} size="md" />
                <span className="text-lg font-semibold text-[#26323B]">
                  {review.rating}/5
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#455A64]">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {review.userId}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(review.$createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {review.isVerifiedPurchase && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified Purchase
                </span>
              )}
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1",
                review.isApproved
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              )}>
                {review.isApproved ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Approved
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    Pending
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Product Link */}
          <div className="p-4 bg-[#F7F7F7] rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#455A64]" />
                <span className="text-sm text-[#455A64]">Product ID:</span>
                <span className="text-sm font-medium text-[#26323B]">{review.productId}</span>
              </div>
              <Button variant="ghost" size="sm" icon={ExternalLink}>
                View Product
              </Button>
            </div>
          </div>

          {/* Title & Comment */}
          {review.title && (
            <h3 className="text-lg font-semibold text-[#26323B] mb-2">{review.title}</h3>
          )}
          <p className="text-[#455A64] mb-6">{review.comment}</p>

          {/* Pros & Cons */}
          {(pros.length > 0 || cons.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {pros.length > 0 && (
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm font-medium text-green-700 mb-2">Pros</p>
                  <ul className="space-y-1">
                    {pros.map((pro, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-700 mb-2">Cons</p>
                  <ul className="space-y-1">
                    {cons.map((con, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                        <X className="w-4 h-4" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-[#455A64] mb-2">Review Images</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Review image ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 p-4 bg-[#F7F7F7] rounded-xl mb-6">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-[#455A64]" />
              <span className="text-sm text-[#455A64]">
                <span className="font-medium text-[#26323B]">{review.helpfulCount}</span> found helpful
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className={cn(
                "w-5 h-5",
                review.reportCount > 0 ? "text-red-500" : "text-[#455A64]"
              )} />
              <span className="text-sm text-[#455A64]">
                <span className={cn(
                  "font-medium",
                  review.reportCount > 0 ? "text-red-500" : "text-[#26323B]"
                )}>{review.reportCount}</span> reports
              </span>
            </div>
          </div>

          {/* Admin Response */}
          <div className="border-t border-[#F7F7F7] pt-6">
            <h4 className="text-sm font-medium text-[#455A64] mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Admin Response
            </h4>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write a response to this review..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] resize-none mb-2"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#455A64]">{response.length}/1000</p>
              <Button
                size="sm"
                onClick={handleRespond}
                isLoading={isSubmitting}
                disabled={!response.trim()}
              >
                {review.response ? 'Update Response' : 'Add Response'}
              </Button>
            </div>
            {review.respondedAt && (
              <p className="text-xs text-[#455A64] mt-2">
                Last responded: {formatDate(review.respondedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#F7F7F7] bg-[#F7F7F7]">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {!review.isApproved && (
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  icon={X}
                  onClick={() => {
                    onReject(review.$id);
                    onClose();
                  }}
                >
                  Reject
                </Button>
                <Button
                  icon={Check}
                  onClick={() => {
                    onApprove(review.$id);
                    onClose();
                  }}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main Admin Reviews Page
export default function AdminReviewsPage() {
  const {
    reviews,
    pendingReviews,
    isLoading,
    pagination,
    fetchAllReviews,
    fetchPendingReviews,
    approveReview,
    rejectReview,
    addResponse,
    deleteReview,
    getReviewStats,
  } = useReviewStore();

  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [filters, setFilters] = useState({
    status: '',
    rating: '',
    verified: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    document.title = 'Manage Reviews - Admin';
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingReviews();
    } else {
      loadReviews();
    }
  }, [activeTab, currentPage, filters]);

  const loadStats = async () => {
    const data = await getReviewStats();
    setStats(data);
  };

  const loadReviews = () => {
    const filterParams = {};
    if (filters.status === 'approved') filterParams.isApproved = true;
    if (filters.status === 'pending') filterParams.isApproved = false;
    if (filters.rating) filterParams.rating = filters.rating;
    if (filters.verified === 'yes') filterParams.isVerifiedPurchase = true;
    if (filters.verified === 'no') filterParams.isVerifiedPurchase = false;

    fetchAllReviews(currentPage, 10, filterParams);
  };

  const handleApprove = async (reviewId) => {
    const result = await approveReview(reviewId);
    if (result.success) {
      toast.success('Review approved');
      loadStats();
      if (activeTab === 'pending') {
        fetchPendingReviews();
      }
    } else {
      toast.error(result.error || 'Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    const result = await rejectReview(reviewId);
    if (result.success) {
      toast.success('Review rejected');
      loadStats();
    } else {
      toast.error(result.error || 'Failed to reject review');
    }
  };

  const handleDelete = async (reviewId) => {
    const result = await deleteReview(reviewId);
    if (result.success) {
      toast.success('Review deleted');
      loadStats();
      setDeleteConfirm(null);
    } else {
      toast.error(result.error || 'Failed to delete review');
    }
  };

  const handleRespond = async (reviewId, response) => {
    const result = await addResponse(reviewId, response);
    if (result.success) {
      toast.success('Response added');
    } else {
      toast.error(result.error || 'Failed to add response');
    }
  };

  const displayedReviews = activeTab === 'pending' ? pendingReviews : reviews;

  const filteredReviews = displayedReviews.filter((review) => {
    if (!searchQuery) return true;
    return (
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.productId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#26323B] to-[#455A64]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl font-bold">Review Management</h1>
              <p className="text-white/70 mt-1">
                Manage and moderate customer reviews
              </p>
            </div>
            
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => {
                loadStats();
                loadReviews();
              }}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Reviews"
            value={stats.total}
            icon={Star}
            color="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Pending Approval"
            value={stats.pending}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatsCard
            title="Approved Reviews"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] mb-6">
          <div className="flex border-b border-[#F7F7F7]">
            {[
              { id: 'all', label: 'All Reviews', count: stats.total },
              { id: 'pending', label: 'Pending', count: stats.pending },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-[#26323B] border-b-2 border-[#26323B]"
                    : "text-[#455A64] hover:text-[#26323B]"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab.id
                    ? "bg-[#26323B] text-white"
                    : "bg-[#F7F7F7] text-[#455A64]"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-[#F7F7F7]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                />
              </div>

              {activeTab === 'all' && (
                <>
                  {/* Status Filter */}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                  >
                    <option value="">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>

                  {/* Rating Filter */}
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                    className="px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>

                  {/* Verified Filter */}
                  <select
                    value={filters.verified}
                    onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                    className="px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                  >
                    <option value="">All Purchases</option>
                    <option value="yes">Verified Only</option>
                    <option value="no">Unverified Only</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Reviews Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#26323B] mb-2">
                No reviews found
              </h3>
              <p className="text-[#455A64]">
                {searchQuery || Object.values(filters).some(Boolean)
                  ? 'Try adjusting your filters'
                  : 'No reviews to display'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F7F7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#455A64] uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#455A64] uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#455A64] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#455A64] uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#455A64] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#455A64] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F7F7]">
                  {filteredReviews.map((review) => (
                    <tr key={review.$id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {review.title && (
                            <p className="font-medium text-[#26323B] truncate">{review.title}</p>
                          )}
                          <p className="text-sm text-[#455A64] truncate">{review.comment}</p>
                          <p className="text-xs text-[#B0BEC5] mt-1">
                            Product: {review.productId.slice(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <span className="text-sm font-medium text-[#26323B]">
                            {review.rating}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 w-fit",
                            review.isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          )}>
                            {review.isApproved ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Approved
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                Pending
                              </>
                            )}
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="text-xs text-green-600">Verified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-[#455A64]">
                            <ThumbsUp className="w-4 h-4" />
                            {review.helpfulCount}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1",
                            review.reportCount > 0 ? "text-red-500" : "text-[#455A64]"
                          )}>
                            <Flag className="w-4 h-4" />
                            {review.reportCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#455A64]">
                        {formatDate(review.$createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="p-2 text-[#455A64] hover:bg-[#F7F7F7] rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {!review.isApproved && (
                            <>
                              <button
                                onClick={() => handleApprove(review.$id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(review.$id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(review.$id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && activeTab === 'all' && (
            <div className="p-4 border-t border-[#F7F7F7] flex items-center justify-between">
              <p className="text-sm text-[#455A64]">
                Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                {pagination.total} reviews
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm font-medium text-[#26323B]">
                  Page {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            isOpen={!!selectedReview}
            onClose={() => setSelectedReview(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onRespond={handleRespond}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#26323B] mb-2">
                  Delete Review?
                </h3>
                <p className="text-[#455A64] mb-6">
                  This action cannot be undone. The review will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleDelete(deleteConfirm)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}