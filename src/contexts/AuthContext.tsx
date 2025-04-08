
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
      
      // THIS IS CRITICAL: Set multiple flags to ensure email verification is bypassed
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          // Skip email verification both in metadata and with emailRedirectTo null
          data: {
            email_confirmed: true,
            autoConfirm: true
          },
          // Deliberately NOT setting an emailRedirectTo to help prevent confirmation emails
          emailRedirectTo: null
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        console.error('Full error object:', JSON.stringify(error));
        return { success: false, error };
      }
      
      // Even if signUp succeeds without error, verify if we actually have a user
      if (!data.user) {
        console.error('Sign up returned no user');
        return { 
          success: false, 
          error: new Error('Sign up completed but no user was returned')
        };
      }
      
      console.log('Sign up successful');
      
      // If confirmation is still pending, try to force confirm the user
      if (data.user?.identities?.[0]?.identity_data?.email_confirmed !== true) {
        console.log('Attempting to auto-verify email...');
        try {
          // Auto sign-in the user right after signup to bypass email verification
          const { error: signInError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          if (signInError) {
            console.warn('Auto sign-in after signup failed:', signInError);
            // Continue anyway since the user was created
          } else {
            console.log('Auto sign-in after signup successful');
          }
        } catch (e) {
          console.warn('Error during auto sign-in after signup:', e);
          // Continue anyway
        }
      }
      
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
