// src/services/settingsService.js
import { 
  databases, 
  DATABASE_ID, 
  ID,
  Query,
} from '../lib/appwrite';
import { appwriteConfig } from '../config/appwrite.config';
import { apiLogger } from '../lib/logger';

const COLLECTION_ID = appwriteConfig.collections.settings;

class SettingsService {
  // Cache for settings
  cache = new Map();
  cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all public settings
   */
  async getPublicSettings() {
    try {
      const cacheKey = 'public_settings';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      apiLogger.info('Fetching public settings');

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('isPublic', true),
          Query.limit(100)
        ]
      );

      const settings = this.formatSettings(response.documents);
      
      this.setCache(cacheKey, { success: true, settings });

      apiLogger.success(`Fetched ${response.documents.length} public settings`);

      return { success: true, settings };
    } catch (error) {
      apiLogger.error('Error fetching public settings:', error);
      return { success: false, error: error.message, settings: {} };
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category) {
    try {
      const cacheKey = `settings_${category}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      apiLogger.info('Fetching settings for category:', category);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('category', category),
          Query.limit(100)
        ]
      );

      const settings = this.formatSettings(response.documents);

      this.setCache(cacheKey, { success: true, settings });

      return { success: true, settings };
    } catch (error) {
      apiLogger.error('Error fetching settings by category:', error);
      return { success: false, error: error.message, settings: {} };
    }
  }

  /**
   * Get single setting by key
   */
  async getSetting(key) {
    try {
      const cacheKey = `setting_${key}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      apiLogger.info('Fetching setting:', key);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('key', key),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        return { success: false, error: 'Setting not found' };
      }

      const setting = response.documents[0];
      const value = this.parseValue(setting.value, setting.type);

      const result = { success: true, setting, value };
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      apiLogger.error('Error fetching setting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create or update setting
   */
  async setSetting(key, value, options = {}) {
    try {
      apiLogger.info('Setting value for key:', key);

      const {
        type = 'string',
        category = 'general',
        description = null,
        isPublic = false
      } = options;

      // Check if setting exists
      const existingResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('key', key),
          Query.limit(1)
        ]
      );

      const stringValue = this.stringifyValue(value, type);

      let setting;

      if (existingResponse.documents.length > 0) {
        // Update existing
        setting = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          existingResponse.documents[0].$id,
          {
            value: stringValue,
            type,
            category,
            description,
            isPublic
          }
        );
        apiLogger.success('Setting updated:', key);
      } else {
        // Create new
        setting = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            key,
            value: stringValue,
            type,
            category,
            description,
            isPublic
          }
        );
        apiLogger.success('Setting created:', key);
      }

      // Clear cache
      this.clearCache();

      return { success: true, setting };
    } catch (error) {
      apiLogger.error('Error setting value:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete setting
   */
  async deleteSetting(key) {
    try {
      apiLogger.info('Deleting setting:', key);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('key', key),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        return { success: false, error: 'Setting not found' };
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        response.documents[0].$id
      );

      // Clear cache
      this.clearCache();

      apiLogger.success('Setting deleted:', key);

      return { success: true };
    } catch (error) {
      apiLogger.error('Error deleting setting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user preferences
   * Note: This uses a special format with userId in the key
   */
  async getUserPreferences(userId) {
    try {
      apiLogger.info('Fetching preferences for user:', userId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('category', `user_${userId}`),
          Query.limit(100)
        ]
      );

      const preferences = this.formatSettings(response.documents);

      return { success: true, preferences };
    } catch (error) {
      apiLogger.error('Error fetching user preferences:', error);
      return { success: false, error: error.message, preferences: {} };
    }
  }

  /**
   * Set user preference
   */
  async setUserPreference(userId, key, value, type = 'string') {
    return this.setSetting(
      `${userId}_${key}`,
      value,
      {
        type,
        category: `user_${userId}`,
        isPublic: false
      }
    );
  }

  /**
   * Get user preference
   */
  async getUserPreference(userId, key, defaultValue = null) {
    const result = await this.getSetting(`${userId}_${key}`);
    
    if (result.success) {
      return result.value;
    }
    
    return defaultValue;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format settings array into object
   */
  formatSettings(documents) {
    const settings = {};
    
    documents.forEach(doc => {
      settings[doc.key] = {
        value: this.parseValue(doc.value, doc.type),
        type: doc.type,
        category: doc.category,
        description: doc.description,
        isPublic: doc.isPublic,
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      };
    });
    
    return settings;
  }

  /**
   * Parse value based on type
   */
  parseValue(value, type) {
    try {
      switch (type) {
        case 'number':
        case 'integer':
          return Number(value);
        case 'boolean':
          return value === 'true' || value === true;
        case 'json':
        case 'array':
        case 'object':
          return JSON.parse(value);
        case 'string':
        default:
          return value;
      }
    } catch (error) {
      apiLogger.warn('Error parsing setting value:', error);
      return value;
    }
  }

  /**
   * Stringify value for storage
   */
  stringifyValue(value, type) {
    try {
      switch (type) {
        case 'json':
        case 'array':
        case 'object':
          return JSON.stringify(value);
        case 'boolean':
          return value ? 'true' : 'false';
        default:
          return String(value);
      }
    } catch (error) {
      apiLogger.warn('Error stringifying setting value:', error);
      return String(value);
    }
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const settingsService = new SettingsService();
export default settingsService;