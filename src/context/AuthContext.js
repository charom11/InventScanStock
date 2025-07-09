import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signUpWithEmail, signInWithEmail, signOut } from '../utils/auth';
import { supabase } from '../utils/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || '',
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || '',
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email, password, username) => {
    try {
      // Supabase Auth sign up
      const { user, error } = await signUpWithEmail(email, password);
      if (error) throw error;
      // Optionally update user metadata with username
      if (user && username) {
        await supabase.auth.updateUser({ data: { username } });
      }
      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logIn = async (email, password) => {
    try {
      // Supabase Auth login
      const { user, error } = await signInWithEmail(email, password);
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    signUp,
    logIn,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 