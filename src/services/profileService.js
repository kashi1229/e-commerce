// src/services/profileService.js
import { 
  databases, 
  storage,
  DATABASE_ID, 
  ID,
  Query,
  getImageUrl,
} from '../lib/appwrite';
import { appwriteConfig } from '../config/appwrite.config';
import { apiLogger } from '../lib/logger';
import { handleError } from '../lib/errors';

const COLLECTIONS = appwriteConfig.collections;
const BUCKET_ID = appwriteConfig.buckets.default;

class ProfileService {
  /**
   * Get user profile by userId
   */
  async getProfile(userId) {
    if (!userId) {
      apiLogger.error('getProfile: userId is required');
      return { success: false, error: 'User ID is required', profile: null };
    }

    try {
      apiLogger.info('Fetching profile for userId:', userId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.usersProfile,
        [Query.equal('userId', userId), Query.limit(1)]
      );

      if (response.documents.length === 0) {
        apiLogger.warn('Profile not found for userId:', userId);
        return { success: false, error: 'Profile not found', profile: null };
      }

      const profile = response.documents[0];
      apiLogger.success('Profile fetched successfully:', profile.$id);

      return { success: true, profile };
    } catch (error) {
      apiLogger.error('Error fetching profile:', error);
      return { success: false, error: error.message, profile: null };
    }
  }

  /**
   * Get profile by document ID
   */
  async getProfileById(profileId) {
    if (!profileId) {
      return { success: false, error: 'Profile ID is required', profile: null };
    }

    try {
      const profile = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.usersProfile,
        profileId
      );

      return { success: true, profile };
    } catch (error) {
      apiLogger.error('Error fetching profile by ID:', error);
      return { success: false, error: error.message, profile: null };
    }
  }

  /**
   * Create new user profile
   */
  async createProfile(userId, data) {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    try {
      apiLogger.info('Creating profile for userId:', userId);

      // Check if profile already exists
      const existingProfile = await this.getProfile(userId);
      if (existingProfile.success && existingProfile.profile) {
        apiLogger.warn('Profile already exists for userId:', userId);
        return { success: true, profile: existingProfile.profile };
      }

      const profileData = {
        userId,
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || null,
        avatar: data.avatar || null,
        role: data.role || 'customer',
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        lastLoginAt: new Date().toISOString(),
        metadata: JSON.stringify(data.metadata || {}),
      };

      const profile = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.usersProfile,
        ID.unique(),
        profileData
      );

      apiLogger.success('Profile created successfully:', profile.$id);

      return { success: true, profile };
    } catch (error) {
      apiLogger.error('Error creating profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileId, data) {
    if (!profileId) {
      apiLogger.error('updateProfile: profileId is required');
      return { success: false, error: 'Profile ID is required' };
    }

    try {
      apiLogger.info('Updating profile:', profileId, data);

      // Filter only allowed fields
      const allowedFields = [
        'firstName',
        'lastName', 
        'phone',
        'avatar',
        'dateOfBirth',
        'gender',
        'metadata',
      ];

      const updateData = {};
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          // Handle dateOfBirth conversion
          if (field === 'dateOfBirth' && data[field]) {
            try {
              const date = new Date(data[field]);
              if (!isNaN(date.getTime())) {
                updateData[field] = date.toISOString();
              }
            } catch (e) {
              apiLogger.warn('Invalid date format for dateOfBirth:', data[field]);
            }
          } else if (data[field] !== '') {
            updateData[field] = data[field];
          }
        }
      });

      // Handle empty strings for nullable fields
      if (data.phone === '') updateData.phone = null;
      if (data.gender === '') updateData.gender = null;
      if (data.dateOfBirth === '') updateData.dateOfBirth = null;

      apiLogger.debug('Update data prepared:', updateData);

      if (Object.keys(updateData).length === 0) {
        apiLogger.warn('No valid fields to update');
        return { success: false, error: 'No valid fields to update' };
      }

      const profile = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.usersProfile,
        profileId,
        updateData
      );

      apiLogger.success('Profile updated successfully:', profileId);

      return { success: true, profile };
    } catch (error) {
      apiLogger.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(profileId) {
    if (!profileId) return { success: false };

    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.usersProfile,
        profileId,
        { lastLoginAt: new Date().toISOString() }
      );
      return { success: true };
    } catch (error) {
      apiLogger.warn('Failed to update last login:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file, oldAvatarId = null) {
    try {
      apiLogger.info('Uploading avatar...');

      // Delete old avatar if exists
      if (oldAvatarId && !oldAvatarId.startsWith('http')) {
        try {
          await storage.deleteFile(BUCKET_ID, oldAvatarId);
          apiLogger.debug('Old avatar deleted:', oldAvatarId);
        } catch (e) {
          apiLogger.warn('Failed to delete old avatar:', e.message);
        }
      }

      // Upload new avatar
      const response = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      apiLogger.success('Avatar uploaded:', response.$id);

      return { 
        success: true, 
        fileId: response.$id,
        url: this.getAvatarUrl(response.$id)
      };
    } catch (error) {
      apiLogger.error('Error uploading avatar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get avatar URL
   */
  getAvatarUrl(fileId, width = 200, height = 200) {
    if (!fileId) return null;
    if (fileId.startsWith('http')) return fileId;
    
    try {
      return storage.getFilePreview(BUCKET_ID, fileId, width, height, 'center', 90).href;
    } catch (error) {
      apiLogger.error('Error getting avatar URL:', error);
      return null;
    }
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(fileId) {
    if (!fileId || fileId.startsWith('http')) {
      return { success: true };
    }

    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      apiLogger.success('Avatar deleted:', fileId);
      return { success: true };
    } catch (error) {
      apiLogger.error('Error deleting avatar:', error);
      return { success: false, error: error.message };
    }
  }
}

export const profileService = new ProfileService();
export default profileService;