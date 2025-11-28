// src/components/home/Hero.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

const slides = [
  {
    id: 1,
    title: 'New Season Arrivals',
    subtitle: 'Spring Collection 2025',
    description: 'Discover the latest trends in fashion with our curated collection of premium essentials.',
    cta: 'Shop Collection',
    href: '/products?newArrivals=true',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
    align: 'left',
  },
  {
    id: 2,
    title: 'Timeless Elegance',
    subtitle: 'Premium Quality',
    description: 'Crafted with precision and designed to last. Experience luxury in every detail.',
    cta: 'Explore Now',
    href: '/products?featured=true',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    align: 'center',
  },
  {
    id: 3,
    title: 'Up to 50% Off',
    subtitle: 'Season End Sale',
    description: 'Don\'t miss out on incredible savings. Limited time offer on selected items.',
    cta: 'Shop Sale',
    href: '/products?sale=true',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',
    align: 'right',
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-[#26323B]">
      {/* Background Slides */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#26323B]/90 via-[#26323B]/60 to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4">
        <div
          className={`h-full flex items-center ${
            slide.align === 'center'
              ? 'justify-center text-center'
              : slide.align === 'right'
              ? 'justify-end text-right'
              : 'justify-start text-left'
          }`}
        >
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide}>
                <motion.span
                  custom={0}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-4"
                >
                  {slide.subtitle}
                </motion.span>

                <motion.h1
                  custom={1}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  custom={2}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-lg md:text-xl text-white/80 mb-8 max-w-md mx-auto"
                >
                  {slide.description}
                </motion.p>

                <motion.div
                  custom={3}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Link to={slide.href}>
                    <Button
                      size="lg"
                      className="bg-white text-[#26323B] hover:bg-[#F7F7F7]"
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      {slide.cta}
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#26323B] transition-all z-10 hidden md:flex items-center justify-center"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#26323B] transition-all z-10 hidden md:flex items-center justify-center"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 h-2 bg-white rounded-full'
                : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          key={currentSlide}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className="h-full bg-white"
        />
      </div>
    </section>
  );
}