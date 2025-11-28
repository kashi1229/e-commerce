// src/components/admin/ProductForm.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  X,
  Upload,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  DollarSign,
  Package,
  Tag,
  FileText,
  Settings,
  Star,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/utils';
import { 
  databases, 
  storage, 
  DATABASE_ID, 
  COLLECTIONS, 
  BUCKET_ID, 
  ID, 
  Query 
} from '../../lib/appwrite';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import { LoadingPage } from '../common/Loading';
import toast from 'react-hot-toast';

// ✅ FIXED: Define PRODUCT_STATUS constant
const PRODUCT_STATUS = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-500'
  },
  out_of_stock: { 
    label: 'Out of Stock', 
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-500'
  },
  discontinued: { 
    label: 'Discontinued', 
    color: 'bg-orange-100 text-orange-700',
    dotColor: 'bg-orange-500'
  },
  draft: { 
    label: 'Draft', 
    color: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-500'
  },
};

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: FileText },
  { id: 'pricing', label: 'Pricing & Inventory', icon: DollarSign },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'details', label: 'Details', icon: Tag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SHIPPING_CLASSES = [
  { value: 'standard', label: 'Standard Shipping' },
  { value: 'express', label: 'Express Shipping' },
  { value: 'free', label: 'Free Shipping' },
  { value: 'pickup', label: 'Store Pickup Only' },
];

// Helper function to generate slug
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

