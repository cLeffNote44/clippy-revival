/**
 * Theme System
 *
 * Provides comprehensive theming support with custom themes,
 * dynamic theme switching, and theme builder utilities.
 *
 * @module utils/themes
 */

import { validateContrast } from './accessibility';

/**
 * Default theme palette
 */
export const defaultPalette = {
  // Primary colors
  primary: {
    main: '#1976D2',
    light: '#42A5F5',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },
  // Secondary colors
  secondary: {
    main: '#DC004E',
    light: '#F73378',
    dark: '#C51162',
    contrastText: '#FFFFFF',
  },
  // Error colors
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
    contrastText: '#FFFFFF',
  },
  // Warning colors
  warning: {
    main: '#ED6C02',
    light: '#FF9800',
    dark: '#E65100',
    contrastText: '#FFFFFF',
  },
  // Info colors
  info: {
    main: '#0288D1',
    light: '#03A9F4',
    dark: '#01579B',
    contrastText: '#FFFFFF',
  },
  // Success colors
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    contrastText: '#FFFFFF',
  },
  // Background colors
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
    elevated: '#FFFFFF',
  },
  // Text colors
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
  },
  // Divider color
  divider: 'rgba(0, 0, 0, 0.12)',
  // Action colors
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
};

/**
 * Default dark theme palette
 */
export const darkPalette = {
  // Primary colors
  primary: {
    main: '#90CAF9',
    light: '#E3F2FD',
    dark: '#42A5F5',
    contrastText: '#000000',
  },
  // Secondary colors
  secondary: {
    main: '#F48FB1',
    light: '#F8BBD0',
    dark: '#EC407A',
    contrastText: '#000000',
  },
  // Error colors
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    contrastText: '#FFFFFF',
  },
  // Warning colors
  warning: {
    main: '#FFA726',
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#000000',
  },
  // Info colors
  info: {
    main: '#29B6F6',
    light: '#4FC3F7',
    dark: '#0288D1',
    contrastText: '#000000',
  },
  // Success colors
  success: {
    main: '#66BB6A',
    light: '#81C784',
    dark: '#388E3C',
    contrastText: '#000000',
  },
  // Background colors
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    elevated: '#2C2C2C',
  },
  // Text colors
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    hint: 'rgba(255, 255, 255, 0.38)',
  },
  // Divider color
  divider: 'rgba(255, 255, 255, 0.12)',
  // Action colors
  action: {
    active: 'rgba(255, 255, 255, 0.56)',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
};

/**
 * Theme class
 */
export class Theme {
  constructor(config) {
    this.id = config.id || 'custom';
    this.name = config.name || 'Custom Theme';
    this.description = config.description || '';
    this.author = config.author || 'Unknown';
    this.version = config.version || '1.0.0';
    this.mode = config.mode || 'light'; // 'light' or 'dark'
    this.palette = this.mergePalette(config.palette || {});
    this.typography = this.mergeTypography(config.typography || {});
    this.spacing = config.spacing || 8;
    this.shape = config.shape || { borderRadius: 4 };
    this.shadows = config.shadows || this.getDefaultShadows();
    this.transitions = config.transitions || this.getDefaultTransitions();
    this.zIndex = config.zIndex || this.getDefaultZIndex();
    this.custom = config.custom || {};
  }

  /**
   * Merge palette with defaults
   */
  mergePalette(customPalette) {
    const basePalette = this.mode === 'dark' ? darkPalette : defaultPalette;
    return this.deepMerge(basePalette, customPalette);
  }

  /**
   * Merge typography with defaults
   */
  mergeTypography(customTypography) {
    const defaultTypography = {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: {
        fontSize: '2.5rem',
        fontWeight: 300,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 300,
        lineHeight: 1.2,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 400,
        lineHeight: 1.2,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 400,
        lineHeight: 1.2,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 400,
        lineHeight: 1.2,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.43,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.75,
        textTransform: 'uppercase',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.66,
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 2.66,
        textTransform: 'uppercase',
      },
    };

    return this.deepMerge(defaultTypography, customTypography);
  }

  /**
   * Get default shadows
   */
  getDefaultShadows() {
    return [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    ];
  }

  /**
   * Get default transitions
   */
  getDefaultTransitions() {
    return {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    };
  }

