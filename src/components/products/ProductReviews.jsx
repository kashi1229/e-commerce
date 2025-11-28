// src/components/products/ProductReviews.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  Camera, 
  X, 
  Check, 
  ChevronDown,
  Filter,
  MessageSquare,
  User,
  Verified,
  Image as ImageIcon
} from 'lucide-react';
import { formatRelativeTime, formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import { databases, DATABASE_ID, COLLECTIONS, ID } from '../../lib/appwrite';
import toast from 'react-hot-toast';

export default function ProductReviews({ productId, reviews = [], onReviewAdded }) {
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterRating, setFilterRating] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [helpfulReviews, setHelpfulReviews] = useState(new Set());

  const { isAuthenticated, user, profile } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: reviews.filter(r => Math.round(r.rating) === stars).length,
      percentage: reviews.length > 0 
        ? (reviews.filter(r => Math.round(r.rating) === stars).length / reviews.length) * 100 
        : 0,
    }));
  }, [reviews]);

  const averageRating = useMemo(() => {
    return reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  }, [reviews]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => filterRating ? Math.round(r.rating) === filterRating : true)
      .sort((a, b) => {
        switch (sortBy) {
          case 'highest':
            return b.rating - a.rating;
          case 'lowest':
            return a.rating - b.rating;
          case 'helpful':
            return (b.helpfulCount || 0) - (a.helpfulCount || 0);
          case 'oldest':
            return new Date(a.$createdAt) - new Date(b.$createdAt);
          default: // newest
            return new Date(b.$createdAt) - new Date(a.$createdAt);
        }
      });
  }, [reviews, filterRating, sortBy]);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Rated' },
    { value: 'lowest', label: 'Lowest Rated' },
    { value: 'helpful', label: 'Most Helpful' },
  ];

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const handleOpenReviewModal = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      toast.error('Please sign in to write a review');
      return;
    }
    setIsWritingReview(true);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      toast.error('Please write a review (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse pros and cons
      const prosArray = pros.trim() 
        ? pros.split('\n').map(p => p.trim()).filter(Boolean) 
        : [];
      const consArray = cons.trim() 
        ? cons.split('\n').map(c => c.trim()).filter(Boolean) 
        : [];

      const newReview = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        ID.unique(),
        {
          productId,
          userId: user.$id,
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
          pros: prosArray.length > 0 ? JSON.stringify(prosArray) : null,
          cons: consArray.length > 0 ? JSON.stringify(consArray) : null,
          isVerifiedPurchase: false, // This would be checked against orders
          isApproved: false, // Requires admin approval
          helpfulCount: 0,
          reportCount: 0,
        }
      );

      toast.success('Thank you! Your review has been submitted and is pending approval.', {
        duration: 5000,
        icon: '✨',
      });

      // Reset form
      setIsWritingReview(false);
      setRating(0);
      setTitle('');
      setComment('');
      setPros('');
      setCons('');
      
      if (onReviewAdded) {
        onReviewAdded(newReview);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      toast.error('Please sign in to mark as helpful');
      return;
    }

    if (helpfulReviews.has(reviewId)) {
      toast.error('You already marked this review as helpful');
      return;
    }

    try {
      const review = reviews.find(r => r.$id === reviewId);
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        reviewId,
        { helpfulCount: (review.helpfulCount || 0) + 1 }
      );
      
      setHelpfulReviews(prev => new Set([...prev, reviewId]));
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Something went wrong');
    }
  };

  const handleReport = async (reviewId) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const review = reviews.find(r => r.$id === reviewId);
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        reviewId,
        { reportCount: (review.reportCount || 0) + 1 }
      );
      toast.success('Review reported. We will review it shortly.');
    } catch (error) {
      toast.error('Failed to report review');
    }
  };

  const toggleExpandReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Star Rating Component
  const StarRating = ({ value, onChange, onHover, size = 'md', readonly = false }) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-10 h-10',
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            className={cn(
              "transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                "transition-colors",
                star <= (onHover ? hoverRating || value : value)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-200 fill-gray-200"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  // Review Card Component
  const ReviewCard = ({ review }) => {
    const prosArray = review.pros ? JSON.parse(review.pros) : [];
    const consArray = review.cons ? JSON.parse(review.cons) : [];
    const isExpanded = expandedReviews[review.$id];
    const isLongComment = review.comment.length > 300;
    const displayComment = isLongComment && !isExpanded 
      ? review.comment.substring(0, 300) + '...' 
      : review.comment;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7] hover:shadow-md transition-shadow"
      >
        {/* Review Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#26323B] to-[#455A64] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {review.userName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#26323B]">
                  {review.userName || 'Anonymous User'}
                </span>
                {review.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <Verified className="w-3 h-3" />
                    Verified Purchase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <StarRating value={review.rating} readonly size="sm" />
                <span className="text-sm text-[#B0BEC5]">
                  {formatRelativeTime(review.$createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div className={cn(
            "px-3 py-1.5 rounded-full text-sm font-semibold",
            review.rating >= 4 ? "bg-green-100 text-green-700" :
            review.rating >= 3 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          )}>
            {ratingLabels[review.rating]}
          </div>
        </div>

        {/* Review Title */}
        {review.title && (
          <h4 className="font-semibold text-[#26323B] text-lg mb-2">
            {review.title}
          </h4>
        )}

        {/* Review Comment */}
        <p className="text-[#455A64] leading-relaxed mb-4 whitespace-pre-wrap">
          {displayComment}
        </p>

        {isLongComment && (
          <button
            onClick={() => toggleExpandReview(review.$id)}
            className="text-[#26323B] font-medium text-sm hover:underline mb-4"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Pros & Cons */}
        {(prosArray.length > 0 || consArray.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-[#F7F7F7] rounded-xl">
            {prosArray.length > 0 && (
              <div>
                <h5 className="font-semibold text-green-700 text-sm mb-2 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Pros
                </h5>
                <ul className="space-y-1">
                  {prosArray.map((pro, index) => (
                    <li key={index} className="text-sm text-[#455A64] flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {consArray.length > 0 && (
              <div>
                <h5 className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Cons
                </h5>
                <ul className="space-y-1">
                  {consArray.map((con, index) => (
                    <li key={index} className="text-sm text-[#455A64] flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Review Images */}
        {review.images && JSON.parse(review.images).length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {JSON.parse(review.images).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </div>
        )}

        {/* Seller Response */}
        {review.response && (
          <div className="bg-[#26323B]/5 rounded-xl p-4 mb-4 border-l-4 border-[#26323B]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-[#26323B] text-sm">Seller Response</span>
              {review.respondedAt && (
                <span className="text-xs text-[#B0BEC5]">
                  {formatRelativeTime(review.respondedAt)}
                </span>
              )}
            </div>
            <p className="text-sm text-[#455A64]">{review.response}</p>
          </div>
        )}

        {/* Review Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F7F7F7]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleHelpful(review.$id)}
              disabled={helpfulReviews.has(review.$id)}
              className={cn(
                "flex items-center gap-2 text-sm transition-colors",
                helpfulReviews.has(review.$id)
                  ? "text-[#26323B] font-medium"
                  : "text-[#455A64] hover:text-[#26323B]"
              )}
            >
              <ThumbsUp className={cn(
                "w-4 h-4",
                helpfulReviews.has(review.$id) && "fill-current"
              )} />
              Helpful ({review.helpfulCount || 0})
            </button>
            <button
              onClick={() => handleReport(review.$id)}
              className="flex items-center gap-2 text-sm text-[#455A64] hover:text-red-500 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Report
            </button>
          </div>
          <span className="text-xs text-[#B0BEC5]">
            {formatDate(review.$createdAt)}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#26323B]">
            Customer Reviews
          </h2>
          <p className="text-[#455A64] mt-1">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} for this product
          </p>
        </div>
        <Button
          onClick={handleOpenReviewModal}
          icon={Star}
          size="lg"
        >
          Write a Review
        </Button>
      </div>

      {/* Summary Section */}
      {reviews.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-8 p-6 md:p-8 bg-gradient-to-br from-[#F7F7F7] to-white rounded-2xl border border-[#F7F7F7]">
          {/* Average Rating */}
          <div className="text-center lg:text-left lg:border-r lg:border-[#E0E0E0] lg:pr-8">
            <div className="flex flex-col items-center lg:items-start gap-3">
              <span className="text-6xl md:text-7xl font-bold text-[#26323B]">
                {averageRating.toFixed(1)}
              </span>
              <div>
                <StarRating value={Math.round(averageRating)} readonly size="lg" />
                <p className="text-sm text-[#455A64] mt-2">
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold text-[#26323B] mb-4">Rating Distribution</h3>
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <button
                key={stars}
                onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                className={cn(
                  "flex items-center gap-4 w-full p-2 rounded-lg transition-all group",
                  filterRating === stars
                    ? "bg-[#26323B]/10 ring-2 ring-[#26323B]"
                    : "hover:bg-[#26323B]/5"
                )}
              >
                <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                  <span className="text-sm font-semibold text-[#26323B] w-3">{stars}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-3 bg-[#E0E0E0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      stars >= 4 ? "bg-green-500" :
                      stars >= 3 ? "bg-yellow-500" :
                      "bg-red-500"
                    )}
                  />
                </div>
                <span className="text-sm text-[#455A64] w-16 text-right">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F7F7F7]">
          {/* Filter by Rating */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <span className="text-sm text-[#455A64] flex-shrink-0">Filter:</span>
            <button
              onClick={() => setFilterRating(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                filterRating === null
                  ? "bg-[#26323B] text-white"
                  : "bg-[#F7F7F7] text-[#455A64] hover:bg-[#E0E0E0]"
              )}
            >
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map((stars) => (
              <button
                key={stars}
                onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1",
                  filterRating === stars
                    ? "bg-[#26323B] text-white"
                    : "bg-[#F7F7F7] text-[#455A64] hover:bg-[#E0E0E0]"
                )}
              >
                {stars} <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#B0BEC5] rounded-lg text-sm font-medium text-[#455A64] hover:border-[#26323B] transition-colors"
            >
              <Filter className="w-4 h-4" />
              {sortOptions.find(o => o.value === sortBy)?.label}
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showSortDropdown && "rotate-180"
              )} />
            </button>

            <AnimatePresence>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#F7F7F7] overflow-hidden z-50"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between",
                          sortBy === option.value
                            ? "bg-[#26323B] text-white"
                            : "text-[#455A64] hover:bg-[#F7F7F7]"
                        )}
                      >
                        {option.label}
                        {sortBy === option.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredReviews.map((review) => (
              <ReviewCard key={review.$id} review={review} />
            ))}
          </AnimatePresence>
        </div>
      ) : reviews.length > 0 ? (
        <EmptyState
          icon={Filter}
          title="No reviews match your filter"
          description="Try selecting a different rating filter"
          action={() => setFilterRating(null)}
          actionLabel="Clear Filter"
        />
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Be the first to review this product and help other customers"
          action={handleOpenReviewModal}
          actionLabel="Write a Review"
        />
      )}

      {/* Write Review Modal */}
      <Modal
        isOpen={isWritingReview}
        onClose={() => setIsWritingReview(false)}
        title="Write a Review"
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Rating Selection */}
          <div className="text-center pb-6 border-b border-[#F7F7F7]">
            <h3 className="text-lg font-semibold text-[#26323B] mb-4">
              How would you rate this product?
            </h3>
            <div className="flex justify-center mb-2">
              <StarRating
                value={rating}
                onChange={setRating}
                onHover={setHoverRating}
                size="xl"
              />
            </div>
            <AnimatePresence mode="wait">
              {(hoverRating || rating) > 0 && (
                <motion.p
                  key={hoverRating || rating}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "text-lg font-medium",
                    (hoverRating || rating) >= 4 ? "text-green-600" :
                    (hoverRating || rating) >= 3 ? "text-yellow-600" :
                    "text-red-600"
                  )}
                >
                  {ratingLabels[hoverRating || rating]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-[#455A64] mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review in a few words"
              maxLength={200}
              className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl text-[#26323B] placeholder-[#B0BEC5] focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent transition-all"
            />
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-medium text-[#455A64] mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product? How was your experience?"
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl text-[#26323B] placeholder-[#B0BEC5] focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-[#B0BEC5] mt-1 text-right">
              {comment.length}/2000 characters
            </p>
          </div>

          {/* Pros & Cons */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Pros (Optional)
              </label>
              <textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder="Enter each pro on a new line"
                rows={3}
                className="w-full px-4 py-3 border border-green-300 rounded-xl text-[#26323B] placeholder-[#B0BEC5] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                <X className="w-4 h-4" />
                Cons (Optional)
              </label>
              <textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="Enter each con on a new line"
                rows={3}
                className="w-full px-4 py-3 border border-red-300 rounded-xl text-[#26323B] placeholder-[#B0BEC5] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Image Upload Placeholder */}
          <div className="border-2 border-dashed border-[#B0BEC5] rounded-xl p-6 text-center hover:border-[#455A64] transition-colors cursor-pointer">
            <ImageIcon className="w-10 h-10 text-[#B0BEC5] mx-auto mb-3" />
            <p className="text-[#455A64] font-medium">Add Photos (Optional)</p>
            <p className="text-sm text-[#B0BEC5] mt-1">
              Drag and drop or click to upload
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-[#F7F7F7] rounded-xl p-4">
            <h4 className="font-medium text-[#26323B] mb-2">Review Guidelines</h4>
            <ul className="text-sm text-[#455A64] space-y-1">
              <li>• Focus on the product's features and your experience</li>
              <li>• Be specific about what you liked or didn't like</li>
              <li>• Avoid inappropriate language or personal attacks</li>
              <li>• Reviews are moderated and may take 24-48 hours to appear</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F7F7F7]">
            <Button
              variant="ghost"
              onClick={() => setIsWritingReview(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              isLoading={isSubmitting}
              disabled={rating === 0 || comment.trim().length < 10}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}