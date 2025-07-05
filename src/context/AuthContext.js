import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getDBConnection, createUser, getUserByEmail, updateUserLoginAttempts, createSession, getSession, invalidateSession, cleanupExpiredSessions } from '../database/database';
import { hashPassword, verifyPassword, createSessionToken, isAccountLocked, shouldLockAccount, calculateLockoutTime, sanitizeInput } from '../utils/security';
import { validateForm } from '../utils/validation';

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
      // Validate input
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedUsername = sanitizeInput(username);
      
      const validation = validateForm({
        email: sanitizedEmail,
        username: sanitizedUsername,
        password,
      });
      
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }
      
      const db = await getDBConnection();
      
      // Hash password
      const { hash: passwordHash } = hashPassword(password);
      
      // Create user
      const userId = await createUser(db, {
        email: sanitizedEmail,
        username: sanitizedUsername,
        passwordHash,
      });
      
      // Create session
      const { token, expiresAt } = createSessionToken(userId);
      await createSession(db, userId, token, expiresAt);
      
      // Store token
      await AsyncStorage.setItem('authToken', token);
      
      const user = {
        id: userId,
        email: sanitizedEmail,
        username: sanitizedUsername,
      };
      
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logIn = async (email, password) => {
    try {
      const sanitizedEmail = sanitizeInput(email);
      
      if (!sanitizedEmail.trim() || !password.trim()) {
        throw new Error('Please enter both email and password');
      }
      
      const db = await getDBConnection();
      
      // Get user by email
      const user = await getUserByEmail(db, sanitizedEmail);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Check if account is locked
      if (isAccountLocked(user)) {
        const lockTime = new Date(user.locked_until);
        const remainingTime = Math.ceil((lockTime - new Date()) / 1000 / 60);
        throw new Error(`Account is locked. Try again in ${remainingTime} minutes.`);
      }
      
      // Verify password
      const isValidPassword = verifyPassword(password, user.password_hash, user.password_salt || '');
      
      if (!isValidPassword) {
        // Increment login attempts
        const newAttempts = (user.login_attempts || 0) + 1;
        let lockedUntil = null;
        
        if (shouldLockAccount(newAttempts)) {
          lockedUntil = calculateLockoutTime();
        }
        
        await updateUserLoginAttempts(db, user.user_id, newAttempts, lockedUntil);
        
        if (shouldLockAccount(newAttempts)) {
          throw new Error('Too many failed attempts. Account locked for 15 minutes.');
        } else {
          const remainingAttempts = 5 - newAttempts;
          throw new Error(`Invalid email or password. ${remainingAttempts} attempts remaining.`);
        }
      }
      
      // Reset login attempts on successful login
      await updateUserLoginAttempts(db, user.user_id, 0, null);
      
      // Create session
      const { token, expiresAt } = createSessionToken(user.user_id);
      await createSession(db, user.user_id, token, expiresAt);
      
      // Store token
      await AsyncStorage.setItem('authToken', token);
      
      const userData = {
        id: user.user_id,
        email: user.email,
        username: user.username,
      };
      
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
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