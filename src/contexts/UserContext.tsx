
import { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

// Define the types for user profile and context
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  updated_at?: string;
  role: 'admin' | 'manager' | 'user';
  // Add other profile fields here
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { fullName?: string; avatarUrl?: string }) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string, type: 'email') => Promise<void>;
}

// Create the context with a default value of undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }

      setIsLoading(false);
    };

    loadSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (user) {
        setUser(user);
        await fetchUserProfile(user.id);
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      alert(error.error_description || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (user) {
        setUser(user);
        await fetchUserProfile(user.id);
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(error.error_description || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserProfile(null);
      navigate('/login'); // Redirect to login page after signing out using react-router
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (updates: { fullName?: string; avatarUrl?: string }) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Optimistically update the profile in the context
      setUserProfile((prevProfile) =>
        prevProfile ? { ...prevProfile, ...updates } : null
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated successfully!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('No user to delete');

      // First, delete the user's data from the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Then handle user deletion - note that direct user deletion might require admin rights
      // so in a real app you might need a server-side function to do this
      try {
        // This is simplified - in a real app you might need a server endpoint to delete the user
        await supabase.auth.admin.deleteUser(user.id);
      } catch (e) {
        console.warn('Could not directly delete user - this may require admin rights');
      }

      // Clear the session and user data
      setSession(null);
      setUser(null);
      setUserProfile(null);

      // Redirect to the home page or a "account deleted" page
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      alert('Password reset email sent!');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (email: string, token: string, type: 'email') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (error) throw error;

      // Handle the response as needed
      console.log('OTP verification successful:', data);
      alert('OTP verification successful!');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    userProfile,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    changePassword,
    deleteAccount,
    sendPasswordResetEmail,
    verifyOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useProfile = () => {
  const { userProfile, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setIsAdmin(userProfile.role === 'admin');
      setIsManager(userProfile.role === 'manager' || userProfile.role === 'admin');
    }
  }, [userProfile, session]);

  return { profile: userProfile, isAdmin, isManager };
};
