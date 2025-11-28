// src/components/product/ReviewList.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ThumbsUp,
  Flag,
  ChevronDown,
  Filter,
  CheckCircle,
  MessageSquare,
  Image as ImageIcon,
  User,
  MoreHorizontal,
} from 'lucide-react';
import useReviewStore from '../../store/reviewStore';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';
import { cn, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

// Star Rating Display
const StarRating = ({ rating, size = 'sm' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5' };
  
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

// Image Lightbox
const ImageLightbox = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <span className="text-3xl">&times;</span>
      </button>
      
      <img
        src={images[currentIndex]}
        alt={`Review image ${currentIndex + 1}`}
        className="max-w-full max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      {images.length > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Single Review Card
const ReviewCard = ({ review, onHelpful, onReport }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showActions, setShowActions] = useState(false);

  const images = review.images ? JSON.parse(review.images) : [];
  const pros = review.pros ? JSON.parse(review.pros) : [];
  const cons = review.cons ? JSON.parse(review.cons) : [];
  
  const isLongComment = review.comment.length > 300;
  const displayComment = showFullComment 
    ? review.comment 
    : review.comment.slice(0, 300);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-[#F7F7F7] py-6 last:border-0"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F7F7F7] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-[#455A64]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#26323B]">
                {review.userName || 'Anonymous'}
              </span>
              {review.isVerifiedPurchase && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-sm text-[#455A64]">
                {formatDate(review.$createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* More Actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-[#455A64]" />
          </button>
          
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#F7F7F7] py-1 z-10 min-w-[150px]"
              >
                <button
                  onClick={() => {
                    onReport(review.$id);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Report Review
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-[#26323B] mb-2">{review.title}</h4>
      )}

      {/* Comment */}
      <p className="text-[#455A64] mb-3">
        {displayComment}
        {isLongComment && !showFullComment && '...'}
      </p>
      
      {isLongComment && (
        <button
          onClick={() => setShowFullComment(!showFullComment)}
          className="text-sm text-[#26323B] font-medium hover:underline mb-3"
        >
          {showFullComment ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Pros & Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {pros.length > 0 && (
            <div className="space-y-1">
              {pros.map((pro, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  {pro}
                </div>
              ))}
            </div>
          )}
          {cons.length > 0 && (
            <div className="space-y-1">
              {cons.map((con, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {con}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="relative flex-shrink-0 group"
            >
              <img
                src={url}
                alt={`Review image ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Admin Response */}
      {review.response && (
        <div className="p-4 bg-[#F7F7F7] rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-[#26323B]" />
            <span className="text-sm font-medium text-[#26323B]">Seller Response</span>
            <span className="text-xs text-[#455A64]">
              {formatDate(review.respondedAt)}
            </span>
          </div>
          <p className="text-sm text-[#455A64]">{review.response}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onHelpful(review.$id)}
          className="flex items-center gap-1.5 text-sm text-[#455A64] hover:text-[#26323B] transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          Helpful ({review.helpfulCount})
        </button>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </motion.div>
  );
};

// Main Review List Component
export default function ReviewList({ 
  reviews, 
  isLoading,
  hasMore,
  onLoadMore,
  filterRating,
  onFilterChange,
  sortBy,
  onSortChange,
}) {
  const { user } = useAuthStore();
  const { markHelpful, reportReview } = useReviewStore();

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error('Please sign in to mark reviews as helpful');
      return;
    }
    
    const result = await markHelpful(reviewId);
    if (result.success) {
      toast.success('Marked as helpful');
    }
  };

  const handleReport = async (reviewId) => {
    if (!user) {
      toast.error('Please sign in to report reviews');
      return;
    }
    
    const result = await reportReview(reviewId);
    if (result.success) {
      toast.success('Review reported');
    }
  };

  return (
    <div>
      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#455A64]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-3 py-2 border border-[#B0BEC5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#26323B]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#455A64]" />
          <span className="text-sm text-[#455A64]">Filter:</span>
          <div className="flex gap-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => onFilterChange?.(filterRating === rating ? null : rating)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                  filterRating === rating
                    ? "bg-[#26323B] text-white"
                    : "bg-[#F7F7F7] text-[#455A64] hover:bg-[#E0E0E0]"
                )}
              >
                {rating} <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-[#B0BEC5] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#26323B] mb-2">
            No reviews yet
          </h3>
          <p className="text-[#455A64]">
            Be the first to review this product
          </p>
        </div>
      ) : (
        <div>
          <AnimatePresence>
            {reviews.map((review) => (
              <ReviewCard
                key={review.$id}
                review={review}
                onHelpful={handleHelpful}
                onReport={handleReport}
              />
            ))}
          </AnimatePresence>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={onLoadMore}
                isLoading={isLoading}
                icon={ChevronDown}
              >
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}