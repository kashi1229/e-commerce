// src/components/product/WriteReviewModal.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  X,
  Plus,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import useReviewStore from '../../store/reviewStore';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';
import Input from '../common/Input';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// Interactive Star Rating
const StarRatingInput = ({ rating, onRatingChange, size = 'lg' }) => {
  const [hovered, setHovered] = useState(0);
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="text-center">
      <div className="flex gap-2 justify-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onRatingChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                sizes[size],
                "transition-colors",
                (hovered || rating) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-[#B0BEC5]"
              )}
            />
          </button>
        ))}
      </div>
      <p className="text-sm font-medium text-[#26323B]">
        {labels[hovered || rating] || 'Select a rating'}
      </p>
    </div>
  );
};

export default function WriteReviewModal({ 
  isOpen, 
  onClose, 
  productId, 
  orderId = null,
  productName = '',
  productImage = '',
  isVerifiedPurchase = false,
}) {
  const { user } = useAuthStore();
  const { createReview } = useReviewStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    pros: [''],
    cons: [''],
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        rating: 0,
        title: '',
        comment: '',
        pros: [''],
        cons: [''],
      });
      setImages([]);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleAddPro = () => {
    if (formData.pros.length < 5) {
      setFormData({ ...formData, pros: [...formData.pros, ''] });
    }
  };

  const handleAddCon = () => {
    if (formData.cons.length < 5) {
      setFormData({ ...formData, cons: [...formData.cons, ''] });
    }
  };

  const handleProChange = (index, value) => {
    const newPros = [...formData.pros];
    newPros[index] = value;
    setFormData({ ...formData, pros: newPros });
  };

  const handleConChange = (index, value) => {
    const newCons = [...formData.cons];
    newCons[index] = value;
    setFormData({ ...formData, cons: newCons });
  };

  const handleRemovePro = (index) => {
    const newPros = formData.pros.filter((_, i) => i !== index);
    setFormData({ ...formData, pros: newPros.length ? newPros : [''] });
  };

  const handleRemoveCon = (index) => {
    const newCons = formData.cons.filter((_, i) => i !== index);
    setFormData({ ...formData, cons: newCons.length ? newCons : [''] });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1 && formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (step === 2 && !formData.comment.trim()) {
      toast.error('Please write a review');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user?.$id) {
      toast.error('Please sign in to submit a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const filteredPros = formData.pros.filter((p) => p.trim());
      const filteredCons = formData.cons.filter((c) => c.trim());

      const reviewData = {
        productId,
        userId: user.$id,
        orderId: orderId || null,
        rating: formData.rating,
        title: formData.title || null,
        comment: formData.comment,
        pros: filteredPros.length > 0 ? JSON.stringify(filteredPros) : null,
        cons: filteredCons.length > 0 ? JSON.stringify(filteredCons) : null,
        isVerifiedPurchase,
      };

      const result = await createReview(reviewData, images);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden"
      >
        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-[#26323B] mb-2">
              Thank You!
            </h2>
            <p className="text-[#455A64]">
              Your review has been submitted and is pending approval.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-[#F7F7F7]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#26323B]">
                  Write a Review
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info */}
              {productName && (
                <div className="flex items-center gap-4 p-3 bg-[#F7F7F7] rounded-xl">
                  {productImage && (
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-medium text-[#26323B]">{productName}</p>
                    {isVerifiedPurchase && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      step >= s ? "bg-[#26323B]" : "bg-[#B0BEC5]"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              <AnimatePresence mode="wait">
                {/* Step 1: Rating */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-[#26323B] mb-6">
                        How would you rate this product?
                      </h3>
                      <StarRatingInput
                        rating={formData.rating}
                        onRatingChange={(rating) => setFormData({ ...formData, rating })}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Review Details */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <Input
                      label="Review Title (Optional)"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Summarize your experience"
                      maxLength={200}
                    />

                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Your Review *
                      </label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="What did you like or dislike about this product?"
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-2.5 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] resize-none"
                      />
                      <p className="text-xs text-[#455A64] mt-1 text-right">
                        {formData.comment.length}/2000
                      </p>
                    </div>

                    {/* Pros */}
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-2">
                        Pros (Optional)
                      </label>
                      <div className="space-y-2">
                        {formData.pros.map((pro, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={pro}
                              onChange={(e) => handleProChange(index, e.target.value)}
                              placeholder="What did you like?"
                              className="flex-1 px-4 py-2 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                            />
                            {formData.pros.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePro(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {formData.pros.length < 5 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={Plus}
                            onClick={handleAddPro}
                          >
                            Add Pro
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Cons */}
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-2">
                        Cons (Optional)
                      </label>
                      <div className="space-y-2">
                        {formData.cons.map((con, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={con}
                              onChange={(e) => handleConChange(index, e.target.value)}
                              placeholder="What could be improved?"
                              className="flex-1 px-4 py-2 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B]"
                            />
                            {formData.cons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCon(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {formData.cons.length < 5 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={Plus}
                            onClick={handleAddCon}
                          >
                            Add Con
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Images */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-[#26323B]">
                        Add Photos (Optional)
                      </h3>
                      <p className="text-sm text-[#455A64]">
                        Share photos of the product to help others
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center">
                      {images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {images.length < 5 && (
                        <label className="w-24 h-24 border-2 border-dashed border-[#B0BEC5] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#26323B] hover:bg-[#F7F7F7] transition-all">
                          <ImageIcon className="w-8 h-8 text-[#B0BEC5] mb-1" />
                          <span className="text-xs text-[#455A64]">Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-[#455A64] text-center">
                      Max 5 images • JPG, PNG up to 5MB each
                    </p>

                    {/* Review Summary */}
                    <div className="mt-8 p-4 bg-[#F7F7F7] rounded-xl">
                      <h4 className="text-sm font-medium text-[#26323B] mb-3">
                        Review Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[#455A64]">Rating:</span>
                          <StarRatingInput
                            rating={formData.rating}
                            onRatingChange={() => {}}
                            size="sm"
                          />
                        </div>
                        {formData.title && (
                          <p className="text-[#26323B] font-medium">{formData.title}</p>
                        )}
                        <p className="text-[#455A64] line-clamp-2">{formData.comment}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#F7F7F7]">
              <div className="flex gap-3">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    className="flex-1"
                  >
                    Submit Review
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}