  /**
   * Get default z-index values
   */
  getDefaultZIndex() {
    return {
      mobileStepper: 1000,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    };
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Validate theme colors for accessibility
   */
  validateAccessibility() {
    const issues = [];

    // Check text on background contrast
    const textResult = validateContrast(
      this.palette.text.primary,
      this.palette.background.default
    );
    if (!textResult.passes) {
      issues.push({
        severity: 'error',
        message: `Text contrast ratio ${textResult.ratio} fails WCAG AA (requires 4.5:1)`,
        colors: { text: this.palette.text.primary, background: this.palette.background.default },
      });
    }

    // Check primary button contrast
    const primaryResult = validateContrast(
      this.palette.primary.contrastText,
      this.palette.primary.main
    );
    if (!primaryResult.passes) {
      issues.push({
        severity: 'warning',
        message: `Primary button contrast ratio ${primaryResult.ratio} fails WCAG AA`,
        colors: { text: this.palette.primary.contrastText, background: this.palette.primary.main },
      });
    }

    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Convert theme to CSS variables
   */
  toCSSVariables() {
    const cssVars = {};

    // Palette colors
    Object.entries(this.palette).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, color]) => {
          cssVars[`--palette-${key}-${subKey}`] = color;
        });
      } else {
        cssVars[`--palette-${key}`] = value;
      }
    });

    // Typography
    cssVars['--typography-fontFamily'] = this.typography.fontFamily;
    cssVars['--typography-fontSize'] = `${this.typography.fontSize}px`;

    // Spacing
    cssVars['--spacing-unit'] = `${this.spacing}px`;

    // Shape
    cssVars['--shape-borderRadius'] = `${this.shape.borderRadius}px`;

    return cssVars;
  }

  /**
   * Apply theme to document
   */
  apply() {
    const cssVars = this.toCSSVariables();
    const root = document.documentElement;

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Add theme mode class
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${this.mode}`);

    // Store current theme ID
    localStorage.setItem('currentTheme', this.id);
  }

  /**
   * Export theme as JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      author: this.author,
      version: this.version,
      mode: this.mode,
      palette: this.palette,
      typography: this.typography,
      spacing: this.spacing,
      shape: this.shape,
      custom: this.custom,
    };
  }

  /**
   * Create theme from JSON
   */
  static fromJSON(json) {
    return new Theme(json);
  }
}

/**
 * Theme Manager
 */
export class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = null;
    this.eventListeners = new Map();

    // Register default themes
    this.registerDefaultThemes();
  }

  /**
   * Register default themes
   */
  registerDefaultThemes() {
    // Light theme
    const lightTheme = new Theme({
      id: 'light',
      name: 'Light',
      description: 'Default light theme',
      mode: 'light',
    });
    this.registerTheme(lightTheme);

    // Dark theme
    const darkTheme = new Theme({
      id: 'dark',
      name: 'Dark',
      description: 'Default dark theme',
      mode: 'dark',
    });
    this.registerTheme(darkTheme);

    // Blue theme
    const blueTheme = new Theme({
      id: 'blue',
      name: 'Ocean Blue',
      description: 'Cool blue theme',
      mode: 'light',
      palette: {
        primary: {
          main: '#0277BD',
          light: '#58A5F0',
          dark: '#004C8C',
          contrastText: '#FFFFFF',
        },
        background: {
          default: '#E1F5FE',
          paper: '#FFFFFF',
        },
      },
    });
    this.registerTheme(blueTheme);

    // Purple theme
    const purpleTheme = new Theme({
      id: 'purple',
      name: 'Deep Purple',
      description: 'Rich purple theme',
      mode: 'dark',
      palette: {
        primary: {
          main: '#7E57C2',
          light: '#B085F5',
          dark: '#4527A0',
          contrastText: '#FFFFFF',
        },
        background: {
          default: '#1A0F2E',
          paper: '#2A1B47',
        },
      },
    });
    this.registerTheme(purpleTheme);
  }

  /**
   * Register a theme
   */
  registerTheme(theme) {
    if (!(theme instanceof Theme)) {
      throw new Error('Theme must be an instance of Theme class');
    }

    // Validate accessibility
    const validation = theme.validateAccessibility();
    if (!validation.valid) {
      console.warn(`Theme '${theme.id}' has accessibility issues:`, validation.issues);
    }

    this.themes.set(theme.id, theme);
    this.emit('themeRegistered', { theme });
  }

  /**
   * Unregister a theme
   */
  unregisterTheme(themeId) {
    if (this.currentTheme?.id === themeId) {
      throw new Error('Cannot unregister active theme');
    }

    this.themes.delete(themeId);
    this.emit('themeUnregistered', { themeId });
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId) {
    return this.themes.get(themeId);
  }

  /**
   * Get all themes
   */
  getAllThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Apply theme
   */
  applyTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    theme.apply();
    this.currentTheme = theme;

    this.emit('themeChanged', { theme });
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Load theme from storage
   */
  loadFromStorage() {
    const savedThemeId = localStorage.getItem('currentTheme');
    if (savedThemeId && this.themes.has(savedThemeId)) {
      this.applyTheme(savedThemeId);
    } else {
      // Apply default theme
      this.applyTheme('light');
    }
  }

  /**
   * Import custom theme
   */
  importTheme(themeData) {
    try {
      const theme = Theme.fromJSON(themeData);
      this.registerTheme(theme);
      return theme;
    } catch (error) {
      throw new Error(`Failed to import theme: ${error.message}`);
    }
  }

  /**
   * Export theme
   */
  exportTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    return theme.toJSON();
  }

  /**
   * Create theme builder
   */
  createBuilder(baseThemeId = 'light') {
    const baseTheme = this.themes.get(baseThemeId);
    if (!baseTheme) {
      throw new Error(`Base theme '${baseThemeId}' not found`);
    }

    return new ThemeBuilder(baseTheme);
  }

  /**
   * Add event listener
   */
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);

    return () => this.off(event, handler);
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    if (!this.eventListeners.has(event)) return;

    const handlers = this.eventListeners.get(event);
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) return;

    const handlers = this.eventListeners.get(event);
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in theme event handler for '${event}':`, error);
      }
    });
  }
}

