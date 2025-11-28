// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[150px] md:text-[200px] font-bold text-[#26323B]/5 select-none leading-none"
          >
            404
          </motion.span>
          
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, type: 'spring' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-24 h-24 bg-[#26323B] rounded-full flex items-center justify-center shadow-xl">
              <Search className="w-12 h-12 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Message */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-[#26323B] mb-4"
        >
          Page Not Found
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-[#455A64] mb-8 text-lg"
        >
          Oops! The page you're looking for doesn't exist or has been moved.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/">
            <Button 
              size="lg" 
              icon={Home} 
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>
          </Link>
          
          <Link to="/products">
            <Button 
              variant="outline" 
              size="lg" 
              icon={ShoppingBag} 
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              Browse Products
            </Button>
          </Link>
        </motion.div>

        {/* Go Back Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-2 text-[#455A64] hover:text-[#26323B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </motion.button>
      </motion.div>
    </div>
  );
}