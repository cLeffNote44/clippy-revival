/**
 * Example Plugin: Weather Plugin
 *
 * This is an example plugin that demonstrates how to create plugins
 * for Clippy Revival. It adds weather information commands.
 *
 * @example
 * import { WeatherPlugin } from './examples/example-plugin';
 * import { pluginManager } from './src/utils/plugins';
 *
 * const weatherPlugin = new WeatherPlugin();
 * await pluginManager.registerPlugin(weatherPlugin);
 * await pluginManager.activatePlugin('weather');
 */

import { Plugin, PluginHooks } from '../src/utils/plugins';

/**
 * Weather Plugin
 *
 * Adds weather information commands and menu items
 */
export class WeatherPlugin extends Plugin {
  constructor() {
    super({
      id: 'weather',
      name: 'Weather Plugin',
      version: '1.0.0',
      description: 'Adds weather information commands',
      author: 'Clippy Revival Team',
      homepage: 'https://github.com/clippy-revival',
      permissions: ['network'],
    });

    this.storage = null;
    this.unsubscribers = [];
  }

  /**
   * Initialize plugin
   */
  async onInit() {
    console.log('Weather Plugin: Initializing...');
    this.storage = this.api.getStorage(this.id);

    // Load saved location
    this.defaultLocation = this.storage.get('defaultLocation', 'New York');
  }

  /**
   * Activate plugin
   */
  async onActivate() {
    console.log('Weather Plugin: Activating...');

    // Register commands
    const unsubCommand1 = this.api.registerCommand(
      'weather.current',
      (location) => this.getCurrentWeather(location),
      {
        label: 'Get Current Weather',
        description: 'Get current weather for a location',
        icon: '☀️',
      }
    );

    const unsubCommand2 = this.api.registerCommand(
      'weather.forecast',
      (location) => this.getForecast(location),
      {
        label: 'Get Weather Forecast',
        description: 'Get 5-day weather forecast',
        icon: '📅',
      }
    );

    const unsubCommand3 = this.api.registerCommand(
      'weather.setLocation',
      (location) => this.setDefaultLocation(location),
      {
        label: 'Set Default Location',
        description: 'Set your default weather location',
        icon: '📍',
      }
    );

    this.unsubscribers.push(unsubCommand1, unsubCommand2, unsubCommand3);

    // Register menu items
    const unsubMenu1 = this.api.registerMenuItem('main', {
      id: 'weather-current',
      label: 'Current Weather',
      icon: '☀️',
      action: () => this.api.executeCommand('weather.current', this.defaultLocation),
    });

    const unsubMenu2 = this.api.registerMenuItem('main', {
      id: 'weather-forecast',
      label: 'Weather Forecast',
      icon: '📅',
      action: () => this.api.executeCommand('weather.forecast', this.defaultLocation),
    });

    this.unsubscribers.push(unsubMenu1, unsubMenu2);

    // Register hooks
    this.registerHook(PluginHooks.ON_MESSAGE, this.handleMessage.bind(this));
    this.registerHook(PluginHooks.ON_SETTINGS_CHANGE, this.handleSettingsChange.bind(this));

    this.api.showNotification({
      title: 'Weather Plugin',
      message: 'Weather plugin activated!',
      type: 'success',
    });
  }

  /**
   * Deactivate plugin
   */
  async onDeactivate() {
    console.log('Weather Plugin: Deactivating...');

    // Unregister all commands and menu items
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    this.api.showNotification({
      title: 'Weather Plugin',
      message: 'Weather plugin deactivated',
      type: 'info',
    });
  }

  /**
   * Unload plugin
   */
  async onUnload() {
    console.log('Weather Plugin: Unloading...');
    // Clean up any remaining resources
  }

