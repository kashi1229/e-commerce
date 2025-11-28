// src/pages/UserReviewsPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Edit,
  Trash2,
  ThumbsUp,
  MessageSquare,
  Package,
  ChevronRight,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ArrowLeft,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useReviewStore from '../store/reviewStore';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { LoadingSpinner } from '../components/common/Loading';
import { cn, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

// Star Rating Component
const StarRating = ({ rating, size = 'md', showLabel = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="flex items-center gap-2">
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
      {showLabel && (
        <span className="text-sm font-medium text-[#26323B]">
          {labels[rating]}
        </span>
      )}
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review, onEdit, onDelete }) => {
  const pros = review.pros ? JSON.parse(review.pros) : [];
  const cons = review.cons ? JSON.parse(review.cons) : [];
  const images = review.images ? JSON.parse(review.images) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            to={`/products/${review.productId}`}
            className="text-sm text-[#455A64] hover:text-[#26323B] mb-2 flex items-center gap-1 group"
          >
            <Package className="w-4 h-4" />
            <span className="group-hover:underline">View Product</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} />
            <span className="text-sm text-[#455A64]">
              {formatDate(review.$createdAt)}
            </span>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {review.isVerifiedPurchase && (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
          <span className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1",
            review.isApproved
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          )}>
            {review.isApproved ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Published
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                Pending Review
              </>
            )}
          </span>
        </div>
      </div>

      {/* Title & Comment */}
      {review.title && (
        <h3 className="text-lg font-semibold text-[#26323B] mb-2">{review.title}</h3>
      )}
      <p className="text-[#455A64] mb-4 whitespace-pre-wrap">{review.comment}</p>

      {/* Pros & Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {pros.length > 0 && (
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-sm font-medium text-green-700 mb-2">Pros</p>
              <ul className="space-y-1">
                {pros.map((pro, index) => (
                  <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div className="p-3 bg-red-50 rounded-xl">
              <p className="text-sm font-medium text-red-700 mb-2">Cons</p>
              <ul className="space-y-1">
                {cons.map((con, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
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
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Review image ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Admin Response */}
      {review.response && (
        <div className="p-4 bg-[#F7F7F7] rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-[#26323B]" />
            <span className="text-sm font-medium text-[#26323B]">Seller Response</span>
            {review.respondedAt && (
              <span className="text-xs text-[#455A64]">
                • {formatDate(review.respondedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-[#455A64]">{review.response}</p>
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#F7F7F7]">
        <div className="flex items-center gap-4 text-sm text-[#455A64]">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {review.helpfulCount || 0} helpful
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => onEdit(review)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => onDelete(review.$id)}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Edit Review Modal
const EditReviewModal = ({ isOpen, onClose, review, onSave }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    pros: [''],
    cons: [''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (review) {
      setFormData({
        rating: review.rating || 5,
        title: review.title || '',
        comment: review.comment || '',
        pros: review.pros ? JSON.parse(review.pros) : [''],
        cons: review.cons ? JSON.parse(review.cons) : [''],
      });
    }
  }, [review]);

  const handleAddPro = () => {
    if (formData.pros.length < 5) {
      setFormData({ ...formData, pros: [...formData.pros, ''] });
    }
  };

  const handleAddCon = () => {
    if (formData.cons.length < 5) {
      setFormData({ ...formData, cons: [...formData.cons, ''] });
    }
  };

  const handleProChange = (index, value) => {
    const newPros = [...formData.pros];
    newPros[index] = value;
    setFormData({ ...formData, pros: newPros });
  };

  const handleConChange = (index, value) => {
    const newCons = [...formData.cons];
    newCons[index] = value;
    setFormData({ ...formData, cons: newCons });
  };

  const handleRemovePro = (index) => {
    const newPros = formData.pros.filter((_, i) => i !== index);
    setFormData({ ...formData, pros: newPros.length ? newPros : [''] });
  };

  const handleRemoveCon = (index) => {
    const newCons = formData.cons.filter((_, i) => i !== index);
    setFormData({ ...formData, cons: newCons.length ? newCons : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const filteredPros = formData.pros.filter((p) => p.trim());
      const filteredCons = formData.cons.filter((c) => c.trim());

      await onSave({
        rating: formData.rating,
        title: formData.title || null,
        comment: formData.comment,
        pros: filteredPros.length > 0 ? JSON.stringify(filteredPros) : null,
        cons: filteredCons.length > 0 ? JSON.stringify(filteredCons) : null,
      });
      
      onClose();
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-[#F7F7F7]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#26323B]">Edit Review</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-[#455A64] mb-2">
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      formData.rating >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-none text-[#B0BEC5]"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Input
            label="Review Title (Optional)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Summarize your experience"
            maxLength={200}
          />

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-[#455A64] mb-1.5">
              Your Review *
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share your experience with this product..."
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] resize-none"
            />
            <p className="text-xs text-[#455A64] mt-1 text-right">
              {formData.comment.length}/2000
            </p>
          </div>

          {/* Pros */}
          <div>
            <label className="block text-sm font-medium text-[#455A64] mb-2">
              Pros (Optional)
            </label>
            <div className="space-y-2">
              {formData.pros.map((pro, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => handleProChange(index, e.target.value)}
                    placeholder="What did you like?"
                    maxLength={200}
                    className="flex-1 px-4 py-2 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                  />
                  {formData.pros.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePro(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {formData.pros.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddPro}
                  className="text-sm text-[#26323B] font-medium hover:underline"
                >
                  + Add Pro
                </button>
              )}
            </div>
          </div>

          {/* Cons */}
          <div>
            <label className="block text-sm font-medium text-[#455A64] mb-2">
              Cons (Optional)
            </label>
            <div className="space-y-2">
              {formData.cons.map((con, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => handleConChange(index, e.target.value)}
                    placeholder="What could be improved?"
                    maxLength={200}
                    className="flex-1 px-4 py-2 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                  />
                  {formData.cons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCon(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {formData.cons.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddCon}
                  className="text-sm text-[#26323B] font-medium hover:underline"
                >
                  + Add Con
                </button>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="p-4 bg-yellow-50 rounded-xl">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Your edited review will need to be re-approved before it becomes visible to other customers.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-[#F7F7F7] flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="flex-1"
          >
            Update Review
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// Main User Reviews Page
export default function UserReviewsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    userReviews,
    isLoading,
    fetchUserReviews,
    updateReview,
    deleteReview,
  } = useReviewStore();

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = 'My Reviews - Elegance';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user?.$id) {
      fetchUserReviews(user.$id);
    }
  }, [user?.$id, fetchUserReviews]);

  const filteredReviews = userReviews.filter((review) => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'approved' && review.isApproved) ||
      (filterStatus === 'pending' && !review.isApproved);

    const matchesSearch =
      !searchQuery ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: userReviews.length,
    approved: userReviews.filter((r) => r.isApproved).length,
    pending: userReviews.filter((r) => !r.isApproved).length,
  };

  const handleEdit = (review) => {
    setEditingReview(review);
  };

  const handleSaveEdit = async (formData) => {
    const result = await updateReview(editingReview.$id, {
      ...formData,
      isApproved: false, // Reset approval status on edit
    });
    
    if (result.success) {
      toast.success('Review updated successfully');
      setEditingReview(null);
    } else {
      toast.error(result.error || 'Failed to update review');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    const result = await deleteReview(deleteConfirm);
    setIsDeleting(false);
    
    if (result.success) {
      toast.success('Review deleted successfully');
      setDeleteConfirm(null);
    } else {
      toast.error(result.error || 'Failed to delete review');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
        <div className="text-center">
          <Star className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#26323B] mb-2">Sign in to view reviews</h1>
          <p className="text-[#455A64] mb-6">Access your reviews and ratings.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#26323B] to-[#455A64]">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl font-bold">My Reviews</h1>
              <p className="text-white/70 mt-1">
                Manage your product reviews and ratings
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-white/70">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.approved}</p>
                <p className="text-sm text-white/70">Published</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-white/70">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] p-4 mb-6">
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

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#455A64]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
              >
                <option value="all">All Reviews</option>
                <option value="approved">Published</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] p-12 text-center"
          >
            <Star className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#26323B] mb-2">
              No reviews found
            </h3>
            <p className="text-[#455A64] mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : "You haven't written any reviews yet"}
            </p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.$id}
                  review={review}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      <AnimatePresence>
        {editingReview && (
          <EditReviewModal
            isOpen={!!editingReview}
            onClose={() => setEditingReview(null)}
            review={editingReview}
            onSave={handleSaveEdit}
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
                  This action cannot be undone. Your review will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleDelete}
                    isLoading={isDeleting}
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