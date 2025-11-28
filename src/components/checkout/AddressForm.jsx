// src/components/checkout/AddressForm.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { databases, DATABASE_ID, COLLECTIONS, ID } from '../../lib/appwrite';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AddressForm({ userId, address, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    type: address?.type || 'home',
    fullName: address?.fullName || '',
    phone: address?.phone || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || 'United States',
    postalCode: address?.postalCode || '',
    isDefault: address?.isDefault || false,
  });

  const addressTypes = [
    { id: 'home', label: 'Home' },
    { id: 'work', label: 'Work' },
    { id: 'other', label: 'Other' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = {
        userId,
        ...formData,
      };

      let result;
      if (address?.$id) {
        // Update existing address
        result = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USER_ADDRESS,
          address.$id,
          data
        );
      } else {
        // Create new address
        result = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_ADDRESS,
          ID.unique(),
          data
        );
      }

      onSuccess(result);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, field, placeholder, required = false, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-[#455A64] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={formData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-3 border rounded-xl transition-all",
          "focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent",
          errors[field] ? "border-red-500 bg-red-50" : "border-[#B0BEC5]"
        )}
        {...props}
      />
      {errors[field] && (
        <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={address ? 'Edit Address' : 'Add New Address'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Address Type */}
        <div>
          <label className="block text-sm font-medium text-[#455A64] mb-2">
            Address Type
          </label>
          <div className="flex gap-3">
            {addressTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleChange('type', type.id)}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl border-2 font-medium transition-all",
                  formData.type === type.id
                    ? "border-[#26323B] bg-[#26323B] text-white"
                    : "border-[#E0E0E0] text-[#455A64] hover:border-[#B0BEC5]"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name & Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            label="Full Name"
            field="fullName"
            placeholder="John Doe"
            required
          />
          <InputField
            label="Phone Number"
            field="phone"
            placeholder="+1 (555) 123-4567"
            type="tel"
            required
          />
        </div>

        {/* Address Lines */}
        <InputField
          label="Address Line 1"
          field="addressLine1"
          placeholder="Street address, P.O. box"
          required
        />
        <InputField
          label="Address Line 2"
          field="addressLine2"
          placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
        />

        {/* City, State, Postal */}
        <div className="grid md:grid-cols-3 gap-4">
          <InputField
            label="City"
            field="city"
            placeholder="New York"
            required
          />
          <InputField
            label="State / Province"
            field="state"
            placeholder="NY"
            required
          />
          <InputField
            label="Postal Code"
            field="postalCode"
            placeholder="10001"
            required
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-[#455A64] mb-1.5">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full px-4 py-3 border border-[#B0BEC5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#26323B] focus:border-transparent"
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
          </select>
        </div>

        {/* Default Address */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => handleChange('isDefault', e.target.checked)}
            className="w-5 h-5 rounded border-[#B0BEC5] text-[#26323B] focus:ring-[#26323B]"
          />
          <span className="text-[#455A64]">Set as default address</span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F7F7F7]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
          >
            {address ? 'Update Address' : 'Save Address'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}