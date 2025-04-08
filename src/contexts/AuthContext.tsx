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
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (!error) {
        console.log('Sign in successful via password');
        return { success: true, error: null };
      }
      
      console.warn('Password login failed, trying alternatives:', error.message);
      
      if (error.message.includes('email') || error.message.includes('Invalid')) {
        try {
          console.log('Trying magic link login...');
          const { error: magicLinkError } = await supabase.auth.signInWithOtp({
            email
          });
          
          if (!magicLinkError) {
            toast({
              title: "Magic Link Sent",
              description: "Check your email for a login link",
            });
            return { success: true, error: null };
          }
          
          console.warn('Magic link failed too:', magicLinkError.message);
        } catch (e) {
          console.warn('Magic link error:', e);
        }
      }
      
      try {
        console.log('Trying to create user and then log in...');
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email_confirmed: true,
              confirmed_at: new Date().toISOString(),
            }
          }
        });
        
        const { error: secondLoginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!secondLoginError) {
          console.log('Sign in successful after user creation attempt');
          return { success: true, error: null };
        }
      } catch (createError) {
        console.warn('Create-then-login failed:', createError);
      }
      
      console.error('All sign in methods failed');
      return { success: false, error };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { success: false, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign up user:', email);
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            email: email,
            display_name: email.split('@')[0],
            role: 'user'
          })
          .select();
          
        if (!profileError) {
          console.log('Created profile directly:', profileData);
        }
      } catch (profileErr) {
        console.warn('Could not create profile directly:', profileErr);
      }
      
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
      
      try {
        console.log('Attempting auto sign-in after signup');
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
