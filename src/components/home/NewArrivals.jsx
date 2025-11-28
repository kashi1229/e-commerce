// src/components/home/NewArrivals.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useProducts, useCategories } from '../../hooks/useProducts';
import ProductCard from '../products/ProductCard';
import { ProductGridSkeleton } from '../common/Skeleton';
import { cn } from '../../lib/utils';

export default function NewArrivals() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { categories } = useCategories();
  const { products, isLoading } = useProducts({
    newArrivals: true,
    limit: 8,
    categoryId: activeCategory !== 'all' ? activeCategory : undefined,
  });

  const displayCategories = [
    { $id: 'all', name: 'All' },
    ...categories.filter(cat => cat.level === 0).slice(0, 4),
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#F7F7F7]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#26323B] text-white text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Just Dropped
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
            New Arrivals
          </h2>
          <p className="text-[#455A64] max-w-2xl mx-auto">
            Be the first to discover our latest collection of trending products
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2"
        >
          {displayCategories.map((category) => (
            <button
              key={category.$id}
              onClick={() => setActiveCategory(category.$id)}
              className={cn(
                'px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap',
                activeCategory === category.$id
                  ? 'bg-[#26323B] text-white'
                  : 'bg-white text-[#455A64] hover:bg-[#F7F7F7] border border-[#B0BEC5]'
              )}
            >
              {category.name}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {products.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))}
          </motion.div>
        )}

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/products?newArrivals=true"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#26323B] text-white font-semibold rounded-full hover:bg-[#455A64] transition-colors"
          >
            Shop All New Arrivals
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}