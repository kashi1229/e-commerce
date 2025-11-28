// src/components/home/Testimonials.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Fashion Enthusiast',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 5,
    comment: 'Absolutely love the quality of products! The customer service is exceptional, and delivery was faster than expected. Will definitely shop here again.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Verified Buyer',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    rating: 5,
    comment: 'Best online shopping experience I\'ve had. The product descriptions are accurate, and the items exceeded my expectations. Highly recommend!',
  },
  {
    id: 3,
    name: 'Emily Davis',
    role: 'Loyal Customer',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    rating: 5,
    comment: 'I\'ve been shopping here for years. The consistency in quality and service keeps me coming back. Love the new collections every season!',
  },
  {
    id: 4,
    name: 'James Wilson',
    role: 'Tech Reviewer',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    rating: 4,
    comment: 'Great selection of electronics at competitive prices. The website is easy to navigate, and the checkout process is seamless.',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const testimonial = testimonials[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-[#26323B]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-[#B0BEC5] max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our valued customers have to say about their experience.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Quote Icon */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center z-10">
            <Quote className="w-8 h-8 text-white" />
          </div>

          {/* Testimonial Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="text-center"
              >
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white/20">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-white text-lg md:text-xl leading-relaxed mb-6 max-w-2xl mx-auto">
                  "{testimonial.comment}"
                </p>

                {/* Author */}
                <div>
                  <p className="text-white font-semibold text-lg">{testimonial.name}</p>
                  <p className="text-[#B0BEC5]">{testimonial.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'w-6 bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}