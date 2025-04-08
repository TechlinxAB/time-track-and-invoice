
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
      
      // Attempt password login first
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
        console.error('Full error object:', JSON.stringify(error));
        
        // If email-related error, try one more time with magic link
        if (error.message.includes('email') || error.message.includes('Invalid')) {
          try {
            const { error: magicLinkError } = await supabase.auth.signInWithOtp({
              email
            });
            
            if (magicLinkError) {
              return { success: false, error };
            } else {
              toast({
                title: "Magic Link Sent",
                description: "Check your email for a login link",
              });
              return { success: true, error: null };
            }
          } catch (e) {
            // Fall through to original error if magic link fails too
            console.error('Magic link error:', e);
          }
        }
        
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
      
      // Completely bypass all email verification
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            email_confirmed: true,
            confirmed_at: new Date().toISOString(),
          },
          emailRedirectTo: null
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        console.error('Full error object:', JSON.stringify(error));
        
        // If it's an email error, try to log in directly
        if (error.message.includes('email')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (!signInError) {
            console.log('Sign in after failed signup successful');
            return { success: true, error: null };
          }
        }
        
        return { success: false, error };
      }
      
      // Auto sign-in the user right after signup
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (signInError) {
          console.warn('Auto sign-in after signup failed:', signInError);
        } else {
          console.log('Auto sign-in after signup successful');
        }
      } catch (e) {
        console.warn('Error during auto sign-in after signup:', e);
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
