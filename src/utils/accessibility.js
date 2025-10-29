/**
 * Accessibility Utilities
 *
 * Provides comprehensive accessibility helpers for ARIA attributes,
 * focus management, keyboard navigation, and screen reader support.
 *
 * @module utils/accessibility
 */

/**
 * ARIA Utilities
 */

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix = 'aria') {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * ARIA attributes generator for common patterns
 */
export const aria = {
  /**
   * Create describedBy relationship
   * @param {string} id - ID of the describing element
   * @returns {Object} ARIA attributes
   */
  describedBy(id) {
    return { 'aria-describedby': id };
  },

  /**
   * Create labelledBy relationship
   * @param {string} id - ID of the labeling element
   * @returns {Object} ARIA attributes
   */
  labelledBy(id) {
    return { 'aria-labelledby': id };
  },

  /**
   * Create label attribute
   * @param {string} label - The label text
   * @returns {Object} ARIA attributes
   */
  label(label) {
    return { 'aria-label': label };
  },

  /**
   * Create expanded state
   * @param {boolean} isExpanded - Whether element is expanded
   * @returns {Object} ARIA attributes
   */
  expanded(isExpanded) {
    return { 'aria-expanded': isExpanded };
  },

  /**
   * Create controls relationship
   * @param {string} id - ID of controlled element
   * @returns {Object} ARIA attributes
   */
  controls(id) {
    return { 'aria-controls': id };
  },

  /**
   * Create current state
   * @param {string} current - Current state (page, step, location, date, time, true)
   * @returns {Object} ARIA attributes
   */
  current(current = 'true') {
    return { 'aria-current': current };
  },

  /**
   * Create disabled state
   * @param {boolean} isDisabled - Whether element is disabled
   * @returns {Object} ARIA attributes
   */
  disabled(isDisabled) {
    return { 'aria-disabled': isDisabled };
  },

  /**
   * Create hidden state
   * @param {boolean} isHidden - Whether element is hidden from screen readers
   * @returns {Object} ARIA attributes
   */
  hidden(isHidden = true) {
    return { 'aria-hidden': isHidden };
  },

  /**
   * Create live region attributes
   * @param {string} politeness - 'polite', 'assertive', or 'off'
   * @param {boolean} atomic - Whether to announce entire region
   * @returns {Object} ARIA attributes
   */
  live(politeness = 'polite', atomic = false) {
    return {
      'aria-live': politeness,
      'aria-atomic': atomic,
    };
  },

  /**
   * Create selected state
   * @param {boolean} isSelected - Whether element is selected
   * @returns {Object} ARIA attributes
   */
  selected(isSelected) {
    return { 'aria-selected': isSelected };
  },

  /**
   * Create checked state
   * @param {boolean|string} isChecked - true, false, or 'mixed'
   * @returns {Object} ARIA attributes
   */
  checked(isChecked) {
    return { 'aria-checked': isChecked };
  },

  /**
   * Create pressed state
   * @param {boolean|string} isPressed - true, false, or 'mixed'
   * @returns {Object} ARIA attributes
   */
  pressed(isPressed) {
    return { 'aria-pressed': isPressed };
  },

  /**
   * Create invalid state
   * @param {boolean|string} isInvalid - true, false, or error message
   * @returns {Object} ARIA attributes
   */
  invalid(isInvalid) {
    return { 'aria-invalid': isInvalid };
  },

  /**
   * Create required state
   * @param {boolean} isRequired - Whether field is required
   * @returns {Object} ARIA attributes
   */
  required(isRequired = true) {
    return { 'aria-required': isRequired };
  },

  /**
   * Create modal dialog attributes
   * @param {string} labelId - ID of the dialog title
   * @param {string} descId - ID of the dialog description
   * @returns {Object} ARIA attributes
   */
  dialog(labelId, descId) {
    return {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': labelId,
      'aria-describedby': descId,
    };
  },

  /**
   * Create alert dialog attributes
   * @param {string} labelId - ID of the alert title
   * @param {string} descId - ID of the alert description
   * @returns {Object} ARIA attributes
   */
  alertDialog(labelId, descId) {
    return {
      role: 'alertdialog',
      'aria-modal': 'true',
      'aria-labelledby': labelId,
      'aria-describedby': descId,
    };
  },

  /**
   * Create menu attributes
   * @param {string} orientation - 'horizontal' or 'vertical'
   * @returns {Object} ARIA attributes
   */
  menu(orientation = 'vertical') {
    return {
      role: 'menu',
      'aria-orientation': orientation,
    };
  },

  /**
   * Create menuitem attributes
   * @param {boolean} isDisabled - Whether menu item is disabled
   * @returns {Object} ARIA attributes
   */
  menuitem(isDisabled = false) {
    return {
      role: 'menuitem',
      tabIndex: isDisabled ? -1 : 0,
      ...(isDisabled && { 'aria-disabled': true }),
    };
  },

  /**
   * Create tab attributes
   * @param {boolean} isSelected - Whether tab is selected
   * @param {string} panelId - ID of the associated panel
   * @returns {Object} ARIA attributes
   */
  tab(isSelected, panelId) {
    return {
      role: 'tab',
      'aria-selected': isSelected,
      'aria-controls': panelId,
      tabIndex: isSelected ? 0 : -1,
    };
  },

  /**
   * Create tabpanel attributes
   * @param {string} tabId - ID of the associated tab
   * @param {boolean} isHidden - Whether panel is hidden
   * @returns {Object} ARIA attributes
   */
  tabpanel(tabId, isHidden = false) {
    return {
      role: 'tabpanel',
      'aria-labelledby': tabId,
      tabIndex: 0,
      ...(isHidden && { hidden: true }),
    };
  },
};

/**
 * Focus Management
 */

/**
 * Focus trap manager for modals and dialogs
 */
export class FocusManager {
  constructor() {
    this.previousFocus = null;
    this.focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
    ].join(',');
  }

  /**
   * Get all focusable elements within a container
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement[]} Array of focusable elements
   */
  getFocusableElements(container) {
    if (!container) return [];
    const elements = Array.from(container.querySelectorAll(this.focusableSelectors));
    return elements.filter((el) => {
      return (
        el.offsetParent !== null &&
        window.getComputedStyle(el).visibility !== 'hidden'
      );
    });
  }

  /**
   * Get the first focusable element in a container
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement|null} First focusable element
   */
  getFirstFocusable(container) {
    const elements = this.getFocusableElements(container);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Get the last focusable element in a container
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement|null} Last focusable element
   */
  getLastFocusable(container) {
    const elements = this.getFocusableElements(container);
    return elements.length > 0 ? elements[elements.length - 1] : null;
  }

  /**
   * Save the currently focused element
   */
  saveFocus() {
    this.previousFocus = document.activeElement;
  }

  /**
   * Restore focus to the previously focused element
   */
  restoreFocus() {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  /**
   * Trap focus within a container (for modals, dialogs)
   * @param {HTMLElement} container - Container element
   * @param {Event} event - Keyboard event
   */
  trapFocus(container, event) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  /**
   * Focus the first element in a container
   * @param {HTMLElement} container - Container element
   * @returns {boolean} Whether focus was successful
   */
  focusFirst(container) {
    const first = this.getFirstFocusable(container);
    if (first) {
      first.focus();
      return true;
    }
    return false;
  }

  /**
   * Focus the last element in a container
   * @param {HTMLElement} container - Container element
   * @returns {boolean} Whether focus was successful
   */
  focusLast(container) {
    const last = this.getLastFocusable(container);
    if (last) {
      last.focus();
      return true;
    }
    return false;
  }
}

// Singleton instance
export const focusManager = new FocusManager();

/**
 * Screen Reader Utilities
 */

/**
 * Announce a message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 * @param {number} timeout - How long to keep announcement (ms)
 */
export function announceToScreenReader(message, priority = 'polite', timeout = 5000) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, timeout);
}

