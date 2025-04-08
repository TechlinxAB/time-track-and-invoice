
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserProfile, UserRole } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const [loadError, setLoadError] = useState<string | null>(null);

  // Function to derive display name from email
  const deriveDisplayNameFromEmail = (email: string): string => {
    try {
      console.log("Deriving display name from:", email);
      const emailPrefix = email.split('@')[0]; // Get the part before @
      
      // Handle cases with dots or underscores
      let nameParts: string[] = [];
      if (emailPrefix.includes('.')) {
        nameParts = emailPrefix.split('.');
      } else if (emailPrefix.includes('_')) {
        nameParts = emailPrefix.split('_');
      } else if (emailPrefix.includes('-')) {
        nameParts = emailPrefix.split('-');
      } else {
        // If no separator, treat as a single name
        nameParts = [emailPrefix];
      }
      
      // Capitalize first letter of each part and join with space
      const displayName = nameParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
      
      console.log("Generated display name:", displayName);
      return displayName;
    } catch (error) {
      console.error("Error deriving name from email:", error);
      return "User"; // Fallback
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      console.log("Starting profile load...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Failed to load session");
        setLoadError("Session error: " + sessionError.message);
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
        setLoadError("User data error: " + (userError?.message || "Unknown error"));
        setIsLoading(false);
        return;
      }

      console.log("User found, checking profile...");
      console.log("User ID:", userData.user.id);
      console.log("User email:", userData.user.email);
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          console.error("Profile error code:", profileError.code);
          console.error("Profile error message:", profileError.message);
          
          if (profileError.code === 'PGRST116') {
            console.log("Profile not found, creating default profile...");
            const displayName = deriveDisplayNameFromEmail(userData.user.email || '');
            
            const defaultProfile: Partial<UserProfile> = {
              id: userData.user.id,
              email: userData.user.email || '',
              displayName: displayName,
              role: 'user',
            };
            
            console.log("Creating profile with data:", defaultProfile);
            
            const { error: createError } = await supabase
              .from('profiles')
              .insert(defaultProfile);
              
            if (createError) {
              console.error("Error creating profile:", createError);
              console.error("Create error details:", JSON.stringify(createError));
              toast.error("Failed to create user profile");
              setLoadError("Failed to create profile: " + createError.message);
            } else {
              console.log("Default profile created successfully");
              setUser(defaultProfile as UserProfile);
              setRole(defaultProfile.role || 'user');
              toast.success("Created default profile");
            }
          } else {
            setLoadError("Failed to load profile: " + profileError.message);
            toast.error("Failed to load profile");
          }
        } else if (profileData) {
          console.log("Profile loaded successfully:", profileData);
          setUser(profileData as UserProfile);
          setRole(profileData.role || 'user');
        }
      } catch (error) {
        console.error("Error in profile loading process:", error);
        setLoadError("Unexpected error loading profile");
        toast.error("Unexpected error loading profile");
      }
    } catch (error) {
      console.error("Load profile error:", error);
      setLoadError("An unexpected error occurred");
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
        return true; // All roles can create time entries
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

  // Handle loading state with single Back to Login button
  const LoadingScreen = () => {
    const navigate = useNavigate();
    
    const handleGoToLogin = async () => {
      console.log("Signing out and clearing session data...");
      
      // Clear any stored data
      try {
        // Sign out from Supabase
        await supabase.auth.signOut({ scope: 'local' });
        
        // Clear any API key settings from localStorage
        localStorage.removeItem('supabase_anon_key');
        
        // Keep the reverse proxy settings
        
        // Clear any other auth-related items that might be in localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth') || key.includes('supabase') || key.includes('session'))) {
            if (key !== 'use_reverse_proxy' && key !== 'reverse_proxy_path') {
              keysToRemove.push(key);
            }
          }
        }
        
        // Remove the collected keys
        keysToRemove.forEach(key => {
          console.log(`Removing localStorage item: ${key}`);
          localStorage.removeItem(key);
        });
        
        toast.success("Signed out successfully");
      } catch (error) {
        console.error("Error during sign out:", error);
      }
      
      // Navigate to login page
      navigate('/login');
    };
    
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-bold text-success mb-2">TimeTracker</h1>
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
          
          {loadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <p className="font-semibold">Error loading profile:</p>
              <p>{loadError}</p>
            </div>
          )}
          
          <div className="mt-6">
            <Button 
              onClick={handleGoToLogin} 
              className="w-full"
              variant="default"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
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
