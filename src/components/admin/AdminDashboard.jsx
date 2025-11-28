// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime, cn } from '../../lib/utils';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../../lib/appwrite';
import { Skeleton } from '../common/Skeleton';
import Badge from '../common/Badge';
import { ORDER_STATUS } from '../../lib/constants';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        // Fetch orders
        const ordersResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          [Query.orderDesc('$createdAt'), Query.limit(100)]
        );

        // Fetch products
        const productsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [Query.orderDesc('soldCount'), Query.limit(5)]
        );

        // Fetch customers
        const customersResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS_PROFILE,
          [Query.limit(1)]
        );

        // Calculate stats
        const orders = ordersResponse.documents;
        const totalRevenue = orders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.total, 0);
        
        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.$createdAt) >= today);
        const todayRevenue = todayOrders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.total, 0);

        setStats({
          totalRevenue,
          totalOrders: ordersResponse.total,
          totalProducts: productsResponse.total || 0,
          totalCustomers: customersResponse.total || 0,
          pendingOrders,
          todayOrders: todayOrders.length,
          todayRevenue,
        });

        setRecentOrders(orders.slice(0, 5));
        setTopProducts(productsResponse.documents);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats ? formatCurrency(stats.totalRevenue) : '-',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: '+8.2%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Products',
      value: stats?.totalProducts || 0,
      change: '+3',
      changeType: 'positive',
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Customers',
      value: stats?.totalCustomers || 0,
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Dashboard</h1>
          <p className="text-[#455A64]">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-sm focus:outline-none focus:border-[#26323B]">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7] hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.color)}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                stat.changeType === 'positive' ? "text-green-600" : "text-red-600"
              )}>
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm text-[#455A64]">{stat.title}</h3>
              <p className="text-2xl font-bold text-[#26323B] mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#26323B] to-[#455A64] rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Today's Revenue</h3>
            <DollarSign className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</p>
          <p className="text-white/70 text-sm mt-1">
            {stats?.todayOrders || 0} orders today
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Pending Orders</h3>
            <Clock className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold">{stats?.pendingOrders || 0}</p>
          <p className="text-white/80 text-sm mt-1">Require attention</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-green-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Conversion Rate</h3>
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold">3.24%</p>
          <p className="text-white/80 text-sm mt-1">+0.5% from last week</p>
        </motion.div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7]"
        >
          <div className="p-6 border-b border-[#F7F7F7] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#26323B]">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-[#455A64] hover:text-[#26323B] flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-[#F7F7F7]">
            {recentOrders.map((order) => (
              <Link
                key={order.$id}
                to={`/admin/orders/${order.$id}`}
                className="flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F7F7F7] rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-[#455A64]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#26323B]">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-[#455A64]">
                      {formatRelativeTime(order.$createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#26323B]">
                    {formatCurrency(order.total)}
                  </p>
                  <Badge className={ORDER_STATUS[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {ORDER_STATUS[order.status]?.label || order.status}
                  </Badge>
                </div>
              </Link>
            ))}

            {recentOrders.length === 0 && (
              <div className="p-8 text-center text-[#455A64]">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7]"
        >
          <div className="p-6 border-b border-[#F7F7F7] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#26323B]">Top Products</h2>
            <Link
              to="/admin/products"
              className="text-sm text-[#455A64] hover:text-[#26323B] flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-[#F7F7F7]">
            {topProducts.map((product, index) => (
              <Link
                key={product.$id}
                to={`/admin/products/${product.$id}`}
                className="flex items-center gap-4 p-4 hover:bg-[#F7F7F7] transition-colors"
              >
                <span className="w-6 h-6 bg-[#26323B] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <img
                  src={product.thumbnail || 'https://via.placeholder.com/48'}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#26323B] truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-[#455A64]">
                    {product.soldCount || 0} sold
                  </p>
                </div>
                <p className="font-semibold text-[#26323B]">
                  {formatCurrency(product.price)}
                </p>
              </Link>
            ))}

            {topProducts.length === 0 && (
              <div className="p-8 text-center text-[#455A64]">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}