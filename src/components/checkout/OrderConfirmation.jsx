// src/components/checkout/OrderConfirmation.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  Package,
  Truck,
  Mail,
  Download,
  Share2,
  Home,
  ShoppingBag,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  Copy,
} from 'lucide-react';
import { formatCurrency, formatDate, parseJSON, cn } from '../../lib/utils';
import { useOrder } from '../../hooks/useOrders';
import Button from '../common/Button';
import { LoadingPage } from '../common/Loading';
import toast from 'react-hot-toast';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { order, items, isLoading, error } = useOrder(orderId);
  const [copied, setCopied] = useState(false);

  const shippingAddress = order?.shippingAddress 
    ? parseJSON(order.shippingAddress, {}) 
    : {};

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success('Order number copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Order ${order?.orderNumber}`,
        text: `I just placed an order! Order #${order?.orderNumber}`,
        url: window.location.href,
      });
    } catch {
      handleCopyOrderNumber();
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#26323B] mb-2">Order Not Found</h1>
          <p className="text-[#455A64] mb-6">
            We couldn't find the order you're looking for.
          </p>
          <Link to="/">
            <Button icon={Home}>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Timeline steps
  const timelineSteps = [
    { id: 'confirmed', label: 'Order Confirmed', icon: Check, completed: true },
    { id: 'processing', label: 'Processing', icon: Package, completed: order.status !== 'pending' },
    { id: 'shipped', label: 'Shipped', icon: Truck, completed: ['shipped', 'delivered'].includes(order.status) },
    { id: 'delivered', label: 'Delivered', icon: Home, completed: order.status === 'delivered' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-[#455A64] text-lg">
              Your order has been placed successfully
            </p>
          </motion.div>
        </motion.div>

        {/* Order Number Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7] mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-[#455A64] mb-1">Order Number</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#26323B] font-mono">
                  {order.orderNumber}
                </span>
                <button
                  onClick={handleCopyOrderNumber}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    copied ? "bg-green-100 text-green-600" : "hover:bg-[#F7F7F7] text-[#455A64]"
                  )}
                  title="Copy order number"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={handleShare}
              >
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
              >
                Download Receipt
              </Button>
            </div>
          </div>

          {/* Order Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F7F7F7]">
            <div>
              <div className="flex items-center gap-2 text-[#455A64] text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Order Date
              </div>
              <p className="font-medium text-[#26323B]">
                {formatDate(order.$createdAt)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#455A64] text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Payment
              </div>
              <p className="font-medium text-[#26323B] capitalize">
                {order.paymentMethod}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#455A64] text-sm mb-1">
                <Package className="w-4 h-4" />
                Items
              </div>
              <p className="font-medium text-[#26323B]">
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#455A64] text-sm mb-1">
                <Clock className="w-4 h-4" />
                Est. Delivery
              </div>
              <p className="font-medium text-[#26323B]">
                {order.estimatedDelivery 
                  ? formatDate(order.estimatedDelivery)
                  : '5-7 business days'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Order Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7] mb-6"
        >
          <h2 className="text-lg font-bold text-[#26323B] mb-6">Order Status</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-[#E0E0E0]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ 
                  width: `${(timelineSteps.filter(s => s.completed).length - 1) / (timelineSteps.length - 1) * 100}%` 
                }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="h-full bg-green-500"
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {timelineSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all",
                    step.completed
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                      : "bg-[#F7F7F7] text-[#B0BEC5]"
                  )}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "mt-2 text-sm font-medium text-center",
                    step.completed ? "text-[#26323B]" : "text-[#B0BEC5]"
                  )}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Order Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7]"
          >
            <h3 className="font-bold text-[#26323B] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#455A64]" />
              Shipping Address
            </h3>
            <div className="text-[#455A64]">
              <p className="font-medium text-[#26323B]">{shippingAddress.fullName}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
              <p className="mt-2">{shippingAddress.phone}</p>
            </div>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7]"
          >
            <h3 className="font-bold text-[#26323B] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#455A64]" />
              Payment Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#455A64]">Subtotal</span>
                <span className="text-[#26323B]">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#455A64]">Shipping</span>
                <span className={order.shipping === 0 ? "text-green-600" : "text-[#26323B]"}>
                  {order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#455A64]">Tax</span>
                <span className="text-[#26323B]">{formatCurrency(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-[#F7F7F7] pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-[#26323B]">Total</span>
                  <span className="text-[#26323B] text-lg">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7] mb-6"
        >
          <h3 className="font-bold text-[#26323B] mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#455A64]" />
            Order Items
          </h3>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.$id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className="flex gap-4 p-4 bg-[#F7F7F7] rounded-xl"
              >
                <img
                  src={item.productImage || 'https://via.placeholder.com/80'}
                  alt={item.productName}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-[#26323B]">{item.productName}</h4>
                  <p className="text-sm text-[#455A64]">SKU: {item.sku}</p>
                  <p className="text-sm text-[#455A64]">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#26323B]">{formatCurrency(item.total)}</p>
                  <p className="text-sm text-[#455A64]">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Email Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Confirmation Email Sent</h3>
              <p className="text-blue-700 text-sm">
                We've sent a confirmation email with your order details. 
                You'll also receive tracking information once your order ships.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/orders">
            <Button variant="outline" icon={Package} className="w-full sm:w-auto">
              View All Orders
            </Button>
          </Link>
          <Link to="/products">
            <Button icon={ShoppingBag} className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}