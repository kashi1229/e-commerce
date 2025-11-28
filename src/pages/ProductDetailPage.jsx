// src/pages/ProductDetailPage.jsx
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { useProduct, useCategories } from '../hooks/useProducts';
import ProductGallery from '../components/products/ProductGallery';
import ProductDetails from '../components/products/ProductDetails';
import ProductReviews from '../components/products/ProductReviews';
import RelatedProducts from '../components/products/RelatedProducts';
import { LoadingPage } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { product, variants, reviews, isLoading, error } = useProduct(productId);
  const { categories } = useCategories();

  const category = categories.find(c => c.$id === product?.categoryId);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) {
      document.title = `${product.name} - Elegance`;
    }
  }, [product]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={Home}
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
          action={() => window.location.href = '/products'}
          actionLabel="Browse Products"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Breadcrumb */}
      <div className="bg-[#F7F7F7] border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-[#455A64] hover:text-[#26323B] transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-[#B0BEC5]" />
            <Link to="/products" className="text-[#455A64] hover:text-[#26323B] transition-colors">
              Products
            </Link>
            {category && (
              <>
                <ChevronRight className="w-4 h-4 text-[#B0BEC5]" />
                <Link
                  to={`/products?category=${category.$id}`}
                  className="text-[#455A64] hover:text-[#26323B] transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-[#B0BEC5]" />
            <span className="text-[#26323B] font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProductGallery product={product} />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProductDetails product={product} variants={variants} />
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-[#F7F7F7] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <ProductReviews productId={productId} reviews={reviews} />
        </div>
      </section>

      {/* Related Products */}
      <RelatedProducts productId={productId} categoryId={product.categoryId} />
    </motion.div>
  );
}