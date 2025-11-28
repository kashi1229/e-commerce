// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

export function useProducts(options = {}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queries = [Query.equal('status', 'active')];
      
      if (options.categoryId) {
        queries.push(Query.equal('categoryId', options.categoryId));
      }
      
      if (options.featured) {
        queries.push(Query.equal('isFeatured', true));
      }
      
      if (options.newArrivals) {
        queries.push(Query.equal('isNewArrival', true));
      }
      
      if (options.bestsellers) {
        queries.push(Query.equal('isBestseller', true));
      }

      if (options.minPrice !== undefined) {
        queries.push(Query.greaterThanEqual('price', options.minPrice));
      }
      
      if (options.maxPrice !== undefined) {
        queries.push(Query.lessThanEqual('price', options.maxPrice));
      }

      if (options.search) {
        queries.push(Query.search('name', options.search));
      }

      // Sorting
      switch (options.sort) {
        case 'price_low':
          queries.push(Query.orderAsc('price'));
          break;
        case 'price_high':
          queries.push(Query.orderDesc('price'));
          break;
        case 'rating':
          queries.push(Query.orderDesc('rating'));
          break;
        case 'popular':
          queries.push(Query.orderDesc('soldCount'));
          break;
        default:
          queries.push(Query.orderDesc('$createdAt'));
      }

      // Pagination
      const limit = options.limit || 12;
      const offset = ((options.page || 1) - 1) * limit;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        queries
      );

      setProducts(response.documents);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    options.categoryId,
    options.featured,
    options.newArrivals,
    options.bestsellers,
    options.minPrice,
    options.maxPrice,
    options.search,
    options.sort,
    options.limit,
    options.page,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, totalPages, refetch: fetchProducts };
}

export function useProduct(productId) {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Fetch product
        const productData = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          productId
        );
        setProduct(productData);

        // Fetch variants if product has variants
        if (productData.hasVariants) {
          const variantsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCT_VARIANTS,
            [
              Query.equal('productId', productId),
              Query.equal('isActive', true),
              Query.orderAsc('sortOrder'),
            ]
          );
          setVariants(variantsResponse.documents);
        }

        // Fetch reviews
        const reviewsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.REVIEWS,
          [
            Query.equal('productId', productId),
            Query.equal('isApproved', true),
            Query.orderDesc('$createdAt'),
            Query.limit(10),
          ]
        );
        setReviews(reviewsResponse.documents);

        // Increment view count
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          productId,
          { viewCount: (productData.viewCount || 0) + 1 }
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  return { product, variants, reviews, isLoading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CATEGORIES,
          [
            Query.equal('isActive', true),
            Query.orderAsc('sortOrder'),
          ]
        );
        setCategories(response.documents);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}