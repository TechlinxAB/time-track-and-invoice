
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserProfile, UserRole } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface UserContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [isLoading, setIsLoading] = useState(true);

  // Function to derive display name from email
  const deriveDisplayNameFromEmail = (email: string): string => {
    try {
      const emailParts = email.split('@')[0]; // Get the part before @
      const nameParts = emailParts.split('.'); // Split by dots
      
      // Capitalize first letter of each part and join with space
      return nameParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    } catch (error) {
      console.error("Error deriving name from email:", error);
      return "User"; // Fallback
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      console.log("Starting profile load...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Failed to load session");
        setIsLoading(false);
        return;
      }

      if (!sessionData.session) {
        console.log("No active session found");
        setUser(null);
        setRole("user");
        setIsLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error("User error:", userError);
        toast.error("Failed to load user data");
        setIsLoading(false);
        return;
      }

      console.log("User found, checking profile...");
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        
        if (profileError.code === 'PGRST116') {
          console.log("Profile not found, creating default profile...");
          const displayName = deriveDisplayNameFromEmail(userData.user.email || '');
          
          const defaultProfile: Partial<UserProfile> = {
            id: userData.user.id,
            email: userData.user.email || '',
            displayName: displayName,
            role: 'user',
          };
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert(defaultProfile);
            
          if (createError) {
            console.error("Error creating profile:", createError);
            toast.error("Failed to create user profile");
          } else {
            console.log("Default profile created successfully");
            setUser(defaultProfile as UserProfile);
            setRole(defaultProfile.role || 'user');
            toast.success("Created default profile");
          }
        } else {
          toast.error("Failed to load profile");
        }
      } else if (profileData) {
        console.log("Profile loaded successfully:", profileData);
        setUser(profileData as UserProfile);
        setRole(profileData.role || 'user');
      }
    } catch (error) {
      console.error("Load profile error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session || !user) {
        toast.error("You must be logged in to update your profile");
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id);
        
      if (error) {
        console.error("Update profile error:", error);
        toast.error("Failed to update profile");
        return;
      }
      
      setUser(prev => prev ? { ...prev, ...profile } : null);
      if (profile.role) setRole(profile.role);
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (role === 'admin') return true;
    
    switch (permission) {
      case 'manage_clients':
        return ['admin', 'manager'].includes(role);
      case 'create_time_entries':
        return ['admin', 'manager', 'user'].includes(role);
      case 'view_reports':
        return ['admin', 'manager'].includes(role);
      case 'manage_invoices':
        return ['admin', 'manager'].includes(role);
      case 'manage_activities':
        return ['admin', 'manager'].includes(role);
      case 'manage_users':
        return role === 'admin';
      case 'manage_settings':
        return role === 'admin';
      default:
        return false;
    }
  };

  useEffect(() => {
    loadProfile();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("Auth state change:", event);
      if (event === 'SIGNED_IN') {
        await loadProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole('user');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        isLoading,
        loadProfile,
        updateProfile,
        hasPermission
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
