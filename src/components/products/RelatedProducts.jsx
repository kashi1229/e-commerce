// src/components/products/RelatedProducts.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from '../common/Skeleton';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../../lib/appwrite';

export default function RelatedProducts({ productId, categoryId }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!categoryId) return;

      try {
        setIsLoading(true);
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [
            Query.equal('categoryId', categoryId),
            Query.equal('status', 'active'),
            Query.notEqual('$id', productId),
            Query.limit(8),
          ]
        );
        setProducts(response.documents);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelatedProducts();
  }, [productId, categoryId]);

  const scroll = (direction) => {
    const container = document.getElementById('related-products-container');
    if (container) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#26323B] mb-8">
            You May Also Like
          </h2>
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#F7F7F7]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-[#26323B]"
          >
            You May Also Like
          </motion.h2>

          {/* Navigation Arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white border border-[#B0BEC5] text-[#455A64] hover:bg-[#26323B] hover:text-white hover:border-[#26323B] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white border border-[#B0BEC5] text-[#455A64] hover:bg-[#26323B] hover:text-white hover:border-[#26323B] transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Products Carousel */}
        <div
          id="related-products-container"
          className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.$id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="w-[280px] md:w-[300px] flex-shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}