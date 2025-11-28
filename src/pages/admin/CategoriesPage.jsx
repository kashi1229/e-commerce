// src/pages/admin/CategoriesPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Folder,
  FolderTree,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  Grid3X3,
  List,
  ChevronRight,
  ChevronDown,
  Upload,
  Home,
  Tag,
  ShoppingBag,
  Heart,
  Star,
  Gift,
  Zap,
  Sparkles,
  Crown,
  Gem,
  Shirt,
  Watch,
  Footprints,
  Glasses,
  Palette,
  Music,
  Gamepad2,
  BookOpen,
  Camera,
  Headphones,
  Laptop,
  Smartphone,
  Tv,
  Car,
  Plane,
  TreePine,
  Flower2,
  Coffee,
  UtensilsCrossed,
  Baby,
  Cat,
  Dog,
  Dumbbell,
} from 'lucide-react';
import { 
  databases, 
  storage, 
  DATABASE_ID, 
  COLLECTIONS, 
  BUCKET_ID, 
  ID, 
  Query 
} from '../../lib/appwrite';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ============================================
// Constants
// ============================================

// Category status options
const CATEGORY_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-500' },
};

// Sort options
const SORT_OPTIONS = [
  { value: 'sortOrder_asc', label: 'Sort Order' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'products', label: 'Most Products' },
];

