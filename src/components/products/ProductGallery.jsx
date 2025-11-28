// src/components/products/ProductGallery.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, X, Expand } from 'lucide-react';
import { cn, getImageUrl, parseJSON } from '../../lib/utils';
import { BUCKET_ID } from '../../lib/appwrite';

export default function ProductGallery({ product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const images = parseJSON(product?.images, []);
  const allImages = [
    product?.thumbnail,
    ...images.filter(img => img !== product?.thumbnail)
  ].filter(Boolean);

  const getImageSrc = (imageId) => {
    if (!imageId) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=800&q=80';
    if (imageId.startsWith('http')) return imageId;
    return getImageUrl(imageId, BUCKET_ID);
  };

  const handleMouseMove = (e) => {
    if (!imageRef.current || !isZoomed) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  if (!allImages.length) {
    return (
      <div className="aspect-square bg-[#F7F7F7] rounded-2xl flex items-center justify-center">
        <span className="text-[#B0BEC5]">No image available</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F7F7F7] group">
          <motion.div
            ref={imageRef}
            className="relative w-full h-full cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setIsLightboxOpen(true)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={getImageSrc(allImages[currentIndex])}
                alt={`${product?.name} - Image ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                  transition: 'transform 0.1s ease-out',
                }}
              />
            </AnimatePresence>

            {/* Zoom Indicator */}
            <div className={cn(
              "absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 transition-opacity",
              isZoomed ? "opacity-0" : "opacity-100"
            )}>
              <ZoomIn className="w-3.5 h-3.5" />
              Hover to zoom
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm text-[#26323B] hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
            >
              <Expand className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-[#26323B] hover:bg-white transition-all shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-[#26323B] hover:bg-white transition-all shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
              {currentIndex + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {allImages.map((image, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all",
                  currentIndex === index
                    ? "ring-2 ring-[#26323B] ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={getImageSrc(image)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[90vh] mx-4"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={getImageSrc(allImages[currentIndex])}
                  alt={`${product?.name} - Image ${currentIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
            </motion.div>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden transition-all",
                      currentIndex === index
                        ? "ring-2 ring-white"
                        : "opacity-50 hover:opacity-100"
                    )}
                  >
                    <img
                      src={getImageSrc(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}