import crypto from 'crypto-js';

// Security configuration
export const SECURITY_CONFIG = {
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  PASSWORD_SALT_ROUNDS: 10,
  TOKEN_LENGTH: 32,
  RESET_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Password hashing using SHA-256 with salt
export const hashPassword = (password, salt = null) => {
  const saltToUse = salt || crypto.lib.WordArray.random(128/8).toString();
  const hash = crypto.SHA256(password + saltToUse).toString();
  return { hash, salt: saltToUse };
};

export const verifyPassword = (password, hash, salt) => {
  const computedHash = crypto.SHA256(password + salt).toString();
  return computedHash === hash;
};

// Token generation
export const generateToken = () => {
  return crypto.lib.WordArray.random(SECURITY_CONFIG.TOKEN_LENGTH).toString();
};

export const generateResetToken = () => {
  return crypto.lib.WordArray.random(32).toString();
};

// Session management
export const createSessionToken = (userId) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SECURITY_CONFIG.SESSION_DURATION);
  return { token, expiresAt: expiresAt.toISOString() };
};

// Rate limiting utilities
export const isAccountLocked = (user) => {
  if (!user.locked_until) return false;
  
  const lockTime = new Date(user.locked_until);
  const now = new Date();
  
  if (now < lockTime) {
    return true;
  }
  
  return false;
};

export const shouldLockAccount = (loginAttempts) => {
  return loginAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
};

export const calculateLockoutTime = () => {
  return new Date(Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION).toISOString();
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};

// Email validation (additional security layer)
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  if (passedChecks === 5) return 'strong';
  if (passedChecks >= 4) return 'good';
  if (passedChecks >= 3) return 'fair';
  return 'weak';
};

// Session validation
export const isSessionValid = (session) => {
  if (!session || !session.expires_at) return false;
  
  const expiryTime = new Date(session.expires_at);
  const now = new Date();
  
  return now < expiryTime && session.is_active;
};

// Token expiration check
export const isTokenExpired = (expiryTime) => {
  const expiry = new Date(expiryTime);
  const now = new Date();
  return now >= expiry;
};

// Secure random string generation
export const generateSecureString = (length = 16) => {
  return crypto.lib.WordArray.random(length).toString();
};

// Data encryption (for sensitive data)
export const encryptData = (data, key) => {
  return crypto.AES.encrypt(JSON.stringify(data), key).toString();
};

export const decryptData = (encryptedData, key) => {
  try {
    const bytes = crypto.AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(crypto.enc.Utf8));
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}; 