/**
 * Create a visually hidden but screen-reader accessible element
 * @returns {Object} CSS-in-JS style object
 */
export function getScreenReaderOnlyStyles() {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };
}

/**
 * Keyboard Navigation Helpers
 */

/**
 * Keyboard key constants
 */
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
};

/**
 * Check if a key event is an activation key (Enter or Space)
 * @param {KeyboardEvent} event - Keyboard event
 * @returns {boolean} Whether key is activation key
 */
export function isActivationKey(event) {
  return event.key === Keys.ENTER || event.key === Keys.SPACE;
}

/**
 * Check if a key event is an arrow key
 * @param {KeyboardEvent} event - Keyboard event
 * @returns {boolean} Whether key is arrow key
 */
export function isArrowKey(event) {
  return [
    Keys.ARROW_UP,
    Keys.ARROW_DOWN,
    Keys.ARROW_LEFT,
    Keys.ARROW_RIGHT,
  ].includes(event.key);
}

/**
 * Handle roving tabindex navigation
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLElement[]} items - Array of navigable items
 * @param {number} currentIndex - Current focused index
 * @param {string} orientation - 'horizontal' or 'vertical'
 * @returns {number} New index to focus
 */
export function handleRovingTabIndex(event, items, currentIndex, orientation = 'vertical') {
  const isVertical = orientation === 'vertical';
  const nextKey = isVertical ? Keys.ARROW_DOWN : Keys.ARROW_RIGHT;
  const prevKey = isVertical ? Keys.ARROW_UP : Keys.ARROW_LEFT;

  let newIndex = currentIndex;

  switch (event.key) {
    case nextKey:
      event.preventDefault();
      newIndex = (currentIndex + 1) % items.length;
      break;
    case prevKey:
      event.preventDefault();
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      break;
    case Keys.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case Keys.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    default:
      return currentIndex;
  }

  return newIndex;
}

