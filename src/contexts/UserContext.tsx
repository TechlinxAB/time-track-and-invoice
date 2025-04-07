
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'manager' | 'user';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

interface ProfileWithPermissions {
  profile: UserProfile | null;
  isLoading: boolean;
  roles: { [key: string]: boolean };
  canAccessRoute: (route: string) => boolean;
  canPerformAction: (action: string) => boolean;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

interface UserProviderProps {
  children: ReactNode;
}

// Create context
const UserContext = createContext<ProfileWithPermissions | undefined>(undefined);

// Define a provider
export const UserProvider = ({ children }: UserProviderProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role-based permissions
  const roles = {
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'admin' || profile?.role === 'manager',
    isUser: !!profile,
  };

  // Route access control
  const canAccessRoute = (route: string): boolean => {
    // Admin can access everything
    if (roles.isAdmin) return true;
    
    // Route-specific permissions
    switch (route) {
      case '/settings/admin':
        return roles.isAdmin;
      case '/invoicing':
      case '/clients':
      case '/activities': 
        return roles.isManager;
      case '/time-tracking':
      case '/dashboard':
      case '/account':
        return roles.isUser;
      default:
        return roles.isUser;
    }
  };

  // Action permissions
  const canPerformAction = (action: string): boolean => {
    // Admin can do everything
    if (roles.isAdmin) return true;
    
    // Action-specific permissions
    switch (action) {
      case 'exportInvoice':
      case 'createClient':
      case 'createActivity':
        return roles.isManager;
      case 'createTimeEntry':
      case 'editTimeEntry':
        return roles.isUser;
      default:
        return false;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) {
      toast.error("You must be logged in to update profile");
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success("Profile updated successfully");
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Profile update failed");
      return false;
    }
  };

  // Function to refresh user profile
  const refreshUserProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setProfile(null);
        console.error('Error getting user:', userError);
        return;
      }

      // Get user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: "destructive",
          title: "Profile error",
          description: "Failed to load profile data"
        });
        return;
      }

      if (data) {
        // Transform the data to match our UserProfile type
        setProfile({
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          role: data.role || 'user',
          avatar: data.avatar_url,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      } else {
        // If no profile exists, create one
        const newProfile = {
          id: user.id,
          email: user.email || '',
          display_name: user.email?.split('@')[0] || 'User',
          role: 'user',
          avatar_url: null,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast({
            variant: "destructive",
            title: "Profile error",
            description: "Failed to create profile"
          });
          return;
        }

        // Set the new profile in state
        setProfile({
          id: newProfile.id,
          email: newProfile.email,
          displayName: newProfile.display_name,
          role: 'user',
          avatar: null,
          createdAt: newProfile.created_at,
        });
      }
    } catch (error) {
      console.error('Unexpected error getting profile:', error);
      toast({
        variant: "destructive",
        title: "Profile error",
        description: "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile on mount and auth changes
  useEffect(() => {
    const loadProfile = async () => {
      await refreshUserProfile();
    };

    loadProfile();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await refreshUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        profile, 
        isLoading, 
        roles, 
        canAccessRoute, 
        canPerformAction, 
        refreshUserProfile,
        updateUserProfile
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
