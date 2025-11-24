import type { AuthError, Session } from '@supabase/supabase-js'; // Type-only imports
import type { ReactNode } from 'react'; // Type-only import
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Define types for our auth operations
interface SignUpCredentials {
  email: string;
  password: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError | null;
}

// Define the shape of our context value
interface AuthContextType {
  session: Session | null | undefined;
  signUpNewUser: (credentials: SignUpCredentials) => Promise<AuthResponse>;
  signInUser: (credentials: SignInCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

// Create context with type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the provider
interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const signUpNewUser = async ({
    email,
    password,
  }: SignUpCredentials): Promise<AuthResponse> => {
    console.log(email, password);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.log('problem signing up');
      return { success: false, error };
    }
    return { success: true, data };
  };

  const signInUser = async ({
    email,
    password,
  }: SignInCredentials): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        console.error('sign in error ', error);
        return { success: false, error: error };
      }
      console.log('sign-in success: ', data);
      return { success: true, data };
    } catch (error) {
      console.log('an error occurred: ', error);
      return { success: false, error: error as AuthError };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('there was an error: ', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, signUpNewUser, signInUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('UserAuth must be used within an AuthContextProvider');
  }
  return context;
};
