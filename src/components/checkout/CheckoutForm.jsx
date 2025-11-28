// src/components/checkout/CheckoutForm.jsx
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Package,
  Clock,
  X,
  Plus,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { getImageUrl } from '../../lib/appwrite';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useCreateOrder } from '../../hooks/useOrders';
import { databases, DATABASE_ID, Query, ID } from '../../lib/appwrite';
import { appwriteConfig } from '../../config/appwrite.config';
import Button from '../common/Button';
import toast from 'react-hot-toast';

// ============================================
// CONSTANTS
// ============================================

const STEPS = [
  { id: 'shipping', label: 'Shipping', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'review', label: 'Review', icon: Package },
];

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', price: 10, days: '5-7 business days', icon: Truck },
  { id: 'express', label: 'Express Shipping', price: 20, days: '2-3 business days', icon: Clock },
  { id: 'free', label: 'Free Shipping', price: 0, days: '7-10 business days', icon: Package, minOrder: 100 },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', icon: Package },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia',
  'Germany', 'France', 'Japan', 'India', 'Brazil', 'Mexico'
];

// Collection ID from config
const ADDRESSES_COLLECTION = appwriteConfig?.collections?.userAddresses || 'user_addresses';

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&q=80';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get product image URL - handles various image formats
 */
const getProductImageUrl = (image, width = 200, height = 200) => {
  if (!image) return PLACEHOLDER_IMAGE;
  
  // If it's already a full URL
  if (typeof image === 'string') {
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    // If it's an Appwrite file ID
    try {
      return getImageUrl(image, width, height);
    } catch (e) {
      return PLACEHOLDER_IMAGE;
    }
  }
  
  // If it's an object with url/src property
  if (typeof image === 'object') {
    return image.url || image.src || image.href || PLACEHOLDER_IMAGE;
  }
  
  return PLACEHOLDER_IMAGE;
};

const formatCardNumber = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  return parts.length ? parts.join(' ') : v;
};

const formatExpiry = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return v.substring(0, 2) + '/' + v.substring(2, 4);
  }
  return v;
};

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Product Image Component with fallback
 */
