// src/components/products/ProductFilters.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  Star,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useCategories } from '../../hooks/useProducts';
import Button from '../common/Button';
import { cn } from '../../lib/utils';

const PRICE_RANGES = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: undefined },
];

const RATING_OPTIONS = [4, 3, 2, 1];

export default function ProductFilters({
  filters,
  onFilterChange,
  onReset,
  isOpen,
  onClose,
  isMobile = false,
}) {
  const { categories, isLoading: categoriesLoading } = useCategories();
  
  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
  });

  // Custom price range state
  const [customPrice, setCustomPrice] = useState({
    min: filters.minPrice || '',
    max: filters.maxPrice || '',
  });

  // Mark as animated after initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Small delay to allow initial animation
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update custom price when filters change externally
  useEffect(() => {
    setCustomPrice({
      min: filters.minPrice || '',
      max: filters.maxPrice || '',
    });
  }, [filters.minPrice, filters.maxPrice]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (categoryId) => {
    onFilterChange({
      categoryId: filters.categoryId === categoryId ? undefined : categoryId,
    });
  };

  const handlePriceRangeChange = (range) => {
    const isSelected = filters.minPrice === range.min && filters.maxPrice === range.max;
    onFilterChange({
      minPrice: isSelected ? undefined : range.min,
      maxPrice: isSelected ? undefined : range.max,
    });
  };

  const handleCustomPriceApply = () => {
    onFilterChange({
      minPrice: customPrice.min ? Number(customPrice.min) : undefined,
      maxPrice: customPrice.max ? Number(customPrice.max) : undefined,
    });
  };

  const handleRatingChange = (rating) => {
    onFilterChange({
      minRating: filters.minRating === rating ? undefined : rating,
    });
  };

  // Filter section component - NO animation after initial load
  const FilterSection = ({ title, name, children }) => {
    const isExpanded = expandedSections[name];
    
    return (
      <div className="border-b border-[#E0E0E0] last:border-b-0">
        <button
          onClick={() => toggleSection(name)}
          className="w-full flex items-center justify-between py-4 text-left"
        >
          <span className="font-medium text-[#26323B]">{title}</span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-[#455A64] transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        
        {/* ✅ FIXED: Only animate on initial mount, not on filter changes */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isExpanded ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
          )}
        >
          {children}
        </div>
      </div>
    );
  };

  // Filter content - shared between desktop and mobile
  const FilterContent = () => (
    <div className="space-y-0">
      {/* Categories */}
      <FilterSection title="Categories" name="categories">
        <div className="space-y-2">
          {categoriesLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-[#F7F7F7] rounded-lg animate-pulse"
              />
            ))
          ) : (
            categories.map((category) => (
              <button
                key={category.$id}
                onClick={() => handleCategoryChange(category.$id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                  filters.categoryId === category.$id
                    ? "bg-[#26323B] text-white"
                    : "bg-[#F7F7F7] text-[#455A64] hover:bg-[#E8E8E8]"
                )}
              >
                <span>{category.name}</span>
                {category.productCount !== undefined && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      filters.categoryId === category.$id
                        ? "bg-white/20"
                        : "bg-[#E0E0E0]"
                    )}
                  >
                    {category.productCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" name="price">
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const isSelected =
              filters.minPrice === range.min && filters.maxPrice === range.max;
            return (
              <button
                key={range.label}
                onClick={() => handlePriceRangeChange(range)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isSelected
                    ? "bg-[#26323B] text-white"
                    : "bg-[#F7F7F7] text-[#455A64] hover:bg-[#E8E8E8]"
                )}
              >
                {range.label}
              </button>
            );
          })}

          {/* Custom Price Range */}
          <div className="pt-3 mt-3 border-t border-[#E0E0E0]">
            <p className="text-sm text-[#455A64] mb-2">Custom Range</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={customPrice.min}
                onChange={(e) =>
                  setCustomPrice((prev) => ({ ...prev, min: e.target.value }))
                }
                className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent"
              />
              <span className="text-[#B0BEC5]">-</span>
              <input
                type="number"
                placeholder="Max"
                value={customPrice.max}
                onChange={(e) =>
                  setCustomPrice((prev) => ({ ...prev, max: e.target.value }))
                }
                className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={handleCustomPriceApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating" name="rating">
        <div className="space-y-2">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
                filters.minRating === rating
                  ? "bg-[#26323B] text-white"
                  : "bg-[#F7F7F7] text-[#455A64] hover:bg-[#E8E8E8]"
              )}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < rating
                        ? filters.minRating === rating
                          ? "fill-white text-white"
                          : "fill-yellow-400 text-yellow-400"
                        : filters.minRating === rating
                        ? "text-white/30"
                        : "text-[#E0E0E0]"
                    )}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Reset Button */}
      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full"
          icon={RotateCcw}
          onClick={onReset}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );

  // Desktop Filters
  if (!isMobile) {
    return (
      <div
        className={cn(
          "bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7] sticky top-24",
          // ✅ Only animate on initial mount
          !hasAnimated && "animate-fadeIn"
        )}
      >
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#E0E0E0]">
          <SlidersHorizontal className="w-5 h-5 text-[#26323B]" />
          <h2 className="font-semibold text-[#26323B]">Filters</h2>
        </div>
        <FilterContent />
      </div>
    );
  }

  // Mobile Filters (Slide-over)
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-white z-50 lg:hidden overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#26323B]" />
                <h2 className="font-semibold text-[#26323B]">Filters</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#455A64]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E0E0E0] bg-white">
              <Button className="w-full" onClick={onClose}>
                Show Results
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}