/**
 * Color Contrast Utilities
 */

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color (#RRGGBB)
 * @returns {Object} RGB values
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * @param {Object} rgb - RGB color object
 * @returns {number} Relative luminance
 */
export function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 * @param {number} ratio - Contrast ratio
 * @param {string} level - 'AA' or 'AAA'
 * @param {boolean} largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {boolean} Whether ratio meets standard
 */
export function meetsContrastStandard(ratio, level = 'AA', largeText = false) {
  if (level === 'AAA') {
    return largeText ? ratio >= 4.5 : ratio >= 7;
  }
  // AA standard
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Validate color contrast
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateContrast(foreground, background, options = {}) {
  const { level = 'AA', largeText = false } = options;
  const ratio = getContrastRatio(foreground, background);
  const passes = meetsContrastStandard(ratio, level, largeText);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes,
    level,
    largeText,
    foreground,
    background,
  };
}

/**
 * Accessibility Testing Helpers
 */

/**
 * Check if element has accessible name
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether element has accessible name
 */
export function hasAccessibleName(element) {
  if (!element) return false;

  // Check aria-label
  if (element.hasAttribute('aria-label')) {
    return element.getAttribute('aria-label').trim().length > 0;
  }

  // Check aria-labelledby
  if (element.hasAttribute('aria-labelledby')) {
    const labelId = element.getAttribute('aria-labelledby');
    const labelElement = document.getElementById(labelId);
    return labelElement && labelElement.textContent.trim().length > 0;
  }

  // Check label (for form controls)
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label && label.textContent.trim().length > 0) {
      return true;
    }
  }

  // Check title attribute
  if (element.hasAttribute('title')) {
    return element.getAttribute('title').trim().length > 0;
  }

  // Check alt text (for images)
  if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
    return true; // Even empty alt is valid for decorative images
  }

  return false;
}

/**
 * Get element's accessible name
 * @param {HTMLElement} element - Element to check
 * @returns {string} Accessible name
 */
export function getAccessibleName(element) {
  if (!element) return '';

  if (element.hasAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }

  if (element.hasAttribute('aria-labelledby')) {
    const labelId = element.getAttribute('aria-labelledby');
    const labelElement = document.getElementById(labelId);
    return labelElement ? labelElement.textContent.trim() : '';
  }

  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }

  if (element.hasAttribute('title')) {
    return element.getAttribute('title');
  }

  if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
    return element.getAttribute('alt');
  }

  return element.textContent ? element.textContent.trim() : '';
}

/**
 * Check if element is keyboard accessible
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether element is keyboard accessible
 */
export function isKeyboardAccessible(element) {
  if (!element) return false;

  // Interactive elements that are natively keyboard accessible
  const interactiveElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (interactiveElements.includes(element.tagName)) {
    return !element.hasAttribute('disabled');
  }

  // Check for tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null && parseInt(tabindex, 10) >= 0) {
    return true;
  }

  // Check for role that implies interactivity
  const interactiveRoles = [
    'button',
    'link',
    'menuitem',
    'tab',
    'checkbox',
    'radio',
    'switch',
    'slider',
  ];
  const role = element.getAttribute('role');
  return role && interactiveRoles.includes(role);
}

export default {
  aria,
  focusManager,
  FocusManager,
  announceToScreenReader,
  getScreenReaderOnlyStyles,
  Keys,
  isActivationKey,
  isArrowKey,
  handleRovingTabIndex,
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsContrastStandard,
  validateContrast,
  hasAccessibleName,
  getAccessibleName,
  isKeyboardAccessible,
  generateAriaId,
};
