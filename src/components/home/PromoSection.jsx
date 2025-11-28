// src/components/home/PromoSection.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Percent, Clock, Gift } from 'lucide-react';
import Button from '../common/Button';

export default function PromoSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Large Promo Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden md:row-span-2 min-h-[400px] md:min-h-[500px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#26323B] via-[#26323B]/50 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium w-fit mb-4">
                <Percent className="w-4 h-4" />
                Up to 50% Off
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Season End Sale
              </h3>
              <p className="text-white/80 mb-6 max-w-md">
                Don't miss out on our biggest sale of the season. Limited time offer on premium selections.
              </p>
              <Link to="/products?sale=true">
                <Button
                  className="bg-white text-[#26323B] hover:bg-[#F7F7F7]"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Shop Sale
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Small Promo Cards */}
          <div className="grid gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden min-h-[240px] bg-[#26323B]"
            >
              <div className="absolute inset-0 flex items-center p-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-3">
                    <Clock className="w-4 h-4" />
                    Limited Time
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Flash Deals
                  </h3>
                  <p className="text-white/70 mb-4">
                    Hurry! These deals won't last long
                  </p>
                  <Link to="/products?deals=true" className="inline-flex items-center gap-2 text-white font-medium hover:text-white/80 transition-colors">
                    Shop Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="hidden sm:block">
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">24h</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-3xl overflow-hidden min-h-[240px] bg-gradient-to-br from-[#455A64] to-[#26323B]"
            >
              <div className="absolute inset-0 flex items-center p-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-3">
                    <Gift className="w-4 h-4" />
                    Members Only
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Join & Save 15%
                  </h3>
                  <p className="text-white/70 mb-4">
                    Get exclusive access to members-only deals
                  </p>
                  <Link to="/register" className="inline-flex items-center gap-2 text-white font-medium hover:text-white/80 transition-colors">
                    Sign Up Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="hidden sm:block">
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">15%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}