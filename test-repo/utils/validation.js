/**
 * Validation utilities
 * Common validation functions for data validation
 */

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Supports formats: +1234567890, (123) 456-7890, 123-456-7890
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength level
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, strength: 'none', message: 'Password is required' };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { 
      valid: false, 
      strength: 'weak', 
      message: `Password must be at least ${minLength} characters` 
    };
  }

  let strength = 'weak';
  let score = 0;

  if (password.length >= minLength) score++;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChar) score++;

  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    valid: score >= 3,
    strength,
    message: score >= 3 ? 'Password is valid' : 'Password should include uppercase, lowercase, numbers, and special characters'
  };
}

/**
 * Validate credit card number using Luhn algorithm
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} Is valid card number
 */
function isValidCreditCard(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }

  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Is valid date
 */
function isValidDate(dateString) {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate required fields in object
 * @param {Object} data - Data to validate
 * @param {Array<string>} requiredFields - Required field names
 * @returns {Object} Validation result
 */
function validateRequiredFields(data, requiredFields) {
  const missing = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : 'All required fields present'
  };
}

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Is in range
 */
function isInRange(value, min, max) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return false;
  }

  return num >= min && num <= max;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  validatePassword,
  isValidCreditCard,
  isValidDate,
  validateRequiredFields,
  sanitizeString,
  isInRange
};
