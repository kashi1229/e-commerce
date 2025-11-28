// src/components/common/Loading.jsx
import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <motion.div
        className="absolute inset-0 border-2 border-[#F7F7F7] rounded-full"
      />
      <motion.div
        className="absolute inset-0 border-2 border-transparent border-t-[#26323B] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-[#455A64] font-medium">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <LoadingSpinner size="xl" />
    </motion.div>
  );
}