const ProductImage = memo(function ProductImage({ src, alt, className }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const imageUrl = useMemo(() => getProductImageUrl(src), [src]);
  
  return (
    <div className={cn("relative bg-slate-100 overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <ImageIcon className="w-6 h-6 text-slate-300" />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt || 'Product'}
          className={cn(
            "w-full h-full object-cover transition-opacity",
            loading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </div>
  );
});

/**
 * Form Input Component - Memoized to prevent focus loss
 */
const FormInput = memo(function FormInput({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  maxLength,
  required,
  error,
  className,
  disabled,
  ...props 
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 border rounded-xl transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
          error ? "border-red-500 bg-red-50" : "border-slate-300",
          disabled && "bg-slate-100 cursor-not-allowed"
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

/**
 * Form Select Component
 */
const FormSelect = memo(function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
  error,
  className,
  disabled,
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 border rounded-xl bg-white transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
          error ? "border-red-500 bg-red-50" : "border-slate-300",
          disabled && "bg-slate-100 cursor-not-allowed"
        )}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

/**
 * Address Card Component
 */
const AddressCard = memo(function AddressCard({ address, isSelected, onSelect, showBadge = true }) {
  if (!address) return null;
  
  return (
    <label
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
        isSelected
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <input
        type="radio"
        checked={isSelected}
        onChange={() => onSelect(address)}
        className="mt-1 w-4 h-4 text-slate-900 focus:ring-slate-900"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-slate-900">
            {address.fullName || 'No Name'}
          </span>
          {showBadge && address.isDefault && (
            <span className="px-2 py-0.5 bg-slate-900 text-white text-xs rounded-full">
              Default
            </span>
          )}
          {showBadge && address.type && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full capitalize">
              {address.type}
            </span>
          )}
          {showBadge && address.label && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {address.label}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {address.addressLine1 || ''}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </p>
        <p className="text-sm text-slate-600">
          {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
        </p>
        <p className="text-sm text-slate-600">{address.country || ''}</p>
        {address.phone && (
          <p className="text-sm text-slate-500 mt-1">{address.phone}</p>
        )}
      </div>
    </label>
  );
});

/**
 * Shipping Method Card
 */
const ShippingMethodCard = memo(function ShippingMethodCard({ 
  method, 
  isSelected, 
  onSelect, 
  isDisabled,
  subtotal 
}) {
  const isFreeEligible = method.minOrder && subtotal >= method.minOrder;
  const Icon = method.icon;
  
  return (
    <label
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
        isDisabled && "opacity-50 cursor-not-allowed",
        isSelected && !isDisabled
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <input
        type="radio"
        checked={isSelected}
        onChange={() => !isDisabled && onSelect(method.id)}
        disabled={isDisabled}
        className="w-4 h-4 text-slate-900 focus:ring-slate-900"
      />
      <Icon className="w-6 h-6 text-slate-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900">{method.label}</span>
          {method.minOrder && (
            <span className="text-xs text-slate-500">
              (Orders over {formatCurrency(method.minOrder)})
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{method.days}</p>
      </div>
      <span className="font-bold text-slate-900 flex-shrink-0">
        {method.price === 0 || isFreeEligible ? 'FREE' : formatCurrency(method.price)}
      </span>
    </label>
  );
});

/**
 * Add Address Modal Component
 */
const AddAddressModal = memo(function AddAddressModal({ isOpen, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    type: 'shipping',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        type: 'shipping',
        isDefault: false,
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!form.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!form.addressLine1?.trim()) newErrors.addressLine1 = 'Address is required';
    if (!form.city?.trim()) newErrors.city = 'City is required';
    if (!form.state?.trim()) newErrors.state = 'State is required';
    if (!form.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
    }
  }, [form, validate, onSave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">Add New Address</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormInput
            label="Full Name"
            required
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={errors.fullName}
            placeholder="John Doe"
          />

          <FormInput
            label="Phone Number"
            required
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            placeholder="+1 (555) 123-4567"
          />

          <FormInput
            label="Address Line 1"
            required
            value={form.addressLine1}
            onChange={handleChange('addressLine1')}
            error={errors.addressLine1}
            placeholder="123 Main Street"
          />

          <FormInput
            label="Address Line 2"
            value={form.addressLine2}
            onChange={handleChange('addressLine2')}
            placeholder="Apt, Suite, etc. (optional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="City"
              required
              value={form.city}
              onChange={handleChange('city')}
              error={errors.city}
              placeholder="New York"
            />
            <FormInput
              label="State"
              required
              value={form.state}
              onChange={handleChange('state')}
              error={errors.state}
              placeholder="NY"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Postal Code"
              required
              value={form.postalCode}
              onChange={handleChange('postalCode')}
              error={errors.postalCode}
              placeholder="10001"
            />
            <FormSelect
              label="Country"
              required
              value={form.country}
              onChange={handleChange('country')}
              options={COUNTRIES.map(c => ({ value: c, label: c }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Address Type"
              value={form.type}
              onChange={handleChange('type')}
              options={[
                { value: 'shipping', label: 'Shipping' },
                { value: 'billing', label: 'Billing' },
              ]}
            />
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={handleChange('isDefault')}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm text-slate-700">Set as default</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isSaving} 
              className="flex-1"
            >
              Add Address
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

/**
 * Order Item Card Component
 */
const OrderItemCard = memo(function OrderItemCard({ item }) {
  const imageUrl = item.productImage || item.image || item.thumbnail;
  const itemTotal = item.total || (item.price * item.quantity) || 0;
  
  return (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
      <ProductImage
        src={imageUrl}
        alt={item.productName || item.name || 'Product'}
        className="w-20 h-20 rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 truncate">
          {item.productName || item.name || 'Unknown Product'}
        </h4>
        {item.sku && (
          <p className="text-xs text-slate-400">SKU: {item.sku}</p>
        )}
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <p className="text-xs text-slate-500 mt-0.5">
            {Object.entries(item.attributes).map(([key, val]) => `${key}: ${val}`).join(', ')}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-slate-500">
            {formatCurrency(item.price || 0)} × {item.quantity || 1}
          </p>
          <p className="font-semibold text-slate-900">
            {formatCurrency(itemTotal)}
          </p>
        </div>
      </div>
    </div>
  );
});

/**
 * Order Summary Sidebar Component
 */
const OrderSummary = memo(function OrderSummary({ 
  items = [], 
  subtotal = 0, 
  tax = 0, 
  shipping = 0, 
  discount = 0, 
  total = 0,
  couponCode 
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
      
      {/* Items */}
      <div className="space-y-3 max-h-64 overflow-auto mb-4 pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No items in cart</p>
        ) : (
          items.map((item, index) => {
            const imageUrl = item.productImage || item.image || item.thumbnail;
            const itemTotal = item.total || (item.price * item.quantity) || 0;
            
            return (
              <div key={item.$id || item.productId || index} className="flex gap-3">
                <ProductImage
                  src={imageUrl}
                  alt={item.productName || item.name}
                  className="w-14 h-14 rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.productName || item.name || 'Product'}
                  </p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity || 1}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                  {formatCurrency(itemTotal)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Totals */}
      <div className="space-y-2 pt-4 border-t border-slate-200">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="text-slate-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Shipping</span>
          <span className="text-slate-900">
            {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Tax (10%)</span>
          <span className="text-slate-900">{formatCurrency(tax)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              Discount
              {couponCode && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  {couponCode}
                </span>
              )}
            </span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-slate-200">
          <span className="text-lg font-bold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>Secure checkout</span>
        </div>
      </div>
    </div>
  );
});

// ============================================
// MAIN CHECKOUT FORM COMPONENT
// ============================================

export default function CheckoutForm() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cart, items } = useCartStore();
  const { createOrder, isCreating } = useCreateOrder();

  // Step state
  const [currentStep, setCurrentStep] = useState(0);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Shipping & Payment state
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNotes, setOrderNotes] = useState('');

  // Card state - consolidated to prevent re-renders
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: '',
  });

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.$id) {
        setIsLoadingAddresses(false);
        return;
      }

      try {
        setIsLoadingAddresses(true);
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          ADDRESSES_COLLECTION,
          [
            Query.equal('userId', user.$id),
            Query.orderDesc('isDefault'),
            Query.orderDesc('$createdAt'),
          ]
        );

        const fetchedAddresses = response.documents || [];
        setAddresses(fetchedAddresses);

        // Auto-select default or first address
        if (fetchedAddresses.length > 0) {
          const defaultAddr = fetchedAddresses.find(addr => addr.isDefault) || fetchedAddresses[0];
          setSelectedShippingAddress(defaultAddr);
          setSelectedBillingAddress(defaultAddr);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        // Don't show error toast if collection doesn't exist yet
        if (!error.message?.includes('Collection')) {
          toast.error('Failed to load addresses');
        }
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [user?.$id]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = cart?.subtotal || items?.reduce((sum, item) => sum + (item.total || item.price * item.quantity || 0), 0) || 0;
    const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethod);
    
    let shippingCost = selectedShipping?.price || 0;
    if (selectedShipping?.minOrder && subtotal >= selectedShipping.minOrder) {
      shippingCost = 0;
    }
    
    const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
    const discount = cart?.discount || 0;
    const total = Math.round((subtotal + tax + shippingCost - discount) * 100) / 100;

    return { subtotal, shippingCost, tax, discount, total };
  }, [cart?.subtotal, cart?.discount, items, shippingMethod]);

  // Handlers
  const handleSelectShippingAddress = useCallback((address) => {
    setSelectedShippingAddress(address);
    if (sameAsShipping) {
      setSelectedBillingAddress(address);
    }
  }, [sameAsShipping]);

  const handleSelectBillingAddress = useCallback((address) => {
    setSelectedBillingAddress(address);
  }, []);

  const handleSameAsShippingChange = useCallback((e) => {
    const checked = e.target.checked;
    setSameAsShipping(checked);
    if (checked && selectedShippingAddress) {
      setSelectedBillingAddress(selectedShippingAddress);
    }
  }, [selectedShippingAddress]);

  const handleShippingMethodChange = useCallback((methodId) => {
    setShippingMethod(methodId);
  }, []);

  const handlePaymentMethodChange = useCallback((methodId) => {
    setPaymentMethod(methodId);
  }, []);

  const handleCardDetailChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setCardDetails(prev => {
      let newValue = value;
      
      if (field === 'number') {
        newValue = formatCardNumber(value);
      } else if (field === 'expiry') {
        newValue = formatExpiry(value);
      } else if (field === 'cvc') {
        newValue = value.replace(/\D/g, '').slice(0, 4);
      }
      
      return { ...prev, [field]: newValue };
    });
  }, []);

  const handleOrderNotesChange = useCallback((e) => {
    setOrderNotes(e.target.value);
  }, []);

  const handleAddAddress = useCallback(async (addressData) => {
    if (!user?.$id) {
      toast.error('Please log in to add an address');
      return;
    }

    setIsSavingAddress(true);
    try {
      // If setting as default, unset other defaults first
      if (addressData.isDefault && addresses.length > 0) {
        const defaultAddresses = addresses.filter(a => a.isDefault);
        for (const addr of defaultAddresses) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              ADDRESSES_COLLECTION,
              addr.$id,
              { isDefault: false }
            );
          } catch (e) {
            console.warn('Failed to unset default:', e);
          }
        }
      }

      const newAddress = await databases.createDocument(
        DATABASE_ID,
        ADDRESSES_COLLECTION,
        ID.unique(),
        {
          userId: user.$id,
          fullName: addressData.fullName.trim(),
          phone: addressData.phone.trim(),
          addressLine1: addressData.addressLine1.trim(),
          addressLine2: addressData.addressLine2?.trim() || null,
          city: addressData.city.trim(),
          state: addressData.state.trim(),
          postalCode: addressData.postalCode.trim(),
          country: addressData.country,
          type: addressData.type || 'shipping',
          isDefault: addresses.length === 0 ? true : addressData.isDefault,
          latitude: null,
          longitude: null,
          label: null,
        }
      );

      setAddresses(prev => [newAddress, ...prev]);
      setSelectedShippingAddress(newAddress);
      if (sameAsShipping) {
        setSelectedBillingAddress(newAddress);
      }
      setShowAddressModal(false);
      toast.success('Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error(error.message || 'Failed to add address');
    } finally {
      setIsSavingAddress(false);
    }
  }, [user?.$id, addresses, sameAsShipping]);

  // Check if can proceed to next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Shipping
        return !!selectedShippingAddress && !!shippingMethod;
      case 1: // Payment
        if (paymentMethod === 'card') {
          return (
            cardDetails.name.trim().length > 0 &&
            cardDetails.number.replace(/\s/g, '').length >= 15 &&
            cardDetails.expiry.length === 5 &&
            cardDetails.cvc.length >= 3
          );
        }
        return true;
      case 2: // Review
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedShippingAddress, shippingMethod, paymentMethod, cardDetails]);

  const handleNext = useCallback(() => {
    if (canProceed && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [canProceed, currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handlePlaceOrder = useCallback(async () => {
    if (!user?.$id) {
      toast.error('Please log in to place an order');
      return;
    }

    if (!selectedShippingAddress) {
      toast.error('Please select a shipping address');
      setCurrentStep(0);
      return;
    }

    if (!items || items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const billingAddr = sameAsShipping ? selectedShippingAddress : selectedBillingAddress;
    if (!billingAddr) {
      toast.error('Please select a billing address');
      setCurrentStep(1);
      return;
    }

    try {
      const orderData = {
        userId: user.$id,
        items: items.map(item => ({
          productId: item.productId || item.$id,
          variantId: item.variantId || null,
          productName: item.productName || item.name || 'Product',
          productImage: item.productImage || item.image || item.thumbnail || null,
          sku: item.sku || null,
          price: item.price || 0,
          quantity: item.quantity || 1,
          total: item.total || (item.price * item.quantity) || 0,
          attributes: item.attributes || null,
        })),
        shippingAddressId: selectedShippingAddress.$id,
        billingAddressId: billingAddr.$id,
        shippingAddress: {
          fullName: selectedShippingAddress.fullName,
          phone: selectedShippingAddress.phone,
          addressLine1: selectedShippingAddress.addressLine1,
          addressLine2: selectedShippingAddress.addressLine2 || null,
          city: selectedShippingAddress.city,
          state: selectedShippingAddress.state,
          country: selectedShippingAddress.country,
          postalCode: selectedShippingAddress.postalCode,
        },
        billingAddress: {
          fullName: billingAddr.fullName,
          phone: billingAddr.phone,
          addressLine1: billingAddr.addressLine1,
          addressLine2: billingAddr.addressLine2 || null,
          city: billingAddr.city,
          state: billingAddr.state,
          country: billingAddr.country,
          postalCode: billingAddr.postalCode,
        },
        shippingMethod,
        paymentMethod,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        shipping: calculations.shippingCost,
        discount: calculations.discount,
        total: calculations.total,
        couponCode: cart?.couponCode || null,
        couponDiscount: cart?.couponDiscount || 0,
        notes: orderNotes.trim() || null,
        status: 'pending',
      };

      const result = await createOrder(orderData);

      if (result?.success && result?.order) {
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${result.order.$id}`);
      } else {
        throw new Error(result?.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    }
  }, [
    user,
    selectedShippingAddress,
    selectedBillingAddress,
    sameAsShipping,
    items,
    shippingMethod,
    paymentMethod,
    calculations,
    cart,
    orderNotes,
    createOrder,
    navigate
  ]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Shipping Address Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>

              {isLoadingAddresses ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No addresses saved yet</p>
                  <Button onClick={() => setShowAddressModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <AddressCard
                      key={address.$id}
                      address={address}
                      isSelected={selectedShippingAddress?.$id === address.$id}
                      onSelect={handleSelectShippingAddress}
                    />
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* Shipping Method Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Method
              </h2>

              <div className="space-y-3">
                {SHIPPING_METHODS.map((method) => {
                  const isDisabled = method.minOrder && calculations.subtotal < method.minOrder;
                  
                  return (
                    <ShippingMethodCard
                      key={method.id}
                      method={method}
                      isSelected={shippingMethod === method.id}
                      onSelect={handleShippingMethodChange}
                      isDisabled={isDisabled}
                      subtotal={calculations.subtotal}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Billing Address Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Billing Address</h2>
              
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={handleSameAsShippingChange}
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-slate-600">Same as shipping address</span>
              </label>

              {!sameAsShipping && addresses.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  {addresses.map((address) => (
                    <AddressCard
                      key={address.$id}
                      address={address}
                      isSelected={selectedBillingAddress?.$id === address.$id}
                      onSelect={handleSelectBillingAddress}
                      showBadge={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h2>

              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === method.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => handlePaymentMethodChange(method.id)}
                        className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="font-semibold text-slate-900">{method.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Card Details Form */}
              <AnimatePresence>
                {paymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-slate-200 overflow-hidden"
                  >
                    <FormInput
                      label="Cardholder Name"
                      value={cardDetails.name}
                      onChange={handleCardDetailChange('name')}
                      placeholder="John Doe"
                      autoComplete="cc-name"
                    />
                    
                    <FormInput
                      label="Card Number"
                      value={cardDetails.number}
                      onChange={handleCardDetailChange('number')}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      autoComplete="cc-number"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Expiry Date"
                        value={cardDetails.expiry}
                        onChange={handleCardDetailChange('expiry')}
                        placeholder="MM/YY"
                        maxLength={5}
                        autoComplete="cc-exp"
                      />
                      <FormInput
                        label="CVC"
                        value={cardDetails.cvc}
                        onChange={handleCardDetailChange('cvc')}
                        placeholder="123"
                        maxLength={4}
                        autoComplete="cc-csc"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700">
                        Your payment information is secure and encrypted
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {paymentMethod === 'cod' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800">
                    💵 Pay with cash when your order is delivered. A small handling fee of $2 will be added.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Order Items */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({items?.length || 0})
              </h2>
              <div className="space-y-4">
                {items?.length > 0 ? (
                  items.map((item, index) => (
                    <OrderItemCard key={item.$id || item.productId || index} item={item} />
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4">No items in cart</p>
                )}
              </div>
            </div>

            {/* Shipping & Payment Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h3>
                {selectedShippingAddress ? (
                  <div className="text-sm text-slate-600 space-y-1">
                    <p className="font-medium text-slate-900">{selectedShippingAddress.fullName}</p>
                    <p>{selectedShippingAddress.addressLine1}</p>
                    {selectedShippingAddress.addressLine2 && (
                      <p>{selectedShippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {selectedShippingAddress.city}, {selectedShippingAddress.state} {selectedShippingAddress.postalCode}
                    </p>
                    <p>{selectedShippingAddress.country}</p>
                    <p className="pt-1 text-slate-500">{selectedShippingAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No address selected</p>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Method:</span>{' '}
                    {SHIPPING_METHODS.find(m => m.id === shippingMethod)?.label}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Method
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                    </p>
                    {paymentMethod === 'card' && cardDetails.number && (
                      <p className="text-sm text-slate-500">
                        Card ending in ****{cardDetails.number.replace(/\s/g, '').slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">
                Order Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </h3>
              <textarea
                value={orderNotes}
                onChange={handleOrderNotesChange}
                placeholder="Add any special instructions for your order (e.g., delivery instructions, gift message)..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all",
                      isActive || isCompleted
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-400",
                      index < currentStep && "cursor-pointer hover:bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-green-500" : "bg-white/20"
                    )}>
                      {isCompleted ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className="font-medium hidden sm:block text-sm">
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "w-6 sm:w-12 md:w-16 h-0.5 mx-1 sm:mx-2 transition-colors",
                      index < currentStep ? "bg-slate-900" : "bg-slate-200"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handlePlaceOrder}
              isLoading={isCreating}
              disabled={!canProceed || isCreating}
              size="lg"
              className="min-w-[200px]"
            >
              {isCreating ? 'Processing...' : `Place Order • ${formatCurrency(calculations.total)}`}
            </Button>
          )}
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <OrderSummary
          items={items || []}
          subtotal={calculations.subtotal}
          tax={calculations.tax}
          shipping={calculations.shippingCost}
          discount={calculations.discount}
          total={calculations.total}
          couponCode={cart?.couponCode}
        />
      </div>

      {/* Address Form Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <AddAddressModal
            isOpen={showAddressModal}
            onClose={() => setShowAddressModal(false)}
            onSave={handleAddAddress}
            isSaving={isSavingAddress}
          />
        )}
      </AnimatePresence>
    </div>
  );
}