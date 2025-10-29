/**
 * Storage utility for persistent data management
 * Provides safe access to localStorage with error handling
 */

const STORAGE_PREFIX = 'clippy_';

/**
 * Get item from localStorage
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Clear all app data from localStorage
 */
export const clearStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage', error);
    return false;
  }
};

/**
 * Get storage size in bytes
 */
export const getStorageSize = () => {
  try {
    let total = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        total += key.length + (value?.length || 0);
      }
    });
    return total;
  } catch (error) {
    console.error('Error calculating storage size', error);
    return 0;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Storage keys constants
 */
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ACTIVE_CHARACTER: 'active_character',
  CHAT_HISTORY: 'chat_history',
  USER_PREFERENCES: 'user_preferences',
  WINDOW_POSITIONS: 'window_positions',
  THEME_MODE: 'theme_mode',
  LAST_AI_MODEL: 'last_ai_model',
  DASHBOARD_LAYOUT: 'dashboard_layout'
};

/**
 * Persist Zustand state to localStorage
 */
export const createPersistentStorage = (key) => ({
  getItem: () => getStorageItem(key),
  setItem: (value) => setStorageItem(key, value),
  removeItem: () => removeStorageItem(key)
});

export default {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  getStorageSize,
  isStorageAvailable,
  createPersistentStorage,
  STORAGE_KEYS
};