// Helper function to generate SKU
const generateSKU = (name, category = 'PRD') => {
  const prefix = category.substring(0, 3).toUpperCase();
  const namePart = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${namePart}-${random}`;
};

// Initial form state
const INITIAL_FORM_STATE = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  sku: '',
  barcode: '',
  categoryId: '',
  brandName: '',
  price: '',
  comparePrice: '',
  costPrice: '',
  taxRate: '0',
  stock: '0',
  lowStockThreshold: '10',
  weight: '',
  dimensions: '',
  status: 'active',
  isFeatured: false,
  isNewArrival: false,
  isBestseller: false,
  hasVariants: false,
  minOrderQuantity: '1',
  maxOrderQuantity: '',
  shippingClass: 'standard',
  tags: '',
  specifications: '',
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEditing = Boolean(productId);

  // State
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Images state
  const [images, setImages] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);

  // Fetch categories on mount
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
        toast.error('Failed to load categories');
      }
    }
    fetchCategories();
  }, []);

  // Fetch product for editing
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      try {
        setIsLoading(true);
        const product = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          productId
        );

        // Parse tags safely
        let parsedTags = '';
        if (product.tags) {
          try {
            const tagsArray = JSON.parse(product.tags);
            parsedTags = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';
          } catch {
            parsedTags = product.tags;
          }
        }

        // Parse images safely
        let parsedImages = [];
        if (product.images) {
          try {
            parsedImages = JSON.parse(product.images);
            if (!Array.isArray(parsedImages)) parsedImages = [];
          } catch {
            parsedImages = [];
          }
        }

        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryId: product.categoryId || '',
          brandName: product.brandName || '',
          price: product.price?.toString() || '',
          comparePrice: product.comparePrice?.toString() || '',
          costPrice: product.costPrice?.toString() || '',
          taxRate: product.taxRate?.toString() || '0',
          stock: product.stock?.toString() || '0',
          lowStockThreshold: product.lowStockThreshold?.toString() || '10',
          weight: product.weight?.toString() || '',
          dimensions: product.dimensions || '',
          status: product.status || 'active',
          isFeatured: product.isFeatured || false,
          isNewArrival: product.isNewArrival || false,
          isBestseller: product.isBestseller || false,
          hasVariants: product.hasVariants || false,
          minOrderQuantity: product.minOrderQuantity?.toString() || '1',
          maxOrderQuantity: product.maxOrderQuantity?.toString() || '',
          shippingClass: product.shippingClass || 'standard',
          tags: parsedTags,
          specifications: product.specifications || '',
        });

        if (product.thumbnail) {
          setThumbnail(product.thumbnail);
        }

        setImages(parsedImages);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        navigate('/admin/products');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [productId, navigate]);

  // Handle input change
  const handleChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-generate slug from name
      if (field === 'name' && !isEditing) {
        newData.slug = slugify(value);
      }

      // Auto-generate SKU
      if (field === 'name' && !prev.sku && !isEditing) {
        const category = categories.find(c => c.$id === prev.categoryId);
        newData.sku = generateSKU(value, category?.name || 'PRD');
      }

      // Auto-generate SKU when category changes
      if (field === 'categoryId' && prev.name && !isEditing) {
        const category = categories.find(c => c.$id === value);
        if (!prev.sku || prev.sku.startsWith('PRD-')) {
          newData.sku = generateSKU(prev.name, category?.name || 'PRD');
        }
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [isEditing, categories, errors]);

  // Get image URL helper
  const getImageUrl = useCallback((fileId) => {
    if (!fileId) return null;
    return `https://tor.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=69256e160012a22579e5`;
  }, []);

  // Image upload with dropzone
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploadingImages(true);
    const uploadedIds = [];

    try {
      for (const file of acceptedFiles) {
        try {
          const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
          );
          uploadedIds.push(response.$id);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (uploadedIds.length > 0) {
        // Set first image as thumbnail if no thumbnail exists
        if (!thumbnail && uploadedIds.length > 0) {
          setThumbnail(uploadedIds[0]);
          setImages(prev => [...prev, ...uploadedIds.slice(1)]);
        } else {
          setImages(prev => [...prev, ...uploadedIds]);
        }

        toast.success(`${uploadedIds.length} image(s) uploaded successfully`);
        
        // Clear image error if exists
        if (errors.images) {
          setErrors(prev => ({ ...prev, images: '' }));
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  }, [thumbnail, errors.images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled: uploadingImages,
  });

  // Remove image
  const removeImage = useCallback(async (imageId, isThumbnailImage = false) => {
    try {
      // Try to delete from storage
      try {
        await storage.deleteFile(BUCKET_ID, imageId);
      } catch (error) {
        // File might already be deleted, continue
        console.log('File deletion warning:', error);
      }

      if (isThumbnailImage) {
        // If removing thumbnail, promote first gallery image
        if (images.length > 0) {
          setThumbnail(images[0]);
          setImages(prev => prev.slice(1));
        } else {
          setThumbnail(null);
        }
      } else {
        setImages(prev => prev.filter(id => id !== imageId));
      }

      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  }, [images]);

  // Set image as thumbnail
  const setAsThumbnail = useCallback((imageId) => {
    if (thumbnail) {
      // Move current thumbnail to gallery
      setImages(prev => [thumbnail, ...prev.filter(id => id !== imageId)]);
    } else {
      setImages(prev => prev.filter(id => id !== imageId));
    }
    setThumbnail(imageId);
    toast.success('Thumbnail updated');
  }, [thumbnail]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    // Pricing validation
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price)) {
      newErrors.comparePrice = 'Compare price must be higher than selling price';
    }

    if (formData.costPrice && parseFloat(formData.costPrice) >= parseFloat(formData.price)) {
      newErrors.costPrice = 'Cost price should be lower than selling price';
    }

    // Stock validation
    if (formData.stock && parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    // Image validation
    if (!thumbnail && images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }

    // Specifications JSON validation
    if (formData.specifications.trim()) {
      try {
        JSON.parse(formData.specifications);
      } catch {
        newErrors.specifications = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, thumbnail, images]);

  // Get tab with first error
  const getTabWithError = useCallback((errorFields) => {
    const basicFields = ['name', 'slug', 'description', 'categoryId'];
    const pricingFields = ['price', 'comparePrice', 'costPrice', 'sku', 'stock'];
    const mediaFields = ['images'];
    const detailsFields = ['specifications'];

    for (const field of errorFields) {
      if (basicFields.includes(field)) return 'basic';
      if (pricingFields.includes(field)) return 'pricing';
      if (mediaFields.includes(field)) return 'media';
      if (detailsFields.includes(field)) return 'details';
    }
    return 'basic';
  }, []);

  // Save product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      const errorFields = Object.keys(errors);
      const tabWithError = getTabWithError(errorFields);
      setActiveTab(tabWithError);
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare tags array
      let tagsJson = null;
      if (formData.tags.trim()) {
        const tagsArray = formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        tagsJson = JSON.stringify(tagsArray);
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim() || null,
        sku: formData.sku.trim().toUpperCase(),
        barcode: formData.barcode.trim() || null,
        categoryId: formData.categoryId,
        brandName: formData.brandName.trim() || null,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        taxRate: parseFloat(formData.taxRate) || 0,
        stock: parseInt(formData.stock) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.trim() || null,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        isBestseller: formData.isBestseller,
        hasVariants: formData.hasVariants,
        minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
        maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null,
        shippingClass: formData.shippingClass || 'standard',
        tags: tagsJson,
        specifications: formData.specifications.trim() || null,
        thumbnail: thumbnail,
        images: images.length > 0 ? JSON.stringify(images) : null,
      };

      // Add default values for new products
      if (!isEditing) {
        productData.rating = 0;
        productData.reviewCount = 0;
        productData.soldCount = 0;
        productData.viewCount = 0;
        productData.wishlistCount = 0;
      }

      if (isEditing) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          productId,
          productData
        );
        toast.success('Product updated successfully');
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          ID.unique(),
          productData
        );
        toast.success('Product created successfully');
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);

      // Handle specific errors
      if (error.message?.includes('slug') || error.message?.includes('unique')) {
        setErrors(prev => ({ ...prev, slug: 'This slug is already in use' }));
        setActiveTab('basic');
        toast.error('Slug is already in use');
      } else if (error.message?.includes('sku')) {
        setErrors(prev => ({ ...prev, sku: 'This SKU is already in use' }));
        setActiveTab('pricing');
        toast.error('SKU is already in use');
      } else {
        toast.error(error.message || 'Failed to save product');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate profit
  const calculateProfit = useCallback(() => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.costPrice) || 0;
    return (price - cost).toFixed(2);
  }, [formData.price, formData.costPrice]);

  // Calculate discount percentage
  const calculateDiscount = useCallback(() => {
    const price = parseFloat(formData.price) || 0;
    const comparePrice = parseFloat(formData.comparePrice) || 0;
    if (comparePrice > 0 && price > 0) {
      return Math.round(((comparePrice - price) / comparePrice) * 100);
    }
    return 0;
  }, [formData.price, formData.comparePrice]);

  // Loading state
  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#455A64]" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#26323B]">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-[#455A64]">
              {isEditing ? 'Update product information' : 'Create a new product listing'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
          {isEditing && formData.slug && (
            <Button
              type="button"
              variant="outline"
              icon={Eye}
              onClick={() => window.open(`/products/${formData.slug}`, '_blank')}
            >
              Preview
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isSaving}
            icon={Save}
            disabled={uploadingImages}
          >
            {isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#F7F7F7] overflow-hidden">
            <div className="flex border-b border-[#F7F7F7] overflow-x-auto">
              {TABS.map((tab) => {
                // Check if tab has errors
                const tabErrors = {
                  basic: ['name', 'slug', 'description', 'categoryId'],
                  pricing: ['price', 'comparePrice', 'costPrice', 'sku', 'stock'],
                  media: ['images'],
                  details: ['specifications'],
                  settings: [],
                };
                const hasError = tabErrors[tab.id]?.some(field => errors[field]);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative",
                      activeTab === tab.id
                        ? "text-[#26323B]"
                        : "text-[#455A64] hover:text-[#26323B]"
                    )}
                  >
                    <tab.icon className={cn("w-4 h-4", hasError && "text-red-500")} />
                    <span className={hasError ? "text-red-500" : ""}>{tab.label}</span>
                    {hasError && (
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#26323B]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Product Name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter product name"
                      error={errors.name}
                      required
                    />
                    <Input
                      label="Slug (URL)"
                      value={formData.slug}
                      onChange={(e) => handleChange('slug', slugify(e.target.value))}
                      placeholder="product-url-slug"
                      error={errors.slug}
                      helperText="Used in the product URL"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Enter detailed product description..."
                      rows={6}
                      className={cn(
                        "w-full px-4 py-3 border rounded-xl transition-all resize-none",
                        "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                        errors.description ? "border-red-500" : "border-[#B0BEC5]"
                      )}
                    />
                    {errors.description && (
                      <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>
                    )}
                    <p className="mt-1 text-xs text-[#B0BEC5] text-right">
                      {formData.description.length} characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                      Short Description
                    </label>
                    <textarea
                      value={formData.shortDescription}
                      onChange={(e) => handleChange('shortDescription', e.target.value)}
                      placeholder="Brief summary for product cards..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent resize-none"
                    />
                    <p className="mt-1 text-xs text-[#B0BEC5] text-right">
                      {formData.shortDescription.length}/500
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => handleChange('categoryId', e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl transition-all appearance-none bg-white",
                          "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                          errors.categoryId ? "border-red-500" : "border-[#B0BEC5]"
                        )}
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.$id} value={cat.$id}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.categoryId && (
                        <p className="mt-1.5 text-sm text-red-500">{errors.categoryId}</p>
                      )}
                    </div>

                    <Input
                      label="Brand Name"
                      value={formData.brandName}
                      onChange={(e) => handleChange('brandName', e.target.value)}
                      placeholder="Enter brand name"
                    />
                  </div>
                </motion.div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => handleChange('price', e.target.value)}
                          placeholder="0.00"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-xl transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                            errors.price ? "border-red-500" : "border-[#B0BEC5]"
                          )}
                        />
                      </div>
                      {errors.price && (
                        <p className="mt-1.5 text-sm text-red-500">{errors.price}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Compare at Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.comparePrice}
                          onChange={(e) => handleChange('comparePrice', e.target.value)}
                          placeholder="0.00"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-xl transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                            errors.comparePrice ? "border-red-500" : "border-[#B0BEC5]"
                          )}
                        />
                      </div>
                      {errors.comparePrice && (
                        <p className="mt-1.5 text-sm text-red-500">{errors.comparePrice}</p>
                      )}
                      {calculateDiscount() > 0 && (
                        <p className="mt-1.5 text-sm text-green-600">
                          {calculateDiscount()}% discount
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Cost Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.costPrice}
                          onChange={(e) => handleChange('costPrice', e.target.value)}
                          placeholder="0.00"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-xl transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                            errors.costPrice ? "border-red-500" : "border-[#B0BEC5]"
                          )}
                        />
                      </div>
                      {errors.costPrice && (
                        <p className="mt-1.5 text-sm text-red-500">{errors.costPrice}</p>
                      )}
                      <p className="mt-1.5 text-xs text-[#B0BEC5]">For profit calculation</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="SKU"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                      placeholder="PRD-SKU-001"
                      error={errors.sku}
                      required
                    />
                    <Input
                      label="Barcode"
                      value={formData.barcode}
                      onChange={(e) => handleChange('barcode', e.target.value)}
                      placeholder="1234567890123"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                        Stock Quantity
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5]" />
                        <input
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => handleChange('stock', e.target.value)}
                          placeholder="0"
                          className={cn(
                            "w-full pl-10 pr-4 py-3 border rounded-xl transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                            errors.stock ? "border-red-500" : "border-[#B0BEC5]"
                          )}
                        />
                      </div>
                      {errors.stock && (
                        <p className="mt-1.5 text-sm text-red-500">{errors.stock}</p>
                      )}
                    </div>

                    <Input
                      label="Low Stock Threshold"
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold}
                      onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                      placeholder="10"
                      helperText="Alert when stock falls below"
                    />

                    <Input
                      label="Tax Rate (%)"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => handleChange('taxRate', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </motion.div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Thumbnail */}
                  <div>
                    <h3 className="text-sm font-medium text-[#455A64] mb-3">
                      Product Thumbnail <span className="text-red-500">*</span>
                    </h3>
                    {thumbnail ? (
                      <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-[#F7F7F7] group">
                        <img
                          src={getImageUrl(thumbnail)}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(thumbnail, true)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[#26323B] text-white text-xs font-medium rounded">
                          Thumbnail
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 rounded-xl border-2 border-dashed border-[#B0BEC5] flex items-center justify-center text-[#B0BEC5]">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">No thumbnail</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Zone */}
                  <div>
                    <h3 className="text-sm font-medium text-[#455A64] mb-3">
                      Product Gallery
                    </h3>
                    <div
                      {...getRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                        isDragActive
                          ? "border-[#26323B] bg-[#26323B]/5"
                          : errors.images 
                            ? "border-red-500 hover:border-red-400"
                            : "border-[#B0BEC5] hover:border-[#455A64]",
                        uploadingImages && "pointer-events-none opacity-50"
                      )}
                    >
                      <input {...getInputProps()} />
                      {uploadingImages ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-10 h-10 text-[#26323B] animate-spin mb-3" />
                          <p className="text-[#455A64]">Uploading images...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-10 h-10 text-[#B0BEC5] mb-3" />
                          <p className="text-[#26323B] font-medium mb-1">
                            {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                          </p>
                          <p className="text-sm text-[#455A64]">
                            or click to browse (Max 5MB each, JPG, PNG, WebP, GIF)
                          </p>
                        </div>
                      )}
                    </div>
                    {errors.images && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.images}
                      </p>
                    )}
                  </div>

                  {/* Image Gallery */}
                  {images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#455A64] mb-3">
                        Gallery Images ({images.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {images.map((imageId, index) => (
                          <div
                            key={imageId}
                            className="relative aspect-square rounded-xl overflow-hidden bg-[#F7F7F7] group"
                          >
                            <img
                              src={getImageUrl(imageId)}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200x200?text=Error';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAsThumbnail(imageId)}
                                className="p-2 bg-[#26323B] text-white rounded-lg hover:bg-[#455A64] transition-colors"
                                title="Set as thumbnail"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(imageId)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      placeholder="0.5"
                    />
                    <Input
                      label="Dimensions (L×W×H cm)"
                      value={formData.dimensions}
                      onChange={(e) => handleChange('dimensions', e.target.value)}
                      placeholder="20×15×10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      placeholder="summer, casual, trending"
                      className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent"
                    />
                    <p className="mt-1.5 text-xs text-[#B0BEC5]">
                      Separate tags with commas
                    </p>
                    {formData.tags && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-[#F7F7F7] text-[#455A64] text-xs rounded-lg">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                      Specifications (JSON)
                    </label>
                    <textarea
                      value={formData.specifications}
                      onChange={(e) => handleChange('specifications', e.target.value)}
                      placeholder='{"Material": "Cotton", "Care": "Machine wash"}'
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 border rounded-xl transition-all resize-none font-mono text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
                        errors.specifications ? "border-red-500" : "border-[#B0BEC5]"
                      )}
                    />
                    {errors.specifications && (
                      <p className="mt-1.5 text-sm text-red-500">{errors.specifications}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Min Order Quantity"
                      type="number"
                      min="1"
                      value={formData.minOrderQuantity}
                      onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
                      placeholder="1"
                    />
                    <Input
                      label="Max Order Quantity"
                      type="number"
                      min="1"
                      value={formData.maxOrderQuantity}
                      onChange={(e) => handleChange('maxOrderQuantity', e.target.value)}
                      placeholder="No limit"
                      helperText="Leave empty for no limit"
                    />
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-3">
                      Product Status
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(PRODUCT_STATUS).map(([value, config]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleChange('status', value)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            formData.status === value
                              ? "border-[#26323B] bg-[#26323B]/5"
                              : "border-[#E0E0E0] hover:border-[#B0BEC5]"
                          )}
                        >
                          <div className={cn("w-3 h-3 rounded-full", config.dotColor)} />
                          <span className="text-sm font-medium text-[#26323B]">
                            {config.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-3">
                      Product Badges
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'isFeatured', label: 'Featured Product', desc: 'Show in featured section on homepage' },
                        { key: 'isNewArrival', label: 'New Arrival', desc: 'Mark as new arrival (shows "New" badge)' },
                        { key: 'isBestseller', label: 'Bestseller', desc: 'Mark as bestselling product' },
                        { key: 'hasVariants', label: 'Has Variants', desc: 'Product has size/color variants' },
                      ].map((badge) => (
                        <label
                          key={badge.key}
                          className="flex items-center justify-between p-4 bg-[#F7F7F7] rounded-xl cursor-pointer hover:bg-[#E8E8E8] transition-colors"
                        >
                          <div>
                            <span className="font-medium text-[#26323B]">{badge.label}</span>
                            <p className="text-sm text-[#455A64]">{badge.desc}</p>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={formData[badge.key]}
                              onChange={(e) => handleChange(badge.key, e.target.checked)}
                              className="sr-only"
                            />
                            <div className={cn(
                              "w-12 h-6 rounded-full transition-colors",
                              formData[badge.key] ? "bg-[#26323B]" : "bg-[#B0BEC5]"
                            )}>
                              <div className={cn(
                                "w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5",
                                formData[badge.key] ? "translate-x-6" : "translate-x-0.5"
                              )} />
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#455A64] mb-1.5">
                      Shipping Class
                    </label>
                    <select
                      value={formData.shippingClass}
                      onChange={(e) => handleChange('shippingClass', e.target.value)}
                      className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent appearance-none bg-white"
                    >
                      {SHIPPING_CLASSES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7]">
            <h3 className="font-semibold text-[#26323B] mb-4">Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#455A64]">Visibility</span>
                <Badge className={PRODUCT_STATUS[formData.status]?.color || 'bg-gray-100 text-gray-700'}>
                  {PRODUCT_STATUS[formData.status]?.label || formData.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#455A64]">Stock</span>
                <span className={cn(
                  "text-sm font-medium",
                  parseInt(formData.stock) <= 0 
                    ? "text-red-600" 
                    : parseInt(formData.stock) <= parseInt(formData.lowStockThreshold) 
                      ? "text-yellow-600" 
                      : "text-green-600"
                )}>
                  {formData.stock || 0} units
                </span>
              </div>
              {parseInt(formData.stock) <= parseInt(formData.lowStockThreshold) && parseInt(formData.stock) > 0 && (
                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                  ⚠️ Low stock warning
                </p>
              )}
              {parseInt(formData.stock) <= 0 && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  ⚠️ Out of stock
                </p>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7]">
            <h3 className="font-semibold text-[#26323B] mb-4">Pricing Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#455A64]">Selling Price</span>
                <span className="font-semibold text-[#26323B]">
                  ${parseFloat(formData.price || 0).toFixed(2)}
                </span>
              </div>
              {formData.comparePrice && parseFloat(formData.comparePrice) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#455A64]">Compare Price</span>
                  <div className="text-right">
                    <span className="text-sm text-[#B0BEC5] line-through">
                      ${parseFloat(formData.comparePrice).toFixed(2)}
                    </span>
                    {calculateDiscount() > 0 && (
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        -{calculateDiscount()}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              {formData.costPrice && parseFloat(formData.costPrice) > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#455A64]">Cost</span>
                    <span className="text-sm text-[#455A64]">
                      ${parseFloat(formData.costPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F7F7F7]">
                    <span className="text-sm text-[#455A64]">Profit</span>
                    <span className={cn(
                      "font-semibold",
                      parseFloat(calculateProfit()) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${calculateProfit()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#455A64]">Margin</span>
                    <span className="text-sm text-[#455A64]">
                      {formData.price && parseFloat(formData.price) > 0
                        ? Math.round((parseFloat(calculateProfit()) / parseFloat(formData.price)) * 100)
                        : 0}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Badges */}
          {(formData.isFeatured || formData.isNewArrival || formData.isBestseller) && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F7F7F7]">
              <h3 className="font-semibold text-[#26323B] mb-4">Active Badges</h3>
              <div className="flex flex-wrap gap-2">
                {formData.isFeatured && (
                  <Badge className="bg-purple-100 text-purple-700">Featured</Badge>
                )}
                {formData.isNewArrival && (
                  <Badge className="bg-blue-100 text-blue-700">New Arrival</Badge>
                )}
                {formData.isBestseller && (
                  <Badge className="bg-orange-100 text-orange-700">Bestseller</Badge>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Tips for Success
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Use high-quality images (min 800×800px)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Write detailed descriptions with keywords</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Set competitive prices</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Keep stock levels updated</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Add relevant tags for better search</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}