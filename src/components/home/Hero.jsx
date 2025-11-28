// src/components/home/Hero.jsx
import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

// Optimized slide data with multiple image sizes
const slides = [
  {
    id: 1,
    title: 'New Season Arrivals',
    subtitle: 'Spring Collection 2025',
    description: 'Discover the latest trends in fashion with our curated collection of premium essentials.',
    cta: 'Shop Collection',
    href: '/products?newArrivals=true',
    // Multiple sizes for responsive loading
    images: {
      placeholder: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=20&q=10&blur=10',
      small: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=640&q=75&auto=format',
      medium: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1280&q=80&auto=format',
      large: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=85&auto=format',
    },
    align: 'left',
  },
  {
    id: 2,
    title: 'Timeless Elegance',
    subtitle: 'Premium Quality',
    description: 'Crafted with precision and designed to last. Experience luxury in every detail.',
    cta: 'Explore Now',
    href: '/products?featured=true',
    images: {
      placeholder: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=20&q=10&blur=10',
      small: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&q=75&auto=format',
      medium: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1280&q=80&auto=format',
      large: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=85&auto=format',
    },
    align: 'center',
  },
  {
    id: 3,
    title: 'Up to 50% Off',
    subtitle: 'Season End Sale',
    description: "Don't miss out on incredible savings. Limited time offer on selected items.",
    cta: 'Shop Sale',
    href: '/products?sale=true',
    images: {
      placeholder: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=20&q=10&blur=10',
      small: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&q=75&auto=format',
      medium: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1280&q=80&auto=format',
      large: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=85&auto=format',
    },
    align: 'right',
  },
];

// Custom hook for image preloading with caching
const useImagePreloader = (imageUrls) => {
  const [loadedImages, setLoadedImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const imageCache = new Map();
    let isMounted = true;

    const preloadImage = (url) => {
      return new Promise((resolve, reject) => {
        // Check if already cached
        if (imageCache.has(url)) {
          resolve(url);
          return;
        }

        const img = new Image();
        img.onload = () => {
          imageCache.set(url, true);
          resolve(url);
        };
        img.onerror = reject;
        img.src = url;
      });
    };

    const preloadAllImages = async () => {
      const results = {};
      
      // Preload first slide immediately (priority)
      try {
        const firstSlideUrl = getResponsiveImageUrl(imageUrls[0]);
        await preloadImage(firstSlideUrl);
        if (isMounted) {
          results[0] = true;
          setLoadedImages({ ...results });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading first image:', error);
        if (isMounted) setIsLoading(false);
      }

      // Preload remaining slides in background
      for (let i = 1; i < imageUrls.length; i++) {
        try {
          const url = getResponsiveImageUrl(imageUrls[i]);
          await preloadImage(url);
          if (isMounted) {
            results[i] = true;
            setLoadedImages((prev) => ({ ...prev, [i]: true }));
          }
        } catch (error) {
          console.error(`Error loading image ${i}:`, error);
        }
      }
    };

    preloadAllImages();

    return () => {
      isMounted = false;
    };
  }, [imageUrls]);

  return { loadedImages, isLoading };
};

// Get responsive image URL based on screen size
const getResponsiveImageUrl = (images) => {
  if (typeof window === 'undefined') return images.medium;
  
  const width = window.innerWidth;
  if (width <= 640) return images.small;
  if (width <= 1280) return images.medium;
  return images.large;
};

// Optimized Background Image Component
const HeroBackground = memo(({ slide, isActive, isLoaded }) => {
  const [currentSrc, setCurrentSrc] = useState(slide.images.placeholder);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const targetSrc = getResponsiveImageUrl(slide.images);
    
    // If already loaded from preloader, use directly
    if (isLoaded) {
      setCurrentSrc(targetSrc);
      setIsImageLoaded(true);
      return;
    }

    // Progressive loading: placeholder -> full image
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(targetSrc);
      setIsImageLoaded(true);
    };
    img.src = targetSrc;
  }, [slide, isActive, isLoaded]);

  return (
    <div className="absolute inset-0">
      {/* Placeholder/Blur background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{
          backgroundImage: `url(${slide.images.placeholder})`,
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: isImageLoaded ? 0 : 1,
        }}
      />
      
      {/* Main Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          isImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${currentSrc})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#26323B]/90 via-[#26323B]/60 to-transparent" />
    </div>
  );
});

HeroBackground.displayName = 'HeroBackground';

// Skeleton Loader Component
const HeroSkeleton = () => (
  <div className="absolute inset-0 bg-[#26323B] animate-pulse">
    <div className="h-full container mx-auto px-4 flex items-center">
      <div className="max-w-xl space-y-4">
        <div className="w-32 h-8 bg-white/10 rounded-full" />
        <div className="w-96 h-16 bg-white/10 rounded-lg" />
        <div className="w-80 h-6 bg-white/10 rounded-lg" />
        <div className="w-40 h-12 bg-white/10 rounded-lg mt-4" />
      </div>
    </div>
  </div>
);

// Slide Content Component (memoized for performance)
const SlideContent = memo(({ slide, slideIndex }) => {
  // Simplified animation variants for better performance
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.08,
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
  };

  return (
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
      </div>
    </div>
  );
});

SlideContent.displayName = 'SlideContent';

// Main Hero Component
function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Preload all images
  const { loadedImages, isLoading } = useImagePreloader(
    slides.map((slide) => slide.images)
  );

  // Auto-slide with pause on hover
  useEffect(() => {
    if (isPaused || isLoading) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, isLoading]);

  const goToSlide = useCallback((index) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Simplified slide variants for better performance
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const slide = slides[currentSlide];

  return (
    <section
      className="relative h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-[#26323B]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Loading Skeleton */}
      {isLoading && <HeroSkeleton />}

      {/* Background Slides */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'tween', duration: 0.5, ease: 'easeInOut' },
            opacity: { duration: 0.3 },
          }}
          className="absolute inset-0"
        >
          <HeroBackground
            slide={slide}
            isActive={true}
            isLoaded={loadedImages[currentSlide]}
          />
        </motion.div>
      </AnimatePresence>

      {/* Preload next slide image */}
      {slides.map((s, index) => (
        index !== currentSlide && (
          <link
            key={s.id}
            rel="preload"
            as="image"
            href={getResponsiveImageUrl(s.images)}
          />
        )
      ))}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <SlideContent slide={slide} slideIndex={currentSlide} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#26323B] transition-all z-10 hidden md:flex items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#26323B] transition-all z-10 hidden md:flex items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
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
          key={`progress-${currentSlide}`}
          initial={{ width: '0%' }}
          animate={{ width: isPaused ? undefined : '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className="h-full bg-white"
          style={isPaused ? { width: undefined } : undefined}
        />
      </div>
    </section>
  );
}

export default memo(Hero);