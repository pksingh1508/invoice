import { supabase } from '@/lib/supabase/client';
import { supabaseServer } from '@/lib/supabase/server';
import { 
  UserProfile, 
  CreateUserProfile, 
  UpdateUserProfile, 
  ApiResponse
} from '@/types/database';
import { handleSupabaseError } from '@/lib/utils/errors';

// Client-side functions (for use in components)
export const profileQueries = {
  // Get current user's profile
  async getCurrentProfile(): Promise<ApiResponse<UserProfile>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // If profile doesn't exist, return a default structure
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: user.id,
            business_name: '',
            business_email: user.email || '',
            business_phone: '',
            business_address: '',
            logo_url: '',
            default_currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserProfile
        };
      }
      
      return {
        error: handleSupabaseError(error, 'fetching user profile')
      };
    }

    return { data };
  },

  // Create or update user profile
  async upsertProfile(profileData: CreateUserProfile | UpdateUserProfile): Promise<ApiResponse<UserProfile>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        error: 'User not authenticated'
      };
    }

    const dataToUpsert = {
      id: user.id,
      ...profileData
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(dataToUpsert)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'updating user profile')
      };
    }

    return { 
      data,
      message: 'Profile updated successfully'
    };
  },

  // Update specific profile fields
  async updateProfile(updates: UpdateUserProfile): Promise<ApiResponse<UserProfile>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'updating user profile')
      };
    }

    return { 
      data,
      message: 'Profile updated successfully'
    };
  },

  // Upload and update profile logo
  async uploadLogo(file: File): Promise<ApiResponse<{ url: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        error: 'User not authenticated'
      };
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return {
        error: `Failed to upload logo: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-assets')
      .getPublicUrl(filePath);

    // Update profile with new logo URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ logo_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      return {
        error: handleSupabaseError(updateError, 'updating profile logo')
      };
    }

    return {
      data: { url: publicUrl },
      message: 'Logo uploaded successfully'
    };
  },

  // Delete profile logo
  async deleteLogo(): Promise<ApiResponse<void>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        error: 'User not authenticated'
      };
    }

    // Get current profile to find logo path
    const profileResult = await this.getCurrentProfile();
    
    if (!profileResult.data?.logo_url) {
      return {
        message: 'No logo to delete'
      };
    }

    // Extract file path from URL
    const url = new URL(profileResult.data.logo_url);
    const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last two parts (bucket/filename)

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('profile-assets')
      .remove([filePath]);

    if (deleteError) {
      return {
        error: `Failed to delete logo: ${deleteError.message}`
      };
    }

    // Update profile to remove logo URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ logo_url: null })
      .eq('id', user.id);

    if (updateError) {
      return {
        error: handleSupabaseError(updateError, 'updating profile')
      };
    }

    return {
      message: 'Logo deleted successfully'
    };
  }
};

// Server-side functions (for use in API routes)
export const profileServerQueries = {
  // Get user profile by ID (for server-side operations)
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    const { data, error } = await supabaseServer
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          error: 'Profile not found'
        };
      }
      
      return {
        error: handleSupabaseError(error, 'fetching user profile')
      };
    }

    return { data };
  },

  // Create initial profile for new user
  async createInitialProfile(userData: CreateUserProfile): Promise<ApiResponse<UserProfile>> {
    const { data, error } = await supabaseServer
      .from('user_profiles')
      .insert(userData)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'creating initial profile')
      };
    }

    return { 
      data,
      message: 'Initial profile created successfully'
    };
  },

  // Update profile (server-side)
  async updateProfileById(userId: string, updates: UpdateUserProfile): Promise<ApiResponse<UserProfile>> {
    const { data, error } = await supabaseServer
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'updating profile')
      };
    }

    return { 
      data,
      message: 'Profile updated successfully'
    };
  },

  // Check if user has completed profile setup
  async checkProfileSetup(userId: string): Promise<ApiResponse<{ is_setup_complete: boolean }>> {
    const { data, error } = await supabaseServer
      .from('user_profiles')
      .select('business_name, business_email')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          data: { is_setup_complete: false }
        };
      }
      
      return {
        error: handleSupabaseError(error, 'checking profile setup')
      };
    }

    const isComplete = !!(data.business_name && data.business_email);

    return {
      data: { is_setup_complete: isComplete }
    };
  }
};

export default profileQueries;