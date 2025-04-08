
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        console.log('Initializing auth state...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          console.error('Full error object:', JSON.stringify(error));
          toast({
            title: "Session Error",
            description: `Could not retrieve session: ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session) {
          console.log('User is authenticated:', data.session.user.email);
        } else {
          console.log('No active session found');
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        console.error('Full error object:', JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event);
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email);
      console.log('Using Supabase URL:', (supabase as any).supabaseUrl);
      
      // Add a delay to ensure the request has time to complete
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
        console.error('Full error object:', JSON.stringify(error));
        return { success: false, error };
      }
      
      console.log('Sign in successful');
      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      console.error('Full error object:', JSON.stringify(error));
      return { success: false, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign up user:', email);
      console.log('Using Supabase URL:', (supabase as any).supabaseUrl);
      
      // Auto-confirm email by setting data.email_confirmed: true
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: null,
          data: {
            email_confirmed: true // This tells Supabase to skip email verification
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        console.error('Full error object:', JSON.stringify(error));
        return { success: false, error };
      }
      
      console.log('Sign up successful');
      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      console.error('Full error object:', JSON.stringify(error));
      return { success: false, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      await supabase.auth.signOut();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error during sign out:', error);
      console.error('Full error object:', JSON.stringify(error));
      toast({
        title: "Error",
        description: "Failed to sign out properly",
        variant: "destructive"
      });
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
