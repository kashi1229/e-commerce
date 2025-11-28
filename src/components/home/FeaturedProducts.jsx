// src/components/home/FeaturedProducts.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from '../products/ProductCard';
import { ProductGridSkeleton } from '../common/Skeleton';

export default function FeaturedProducts() {
  const { products, isLoading } = useProducts({ featured: true, limit: 8 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-[#455A64] font-medium mb-2 block">Curated Selection</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#26323B]">
              Featured Products
            </h2>
          </div>
          <Link
            to="/products?featured=true"
            className="inline-flex items-center gap-2 text-[#26323B] font-semibold hover:text-[#455A64] transition-colors"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {products.map((product) => (
              <ProductCard key={product.$id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}