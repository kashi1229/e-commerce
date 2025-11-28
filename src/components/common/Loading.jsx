// src/components/common/Loading.jsx
import { memo } from 'react';
import { motion } from 'framer-motion';

// ============================================
// Full Page Loading (for initial app load)
// ============================================
export const LoadingPage = memo(function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#26323B] rounded-2xl flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-2xl">KS</span>
        </div>
        <LoadingDots />
      </div>
    </div>
  );
});

// ============================================
// Page Loader (for lazy loaded pages)
// ============================================
export const PageLoader = memo(function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-[#26323B]/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-[#26323B] rounded-full animate-spin" />
          </div>
          
          {/* Text */}
          <p className="text-[#455A64] text-sm font-medium">Loading...</p>
        </motion.div>
      </div>
    </div>
  );
});

// ============================================
// Loading Dots Animation
// ============================================
export const LoadingDots = memo(function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-[#26323B] rounded-full"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// Inline Spinner (for buttons, etc.)
// ============================================
export const Spinner = memo(function Spinner({ 
  size = 'md', 
  color = 'white',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    dark: 'border-[#26323B]/30 border-t-[#26323B]',
    primary: 'border-[#26323B]/30 border-t-[#26323B]',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        rounded-full
        animate-spin
        ${className}
      `}
    />
  );
});

// ============================================
// Skeleton Loaders
// ============================================
export const Skeleton = memo(function Skeleton({ 
  className = '', 
  variant = 'rectangular' 
}) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
});

// ============================================
// Product Card Skeleton
// ============================================
export const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Image */}
      <Skeleton className="w-full h-64" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" variant="text" />
          <Skeleton className="h-10 w-10" variant="circular" />
        </div>
      </div>
    </div>
  );
});

// ============================================
// Product Grid Skeleton
// ============================================
export const ProductGridSkeleton = memo(function ProductGridSkeleton({ 
  count = 8 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
});

// Default export
export default {
  LoadingPage,
  PageLoader,
  LoadingDots,
  Spinner,
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
};