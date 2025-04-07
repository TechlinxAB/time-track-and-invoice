
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

// Define user roles
export type UserRole = 'admin' | 'manager' | 'user';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface UserContextType {
  profile: UserProfile | null;
  isProfileLoading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  hasPermission: (action: string) => boolean;
  updateSettings: (settings: Partial<UserProfile['settings']>) => Promise<boolean>;
}

const defaultUserContext: UserContextType = {
  profile: null,
  isProfileLoading: true,
  updateProfile: async () => false,
  hasPermission: () => false,
  updateSettings: async () => false,
};

const UserContext = createContext<UserContextType>(defaultUserContext);

// Role-based permissions
const permissions = {
  admin: [
    'manage_users',
    'manage_settings',
    'manage_clients',
    'manage_activities',
    'manage_products',
    'manage_invoices',
    'track_time',
    'delete_data',
  ],
  manager: [
    'manage_clients',
    'manage_activities',
    'manage_products',
    'manage_invoices',
    'track_time',
  ],
  user: ['track_time'],
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      try {
        setIsProfileLoading(true);
        
        // First check if a profile exists in the 'profiles' table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          toast({
            title: "Profile Error",
            description: "Failed to load your profile",
            variant: "destructive"
          });
        }

        if (data) {
          // Profile exists
          setProfile({
            id: user.id,
            email: user.email || '',
            displayName: data.display_name || user.email?.split('@')[0] || 'User',
            role: data.role || 'user',
            avatar: data.avatar_url,
            settings: data.settings || {},
          });
        } else {
          // No profile yet, create default one
          const newProfile = {
            id: user.id,
            email: user.email || '',
            displayName: user.email?.split('@')[0] || 'User',
            role: 'user' as UserRole,
          };
          
          // For demo purposes, if this is the first user, make them admin
          if (user.email === 'admin@example.com') {
            newProfile.role = 'admin';
          }
          
          setProfile(newProfile);
          
          // Create the profile in the database (ignore errors for now if table doesn't exist)
          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              display_name: newProfile.displayName,
              role: newProfile.role,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.log('Could not create profile, likely profiles table doesn\'t exist yet');
          }
        }
      } catch (err) {
        console.error('Unexpected error loading profile:', err);
      } finally {
        setIsProfileLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      // Convert profile data to database format
      const dbData: any = {};
      
      if (data.displayName) dbData.display_name = data.displayName;
      if (data.role) dbData.role = data.role;
      if (data.avatar) dbData.avatar_url = data.avatar;
      if (data.settings) dbData.settings = { ...profile.settings, ...data.settings };
      
      dbData.updated_at = new Date().toISOString();

      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...dbData });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Update local state
      setProfile({
        ...profile,
        ...data,
        settings: data.settings ? { ...profile.settings, ...data.settings } : profile.settings
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  // Update user settings
  const updateSettings = async (settings: Partial<UserProfile['settings']>): Promise<boolean> => {
    return updateProfile({ settings: { ...profile?.settings, ...settings } });
  };

  // Check if user has permission for an action
  const hasPermission = (action: string): boolean => {
    if (!profile) return false;
    
    const rolePermissions = permissions[profile.role] || [];
    return rolePermissions.includes(action);
  };

  const contextValue = {
    profile,
    isProfileLoading,
    updateProfile,
    hasPermission,
    updateSettings,
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
