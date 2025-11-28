// src/store/reviewStore.js
import { create } from 'zustand';
import { databases, ID, Query } from '../lib/appwrite';
import { config } from '../lib/config';

const useReviewStore = create((set, get) => ({
  reviews: [],
  userReviews: [],
  productReviews: [],
  pendingReviews: [],
  currentReview: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    hasMore: false,
  },
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    averageRating: 0,
  },
  productStats: {},

  // Helper function to fetch user details for reviews
  enrichReviewsWithUserData: async (reviews) => {
    try {
      const userIds = [...new Set(reviews.map((r) => r.userId))];
      const userPromises = userIds.map(async (userId) => {
        try {
          const userDocs = await databases.listDocuments(
            config.databaseId,
            config.collections.userProfile,
            [Query.equal('userId', userId), Query.limit(1)]
          );
          return userDocs.documents[0] || null;
        } catch {
          return null;
        }
      });

      const users = await Promise.all(userPromises);
      const userMap = {};
      users.forEach((user, index) => {
        if (user) {
          userMap[userIds[index]] = user;
        }
      });

      return reviews.map((review) => ({
        ...review,
        userName: userMap[review.userId]
          ? `${userMap[review.userId].firstName || ''} ${userMap[review.userId].lastName || ''}`.trim() || 'Anonymous'
          : 'Anonymous',
        userAvatar: userMap[review.userId]?.avatar || null,
      }));
    } catch (error) {
      console.error('Error enriching reviews with user data:', error);
      return reviews.map((review) => ({
        ...review,
        userName: 'Anonymous',
        userAvatar: null,
      }));
    }
  },

  // Helper function to fetch product details for reviews
  enrichReviewsWithProductData: async (reviews) => {
    try {
      const productIds = [...new Set(reviews.map((r) => r.productId))];
      const productPromises = productIds.map(async (productId) => {
        try {
          const product = await databases.getDocument(
            config.databaseId,
            config.collections.products,
            productId
          );
          return product;
        } catch {
          return null;
        }
      });

      const products = await Promise.all(productPromises);
      const productMap = {};
      products.forEach((product, index) => {
        if (product) {
          productMap[productIds[index]] = product;
        }
      });

      return reviews.map((review) => ({
        ...review,
        productName: productMap[review.productId]?.name || 'Unknown Product',
        productImage: productMap[review.productId]?.images?.[0] || null,
        productSlug: productMap[review.productId]?.slug || review.productId,
      }));
    } catch (error) {
      console.error('Error enriching reviews with product data:', error);
      return reviews;
    }
  },

  // Fetch all reviews (Admin)
  fetchAllReviews: async (page = 1, limit = 10, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ];

      if (filters.isApproved !== undefined) {
        queries.push(Query.equal('isApproved', filters.isApproved));
      }
      if (filters.rating) {
        queries.push(Query.equal('rating', parseInt(filters.rating)));
      }
      if (filters.isVerifiedPurchase !== undefined) {
        queries.push(Query.equal('isVerifiedPurchase', filters.isVerifiedPurchase));
      }
      if (filters.productId) {
        queries.push(Query.equal('productId', filters.productId));
      }
      if (filters.userId) {
        queries.push(Query.equal('userId', filters.userId));
      }

      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.reviews,
        queries
      );

      // Enrich with user and product data
      let enrichedReviews = await get().enrichReviewsWithUserData(response.documents);
      enrichedReviews = await get().enrichReviewsWithProductData(enrichedReviews);

      set({
        reviews: enrichedReviews,
        pagination: {
          total: response.total,
          page,
          limit,
          hasMore: response.total > page * limit,
        },
        isLoading: false,
      });

      return { success: true, data: enrichedReviews, total: response.total };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch pending reviews (Admin)
  fetchPendingReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.reviews,
        [
          Query.equal('isApproved', false),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]
      );

      let enrichedReviews = await get().enrichReviewsWithUserData(response.documents);
      enrichedReviews = await get().enrichReviewsWithProductData(enrichedReviews);

      set({ pendingReviews: enrichedReviews, isLoading: false });
      return { success: true, data: enrichedReviews };
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch user's reviews
  fetchUserReviews: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.reviews,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]
      );

      // Enrich with product data for user reviews
      const enrichedReviews = await get().enrichReviewsWithProductData(response.documents);

      set({ userReviews: enrichedReviews, isLoading: false });
      return { success: true, data: enrichedReviews };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch product reviews (approved only for public)
  fetchProductReviews: async (productId, page = 1, limit = 10, sortBy = 'newest') => {
    set({ isLoading: true, error: null });
    try {
      let orderQuery;
      switch (sortBy) {
        case 'oldest':
          orderQuery = Query.orderAsc('$createdAt');
          break;
        case 'highest':
          orderQuery = Query.orderDesc('rating');
          break;
        case 'lowest':
          orderQuery = Query.orderAsc('rating');
          break;
        case 'helpful':
          orderQuery = Query.orderDesc('helpfulCount');
          break;
        default:
          orderQuery = Query.orderDesc('$createdAt');
      }

      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.reviews,
        [
          Query.equal('productId', productId),
          Query.equal('isApproved', true),
          orderQuery,
          Query.limit(limit),
          Query.offset((page - 1) * limit),
        ]
      );

      // Enrich with user data
      const enrichedReviews = await get().enrichReviewsWithUserData(response.documents);

      const newReviews = page === 1 
        ? enrichedReviews 
        : [...get().productReviews, ...enrichedReviews];

      set({
        productReviews: newReviews,
        pagination: {
          total: response.total,
          page,
          limit,
          hasMore: response.total > page * limit,
        },
        isLoading: false,
      });

      return { success: true, data: enrichedReviews, total: response.total };
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Get single review
  getReview: async (reviewId) => {
    set({ isLoading: true, error: null });
    try {
      const review = await databases.getDocument(
        config.databaseId,
        config.collections.reviews,
        reviewId
      );

      const enrichedReviews = await get().enrichReviewsWithUserData([review]);
      const enrichedWithProduct = await get().enrichReviewsWithProductData(enrichedReviews);

      set({ currentReview: enrichedWithProduct[0], isLoading: false });
      return { success: true, data: enrichedWithProduct[0] };
    } catch (error) {
      console.error('Error fetching review:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Create review
  createReview: async (reviewData) => {
    set({ isLoading: true, error: null });
    try {
      const review = await databases.createDocument(
        config.databaseId,
        config.collections.reviews,
        ID.unique(),
        {
          productId: reviewData.productId,
          userId: reviewData.userId,
          orderId: reviewData.orderId || null,
          rating: reviewData.rating,
          title: reviewData.title || null,
          comment: reviewData.comment,
          images: reviewData.images || null,
          pros: reviewData.pros || null,
          cons: reviewData.cons || null,
          isVerifiedPurchase: reviewData.isVerifiedPurchase || false,
          isApproved: false,
          helpfulCount: 0,
          reportCount: 0,
          response: null,
          respondedAt: null,
        }
      );

      // Enrich the new review with user and product data
      const enrichedReviews = await get().enrichReviewsWithUserData([review]);
      const enrichedWithProduct = await get().enrichReviewsWithProductData(enrichedReviews);

      set((state) => ({
        userReviews: [enrichedWithProduct[0], ...state.userReviews],
        isLoading: false,
      }));

      return { success: true, data: enrichedWithProduct[0] };
    } catch (error) {
      console.error('Error creating review:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update review
  updateReview: async (reviewId, data) => {
    set({ isLoading: true, error: null });
    try {
      const review = await databases.updateDocument(
        config.databaseId,
        config.collections.reviews,
        reviewId,
        data
      );

      // Enrich the updated review
      const enrichedReviews = await get().enrichReviewsWithUserData([review]);
      const enrichedWithProduct = await get().enrichReviewsWithProductData(enrichedReviews);
      const enrichedReview = enrichedWithProduct[0];

      set((state) => ({
        reviews: state.reviews.map((r) => (r.$id === reviewId ? enrichedReview : r)),
        userReviews: state.userReviews.map((r) => (r.$id === reviewId ? enrichedReview : r)),
        productReviews: state.productReviews.map((r) => (r.$id === reviewId ? enrichedReview : r)),
        pendingReviews: state.pendingReviews.map((r) => (r.$id === reviewId ? enrichedReview : r)),
        currentReview: state.currentReview?.$id === reviewId ? enrichedReview : state.currentReview,
        isLoading: false,
      }));

      return { success: true, data: enrichedReview };
    } catch (error) {
      console.error('Error updating review:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Delete review
  deleteReview: async (reviewId) => {
    set({ isLoading: true, error: null });
    try {
      await databases.deleteDocument(
        config.databaseId,
        config.collections.reviews,
        reviewId
      );

      set((state) => ({
        reviews: state.reviews.filter((r) => r.$id !== reviewId),
        userReviews: state.userReviews.filter((r) => r.$id !== reviewId),
        productReviews: state.productReviews.filter((r) => r.$id !== reviewId),
        pendingReviews: state.pendingReviews.filter((r) => r.$id !== reviewId),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error deleting review:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Approve review (Admin)
  approveReview: async (reviewId) => {
    const result = await get().updateReview(reviewId, { isApproved: true });
    if (result.success) {
      set((state) => ({
        pendingReviews: state.pendingReviews.filter((r) => r.$id !== reviewId),
      }));
    }
    return result;
  },

  // Reject review (Admin) - deletes the review
  rejectReview: async (reviewId) => {
    return get().deleteReview(reviewId);
  },

  // Add admin response
  addResponse: async (reviewId, response) => {
    return get().updateReview(reviewId, {
      response,
      respondedAt: new Date().toISOString(),
    });
  },

  // Remove admin response
  removeResponse: async (reviewId) => {
    return get().updateReview(reviewId, {
      response: null,
      respondedAt: null,
    });
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    const allReviews = [...get().reviews, ...get().productReviews, ...get().userReviews];
    const review = allReviews.find((r) => r.$id === reviewId);
    
    if (review) {
      return get().updateReview(reviewId, {
        helpfulCount: (review.helpfulCount || 0) + 1,
      });
    }
    return { success: false, error: 'Review not found' };
  },

  // Report review
  reportReview: async (reviewId) => {
    const allReviews = [...get().reviews, ...get().productReviews, ...get().userReviews];
    const review = allReviews.find((r) => r.$id === reviewId);
    
    if (review) {
      return get().updateReview(reviewId, {
        reportCount: (review.reportCount || 0) + 1,
      });
    }
    return { success: false, error: 'Review not found' };
  },

  // Get review statistics (Admin)
  getReviewStats: async () => {
    try {
      const [allReviews, pendingReviews, approvedReviews] = await Promise.all([
        databases.listDocuments(
          config.databaseId,
          config.collections.reviews,
          [Query.limit(1)]
        ),
        databases.listDocuments(
          config.databaseId,
          config.collections.reviews,
          [Query.equal('isApproved', false), Query.limit(1)]
        ),
        databases.listDocuments(
          config.databaseId,
          config.collections.reviews,
          [Query.equal('isApproved', true), Query.limit(1)]
        ),
      ]);

      const stats = {
        total: allReviews.total,
        pending: pendingReviews.total,
        approved: approvedReviews.total,
      };

      set({ stats });
      return stats;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return { total: 0, pending: 0, approved: 0 };
    }
  },

  // Get product review statistics (for product cards and detail pages)
  getProductReviewStats: async (productId) => {
    try {
      // Check if we already have cached stats
      const cachedStats = get().productStats[productId];
      if (cachedStats && Date.now() - cachedStats.timestamp < 60000) {
        return cachedStats.data;
      }

      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.reviews,
        [
          Query.equal('productId', productId),
          Query.equal('isApproved', true),
          Query.limit(500),
        ]
      );

      const reviews = response.documents;
      const total = reviews.length;

      if (total === 0) {
        const emptyStats = {
          total: 0,
          average: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
        
        set((state) => ({
          productStats: {
            ...state.productStats,
            [productId]: { data: emptyStats, timestamp: Date.now() },
          },
        }));
        
        return emptyStats;
      }

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sum = 0;

      reviews.forEach((review) => {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        sum += review.rating;
      });

      const stats = {
        total,
        average: sum / total,
        distribution,
      };

      // Cache the stats
      set((state) => ({
        productStats: {
          ...state.productStats,
          [productId]: { data: stats, timestamp: Date.now() },
        },
      }));

      return stats;
    } catch (error) {
      console.error('Error fetching product review stats:', error);
      return {
        total: 0,
        average: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
  },

  // Batch get product review stats (for product listings)
  batchGetProductReviewStats: async (productIds) => {
    try {
      const statsPromises = productIds.map((id) => get().getProductReviewStats(id));
      const results = await Promise.all(statsPromises);
      
      const statsMap = {};
      productIds.forEach((id, index) => {
        statsMap[id] = results[index];
      });
      
      return statsMap;
    } catch (error) {
      console.error('Error batch fetching review stats:', error);
      return {};
    }
  },

  // Check if user can review product
  canUserReviewProduct: async (userId, productId) => {
    try {
      // Check if user already reviewed this product
      const existingReview = await databases.listDocuments(
        config.databaseId,
        config.collections.reviews,
        [
          Query.equal('userId', userId),
          Query.equal('productId', productId),
          Query.limit(1),
        ]
      );

      if (existingReview.documents.length > 0) {
        return { 
          canReview: false, 
          reason: 'already_reviewed', 
          existingReview: existingReview.documents[0] 
        };
      }

      // Check if user has purchased this product
      try {
        const orders = await databases.listDocuments(
          config.databaseId,
          config.collections.orders,
          [
            Query.equal('userId', userId),
            Query.equal('status', 'delivered'),
            Query.limit(50),
          ]
        );

        for (const order of orders.documents) {
          const orderItems = await databases.listDocuments(
            config.databaseId,
            config.collections.orderItems,
            [
              Query.equal('orderId', order.$id),
              Query.equal('productId', productId),
              Query.limit(1),
            ]
          );

          if (orderItems.documents.length > 0) {
            return { 
              canReview: true, 
              isVerifiedPurchase: true, 
              orderId: order.$id 
            };
          }
        }
      } catch (orderError) {
        console.error('Error checking order history:', orderError);
      }

      // User can still review but not as verified purchase
      return { canReview: true, isVerifiedPurchase: false };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: true, isVerifiedPurchase: false };
    }
  },

  // Clear product reviews
  clearProductReviews: () => {
    set({ 
      productReviews: [], 
      pagination: { total: 0, page: 1, limit: 10, hasMore: false } 
    });
  },

  // Clear product stats cache
  clearProductStatsCache: (productId) => {
    if (productId) {
      set((state) => {
        const newStats = { ...state.productStats };
        delete newStats[productId];
        return { productStats: newStats };
      });
    } else {
      set({ productStats: {} });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    reviews: [],
    userReviews: [],
    productReviews: [],
    pendingReviews: [],
    currentReview: null,
    isLoading: false,
    error: null,
    pagination: { total: 0, page: 1, limit: 10, hasMore: false },
    stats: { total: 0, pending: 0, approved: 0, averageRating: 0 },
    productStats: {},
  }),
}));

export default useReviewStore;