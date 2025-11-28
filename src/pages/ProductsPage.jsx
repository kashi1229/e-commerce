// src/pages/ProductsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  ChevronDown,
  X,
} from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useProducts';
import ProductGrid from '../components/products/ProductGrid';
import ProductFilters from '../components/products/ProductFilters';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { cn } from '../lib/utils';
import { SORT_OPTIONS } from '../lib/constants';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // View state
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter state from URL params
  const filters = useMemo(() => ({
    categoryId: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    search: searchParams.get('q') || searchParams.get('search') || undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    newArrivals: searchParams.get('newArrivals') === 'true' || undefined,
    bestsellers: searchParams.get('bestsellers') === 'true' || undefined,
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  }), [searchParams]);

  // Fetch products
  const { products, isLoading, totalPages } = useProducts({
    ...filters,
    limit: 12,
  });

  const { categories } = useCategories();

  // Get current category
  const currentCategory = categories.find(c => c.$id === filters.categoryId);

  // Page title
  useEffect(() => {
    let title = 'Shop';
    if (filters.search) title = `Search: ${filters.search}`;
    else if (filters.featured) title = 'Featured Products';
    else if (filters.newArrivals) title = 'New Arrivals';
    else if (filters.bestsellers) title = 'Bestsellers';
    else if (currentCategory) title = currentCategory.name;
    
    document.title = `${title} - Elegance`;
    window.scrollTo(0, 0);
  }, [filters, currentCategory]);

  // Update filters
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key === 'categoryId' ? 'category' : key);
      } else {
        params.set(key === 'categoryId' ? 'category' : key, String(value));
      }
    });
    
    // Reset to page 1 when filters change
    if (!newFilters.page) {
      params.delete('page');
    }
    
    setSearchParams(params);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchParams({});
  };

  // Handle sort change
  const handleSortChange = (sortValue) => {
    handleFilterChange({ sort: sortValue });
    setShowSortDropdown(false);
  };

  // Handle page change
  const handlePageChange = (page) => {
    handleFilterChange({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && !['sort', 'page'].includes(key)
  ).length;

  // Page header text
  const getPageTitle = () => {
    if (filters.search) return `Search Results for "${filters.search}"`;
    if (filters.featured) return 'Featured Products';
    if (filters.newArrivals) return 'New Arrivals';
    if (filters.bestsellers) return 'Bestsellers';
    if (currentCategory) return currentCategory.name;
    return 'All Products';
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-[#26323B] mb-2">
              {getPageTitle()}
            </h1>
            {currentCategory?.description && (
              <p className="text-[#455A64] max-w-2xl mx-auto">
                {currentCategory.description}
              </p>
            )}
            {filters.search && products.length > 0 && (
              <p className="text-[#455A64] mt-2">
                Found {products.length} results
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-[#F7F7F7]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Filter toggle (mobile) & results count */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={SlidersHorizontal}
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden"
                  >
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-[#26323B] text-white text-xs rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* ✅ FIXED: Changed <p> to <span> to allow Skeleton (div) inside */}
                  <span className="text-sm text-[#455A64] inline-flex items-center">
                    {isLoading ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      `Showing ${products.length} products`
                    )}
                  </span>
                </div>

                {/* Right: Sort & View */}
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F7F7F7] rounded-xl text-sm font-medium text-[#455A64] hover:bg-[#E8E8E8] transition-colors"
                    >
                      {SORT_OPTIONS.find(o => o.value === filters.sort)?.label || 'Sort by'}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        showSortDropdown && "rotate-180"
                      )} />
                    </button>

                    <AnimatePresence>
                      {showSortDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowSortDropdown(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-50"
                          >
                            {SORT_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleSortChange(option.value)}
                                className={cn(
                                  "w-full px-4 py-2.5 text-left text-sm transition-colors",
                                  filters.sort === option.value
                                    ? "bg-[#26323B] text-white"
                                    : "text-[#455A64] hover:bg-[#F7F7F7]"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* View Toggle */}
                  <div className="hidden md:flex items-center bg-[#F7F7F7] rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        viewMode === 'grid'
                          ? "bg-white text-[#26323B] shadow-sm"
                          : "text-[#B0BEC5] hover:text-[#455A64]"
                      )}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        viewMode === 'list'
                          ? "bg-white text-[#26323B] shadow-sm"
                          : "text-[#B0BEC5] hover:text-[#455A64]"
                      )}
                    >
                      <LayoutList className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#F7F7F7]">
                  <span className="text-sm text-[#455A64]">Active filters:</span>
                  
                  {filters.categoryId && currentCategory && (
                    <button
                      onClick={() => handleFilterChange({ categoryId: undefined })}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
                    >
                      {currentCategory.name}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  
                  {filters.minPrice !== undefined && (
                    <button
                      onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
                    >
                      ${filters.minPrice} - ${filters.maxPrice || '∞'}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  
                  {filters.minRating && (
                    <button
                      onClick={() => handleFilterChange({ minRating: undefined })}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#26323B] text-white text-sm rounded-full"
                    >
                      {filters.minRating}+ Stars
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-[#455A64] hover:text-[#26323B] underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={products}
              isLoading={isLoading}
              columns={viewMode === 'list' ? 2 : 4}
              emptyTitle={filters.search ? 'No products found' : 'No products available'}
              emptyDescription={
                filters.search
                  ? 'Try different search terms or browse our categories'
                  : 'Check back later for new products'
              }
            />

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        isMobile
      />
    </div>
  );
}