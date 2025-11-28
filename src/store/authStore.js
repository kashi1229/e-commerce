// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  account, 
  databases,
  client,
  DATABASE_ID, 
  ID, 
  Query,
  getCurrentUser,
  isAuthError,
  getErrorMessage,
} from '../lib/appwrite';
import { appwriteConfig } from '../config/appwrite.config';
import { profileService } from '../services/profileService';
import { authLogger } from '../lib/logger';

const COLLECTIONS = appwriteConfig.collections;

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      isInitialized: false,
      error: null,
      realtimeUnsubscribe: null,

      // ============================================
      // INITIALIZATION
      // ============================================
      
      initialize: async () => {
        if (get().isInitialized) {
          authLogger.debug('Already initialized');
          return { success: true, user: get().user };
        }

        try {
          set({ isLoading: true, error: null });
          authLogger.info('Initializing auth state...');
          
          const user = await getCurrentUser();
          
          if (user) {
            authLogger.success('User found:', user.$id);
            
            // Fetch profile
            let profileResult = await profileService.getProfile(user.$id);
            
            // Create profile if doesn't exist
            if (!profileResult.success || !profileResult.profile) {
              authLogger.info('Profile not found, creating new profile...');
              
              const nameParts = (user.name || '').split(' ');
              profileResult = await profileService.createProfile(user.$id, {
                email: user.email,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
              });
            }

            const profile = profileResult.profile;

            set({ 
              user, 
              profile, 
              isAuthenticated: true, 
              isLoading: false,
              isInitialized: true,
              error: null
            });

            // Update last login
            if (profile?.$id) {
              profileService.updateLastLogin(profile.$id);
            }

            // Setup realtime subscription
            get().subscribeToProfile(user.$id, profile?.$id);
            
            authLogger.success('Auth initialized successfully');
            return { success: true, user, profile };
          } else {
            authLogger.info('No active session');
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false, 
              isLoading: false,
              isInitialized: true,
              error: null
            });
            return { success: true, user: null };
          }
        } catch (error) {
          authLogger.error('Initialization error:', error);
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false, 
            isLoading: false,
            isInitialized: true,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // ============================================
      // LOGIN
      // ============================================
      
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          authLogger.info('Logging in user:', email);
          
          // Create session
          await account.createEmailPasswordSession(email, password);
          
          // Get user
          const user = await account.get();
          authLogger.success('Login successful:', user.$id);
          
          // Fetch or create profile
          let profileResult = await profileService.getProfile(user.$id);
          
          if (!profileResult.success || !profileResult.profile) {
            authLogger.info('Creating profile for user...');
            const nameParts = (user.name || '').split(' ');
            profileResult = await profileService.createProfile(user.$id, {
              email: user.email,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            });
          }

          const profile = profileResult.profile;
          
          set({ 
            user, 
            profile, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });

          // Update last login
          if (profile?.$id) {
            profileService.updateLastLogin(profile.$id);
          }

          // Setup realtime subscription
          get().subscribeToProfile(user.$id, profile?.$id);

          return { success: true, user, profile };
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          authLogger.error('Login failed:', errorMessage);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ============================================
      // REGISTER
      // ============================================
      
      register: async (email, password, firstName, lastName) => {
        try {
          set({ isLoading: true, error: null });
          authLogger.info('Registering user:', email);
          
          // Create account
          const newUser = await account.create(
            ID.unique(), 
            email, 
            password, 
            `${firstName} ${lastName}`
          );
          
          authLogger.success('Account created:', newUser.$id);
          
          // Create session
          await account.createEmailPasswordSession(email, password);
          
          // Get user
          const user = await account.get();
          
          // Create profile
          const profileResult = await profileService.createProfile(user.$id, {
            email,
            firstName,
            lastName,
            role: 'customer',
          });

          if (!profileResult.success) {
            authLogger.error('Failed to create profile:', profileResult.error);
          }

          const profile = profileResult.profile;

          // Create cart
          try {
            await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.cart,
              ID.unique(),
              {
                userId: user.$id,
                itemCount: 0,
                subtotal: 0,
                tax: 0,
                shipping: 0,
                discount: 0,
                total: 0,
              }
            );
          } catch (cartError) {
            authLogger.warn('Cart creation skipped:', cartError.message);
          }

          set({ 
            user, 
            profile, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });

          // Setup realtime subscription
          get().subscribeToProfile(user.$id, profile?.$id);

          authLogger.success('Registration complete');
          return { success: true, user, profile };
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          authLogger.error('Registration failed:', errorMessage);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // ============================================
      // LOGOUT
      // ============================================
      
      logout: async () => {
        try {
          set({ isLoading: true });
          authLogger.info('Logging out...');
          
          // Unsubscribe from realtime
          get().unsubscribeFromProfile();
          
          await account.deleteSession('current');
          authLogger.success('Logged out successfully');
        } catch (error) {
          authLogger.warn('Logout error (ignored):', error.message);
        } finally {
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null,
            realtimeUnsubscribe: null,
          });
        }

        return { success: true };
      },

      // ============================================
      // UPDATE PROFILE
      // ============================================
      
      updateProfile: async (data) => {
        try {
          const { profile } = get();
          
          if (!profile || !profile.$id) {
            authLogger.error('No profile found to update');
            return { success: false, error: 'No profile found. Please try logging out and back in.' };
          }

          authLogger.info('Updating profile:', profile.$id, data);

          const result = await profileService.updateProfile(profile.$id, data);
          
          if (result.success) {
            set({ profile: result.profile });
            authLogger.success('Profile updated in store');
          } else {
            authLogger.error('Profile update failed:', result.error);
          }

          return result;
        } catch (error) {
          authLogger.error('Update profile error:', error);
          return { success: false, error: error.message };
        }
      },

      // ============================================
      // UPLOAD AVATAR
      // ============================================
      
      uploadAvatar: async (file) => {
        try {
          const { profile } = get();
          
          if (!profile || !profile.$id) {
            return { success: false, error: 'No profile found' };
          }

          authLogger.info('Uploading avatar for profile:', profile.$id);

          // Upload file
          const uploadResult = await profileService.uploadAvatar(file, profile.avatar);
          
          if (!uploadResult.success) {
            return uploadResult;
          }

          // Update profile with new avatar
          const updateResult = await profileService.updateProfile(profile.$id, {
            avatar: uploadResult.fileId
          });

          if (updateResult.success) {
            set({ profile: updateResult.profile });
            authLogger.success('Avatar updated');
          }

          return updateResult;
        } catch (error) {
          authLogger.error('Avatar upload error:', error);
          return { success: false, error: error.message };
        }
      },

      // ============================================
      // REFRESH PROFILE
      // ============================================
      
      refreshProfile: async () => {
        try {
          const { user, profile } = get();
          
          if (!user?.$id) {
            return { success: false, error: 'Not authenticated' };
          }

          authLogger.info('Refreshing profile...');

          // Try to fetch by profile ID first (faster)
          if (profile?.$id) {
            const result = await profileService.getProfileById(profile.$id);
            if (result.success) {
              set({ profile: result.profile });
              authLogger.success('Profile refreshed');
              return result;
            }
          }

          // Fallback to fetch by userId
          const result = await profileService.getProfile(user.$id);
          
          if (result.success) {
            set({ profile: result.profile });
            authLogger.success('Profile refreshed');
          }

          return result;
        } catch (error) {
          authLogger.error('Refresh profile error:', error);
          return { success: false, error: error.message };
        }
      },

      // ============================================
      // REALTIME SUBSCRIPTION
      // ============================================
      
      subscribeToProfile: (userId, profileId) => {
        try {
          const { realtimeUnsubscribe } = get();
          
          if (realtimeUnsubscribe) {
            realtimeUnsubscribe();
          }

          if (!profileId) {
            authLogger.warn('No profileId for realtime subscription');
            return;
          }

          authLogger.info('Setting up profile subscription...');

          const unsubscribe = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTIONS.usersProfile}.documents.${profileId}`,
            (response) => {
              authLogger.debug('Profile realtime update:', response.events);
              
              if (response.events.some(e => e.includes('.update'))) {
                set({ profile: response.payload });
                authLogger.success('Profile updated via realtime');
              }
            }
          );

          set({ realtimeUnsubscribe: unsubscribe });
          authLogger.success('Profile subscription active');
        } catch (error) {
          authLogger.error('Subscription error:', error);
        }
      },

      unsubscribeFromProfile: () => {
        const { realtimeUnsubscribe } = get();
        if (realtimeUnsubscribe) {
          realtimeUnsubscribe();
          set({ realtimeUnsubscribe: null });
          authLogger.info('Unsubscribed from profile updates');
        }
      },

      // ============================================
      // PASSWORD METHODS
      // ============================================
      
      updatePassword: async (newPassword, currentPassword) => {
        try {
          await account.updatePassword(newPassword, currentPassword);
          authLogger.success('Password updated');
          return { success: true };
        } catch (error) {
          authLogger.error('Password update failed:', error);
          return { success: false, error: getErrorMessage(error) };
        }
      },

      forgotPassword: async (email) => {
        try {
          const resetUrl = `${window.location.origin}/reset-password`;
          await account.createRecovery(email, resetUrl);
          authLogger.success('Password recovery email sent');
          return { success: true };
        } catch (error) {
          authLogger.error('Password recovery failed:', error);
          return { success: false, error: getErrorMessage(error) };
        }
      },

      // ============================================
      // UTILITY METHODS
      // ============================================
      
      isAdmin: () => {
        const { profile } = get();
        return profile?.role === 'admin';
      },

      getAvatarUrl: (width = 200, height = 200) => {
        const { profile } = get();
        return profileService.getAvatarUrl(profile?.avatar, width, height);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'elegance-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
      version: 3,
    }
  )
);

export default useAuthStore;