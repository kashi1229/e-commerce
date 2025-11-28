// src/components/product/ReviewSummary.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

const RatingBar = ({ rating, count, total, onClick, isActive }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 py-1 group transition-opacity",
        isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
      )}
    >
      <span className="text-sm text-[#455A64] w-16 flex items-center gap-1">
        {rating} <Star className="w-3 h-3 fill-current" />
      </span>
      <div className="flex-1 h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            "h-full rounded-full",
            rating >= 4 ? "bg-green-500" : rating >= 3 ? "bg-yellow-500" : "bg-red-500"
          )}
        />
      </div>
      <span className="text-sm text-[#455A64] w-12 text-right">{count}</span>
    </button>
  );
};

export default function ReviewSummary({ 
  reviews = [], 
  onFilterChange,
  selectedFilter = null 
}) {
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    if (reviews.length === 0) {
      setStats({
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
      return;
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
      sum += review.rating;
    });

    setStats({
      average: sum / reviews.length,
      total: reviews.length,
      distribution,
    });
  }, [reviews]);

  const handleFilterClick = (rating) => {
    if (selectedFilter === rating) {
      onFilterChange?.(null);
    } else {
      onFilterChange?.(rating);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] p-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Average Rating */}
        <div className="text-center md:text-left md:pr-8 md:border-r border-[#F7F7F7]">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-5xl font-bold text-[#26323B]">
              {stats.average.toFixed(1)}
            </span>
            <span className="text-2xl text-[#B0BEC5]">/5</span>
          </div>
          
          <div className="flex justify-center md:justify-start mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-5 h-5",
                  stats.average >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : stats.average >= star - 0.5
                    ? "fill-yellow-400/50 text-yellow-400"
                    : "fill-none text-[#B0BEC5]"
                )}
              />
            ))}
          </div>
          
          <p className="text-sm text-[#455A64] mt-2">
            Based on {stats.total} reviews
          </p>

          {/* Recommendation Rate */}
          {stats.total > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl">
              <div className="flex items-center justify-center md:justify-start gap-2 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {Math.round(((stats.distribution[4] + stats.distribution[5]) / stats.total) * 100)}% recommend
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[#455A64] mb-3">
            Rating Distribution
            {selectedFilter && (
              <button
                onClick={() => onFilterChange?.(null)}
                className="ml-2 text-[#26323B] underline"
              >
                Clear filter
              </button>
            )}
          </h4>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={stats.distribution[rating]}
                total={stats.total}
                onClick={() => handleFilterClick(rating)}
                isActive={selectedFilter === null || selectedFilter === rating}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}