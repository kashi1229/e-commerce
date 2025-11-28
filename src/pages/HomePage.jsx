// src/pages/HomePage.jsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/home/Hero';
import Categories from '../components/home/Categories';
import FeaturedProducts from '../components/home/FeaturedProducts';
import NewArrivals from '../components/home/NewArrivals';
import PromoSection from '../components/home/PromoSection';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';

export default function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Elegance - Premium E-Commerce Store';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero />
      <Categories />
      <FeaturedProducts />
      <PromoSection />
      <NewArrivals />
      <Testimonials />
      <Newsletter />
    </motion.div>
  );
}