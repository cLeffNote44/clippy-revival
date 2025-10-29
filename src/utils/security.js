/**
 * Input sanitization and validation utilities
 * Provides functions to clean and validate user input to prevent XSS and injection attacks
 */

/**
 * HTML Entity Map for escaping
 */
const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return text;
  }

  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char]);
}

/**
 * Sanitize user input by removing potentially dangerous content
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') {
    return input;
  }

  const {
    allowNewlines = true,
    allowTabs = false,
    maxLength = null,
    trim = true
  } = options;

  let sanitized = input;

  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove control characters except newlines and tabs if allowed
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\n\r]/g, ' ');
  }

  // Remove tabs if not allowed
  if (!allowTabs) {
    sanitized = sanitized.replace(/\t/g, ' ');
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {boolean} - True if valid URL format
 */
export function isValidUrl(url, options = {}) {
  if (typeof url !== 'string') {
    return false;
  }

  const {
    allowedProtocols = ['http', 'https'],
    allowLocalhost = true
  } = options;

  try {
    const parsed = new URL(url);

    // Check protocol
    const protocol = parsed.protocol.slice(0, -1); // Remove trailing ':'
    if (!allowedProtocols.includes(protocol)) {
      return false;
    }

    // Check localhost if not allowed
    if (!allowLocalhost && (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1'
    )) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate file path to prevent directory traversal
 * @param {string} filepath - File path to validate
 * @returns {boolean} - True if safe path
 */
export function isValidFilePath(filepath) {
  if (typeof filepath !== 'string') {
    return false;
  }

  // Check for directory traversal attempts
  if (filepath.includes('..') || filepath.includes('~')) {
    return false;
  }

  // Check for absolute paths (should use relative paths only)
  if (filepath.startsWith('/') || /^[a-zA-Z]:/.test(filepath)) {
    return false;
  }

  // Check for null bytes
  if (filepath.includes('\0')) {
    return false;
  }

  return true;
}

/**
 * Sanitize filename to remove unsafe characters
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return '';
  }

  // Remove or replace unsafe characters
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .substring(0, 255); // Limit length
}

/**
 * Validate number within range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if valid number in range
 */
export function isValidNumber(value, min = -Infinity, max = Infinity) {
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return false;
  }

  return num >= min && num <= max;
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if valid length
 */
export function isValidLength(value, minLength = 0, maxLength = Infinity) {
  if (typeof value !== 'string') {
    return false;
  }

  return value.length >= minLength && value.length <= maxLength;
}

/**
 * Validate enum value
 * @param {any} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} - True if value is in allowed list
 */
export function isValidEnum(value, allowedValues) {
  return allowedValues.includes(value);
}

/**
 * Sanitize JSON to prevent prototype pollution
 * @param {any} obj - Object to sanitize
 * @returns {any} - Sanitized object
 */
export function sanitizeJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Check for dangerous keys
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJson(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (dangerousKeys.includes(key)) {
      continue; // Skip dangerous keys
    }

    sanitized[key] = sanitizeJson(value);
  }

  return sanitized;
}

/**
 * Validate and sanitize chat message
 * @param {string} message - Chat message to validate
 * @returns {Object} - Validation result with sanitized message
 */
export function validateChatMessage(message) {
  if (typeof message !== 'string') {
    return {
      valid: false,
      error: 'Message must be a string',
      sanitized: ''
    };
  }

  // Check minimum length
  if (message.trim().length === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty',
      sanitized: ''
    };
  }

  // Check maximum length
  const maxLength = 4000;
  if (message.length > maxLength) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${maxLength} characters`,
      sanitized: message.substring(0, maxLength)
    };
  }

  // Sanitize input
  const sanitized = sanitizeInput(message, {
    allowNewlines: true,
    allowTabs: false,
    trim: true
  });

  return {
    valid: true,
    error: null,
    sanitized
  };
}

/**
 * Rate limiter class
 * Tracks and limits the rate of operations per time window
 */
export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  /**
   * Check if operation is allowed
   * @param {string} key - Unique identifier for the operation
   * @returns {boolean} - True if allowed, false if rate limit exceeded
   */
  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Get remaining requests for a key
   * @param {string} key - Key to check
   * @returns {number} - Number of remaining requests
   */
  getRemaining(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export default {
  escapeHtml,
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  isValidFilePath,
  sanitizeFilename,
  isValidNumber,
  isValidLength,
  isValidEnum,
  sanitizeJson,
  validateChatMessage,
  RateLimiter
};
