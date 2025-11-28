// src/components/admin/ProductManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  ChevronDown,
  Download,
  Upload,
  Image as ImageIcon,
  Package,
  AlertCircle,
  Check,
  X,
  Star,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, cn, debounce, getImageUrl } from '../../lib/utils';
import { databases, DATABASE_ID, COLLECTIONS, Query, BUCKET_ID } from '../../lib/appwrite';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import { Skeleton } from '../common/Skeleton';
import { PRODUCT_STATUS } from '../../lib/constants';
import toast from 'react-hot-toast';

export default function ProductManagement() {
  const navigate = useNavigate();
  
  // State
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CATEGORIES,
          [Query.equal('isActive', true), Query.orderAsc('name')]
        );
        setCategories(response.documents);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queries = [];

      // Status filter
      if (statusFilter !== 'all') {
        queries.push(Query.equal('status', statusFilter));
      }

      // Category filter
      if (categoryFilter !== 'all') {
        queries.push(Query.equal('categoryId', categoryFilter));
      }

      // Search
      if (searchQuery.trim()) {
        queries.push(Query.search('name', searchQuery.trim()));
      }

      // Sorting
      switch (sortBy) {
        case 'oldest':
          queries.push(Query.orderAsc('$createdAt'));
          break;
        case 'price_high':
          queries.push(Query.orderDesc('price'));
          break;
        case 'price_low':
          queries.push(Query.orderAsc('price'));
          break;
        case 'stock_low':
          queries.push(Query.orderAsc('stock'));
          break;
        case 'bestselling':
          queries.push(Query.orderDesc('soldCount'));
          break;
        default:
          queries.push(Query.orderDesc('$createdAt'));
      }

      // Pagination
      queries.push(Query.limit(ITEMS_PER_PAGE));
      queries.push(Query.offset((currentPage - 1) * ITEMS_PER_PAGE));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        queries
      );

      setProducts(response.documents);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Handle delete
  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        productToDelete.$id
      );
      
      setProducts(prev => prev.filter(p => p.$id !== productToDelete.$id));
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (productId, newStatus) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        productId,
        { status: newStatus }
      );
      
      setProducts(prev => prev.map(p => 
        p.$id === productId ? { ...p, status: newStatus } : p
      ));
      toast.success('Product status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
    setActiveDropdown(null);
  };

  // Handle duplicate
  const handleDuplicate = async (product) => {
    try {
      const { $id, $createdAt, $updatedAt, $permissions, $collectionId, $databaseId, ...productData } = product;
      
      const newProduct = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        'unique()',
        {
          ...productData,
          name: `${product.name} (Copy)`,
          slug: `${product.slug}-copy-${Date.now()}`,
          sku: `${product.sku}-COPY`,
          status: 'inactive',
        }
      );
      
      setProducts(prev => [newProduct, ...prev]);
      toast.success('Product duplicated successfully');
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.error('Failed to duplicate product');
    }
    setActiveDropdown(null);
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      await Promise.all(
        selectedProducts.map(id =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id)
        )
      );
      
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.$id)));
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} products deleted`);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.$id));
    }
  };

  // Get image URL
  const getProductImage = (product) => {
    if (product.thumbnail) {
      if (product.thumbnail.startsWith('http')) return product.thumbnail;
      return getImageUrl(product.thumbnail, BUCKET_ID);
    }
    return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=100&q=80';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Products</h1>
          <p className="text-[#455A64]">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          <Button variant="outline" icon={Upload}>
            Import
          </Button>
          <Link to="/admin/products/new">
            <Button icon={Plus}>Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
            <input
              type="text"
              placeholder="Search products..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.$id} value={cat.$id}>{cat.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-[#F7F7F7] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#26323B] transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
              <option value="stock_low">Low Stock</option>
              <option value="bestselling">Best Selling</option>
            </select>

            {/* More Filters Button */}
            <Button
              variant="outline"
              size="sm"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              More Filters
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-[#F7F7F7]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#455A64]">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProducts([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={handleBulkDelete}
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-[#B0BEC5] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#26323B] mb-2">No products found</h3>
            <p className="text-[#455A64] mb-6">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'}
            </p>
            <Link to="/admin/products/new">
              <Button icon={Plus}>Add Product</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-[#F7F7F7] border-b border-[#E0E0E0] text-sm font-medium text-[#455A64]">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-[#B0BEC5] text-[#26323B] focus:ring-[#26323B]"
                />
              </div>
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#F7F7F7]">
              {products.map((product) => (
                <ProductRow
                  key={product.$id}
                  product={product}
                  isSelected={selectedProducts.includes(product.$id)}
                  onSelect={(id) => {
                    setSelectedProducts(prev =>
                      prev.includes(id)
                        ? prev.filter(p => p !== id)
                        : [...prev, id]
                    );
                  }}
                  onEdit={() => navigate(`/admin/products/${product.$id}/edit`)}
                  onDelete={() => {
                    setProductToDelete(product);
                    setShowDeleteModal(true);
                  }}
                  onStatusChange={(status) => handleStatusChange(product.$id, status)}
                  onDuplicate={() => handleDuplicate(product)}
                  onView={() => window.open(`/products/${product.$id}`, '_blank')}
                  getProductImage={getProductImage}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  categories={categories}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && products.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#455A64]">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, products.length)} of{' '}
            {products.length} products
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        title="Delete Product"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#26323B]">
                Are you sure you want to delete this product?
              </h3>
              <p className="text-sm text-[#455A64]">
                "{productToDelete?.name}" will be permanently removed.
              </p>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This action cannot be undone. All product data,
              including images and variants, will be permanently deleted.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              icon={Trash2}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Product Row Component
function ProductRow({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onView,
  getProductImage,
  activeDropdown,
  setActiveDropdown,
  categories,
}) {
  const isDropdownOpen = activeDropdown === product.$id;
  const category = categories.find(c => c.$id === product.categoryId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 lg:py-4 hover:bg-[#F7F7F7]/50 transition-colors",
        isSelected && "bg-blue-50"
      )}
    >
      {/* Checkbox */}
      <div className="hidden lg:flex col-span-1 items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(product.$id)}
          className="w-5 h-5 rounded border-[#B0BEC5] text-[#26323B] focus:ring-[#26323B]"
        />
      </div>

      {/* Product Info */}
      <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(product.$id)}
          className="lg:hidden w-5 h-5 rounded border-[#B0BEC5] text-[#26323B] focus:ring-[#26323B]"
        />
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F7F7F7] flex-shrink-0">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.isFeatured && (
            <div className="absolute top-1 left-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[#26323B] truncate">{product.name}</h3>
          <p className="text-sm text-[#455A64] truncate">
            SKU: {product.sku}
          </p>
          {category && (
            <span className="inline-block text-xs bg-[#F7F7F7] text-[#455A64] px-2 py-0.5 rounded-full mt-1">
              {category.name}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="col-span-1 lg:col-span-2 flex items-center">
        <div>
          <p className="font-semibold text-[#26323B]">{formatCurrency(product.price)}</p>
          {product.comparePrice > product.price && (
            <p className="text-sm text-[#B0BEC5] line-through">
              {formatCurrency(product.comparePrice)}
            </p>
          )}
        </div>
      </div>

      {/* Stock */}
      <div className="col-span-1 lg:col-span-1 flex items-center">
        <div className={cn(
          "text-sm font-medium",
          product.stock <= 0 ? "text-red-600" :
          product.stock <= (product.lowStockThreshold || 10) ? "text-yellow-600" :
          "text-green-600"
        )}>
          {product.stock <= 0 ? (
            <span className="flex items-center gap-1">
              <X className="w-4 h-4" />
              Out
            </span>
          ) : (
            <span className="flex items-center gap-1">
              {product.stock} left
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="col-span-1 lg:col-span-2 flex items-center">
        <Badge className={PRODUCT_STATUS[product.status]?.color || 'bg-gray-100 text-gray-800'}>
          {PRODUCT_STATUS[product.status]?.label || product.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="col-span-1 lg:col-span-2 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          onClick={onView}
          className="hidden sm:flex"
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Edit}
          onClick={onEdit}
        />
        
        {/* Dropdown Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            icon={MoreVertical}
            onClick={() => setActiveDropdown(isDropdownOpen ? null : product.$id)}
          />

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setActiveDropdown(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-50"
                >
                  <button
                    onClick={onView}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#455A64] hover:bg-[#F7F7F7]"
                  >
                    <Eye className="w-4 h-4" />
                    View Product
                  </button>
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#455A64] hover:bg-[#F7F7F7]"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Product
                  </button>
                  <button
                    onClick={onDuplicate}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#455A64] hover:bg-[#F7F7F7]"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  
                  <hr className="border-[#E0E0E0]" />
                  
                  {/* Status Options */}
                  <div className="px-4 py-2">
                    <p className="text-xs text-[#B0BEC5] font-medium mb-1">Change Status</p>
                  </div>
                  {Object.entries(PRODUCT_STATUS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => onStatusChange(key)}
                      className={cn(
                        "flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-[#F7F7F7]",
                        product.status === key ? "text-[#26323B] font-medium" : "text-[#455A64]"
                      )}
                    >
                      {product.status === key && <Check className="w-4 h-4" />}
                      <span className={product.status === key ? "ml-0" : "ml-6"}>
                        {value.label}
                      </span>
                    </button>
                  ))}
                  
                  <hr className="border-[#E0E0E0]" />
                  
                  <button
                    onClick={() => onStatusChange('inactive')}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}