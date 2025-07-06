import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDBConnection, createUser, getUserByEmail, updateUserLoginAttempts, createSession, getSession, invalidateSession, cleanupExpiredSessions } from '../database/database';
import { hashPassword, verifyPassword, createSessionToken, isAccountLocked, shouldLockAccount, calculateLockoutTime, sanitizeInput } from '../utils/security';
import { validateForm } from '../utils/validation';
import { auth } from '../utils/firebase';

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
  const [token, setToken] = useState(null);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      
      if (storedToken) {
        const db = await getDBConnection();
        const session = await getSession(db, storedToken);
        
        if (session && session.is_active) {
          setToken(storedToken);
          setUser({
            id: session.user_id,
            email: session.email,
            username: session.username,
          });
          setIsAuthenticated(true);
        } else {
          // Invalid or expired session, clear storage
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
      }
      
      // Cleanup expired sessions
      const db = await getDBConnection();
      await cleanupExpiredSessions(db);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email, password, username) => {
    try {
      // Firebase Auth sign up
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      // Optionally update display name
      if (user && username) {
        await user.updateProfile({ displayName: username });
      }
      setUser({
        id: user.uid,
        email: user.email,
        username: user.displayName || username || '',
      });
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logIn = async (email, password) => {
    try {
      // Firebase Auth login
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      setUser({
        id: user.uid,
        email: user.email,
        username: user.displayName || '',
      });
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      // Invalidate session in database
      if (token) {
        const db = await getDBConnection();
        await invalidateSession(db, token);
      }
      
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Reset state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    token,
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