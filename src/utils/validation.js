// Validation utility for form inputs
export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  PASSWORD: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  },
  USERNAME: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
  }
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!VALIDATION_RULES.EMAIL.pattern.test(email)) {
    return { isValid: false, message: VALIDATION_RULES.EMAIL.message };
  }
  
  return { isValid: true, message: '' };
};

export const validatePassword = (password) => {
  if (!password || !password.trim()) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD.minLength) {
    return { isValid: false, message: `Password must be at least ${VALIDATION_RULES.PASSWORD.minLength} characters` };
  }
  
  if (VALIDATION_RULES.PASSWORD.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (VALIDATION_RULES.PASSWORD.requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (VALIDATION_RULES.PASSWORD.requireNumbers && !/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (VALIDATION_RULES.PASSWORD.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: '' };
};

export const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return { isValid: false, message: 'Username is required' };
  }
  
  if (username.length < VALIDATION_RULES.USERNAME.minLength) {
    return { isValid: false, message: `Username must be at least ${VALIDATION_RULES.USERNAME.minLength} characters` };
  }
  
  if (username.length > VALIDATION_RULES.USERNAME.maxLength) {
    return { isValid: false, message: `Username must be no more than ${VALIDATION_RULES.USERNAME.maxLength} characters` };
  }
  
  if (!VALIDATION_RULES.USERNAME.pattern.test(username)) {
    return { isValid: false, message: VALIDATION_RULES.USERNAME.message };
  }
  
  return { isValid: true, message: '' };
};

export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword || !confirmPassword.trim()) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  
  return { isValid: true, message: '' };
};

export const validateForm = (formData) => {
  const errors = {};
  
  // Email validation
  if (formData.email) {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
  }
  
  // Username validation
  if (formData.username) {
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message;
    }
  }
  
  // Password validation
  if (formData.password) {
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
  }
  
  // Password confirmation validation
  if (formData.password && formData.confirmPassword) {
    const confirmValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword);
    if (!confirmValidation.isValid) {
      errors.confirmPassword = confirmValidation.message;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 