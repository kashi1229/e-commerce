// src/components/home/Categories.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '../../hooks/useProducts';
import { Skeleton } from '../common/Skeleton';

const categoryImages = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
  'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
  'Home & Living': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
  'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
  'Sports': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
  'Books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80';

export default function Categories() {
  const { categories, isLoading } = useCategories();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-[#F7F7F7]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayCategories = categories.filter(cat => cat.level === 0).slice(0, 6);

  return (
    <section className="py-16 md:py-24 bg-[#F7F7F7]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
            Shop by Category
          </h2>
          <p className="text-[#455A64] max-w-2xl mx-auto">
            Explore our wide range of categories and find exactly what you're looking for
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {displayCategories.map((category) => (
            <motion.div key={category.$id} variants={itemVariants}>
              <Link
                to={`/products?category=${category.$id}`}
                className="group block relative aspect-square rounded-2xl overflow-hidden"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${categoryImages[category.name] || category.image || defaultImage})`,
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#26323B]/90 via-[#26323B]/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {category.name}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {category.productCount || 0} Products
                  </p>

                  {/* Hover Arrow */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    <span className="inline-flex items-center gap-1 text-white text-sm font-medium">
                      Shop Now
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </motion.div>
                </div>

                {/* Border Animation */}
                <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-2xl transition-all duration-300" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[#26323B] font-semibold hover:text-[#455A64] transition-colors"
          >
            View All Categories
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}