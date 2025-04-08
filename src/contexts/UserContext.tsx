import { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  updated_at?: string;
  role: 'admin' | 'manager' | 'user';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.message.includes('contains 0 rows')) {
          await createDefaultProfile(userId);
          return;
        }
        return;
      }

      setUserProfile({
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url || '',
        role: data.role,
        updated_at: data.updated_at
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const isFirstUser = async (): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error counting profiles:', error);
        return false;
      }
      
      return count === 0;
    } catch (error) {
      console.error('Error checking if first user:', error);
      return false;
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || '';
      
      const displayName = email.split('@')[0] || 'User';
      
      const firstUser = await isFirstUser();
      console.log('Is first user?', firstUser);
      
      const defaultProfile = {
        id: userId,
        email,
        full_name: displayName,
        avatar_url: '',
        role: firstUser ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating default profile:', error);
        return;
      }
      
      setUserProfile({
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url || '',
        role: data.role,
        updated_at: data.updated_at
      });
      
      console.log('Created default profile for new user:', data);
      
      if (firstUser && data.role === 'admin') {
        console.log('First user created as admin!');
        toast({
          title: "Welcome, Administrator!",
          description: "As the first user, you have been granted administrator privileges.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error creating default profile:', error);
    }
  };

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

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserProfile(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: { fullName?: string; avatarUrl?: string }) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setUserProfile((prevProfile) =>
        prevProfile ? { 
          ...prevProfile, 
          fullName: updates.fullName || prevProfile.fullName,
          avatarUrl: updates.avatarUrl || prevProfile.avatarUrl
        } : null
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

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      try {
        await supabase.auth.admin.deleteUser(user.id);
      } catch (e) {
        console.warn('Could not directly delete user - this may require admin rights');
      }

      setSession(null);
      setUser(null);
      setUserProfile(null);

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
