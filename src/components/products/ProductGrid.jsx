// src/components/products/ProductGrid.jsx
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import { Package } from 'lucide-react';

export default function ProductGrid({ 
  products, 
  isLoading, 
  columns = 4,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search terms"
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  if (isLoading) {
    return <ProductGridSkeleton count={columns * 2} />;
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid ${gridCols[columns] || gridCols[4]} gap-4 md:gap-6`}
    >
      {products.map((product) => (
        <ProductCard key={product.$id} product={product} />
      ))}
    </motion.div>
  );
}