/**
 * Theme Builder utility
 */
export class ThemeBuilder {
  constructor(baseTheme) {
    this.config = baseTheme ? baseTheme.toJSON() : {};
    this.config.id = 'custom-' + Date.now();
  }

  /**
   * Set theme ID
   */
  setId(id) {
    this.config.id = id;
    return this;
  }

  /**
   * Set theme name
   */
  setName(name) {
    this.config.name = name;
    return this;
  }

  /**
   * Set theme description
   */
  setDescription(description) {
    this.config.description = description;
    return this;
  }

  /**
   * Set theme mode
   */
  setMode(mode) {
    this.config.mode = mode;
    return this;
  }

  /**
   * Set primary color
   */
  setPrimaryColor(color) {
    if (!this.config.palette) this.config.palette = {};
    if (!this.config.palette.primary) this.config.palette.primary = {};
    this.config.palette.primary.main = color;
    return this;
  }

  /**
   * Set secondary color
   */
  setSecondaryColor(color) {
    if (!this.config.palette) this.config.palette = {};
    if (!this.config.palette.secondary) this.config.palette.secondary = {};
    this.config.palette.secondary.main = color;
    return this;
  }

  /**
   * Set background color
   */
  setBackgroundColor(color) {
    if (!this.config.palette) this.config.palette = {};
    if (!this.config.palette.background) this.config.palette.background = {};
    this.config.palette.background.default = color;
    return this;
  }

  /**
   * Set font family
   */
  setFontFamily(fontFamily) {
    if (!this.config.typography) this.config.typography = {};
    this.config.typography.fontFamily = fontFamily;
    return this;
  }

  /**
   * Set border radius
   */
  setBorderRadius(radius) {
    if (!this.config.shape) this.config.shape = {};
    this.config.shape.borderRadius = radius;
    return this;
  }

  /**
   * Set spacing unit
   */
  setSpacing(spacing) {
    this.config.spacing = spacing;
    return this;
  }

  /**
   * Build theme
   */
  build() {
    return new Theme(this.config);
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

export default {
  Theme,
  ThemeManager,
  ThemeBuilder,
  themeManager,
  defaultPalette,
  darkPalette,
};
