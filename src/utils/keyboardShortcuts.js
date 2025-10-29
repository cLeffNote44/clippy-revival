/**
 * Keyboard shortcuts manager for the application
 */

const shortcuts = new Map();
let isEnabled = true;

/**
 * Keyboard shortcut configuration
 */
export const SHORTCUTS = {
  // Navigation
  SHOW_DASHBOARD: { key: 'd', ctrl: true, description: 'Show Dashboard' },
  SHOW_BUDDY: { key: 'b', ctrl: true, description: 'Toggle Buddy Window' },
  SHOW_SETTINGS: { key: ',', ctrl: true, description: 'Open Settings' },

  // Actions
  SEND_MESSAGE: { key: 'Enter', ctrl: true, description: 'Send Chat Message' },
  CLOSE_WINDOW: { key: 'Escape', description: 'Close Window/Dialog' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh Data' },

  // Search
  SEARCH: { key: 'f', ctrl: true, description: 'Search/Focus Search' },

  // Help
  SHOW_HELP: { key: 'h', ctrl: true, shift: true, description: 'Show Help' }
};

/**
 * Check if a keyboard event matches a shortcut
 */
const matchesShortcut = (event, shortcut) => {
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = shortcut.alt ? event.altKey : !event.altKey;

  return keyMatch && ctrlMatch && shiftMatch && altMatch;
};

/**
 * Register a keyboard shortcut
 */
export const registerShortcut = (name, callback) => {
  const shortcut = SHORTCUTS[name];
  if (!shortcut) {
    console.warn(`Unknown shortcut: ${name}`);
    return;
  }

  shortcuts.set(name, { ...shortcut, callback });
};

/**
 * Unregister a keyboard shortcut
 */
export const unregisterShortcut = (name) => {
  shortcuts.delete(name);
};

/**
 * Handle keyboard event
 */
const handleKeyDown = (event) => {
  if (!isEnabled) return;

  // Don't trigger shortcuts when typing in inputs
  const tagName = event.target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') {
    // Allow Escape to blur inputs
    if (event.key === 'Escape') {
      event.target.blur();
    }
    return;
  }

  // Check each registered shortcut
  shortcuts.forEach(({ callback, ...shortcut }, name) => {
    if (matchesShortcut(event, shortcut)) {
      event.preventDefault();
      event.stopPropagation();
      callback(event);
    }
  });
};

/**
 * Initialize keyboard shortcuts
 */
export const initKeyboardShortcuts = () => {
  document.addEventListener('keydown', handleKeyDown);
};

/**
 * Cleanup keyboard shortcuts
 */
export const cleanupKeyboardShortcuts = () => {
  document.removeEventListener('keydown', handleKeyDown);
  shortcuts.clear();
};

/**
 * Enable/disable keyboard shortcuts
 */
export const setShortcutsEnabled = (enabled) => {
  isEnabled = enabled;
};

/**
 * Get all registered shortcuts
 */
export const getAllShortcuts = () => {
  return Array.from(shortcuts.entries()).map(([name, shortcut]) => ({
    name,
    ...shortcut
  }));
};

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut) => {
  const parts = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
};

export default {
  SHORTCUTS,
  registerShortcut,
  unregisterShortcut,
  initKeyboardShortcuts,
  cleanupKeyboardShortcuts,
  setShortcutsEnabled,
  getAllShortcuts,
  formatShortcut
};
