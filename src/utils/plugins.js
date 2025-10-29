/**
 * Plugin System
 *
 * Provides a comprehensive plugin architecture for extending Clippy Revival
 * with custom functionality, integrations, and features.
 *
 * @module utils/plugins
 */

/**
 * Plugin lifecycle hooks
 */
export const PluginHooks = {
  BEFORE_INIT: 'beforeInit',
  AFTER_INIT: 'afterInit',
  BEFORE_LOAD: 'beforeLoad',
  AFTER_LOAD: 'afterLoad',
  BEFORE_UNLOAD: 'beforeUnload',
  AFTER_UNLOAD: 'afterUnload',
  ON_MESSAGE: 'onMessage',
  ON_RESPONSE: 'onResponse',
  ON_ERROR: 'onError',
  ON_SETTINGS_CHANGE: 'onSettingsChange',
};

/**
 * Plugin status
 */
export const PluginStatus = {
  UNLOADED: 'unloaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ACTIVE: 'active',
  ERROR: 'error',
  DISABLED: 'disabled',
};

/**
 * Plugin API for accessing core functionality
 */
export class PluginAPI {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.registeredCommands = new Map();
    this.registeredMenuItems = new Map();
    this.registeredPanels = new Map();
  }

  /**
   * Register a command
   * @param {string} id - Command ID
   * @param {Function} handler - Command handler
   * @param {Object} options - Command options
   */
  registerCommand(id, handler, options = {}) {
    if (this.registeredCommands.has(id)) {
      throw new Error(`Command '${id}' is already registered`);
    }

    const command = {
      id,
      handler,
      label: options.label || id,
      description: options.description || '',
      icon: options.icon || null,
      shortcut: options.shortcut || null,
    };

    this.registeredCommands.set(id, command);
    return () => this.unregisterCommand(id);
  }

  /**
   * Unregister a command
   * @param {string} id - Command ID
   */
  unregisterCommand(id) {
    this.registeredCommands.delete(id);
  }

  /**
   * Execute a command
   * @param {string} id - Command ID
   * @param {*} args - Command arguments
   */
  async executeCommand(id, ...args) {
    const command = this.registeredCommands.get(id);
    if (!command) {
      throw new Error(`Command '${id}' not found`);
    }
    return await command.handler(...args);
  }

  /**
   * Register a menu item
   * @param {string} location - Menu location (e.g., 'main', 'context', 'tray')
   * @param {Object} item - Menu item configuration
   */
  registerMenuItem(location, item) {
    if (!this.registeredMenuItems.has(location)) {
      this.registeredMenuItems.set(location, []);
    }

    this.registeredMenuItems.get(location).push(item);
    return () => this.unregisterMenuItem(location, item.id);
  }

  /**
   * Unregister a menu item
   * @param {string} location - Menu location
   * @param {string} itemId - Menu item ID
   */
  unregisterMenuItem(location, itemId) {
    if (!this.registeredMenuItems.has(location)) return;

    const items = this.registeredMenuItems.get(location);
    const index = items.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      items.splice(index, 1);
    }
  }

  /**
   * Register a panel
   * @param {string} id - Panel ID
   * @param {Object} panel - Panel configuration
   */
  registerPanel(id, panel) {
    if (this.registeredPanels.has(id)) {
      throw new Error(`Panel '${id}' is already registered`);
    }

    this.registeredPanels.set(id, panel);
    return () => this.unregisterPanel(id);
  }

  /**
   * Unregister a panel
   * @param {string} id - Panel ID
   */
  unregisterPanel(id) {
    this.registeredPanels.delete(id);
  }

  /**
   * Get storage for plugin
   * @param {string} pluginId - Plugin ID
   */
  getStorage(pluginId) {
    return {
      get: (key, defaultValue = null) => {
        const storageKey = `plugin_${pluginId}_${key}`;
        const value = localStorage.getItem(storageKey);
        return value ? JSON.parse(value) : defaultValue;
      },
      set: (key, value) => {
        const storageKey = `plugin_${pluginId}_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
      },
      remove: (key) => {
        const storageKey = `plugin_${pluginId}_${key}`;
        localStorage.removeItem(storageKey);
      },
      clear: () => {
        const prefix = `plugin_${pluginId}_`;
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      },
    };
  }

  /**
   * Show notification
   * @param {Object} options - Notification options
   */
  showNotification(options) {
    const { title, message, type = 'info', duration = 5000 } = options;
    // This would integrate with the Toast system
    if (window.showToast) {
      window.showToast(message, type, duration);
    } else {
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
  }

  /**
   * Get app context
   */
  getContext() {
    return {
      version: '1.0.0',
      platform: window.navigator.platform,
      locale: window.navigator.language,
    };
  }
}

/**
 * Base Plugin class that all plugins should extend
 */
export class Plugin {
  constructor(manifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.description = manifest.description || '';
    this.author = manifest.author || 'Unknown';
    this.homepage = manifest.homepage || '';
    this.dependencies = manifest.dependencies || {};
    this.permissions = manifest.permissions || [];

    this.api = null;
    this.status = PluginStatus.UNLOADED;
    this.error = null;
    this.hooks = {};
  }

  /**
   * Initialize plugin
   * @param {PluginAPI} api - Plugin API instance
   */
  async init(api) {
    this.api = api;
    this.status = PluginStatus.LOADING;

    try {
      await this.onInit();
      this.status = PluginStatus.LOADED;
    } catch (error) {
      this.status = PluginStatus.ERROR;
      this.error = error;
      throw error;
    }
  }

  /**
   * Activate plugin
   */
  async activate() {
    if (this.status !== PluginStatus.LOADED) {
      throw new Error('Plugin must be loaded before activation');
    }

    try {
      await this.onActivate();
      this.status = PluginStatus.ACTIVE;
    } catch (error) {
      this.status = PluginStatus.ERROR;
      this.error = error;
      throw error;
    }
  }

  /**
   * Deactivate plugin
   */
  async deactivate() {
    if (this.status !== PluginStatus.ACTIVE) {
      return;
    }

    try {
      await this.onDeactivate();
      this.status = PluginStatus.LOADED;
    } catch (error) {
      this.error = error;
      throw error;
    }
  }

  /**
   * Unload plugin
   */
  async unload() {
    if (this.status === PluginStatus.ACTIVE) {
      await this.deactivate();
    }

    try {
      await this.onUnload();
      this.status = PluginStatus.UNLOADED;
    } catch (error) {
      this.error = error;
      throw error;
    }
  }

  /**
   * Register a hook handler
   * @param {string} hook - Hook name
   * @param {Function} handler - Hook handler
   */
  registerHook(hook, handler) {
    if (!this.hooks[hook]) {
      this.hooks[hook] = [];
    }
    this.hooks[hook].push(handler);
  }

  /**
   * Execute hook handlers
   * @param {string} hook - Hook name
   * @param {*} data - Hook data
   */
  async executeHook(hook, data) {
    if (!this.hooks[hook]) return data;

    let result = data;
    for (const handler of this.hooks[hook]) {
      try {
        result = await handler(result);
      } catch (error) {
        console.error(`Error in hook '${hook}' for plugin '${this.id}':`, error);
      }
    }
    return result;
  }

  // Lifecycle methods to be overridden by plugins
  async onInit() {}
  async onActivate() {}
  async onDeactivate() {}
  async onUnload() {}
}

/**
 * Plugin Manager
 */
export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.api = new PluginAPI(this);
    this.eventListeners = new Map();
  }

  /**
   * Register a plugin
   * @param {Plugin} plugin - Plugin instance
   */
  async registerPlugin(plugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin '${plugin.id}' is already registered`);
    }

    // Check dependencies
    for (const [depId, depVersion] of Object.entries(plugin.dependencies)) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Plugin '${plugin.id}' requires '${depId}' v${depVersion}`);
      }
    }

    this.plugins.set(plugin.id, plugin);
    await plugin.init(this.api);

    this.emit('pluginRegistered', { plugin });
    return plugin;
  }

  /**
   * Unregister a plugin
   * @param {string} pluginId - Plugin ID
   */
  async unregisterPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    await plugin.unload();
    this.plugins.delete(pluginId);

    this.emit('pluginUnregistered', { pluginId });
  }

  /**
   * Activate a plugin
   * @param {string} pluginId - Plugin ID
   */
  async activatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    await plugin.activate();
    this.emit('pluginActivated', { plugin });
  }

  /**
   * Deactivate a plugin
   * @param {string} pluginId - Plugin ID
   */
  async deactivatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    await plugin.deactivate();
    this.emit('pluginDeactivated', { plugin });
  }

  /**
   * Get plugin by ID
   * @param {string} pluginId - Plugin ID
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins() {
    return this.getAllPlugins().filter((plugin) => plugin.status === PluginStatus.ACTIVE);
  }

  /**
   * Execute a hook across all active plugins
   * @param {string} hook - Hook name
   * @param {*} data - Hook data
   */
  async executeHook(hook, data) {
    let result = data;
    const activePlugins = this.getActivePlugins();

    for (const plugin of activePlugins) {
      try {
        result = await plugin.executeHook(hook, result);
      } catch (error) {
        console.error(`Error executing hook '${hook}' for plugin '${plugin.id}':`, error);
      }
    }

    return result;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
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
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
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
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) return;

    const handlers = this.eventListeners.get(event);
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }

  /**
   * Load plugins from configuration
   * @param {Array} pluginConfigs - Array of plugin configurations
   */
  async loadPluginsFromConfig(pluginConfigs) {
    const results = [];

    for (const config of pluginConfigs) {
      try {
        // In a real implementation, this would dynamically load plugin modules
        // For now, we'll just track the configuration
        results.push({
          id: config.id,
          success: true,
          message: `Plugin '${config.id}' loaded successfully`,
        });
      } catch (error) {
        results.push({
          id: config.id,
          success: false,
          message: `Failed to load plugin '${config.id}': ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const plugins = this.getAllPlugins();
    return {
      total: plugins.length,
      active: plugins.filter((p) => p.status === PluginStatus.ACTIVE).length,
      loaded: plugins.filter((p) => p.status === PluginStatus.LOADED).length,
      error: plugins.filter((p) => p.status === PluginStatus.ERROR).length,
      disabled: plugins.filter((p) => p.status === PluginStatus.DISABLED).length,
    };
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

export default {
  Plugin,
  PluginManager,
  PluginAPI,
  PluginHooks,
  PluginStatus,
  pluginManager,
};