// Available icons for categories
const CATEGORY_ICONS = [
  { name: 'folder', icon: Folder, label: 'Folder' },
  { name: 'tag', icon: Tag, label: 'Tag' },
  { name: 'shopping-bag', icon: ShoppingBag, label: 'Shopping Bag' },
  { name: 'heart', icon: Heart, label: 'Heart' },
  { name: 'star', icon: Star, label: 'Star' },
  { name: 'gift', icon: Gift, label: 'Gift' },
  { name: 'zap', icon: Zap, label: 'Zap' },
  { name: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { name: 'crown', icon: Crown, label: 'Crown' },
  { name: 'gem', icon: Gem, label: 'Gem' },
  { name: 'shirt', icon: Shirt, label: 'Clothing' },
  { name: 'watch', icon: Watch, label: 'Watch' },
  { name: 'footprints', icon: Footprints, label: 'Footwear' },
  { name: 'glasses', icon: Glasses, label: 'Eyewear' },
  { name: 'palette', icon: Palette, label: 'Art' },
  { name: 'music', icon: Music, label: 'Music' },
  { name: 'gamepad', icon: Gamepad2, label: 'Gaming' },
  { name: 'book', icon: BookOpen, label: 'Books' },
  { name: 'camera', icon: Camera, label: 'Camera' },
  { name: 'headphones', icon: Headphones, label: 'Audio' },
  { name: 'laptop', icon: Laptop, label: 'Computers' },
  { name: 'smartphone', icon: Smartphone, label: 'Phones' },
  { name: 'tv', icon: Tv, label: 'Electronics' },
  { name: 'car', icon: Car, label: 'Automotive' },
  { name: 'plane', icon: Plane, label: 'Travel' },
  { name: 'tree', icon: TreePine, label: 'Outdoor' },
  { name: 'flower', icon: Flower2, label: 'Garden' },
  { name: 'coffee', icon: Coffee, label: 'Beverages' },
  { name: 'food', icon: UtensilsCrossed, label: 'Food' },
  { name: 'baby', icon: Baby, label: 'Baby' },
  { name: 'cat', icon: Cat, label: 'Pets' },
  { name: 'dog', icon: Dog, label: 'Dogs' },
  { name: 'dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'home', icon: Home, label: 'Home' },
];

// Helper to generate slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Get image URL
const getImageUrl = (fileId) => {
  if (!fileId) return null;
  return `https://tor.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=69256e160012a22579e5`;
};

// Get icon component by name
const getIconComponent = (iconName) => {
  const iconData = CATEGORY_ICONS.find(i => i.name === iconName);
  return iconData?.icon || Folder;
};

// Initial form state matching Appwrite schema
const INITIAL_FORM_STATE = {
  name: '',
  slug: '',
  description: '',
  image: null,
  icon: 'folder',
  parentId: null,
  level: 0,
  isActive: true,
  sortOrder: 0,
  productCount: 0,
  metadata: '',
};

// ============================================
// Main Component
// ============================================
export default function CategoriesPage() {
  // State
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sortOrder_asc');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const queries = [Query.limit(500)];
      
      // Add sorting
      switch (sortBy) {
        case 'sortOrder_asc':
          queries.push(Query.orderAsc('sortOrder'));
          break;
        case 'name_asc':
          queries.push(Query.orderAsc('name'));
          break;
        case 'name_desc':
          queries.push(Query.orderDesc('name'));
          break;
        case 'newest':
          queries.push(Query.orderDesc('$createdAt'));
          break;
        case 'oldest':
          queries.push(Query.orderAsc('$createdAt'));
          break;
        case 'products':
          queries.push(Query.orderDesc('productCount'));
          break;
        default:
          queries.push(Query.orderAsc('sortOrder'));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        queries
      );

      setCategories(response.documents);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter and organize categories
  const { filteredCategories, categoryTree, stats } = useMemo(() => {
    let filtered = [...categories];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cat => cat.isActive === (statusFilter === 'active'));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name?.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query) ||
        cat.slug?.toLowerCase().includes(query)
      );
    }

    // Build category tree
    const tree = [];
    const childrenMap = {};

    // First pass: organize by parent
    filtered.forEach(cat => {
      if (!cat.parentId) {
        tree.push({ ...cat, children: [] });
      } else {
        if (!childrenMap[cat.parentId]) {
          childrenMap[cat.parentId] = [];
        }
        childrenMap[cat.parentId].push({ ...cat, children: [] });
      }
    });

    // Second pass: attach children to parents
    const attachChildren = (items) => {
      items.forEach(item => {
        if (childrenMap[item.$id]) {
          item.children = childrenMap[item.$id];
          attachChildren(item.children);
        }
      });
    };
    attachChildren(tree);

    // Calculate stats
    const statsData = {
      total: categories.length,
      active: categories.filter(c => c.isActive).length,
      inactive: categories.filter(c => !c.isActive).length,
      rootCategories: categories.filter(c => !c.parentId).length,
      subCategories: categories.filter(c => c.parentId).length,
    };

    return { 
      filteredCategories: filtered, 
      categoryTree: tree,
      stats: statsData 
    };
  }, [categories, statusFilter, searchQuery]);

  // Toggle category expansion
  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Open add modal
  const handleAdd = (parentCategory = null) => {
    setEditingCategory(parentCategory ? { parentId: parentCategory.$id, level: parentCategory.level + 1 } : null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  // Open delete modal
  const handleDeleteClick = (category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
    setOpenDropdown(null);
  };

  // Toggle category status
  const handleToggleStatus = async (category) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        category.$id,
        { isActive: !category.isActive }
      );
      
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
      fetchCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
    setOpenDropdown(null);
  };

  // Delete category
  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      // Check if category has children
      const hasChildren = categories.some(cat => cat.parentId === deletingCategory.$id);
      if (hasChildren) {
        toast.error('Cannot delete category with subcategories. Delete subcategories first.');
        setIsDeleteModalOpen(false);
        setDeletingCategory(null);
        return;
      }

      // Check if category has products
      try {
        const products = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          [Query.equal('categoryId', deletingCategory.$id), Query.limit(1)]
        );

        if (products.documents.length > 0) {
          toast.error('Cannot delete category with products. Remove or reassign products first.');
          setIsDeleteModalOpen(false);
          setDeletingCategory(null);
          return;
        }
      } catch (error) {
        // Products collection might not exist or other error, continue
        console.log('Product check warning:', error);
      }

      // Delete image if exists
      if (deletingCategory.image) {
        try {
          await storage.deleteFile(BUCKET_ID, deletingCategory.image);
        } catch (error) {
          console.log('Image deletion warning:', error);
        }
      }

      // Delete category
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        deletingCategory.$id
      );

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
    }
  };

  // Handle modal close
  const handleModalClose = (refresh = false) => {
    setIsModalOpen(false);
    setEditingCategory(null);
    if (refresh) {
      fetchCategories();
    }
  };

  // Get parent category name
  const getParentName = (parentId) => {
    const parent = categories.find(c => c.$id === parentId);
    return parent?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">Categories</h1>
          <p className="text-[#455A64]">Manage your product categories</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={fetchCategories}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button icon={Plus} onClick={() => handleAdd()}>
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#455A64]">Total</p>
              <p className="text-xl font-bold text-[#26323B]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#455A64]">Active</p>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-[#455A64]">Inactive</p>
              <p className="text-xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-[#455A64]">Root</p>
              <p className="text-xl font-bold text-purple-600">{stats.rootCategories}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-[#455A64]">Sub</p>
              <p className="text-xl font-bold text-orange-600">{stats.subCategories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F7F7F7]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0BEC5] hover:text-[#455A64]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent appearance-none bg-white min-w-[140px] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent appearance-none bg-white min-w-[160px] cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-[#F7F7F7] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'grid'
                  ? "bg-white text-[#26323B] shadow-sm"
                  : "text-[#B0BEC5] hover:text-[#455A64]"
              )}
              title="Grid View"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'tree'
                  ? "bg-white text-[#26323B] shadow-sm"
                  : "text-[#B0BEC5] hover:text-[#455A64]"
              )}
              title="Tree View"
            >
              <FolderTree className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'list'
                  ? "bg-white text-[#26323B] shadow-sm"
                  : "text-[#B0BEC5] hover:text-[#455A64]"
              )}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#26323B] animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onAdd={() => handleAdd()}
          onClearSearch={() => setSearchQuery('')}
        />
      ) : viewMode === 'grid' ? (
        <GridView
          categories={filteredCategories}
          getParentName={getParentName}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
          onAddChild={handleAdd}
        />
      ) : viewMode === 'tree' ? (
        <TreeView
          categoryTree={categoryTree}
          expandedCategories={expandedCategories}
          toggleExpand={toggleExpand}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
          onAddChild={handleAdd}
        />
      ) : (
        <ListView
          categories={filteredCategories}
          getParentName={getParentName}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        category={editingCategory}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
        category={deletingCategory}
        hasChildren={categories.some(cat => cat.parentId === deletingCategory?.$id)}
      />
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({ searchQuery, statusFilter, onAdd, onClearSearch }) {
  return (
    <div className="bg-white rounded-2xl p-12 shadow-sm border border-[#F7F7F7] text-center">
      <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
        <Folder className="w-8 h-8 text-[#B0BEC5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#26323B] mb-2">No categories found</h3>
      <p className="text-[#455A64] mb-6">
        {searchQuery || statusFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Get started by adding your first category'}
      </p>
      {searchQuery || statusFilter !== 'all' ? (
        <Button variant="outline" onClick={onClearSearch}>
          Clear Filters
        </Button>
      ) : (
        <Button icon={Plus} onClick={onAdd}>
          Add Category
        </Button>
      )}
    </div>
  );
}

// ============================================
// Grid View Component
// ============================================
function GridView({ 
  categories, 
  getParentName, 
  openDropdown, 
  setOpenDropdown, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onAddChild 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {categories.map((category, index) => {
          const IconComponent = getIconComponent(category.icon);
          
          return (
            <motion.div
              key={category.$id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden group hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-[#F7F7F7] to-[#E8E8E8] relative overflow-hidden">
                {category.image ? (
                  <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconComponent className="w-16 h-16 text-[#B0BEC5]" />
                  </div>
                )}
                
                {/* Level Badge */}
                {category.level > 0 && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-100 text-purple-700">
                      Level {category.level}
                    </Badge>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-12">
                  <Badge className={CATEGORY_STATUS[category.isActive ? 'active' : 'inactive'].color}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Actions Dropdown */}
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === category.$id ? null : category.$id);
                      }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-sm"
                    >
                      <MoreVertical className="w-4 h-4 text-[#455A64]" />
                    </button>
                    
                    <AnimatePresence>
                      {openDropdown === category.$id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onEdit(category)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#455A64] hover:bg-[#F7F7F7] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Category
                          </button>
                          <button
                            onClick={() => onAddChild(category)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#455A64] hover:bg-[#F7F7F7] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Subcategory
                          </button>
                          <button
                            onClick={() => onToggleStatus(category)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#455A64] hover:bg-[#F7F7F7] transition-colors"
                          >
                            {category.isActive ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => onDelete(category)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#F7F7F7] rounded-xl flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-[#455A64]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#26323B] truncate">
                      {category.name}
                    </h3>
                    {category.parentId && (
                      <p className="text-xs text-[#B0BEC5]">
                        in {getParentName(category.parentId)}
                      </p>
                    )}
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-sm text-[#455A64] line-clamp-2 mt-3">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F7F7F7] text-sm">
                  <span className="text-[#455A64]">
                    <span className="font-medium text-[#26323B]">{category.productCount || 0}</span> products
                  </span>
                  <code className="text-xs text-[#B0BEC5] bg-[#F7F7F7] px-2 py-1 rounded">
                    /{category.slug}
                  </code>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Tree View Component
// ============================================
function TreeView({ 
  categoryTree, 
  expandedCategories, 
  toggleExpand,
  openDropdown, 
  setOpenDropdown, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onAddChild 
}) {
  const renderCategory = (category, depth = 0) => {
    const IconComponent = getIconComponent(category.icon);
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category.$id];

    return (
      <div key={category.$id}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex items-center gap-3 p-3 bg-white rounded-xl border border-[#F7F7F7] hover:border-[#E0E0E0] transition-all group",
            depth > 0 && "ml-8"
          )}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleExpand(category.$id)}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
              hasChildren ? "hover:bg-[#F7F7F7]" : "invisible"
            )}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#455A64]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#455A64]" />
              )
            )}
          </button>

          {/* Icon */}
          <div className="w-10 h-10 bg-[#F7F7F7] rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-5 h-5 text-[#455A64]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[#26323B] truncate">{category.name}</h3>
              <Badge className={CATEGORY_STATUS[category.isActive ? 'active' : 'inactive'].color}>
                {category.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-[#B0BEC5]">
              /{category.slug} • {category.productCount || 0} products
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild(category)}
              className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
              title="Add subcategory"
            >
              <Plus className="w-4 h-4 text-[#455A64]" />
            </button>
            <button
              onClick={() => onEdit(category)}
              className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-[#455A64]" />
            </button>
            <button
              onClick={() => onToggleStatus(category)}
              className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
              title={category.isActive ? 'Deactivate' : 'Activate'}
            >
              {category.isActive ? (
                <EyeOff className="w-4 h-4 text-[#455A64]" />
              ) : (
                <Eye className="w-4 h-4 text-[#455A64]" />
              )}
            </button>
            <button
              onClick={() => onDelete(category)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mt-2"
            >
              {category.children.map(child => renderCategory(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {categoryTree.map(category => renderCategory(category))}
    </div>
  );
}

// ============================================
// List View Component
// ============================================
function ListView({ categories, getParentName, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F7F7F7] bg-[#FAFAFA]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Category</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Parent</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Level</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Products</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Order</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-[#455A64] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {categories.map((category, index) => {
                const IconComponent = getIconComponent(category.icon);
                
                return (
                  <motion.tr
                    key={category.$id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-[#F7F7F7] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F7F7F7] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {category.image ? (
                            <img
                              src={getImageUrl(category.image)}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <IconComponent className="w-5 h-5 text-[#B0BEC5]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#26323B]">{category.name}</p>
                          <code className="text-xs text-[#B0BEC5]">/{category.slug}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {category.parentId ? (
                        <span className="text-[#455A64]">{getParentName(category.parentId)}</span>
                      ) : (
                        <span className="text-[#B0BEC5]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-purple-100 text-purple-700">
                        Level {category.level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#26323B] font-medium">{category.productCount || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#455A64]">{category.sortOrder}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={CATEGORY_STATUS[category.isActive ? 'active' : 'inactive'].color}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(category)}
                          className="p-2 hover:bg-[#E8E8E8] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-[#455A64]" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(category)}
                          className="p-2 hover:bg-[#E8E8E8] rounded-lg transition-colors"
                          title={category.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {category.isActive ? (
                            <EyeOff className="w-4 h-4 text-[#455A64]" />
                          ) : (
                            <Eye className="w-4 h-4 text-[#455A64]" />
                          )}
                        </button>
                        <button
                          onClick={() => onDelete(category)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Category Modal Component (Add/Edit)
// ============================================
function CategoryModal({ isOpen, onClose, category, categories }) {
  const isEditing = category && category.$id;
  const isAddingChild = category && category.parentId && !category.$id;
  
  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Get parent categories (exclude self and children when editing)
  const parentOptions = useMemo(() => {
    if (!isEditing) return categories.filter(c => c.level < 3); // Max 3 levels deep
    
    // Exclude self and all descendants
    const descendants = new Set();
    const findDescendants = (parentId) => {
      categories.forEach(c => {
        if (c.parentId === parentId) {
          descendants.add(c.$id);
          findDescendants(c.$id);
        }
      });
    };
    findDescendants(category.$id);
    
    return categories.filter(c => 
      c.$id !== category.$id && 
      !descendants.has(c.$id) &&
      c.level < 3
    );
  }, [categories, category, isEditing]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        // Editing existing category
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image: category.image || null,
          icon: category.icon || 'folder',
          parentId: category.parentId || null,
          level: category.level || 0,
          isActive: category.isActive ?? true,
          sortOrder: category.sortOrder || 0,
          productCount: category.productCount || 0,
          metadata: category.metadata || '',
        });
        if (category.image) {
          setImagePreview(getImageUrl(category.image));
        }
      } else if (isAddingChild) {
        // Adding child category
        const parentLevel = category.level || 0;
        setFormData({
          ...INITIAL_FORM_STATE,
          parentId: category.parentId,
          level: parentLevel + 1,
        });
        setImagePreview(null);
      } else {
        // Adding new root category
        setFormData(INITIAL_FORM_STATE);
        setImagePreview(null);
      }
      setImageFile(null);
      setErrors({});
      setShowIconPicker(false);
    }
  }, [isOpen, category, isEditing, isAddingChild]);

  // Update level when parent changes
  useEffect(() => {
    if (formData.parentId) {
      const parent = categories.find(c => c.$id === formData.parentId);
      if (parent) {
        setFormData(prev => ({ ...prev, level: parent.level + 1 }));
      }
    } else {
      setFormData(prev => ({ ...prev, level: 0 }));
    }
  }, [formData.parentId, categories]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate slug from name
      if (field === 'name' && !isEditing) {
        newData.slug = slugify(value);
      }
      
      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Invalid slug format (use lowercase letters, numbers, and hyphens)';
    } else if (formData.slug.length > 100) {
      newErrors.slug = 'Slug must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.metadata) {
      try {
        JSON.parse(formData.metadata);
      } catch {
        newErrors.metadata = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      let imageId = formData.image;

      // Upload new image if selected
      if (imageFile) {
        setIsUploading(true);
        
        // Delete old image if exists
        if (isEditing && category.image) {
          try {
            await storage.deleteFile(BUCKET_ID, category.image);
          } catch (error) {
            console.log('Old image deletion warning:', error);
          }
        }

        // Upload new image
        const uploadedFile = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          imageFile
        );
        imageId = uploadedFile.$id;
        setIsUploading(false);
      }

      // Prepare category data matching Appwrite schema
      const categoryData = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        description: formData.description?.trim() || null,
        image: imageId || null,
        icon: formData.icon || 'folder',
        parentId: formData.parentId || null,
        level: parseInt(formData.level) || 0,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0,
        productCount: parseInt(formData.productCount) || 0,
        metadata: formData.metadata?.trim() || null,
      };

      console.log('Saving category data:', categoryData);

      if (isEditing) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CATEGORIES,
          category.$id,
          categoryData
        );
        toast.success('Category updated successfully');
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CATEGORIES,
          ID.unique(),
          categoryData
        );
        toast.success('Category created successfully');
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving category:', error);
      
      if (error.message?.includes('slug') || error.message?.includes('unique')) {
        setErrors({ slug: 'This slug is already in use' });
      } else {
        toast.error(error.message || 'Failed to save category');
      }
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const IconComponent = getIconComponent(formData.icon);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => onClose(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#F7F7F7]">
            <div>
              <h2 className="text-xl font-bold text-[#26323B]">
                {isEditing ? 'Edit Category' : isAddingChild ? 'Add Subcategory' : 'Add New Category'}
              </h2>
              {isAddingChild && (
                <p className="text-sm text-[#455A64] mt-1">
                  Adding to: {categories.find(c => c.$id === formData.parentId)?.name}
                </p>
              )}
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#455A64]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-[#455A64] mb-2">
                  Category Image
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 bg-[#F7F7F7] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IconComponent className="w-12 h-12 text-[#B0BEC5]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="category-image"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="category-image"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F7F7] text-[#455A64] rounded-lg cursor-pointer hover:bg-[#E8E8E8] transition-colors text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#B0BEC5] mt-2">
                      Recommended: 800×600px, Max 5MB (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-[#455A64] mb-2">
                  Category Icon
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="flex items-center gap-3 px-4 py-3 bg-[#F7F7F7] rounded-xl hover:bg-[#E8E8E8] transition-colors w-full"
                  >
                    <IconComponent className="w-5 h-5 text-[#455A64]" />
                    <span className="text-[#26323B] capitalize">{formData.icon.replace('-', ' ')}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-[#455A64] ml-auto transition-transform",
                      showIconPicker && "rotate-180"
                    )} />
                  </button>
                  
                  <AnimatePresence>
                    {showIconPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E0E0E0] p-4 z-20 max-h-64 overflow-y-auto"
                      >
                        <div className="grid grid-cols-6 gap-2">
                          {CATEGORY_ICONS.map((iconData) => (
                            <button
                              key={iconData.name}
                              type="button"
                              onClick={() => {
                                handleChange('icon', iconData.name);
                                setShowIconPicker(false);
                              }}
                              className={cn(
                                "p-3 rounded-lg transition-colors flex flex-col items-center gap-1",
                                formData.icon === iconData.name
                                  ? "bg-[#26323B] text-white"
                                  : "hover:bg-[#F7F7F7] text-[#455A64]"
                              )}
                              title={iconData.label}
                            >
                              <iconData.icon className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Name & Slug */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Category name"
                    maxLength={100}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                      errors.name ? "border-red-500" : "border-[#B0BEC5]"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', slugify(e.target.value))}
                    placeholder="category-slug"
                    maxLength={100}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                      errors.slug ? "border-red-500" : "border-[#B0BEC5]"
                    )}
                  />
                  {errors.slug && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.slug}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Category description..."
                  rows={3}
                  maxLength={1000}
                  className={cn(
                    "w-full px-4 py-3 border rounded-xl transition-all resize-none",
                    "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                    errors.description ? "border-red-500" : "border-[#B0BEC5]"
                  )}
                />
                <div className="flex justify-between mt-1">
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                  <p className="text-xs text-[#B0BEC5] ml-auto">
                    {formData.description?.length || 0}/1000
                  </p>
                </div>
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                  Parent Category
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => handleChange('parentId', e.target.value || null)}
                  className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="">None (Root Category)</option>
                  {parentOptions.map((cat) => (
                    <option key={cat.$id} value={cat.$id}>
                      {'—'.repeat(cat.level)} {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[#B0BEC5]">
                  Current level: {formData.level} (Max depth: 3 levels)
                </p>
              </div>

              {/* Status, Sort Order, Level */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4 h-12">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.isActive}
                        onChange={() => handleChange('isActive', true)}
                        className="w-4 h-4 text-[#26323B] focus:ring-[#26323B]"
                      />
                      <span className="text-sm text-[#26323B]">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={!formData.isActive}
                        onChange={() => handleChange('isActive', false)}
                        className="w-4 h-4 text-[#26323B] focus:ring-[#26323B]"
                      />
                      <span className="text-sm text-[#26323B]">Inactive</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                    Sort Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => handleChange('sortOrder', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                    Level
                  </label>
                  <input
                    type="number"
                    value={formData.level}
                    readOnly
                    className="w-full px-4 py-3 border border-[#E0E0E0] rounded-xl bg-[#F7F7F7] text-[#455A64] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Metadata (JSON) */}
              <div>
                <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                  Metadata (JSON)
                </label>
                <textarea
                  value={formData.metadata}
                  onChange={(e) => handleChange('metadata', e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 border rounded-xl transition-all resize-none font-mono text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                    errors.metadata ? "border-red-500" : "border-[#B0BEC5]"
                  )}
                />
                {errors.metadata && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.metadata}</p>
                )}
                <p className="mt-1.5 text-xs text-[#B0BEC5]">
                  Optional: Store additional category data in JSON format
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#F7F7F7]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isUploading ? 'Uploading...' : isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Delete Confirmation Modal
// ============================================
function DeleteModal({ isOpen, onClose, onConfirm, category, hasChildren }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (hasChildren) {
      toast.error('Cannot delete category with subcategories');
      onClose();
      return;
    }
    
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[#26323B] mb-2">
              Delete Category
            </h3>
            <p className="text-[#455A64] mb-6">
              Are you sure you want to delete <strong>"{category?.name}"</strong>?
              {hasChildren && (
                <span className="block mt-2 text-red-600 text-sm">
                  ⚠️ This category has subcategories. Delete them first.
                </span>
              )}
              {!hasChildren && (
                <span className="block mt-2 text-sm">
                  This action cannot be undone.
                </span>
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={hasChildren}
                className="bg-red-600 hover:bg-red-700"
              >
                {hasChildren ? 'Cannot Delete' : 'Delete'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}