  /**
   * Get current weather
   */
  async getCurrentWeather(location) {
    location = location || this.defaultLocation;

    try {
      // In a real plugin, this would call a weather API
      const weather = {
        location,
        temperature: Math.floor(Math.random() * 30) + 60, // Mock data
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 50) + 30,
        windSpeed: Math.floor(Math.random() * 20) + 5,
      };

      this.api.showNotification({
        title: `Weather in ${weather.location}`,
        message: `${weather.temperature}°F, ${weather.condition}`,
        type: 'info',
      });

      return weather;
    } catch (error) {
      this.api.showNotification({
        title: 'Weather Error',
        message: `Failed to get weather: ${error.message}`,
        type: 'error',
      });
      throw error;
    }
  }

  /**
   * Get weather forecast
   */
  async getForecast(location) {
    location = location || this.defaultLocation;

    try {
      // Mock 5-day forecast
      const forecast = [];
      for (let i = 0; i < 5; i++) {
        forecast.push({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i],
          high: Math.floor(Math.random() * 20) + 70,
          low: Math.floor(Math.random() * 20) + 50,
          condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        });
      }

      this.api.showNotification({
        title: `5-Day Forecast for ${location}`,
        message: `${forecast[0].condition}, ${forecast[0].high}°F`,
        type: 'info',
      });

      return forecast;
    } catch (error) {
      this.api.showNotification({
        title: 'Forecast Error',
        message: `Failed to get forecast: ${error.message}`,
        type: 'error',
      });
      throw error;
    }
  }

  /**
   * Set default location
   */
  setDefaultLocation(location) {
    this.defaultLocation = location;
    this.storage.set('defaultLocation', location);

    this.api.showNotification({
      title: 'Location Updated',
      message: `Default location set to ${location}`,
      type: 'success',
    });

    return { success: true, location };
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(data) {
    const message = data.content.toLowerCase();

    // Auto-respond to weather-related queries
    if (message.includes('weather') || message.includes('temperature')) {
      // Extract location if mentioned
      const locationMatch = message.match(/in ([a-z\s]+)/i);
      const location = locationMatch ? locationMatch[1].trim() : this.defaultLocation;

      if (message.includes('forecast')) {
        await this.getForecast(location);
      } else {
        await this.getCurrentWeather(location);
      }
    }

    return data;
  }

  /**
   * Handle settings changes
   */
  async handleSettingsChange(data) {
    if (data.key === 'weather.defaultLocation') {
      this.setDefaultLocation(data.value);
    }
    return data;
  }
}

/**
 * Example Plugin: Notes Plugin
 *
 * A simple note-taking plugin
 */
export class NotesPlugin extends Plugin {
  constructor() {
    super({
      id: 'notes',
      name: 'Notes Plugin',
      version: '1.0.0',
      description: 'Simple note-taking functionality',
      author: 'Clippy Revival Team',
    });

    this.notes = [];
    this.storage = null;
  }

  async onInit() {
    this.storage = this.api.getStorage(this.id);
    this.notes = this.storage.get('notes', []);
  }

  async onActivate() {
    // Register commands
    this.api.registerCommand(
      'notes.create',
      (title, content) => this.createNote(title, content),
      { label: 'Create Note', icon: '📝' }
    );

    this.api.registerCommand(
      'notes.list',
      () => this.listNotes(),
      { label: 'List Notes', icon: '📋' }
    );

    this.api.registerCommand(
      'notes.delete',
      (id) => this.deleteNote(id),
      { label: 'Delete Note', icon: '🗑️' }
    );

    // Register panel
    this.api.registerPanel('notes', {
      title: 'My Notes',
      icon: '📝',
      render: () => this.renderNotesPanel(),
    });
  }

  createNote(title, content) {
    const note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
    };

    this.notes.push(note);
    this.storage.set('notes', this.notes);

    this.api.showNotification({
      title: 'Note Created',
      message: `Created note: ${title}`,
      type: 'success',
    });

    return note;
  }

  listNotes() {
    return this.notes;
  }

  deleteNote(id) {
    const index = this.notes.findIndex((note) => note.id === id);
    if (index !== -1) {
      const note = this.notes.splice(index, 1)[0];
      this.storage.set('notes', this.notes);

      this.api.showNotification({
        title: 'Note Deleted',
        message: `Deleted note: ${note.title}`,
        type: 'info',
      });

      return { success: true };
    }

    return { success: false, error: 'Note not found' };
  }

  renderNotesPanel() {
    return {
      type: 'notes-list',
      notes: this.notes,
    };
  }
}

export default {
  WeatherPlugin,
  NotesPlugin,
};
