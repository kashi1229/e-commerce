// src/services/addressService.js
import { 
  databases, 
  DATABASE_ID, 
  ID,
  Query,
} from '../lib/appwrite';
import { appwriteConfig } from '../config/appwrite.config';
import { apiLogger } from '../lib/logger';

const COLLECTION_ID = appwriteConfig.collections.userAddresses;

class AddressService {
  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId) {
    if (!userId) {
      apiLogger.error('getUserAddresses: userId is required');
      return { success: false, error: 'User ID required', addresses: [] };
    }

    try {
      apiLogger.info('Fetching addresses for user:', userId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('isDefault'),
          Query.orderDesc('$createdAt'),
        ]
      );

      apiLogger.success(`Fetched ${response.documents.length} addresses`);

      return { 
        success: true, 
        addresses: response.documents,
        total: response.total 
      };
    } catch (error) {
      apiLogger.error('Error fetching addresses:', error);
      return { success: false, error: error.message, addresses: [] };
    }
  }

  /**
   * Get single address by ID
   */
  async getAddress(addressId) {
    if (!addressId) {
      return { success: false, error: 'Address ID required' };
    }

    try {
      const address = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        addressId
      );

      return { success: true, address };
    } catch (error) {
      apiLogger.error('Error fetching address:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create new address
   */
  async createAddress(userId, data) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      apiLogger.info('Creating address for user:', userId);

      // If this is set as default, unset other defaults first
      if (data.isDefault) {
        await this.unsetDefaultAddresses(userId);
      }

      // Build fullName from firstName and lastName if provided
      const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();

      const addressData = {
        userId,
        type: data.type || 'shipping',
        fullName: fullName || 'Unknown',
        phone: data.phone || '',
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        isDefault: data.isDefault || false,
        label: data.label || null,
      };

      apiLogger.debug('Address data:', addressData);

      const address = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        addressData
      );

      apiLogger.success('Address created:', address.$id);

      return { success: true, address };
    } catch (error) {
      apiLogger.error('Error creating address:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update address
   */
  async updateAddress(addressId, data) {
    if (!addressId) {
      return { success: false, error: 'Address ID required' };
    }

    try {
      apiLogger.info('Updating address:', addressId);

      // Get current address to check userId
      const currentAddress = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        addressId
      );

      // If setting as default, unset other defaults first
      if (data.isDefault && !currentAddress.isDefault) {
        await this.unsetDefaultAddresses(currentAddress.userId);
      }

      // Build update data
      const updateData = {};
      
      const allowedFields = [
        'type', 'fullName', 'phone', 'addressLine1', 'addressLine2',
        'city', 'state', 'country', 'postalCode', 'latitude', 'longitude',
        'isDefault', 'label'
      ];

      // Handle firstName/lastName conversion to fullName
      if (data.firstName !== undefined || data.lastName !== undefined) {
        const firstName = data.firstName !== undefined ? data.firstName : '';
        const lastName = data.lastName !== undefined ? data.lastName : '';
        updateData.fullName = `${firstName} ${lastName}`.trim();
      }

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      // Handle empty strings for nullable fields
      if (data.addressLine2 === '') updateData.addressLine2 = null;
      if (data.label === '') updateData.label = null;

      apiLogger.debug('Update data:', updateData);

      const address = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        addressId,
        updateData
      );

      apiLogger.success('Address updated:', addressId);

      return { success: true, address };
    } catch (error) {
      apiLogger.error('Error updating address:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId) {
    if (!addressId) {
      return { success: false, error: 'Address ID required' };
    }

    try {
      apiLogger.info('Deleting address:', addressId);

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        addressId
      );

      apiLogger.success('Address deleted:', addressId);

      return { success: true };
    } catch (error) {
      apiLogger.error('Error deleting address:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(userId, addressId) {
    if (!userId || !addressId) {
      return { success: false, error: 'User ID and Address ID required' };
    }

    try {
      apiLogger.info('Setting default address:', addressId);

      // Unset other defaults first
      await this.unsetDefaultAddresses(userId);

      // Set new default
      const address = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        addressId,
        { isDefault: true }
      );

      apiLogger.success('Default address set:', addressId);

      return { success: true, address };
    } catch (error) {
      apiLogger.error('Error setting default address:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unset all default addresses for user
   */
  async unsetDefaultAddresses(userId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isDefault', true)
        ]
      );

      const promises = response.documents.map(addr =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          addr.$id,
          { isDefault: false }
        )
      );

      await Promise.all(promises);
      apiLogger.debug('Unset default addresses for user:', userId);
    } catch (error) {
      apiLogger.warn('Error unsetting default addresses:', error.message);
    }
  }

  /**
   * Get default address for user
   */
  async getDefaultAddress(userId) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isDefault', true),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        return { success: false, error: 'No default address found' };
      }

      return { success: true, address: response.documents[0] };
    } catch (error) {
      apiLogger.error('Error fetching default address:', error);
      return { success: false, error: error.message };
    }
  }
}

export const addressService = new AddressService();
export default addressService;