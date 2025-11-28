// src/components/home/Newsletter.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Gift, Bell, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Welcome! Check your inbox for exclusive offers.');
    setEmail('');
    setIsSubmitting(false);
  };

  const benefits = [
    { icon: Gift, text: 'Exclusive Offers' },
    { icon: Bell, text: 'New Arrivals Alert' },
    { icon: Tag, text: 'Member Discounts' },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F7F7F7]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#26323B]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#455A64]/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[#26323B] flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-4">
                  Stay in the Loop
                </h2>
                <p className="text-[#455A64] max-w-lg mx-auto">
                  Subscribe to our newsletter and be the first to know about new arrivals,
                  exclusive offers, and style tips.
                </p>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-[#455A64]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-[#26323B]" />
                    </div>
                    <span className="font-medium">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-4 border-2 border-[#B0BEC5] rounded-xl text-[#26323B] placeholder-[#B0BEC5] focus:outline-none focus:border-[#26323B] transition-colors"
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-[#26323B] text-white font-semibold rounded-xl hover:bg-[#455A64] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Subscribe
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm text-[#B0BEC5] mt-4">
                No spam, unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}