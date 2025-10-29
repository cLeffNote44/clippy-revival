# Advanced Features Guide

This guide covers advanced features in Clippy Revival including the plugin system, custom themes, and advanced AI capabilities.

## Table of Contents

1. [Plugin System](#plugin-system)
2. [Theme System](#theme-system)
3. [Advanced AI Features](#advanced-ai-features)
4. [Examples](#examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Plugin System

The plugin system allows you to extend Clippy Revival with custom functionality, integrations, and features.

### Architecture

The plugin system consists of:
- **Plugin Class**: Base class for all plugins
- **PluginManager**: Manages plugin lifecycle
- **PluginAPI**: Provides API for plugins to interact with the app
- **PluginHooks**: Lifecycle hooks for plugins

### Creating a Plugin

#### Basic Plugin Structure

```javascript
import { Plugin } from '../src/utils/plugins';

class MyPlugin extends Plugin {
  constructor() {
    super({
      id: 'my-plugin',
      name: 'My Plugin',
      version: '1.0.0',
      description: 'My awesome plugin',
      author: 'Your Name',
      permissions: ['network'], // Optional
    });
  }

  // Lifecycle methods
  async onInit() {
    // Initialize plugin
    this.storage = this.api.getStorage(this.id);
  }

  async onActivate() {
    // Activate plugin - register commands, menu items, etc.
    this.api.registerCommand('mycommand', () => {
      this.api.showNotification({
        title: 'My Plugin',
        message: 'Command executed!',
        type: 'success',
      });
    });
  }

  async onDeactivate() {
    // Deactivate plugin - clean up
  }

  async onUnload() {
    // Unload plugin - final cleanup
  }
}
```

### Plugin API

#### Registering Commands

```javascript
async onActivate() {
  // Register a command
  this.api.registerCommand(
    'plugin.action',
    (arg1, arg2) => this.handleAction(arg1, arg2),
    {
      label: 'My Action',
      description: 'Performs my action',
      icon: '🎯',
      shortcut: 'Ctrl+Shift+A',
    }
  );

  // Execute a command
  await this.api.executeCommand('plugin.action', 'arg1', 'arg2');
}
```

#### Registering Menu Items

```javascript
async onActivate() {
  this.api.registerMenuItem('main', {
    id: 'my-menu-item',
    label: 'My Menu Item',
    icon: '📋',
    action: () => this.handleMenuAction(),
    separator: false,
  });
}
```

#### Registering Panels

```javascript
async onActivate() {
  this.api.registerPanel('my-panel', {
    title: 'My Panel',
    icon: '📊',
    render: () => this.renderPanel(),
  });
}

renderPanel() {
  return {
    type: 'custom',
    content: '<div>My Panel Content</div>',
  };
}
```

#### Storage API

```javascript
// Get storage for your plugin
const storage = this.api.getStorage(this.id);

// Save data
storage.set('key', { data: 'value' });

// Retrieve data
const data = storage.get('key', defaultValue);

// Remove data
storage.remove('key');

// Clear all plugin data
storage.clear();
```

#### Notifications

```javascript
this.api.showNotification({
  title: 'Notification Title',
  message: 'Notification message',
  type: 'success', // 'success', 'error', 'warning', 'info'
  duration: 5000,
});
```

### Plugin Hooks

```javascript
import { PluginHooks } from '../src/utils/plugins';

async onActivate() {
  // Register hook handlers
  this.registerHook(PluginHooks.ON_MESSAGE, async (data) => {
    // Process message before sending to AI
    console.log('Message:', data.content);
    return data; // Return modified data
  });

  this.registerHook(PluginHooks.ON_RESPONSE, async (data) => {
    // Process AI response before displaying
    console.log('Response:', data.content);
    return data;
  });

  this.registerHook(PluginHooks.ON_ERROR, async (data) => {
    // Handle errors
    console.error('Error:', data.error);
    return data;
  });

  this.registerHook(PluginHooks.ON_SETTINGS_CHANGE, async (data) => {
    // Handle settings changes
    if (data.key === 'myPlugin.setting') {
      this.updateSetting(data.value);
    }
    return data;
  });
}
```

### Available Hooks

- `BEFORE_INIT`: Before plugin initialization
- `AFTER_INIT`: After plugin initialization
- `BEFORE_LOAD`: Before plugin load
- `AFTER_LOAD`: After plugin load
- `BEFORE_UNLOAD`: Before plugin unload
- `AFTER_UNLOAD`: After plugin unload
- `ON_MESSAGE`: When user sends a message
- `ON_RESPONSE`: When AI responds
- `ON_ERROR`: When an error occurs
- `ON_SETTINGS_CHANGE`: When settings change

### Using the Plugin Manager

```javascript
import { pluginManager } from './src/utils/plugins';
import { MyPlugin } from './plugins/my-plugin';

// Register plugin
const plugin = new MyPlugin();
await pluginManager.registerPlugin(plugin);

// Activate plugin
await pluginManager.activatePlugin('my-plugin');

// Deactivate plugin
await pluginManager.deactivatePlugin('my-plugin');

// Unregister plugin
await pluginManager.unregisterPlugin('my-plugin');

// Get plugin
const plugin = pluginManager.getPlugin('my-plugin');

// Get all plugins
const plugins = pluginManager.getAllPlugins();

// Get active plugins
const activePlugins = pluginManager.getActivePlugins();

// Execute hook across all plugins
await pluginManager.executeHook('onMessage', messageData);

// Get statistics
const stats = pluginManager.getStats();
console.log(stats);
// {
//   total: 5,
//   active: 3,
//   loaded: 4,
//   error: 0,
//   disabled: 1
// }
```

### Plugin Events

```javascript
// Listen for plugin events
pluginManager.on('pluginRegistered', ({ plugin }) => {
  console.log('Plugin registered:', plugin.name);
});

pluginManager.on('pluginActivated', ({ plugin }) => {
  console.log('Plugin activated:', plugin.name);
});

pluginManager.on('pluginDeactivated', ({ plugin }) => {
  console.log('Plugin deactivated:', plugin.name);
});

pluginManager.on('pluginUnregistered', ({ pluginId }) => {
  console.log('Plugin unregistered:', pluginId);
});
```

---

## Theme System

The theme system provides comprehensive theming support with custom color palettes, typography, and design tokens.

### Architecture

- **Theme Class**: Represents a theme configuration
- **ThemeManager**: Manages themes and theme switching
- **ThemeBuilder**: Utility for building custom themes

### Creating a Theme

#### Using Theme Class

```javascript
import { Theme } from '../src/utils/themes';

const myTheme = new Theme({
  id: 'my-theme',
  name: 'My Theme',
  description: 'My custom theme',
  author: 'Your Name',
  version: '1.0.0',
  mode: 'light', // 'light' or 'dark'
  palette: {
    primary: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#DC004E',
      light: '#F73378',
      dark: '#C51162',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
      elevated: '#FFFFFF',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 14,
  },
  spacing: 8,
  shape: {
    borderRadius: 4,
  },
});
```

#### Using Theme Builder

```javascript
import { themeManager } from '../src/utils/themes';

const theme = themeManager
  .createBuilder('light') // Start with light theme
  .setId('custom-blue')
  .setName('Custom Blue')
  .setDescription('A custom blue theme')
  .setMode('light')
  .setPrimaryColor('#0277BD')
  .setSecondaryColor('#FFC107')
  .setBackgroundColor('#E1F5FE')
  .setFontFamily('"Nunito", sans-serif')
  .setBorderRadius(12)
  .setSpacing(10)
  .build();

// Register the theme
themeManager.registerTheme(theme);
```

### Theme Properties

#### Palette

```javascript
palette: {
  // Primary colors
  primary: {
    main: '#1976D2',
    light: '#42A5F5',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },
  // Secondary colors
  secondary: { main, light, dark, contrastText },
  // Status colors
  error: { main, light, dark, contrastText },
  warning: { main, light, dark, contrastText },
  info: { main, light, dark, contrastText },
  success: { main, light, dark, contrastText },
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
}
```

#### Typography

```javascript
typography: {
  fontFamily: '"Roboto", "Helvetica", sans-serif',
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: { fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.2 },
  h2: { fontSize: '2rem', fontWeight: 300, lineHeight: 1.2 },
  h3: { fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.2 },
  h4: { fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.2 },
  h5: { fontSize: '1.25rem', fontWeight: 400, lineHeight: 1.2 },
  h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.2 },
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
  button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase' },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
}
```

### Using Theme Manager

```javascript
import { themeManager } from '../src/utils/themes';

// Get all themes
const themes = themeManager.getAllThemes();

// Apply a theme
themeManager.applyTheme('dark');

// Get current theme
const currentTheme = themeManager.getCurrentTheme();

// Load theme from storage (auto-applies saved theme)
themeManager.loadFromStorage();

// Import theme from JSON
const themeData = { /* theme config */ };
const importedTheme = themeManager.importTheme(themeData);

// Export theme to JSON
const themeJSON = themeManager.exportTheme('my-theme');

// Listen for theme changes
themeManager.on('themeChanged', ({ theme }) => {
  console.log('Theme changed to:', theme.name);
});

themeManager.on('themeRegistered', ({ theme }) => {
  console.log('New theme registered:', theme.name);
});
```

### Accessibility Validation

```javascript
// Validate theme for accessibility
const validation = theme.validateAccessibility();

if (validation.valid) {
  console.log('Theme passes accessibility checks');
} else {
  console.warn('Accessibility issues:', validation.issues);
  // [
  //   {
  //     severity: 'error',
  //     message: 'Text contrast ratio 3.2 fails WCAG AA (requires 4.5:1)',
  //     colors: { text: '#666666', background: '#FFFFFF' }
  //   }
  // ]
}
```

### CSS Variables

Themes are applied using CSS variables:

```javascript
// Convert theme to CSS variables
const cssVars = theme.toCSSVariables();

// Manual application
const root = document.documentElement;
Object.entries(cssVars).forEach(([key, value]) => {
  root.style.setProperty(key, value);
});

// Or use theme.apply()
theme.apply();
```

**Available CSS Variables:**
```css
/* Palette */
--palette-primary-main
--palette-primary-light
--palette-primary-dark
--palette-primary-contrastText
--palette-background-default
--palette-background-paper
--palette-text-primary
--palette-text-secondary

/* Typography */
--typography-fontFamily
--typography-fontSize

/* Spacing */
--spacing-unit

/* Shape */
--shape-borderRadius
```

### Built-in Themes

Clippy Revival includes several built-in themes:

1. **Light** - Default light theme
2. **Dark** - Default dark theme
3. **Ocean Blue** - Cool blue theme
4. **Deep Purple** - Rich purple dark theme

See `examples/example-themes.json` for more theme examples.

---

## Advanced AI Features

Advanced AI features include context memory, conversation history, and AI personas.

### Context Memory Manager

Manages conversation context with intelligent summarization.

#### Creating Conversations

```javascript
import { contextMemory } from '../src/utils/ai-advanced';

// Create a new conversation
const conversationId = contextMemory.createConversation('conv-1', {
  title: 'My Conversation',
  tags: ['work', 'coding'],
});

// Add messages
contextMemory.addMessage(conversationId, 'user', 'Hello, how are you?');
contextMemory.addMessage(conversationId, 'assistant', 'I am doing well, thank you!');

// Get messages
const messages = contextMemory.getMessages(conversationId);

// Get recent messages (last 10)
const recentMessages = contextMemory.getMessages(conversationId, 10);
```

#### Getting Context for AI

```javascript
// Get context for AI with summary
const context = contextMemory.getContext(conversationId, {
  maxMessages: 10, // Number of recent messages
  includeSystem: true,
});

console.log(context);
// {
//   messages: [{ role: 'user', content: '...' }, ...],
//   summary: { text: 'Summary...', topics: [...] },
//   messageCount: 25,
//   metadata: { createdAt: ..., updatedAt: ... }
// }
```

#### Summarization

```javascript
// Automatically summarizes when threshold reached
// Or manually trigger
await contextMemory.summarizeConversation(conversationId);
```

#### Searching Conversations

```javascript
// Search across all conversations
const results = contextMemory.search('javascript', {
  limit: 10,
});

results.forEach((result) => {
  console.log('Found in:', result.conversationId);
  console.log('Message:', result.message.content);
  console.log('Context:', result.context);
});

// Search in specific conversation
const results = contextMemory.search('error', {
  conversationId: 'conv-1',
  limit: 5,
});
```

#### Marking Important Messages

```javascript
// Mark message as important (1-10 scale)
contextMemory.markImportant(conversationId, messageId, 8);

// Get important messages
const importantMessages = contextMemory.getImportantMessages(conversationId, 5);
```

#### Import/Export

```javascript
// Export conversation
const data = contextMemory.exportConversation(conversationId);

// Save to file
localStorage.setItem('conversation', JSON.stringify(data));

// Import conversation
const data = JSON.parse(localStorage.getItem('conversation'));
contextMemory.importConversation(data);
```

#### Statistics

```javascript
const stats = contextMemory.getStats();
console.log(stats);
// {
//   totalConversations: 10,
//   totalMessages: 250,
//   totalSummaries: 3,
//   oldestConversation: 1640000000000,
//   newestConversation: 1640500000000,
//   avgMessagesPerConversation: 25
// }
```

### AI Personas

Create custom AI personalities with different tones, knowledge, and capabilities.

#### Creating a Persona

```javascript
import { AIPersona, personaManager } from '../src/utils/ai-advanced';

const persona = new AIPersona({
  id: 'expert-coder',
  name: 'Expert Coder',
  description: 'A senior software engineer',
  avatar: '👨‍💻',
  systemPrompt: 'You are an expert software engineer with 15 years of experience.',
  personality: {
    tone: 'technical',
    formality: 'professional',
    enthusiasm: 'moderate',
  },
  knowledge: [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'System Design',
    'Best Practices',
  ],
  capabilities: [
    'write production-ready code',
    'review code for issues',
    'explain complex concepts',
    'design scalable systems',
  ],
  constraints: [
    'always prioritize code quality',
    'suggest best practices',
    'consider security implications',
  ],
  temperature: 0.5, // Lower temperature for consistent, precise responses
});

// Register persona
personaManager.registerPersona(persona);
```

#### Built-in Personas

1. **General Assistant** - Helpful, professional assistant
2. **Coding Assistant** - Technical programming expert
3. **Creative Writer** - Creative storytelling assistant
4. **Friendly Companion** - Warm, encouraging companion

#### Using Personas

```javascript
// Set active persona
personaManager.setActivePersona('expert-coder');

// Get active persona
const activePersona = personaManager.getActivePersona();

// Get AI configuration from persona
const aiConfig = activePersona.getAIConfig();
console.log(aiConfig);
// {
//   systemPrompt: 'You are an expert software engineer...',
//   temperature: 0.5,
//   persona: { name: 'Expert Coder', avatar: '👨‍💻' }
// }

// Use in AI request
const response = await sendToAI({
  message: userMessage,
  ...aiConfig,
});
```

#### Managing Personas

```javascript
// Get all personas
const personas = personaManager.getAllPersonas();

// Import persona from JSON
const personaData = { /* persona config */ };
const persona = personaManager.importPersona(personaData);

// Export persona
const personaJSON = personaManager.exportPersona('expert-coder');

// Save to file
localStorage.setItem('my-persona', JSON.stringify(personaJSON));

// Load from storage (auto-loads last active)
personaManager.loadFromStorage();
```

---

## Examples

### Complete Plugin Example

See `examples/example-plugin.js` for full plugin examples including:
- **WeatherPlugin**: Adds weather commands
- **NotesPlugin**: Simple note-taking functionality

### Theme Examples

See `examples/example-themes.json` for 8 ready-to-use themes:
- Sunset
- Forest
- Cyberpunk
- Ocean
- Midnight
- High Contrast
- Autumn
- Minimalist

---

## Best Practices

### Plugins

1. **Error Handling**: Always wrap operations in try-catch
2. **Cleanup**: Unregister all commands/menu items in onDeactivate
3. **Storage**: Use plugin storage API, not direct localStorage
4. **Permissions**: Declare required permissions in manifest
5. **Versioning**: Follow semantic versioning (semver)

```javascript
async onActivate() {
  try {
    // Register resources
    this.cleanup = this.api.registerCommand(...);
  } catch (error) {
    this.api.showNotification({
      title: 'Plugin Error',
      message: error.message,
      type: 'error',
    });
  }
}

async onDeactivate() {
  // Clean up all resources
  if (this.cleanup) {
    this.cleanup();
  }
}
```

### Themes

1. **Contrast**: Always validate accessibility with `validateAccessibility()`
2. **Consistency**: Use theme tokens, not hardcoded colors
3. **Testing**: Test in both light and dark modes
4. **Typography**: Choose web-safe fonts with fallbacks
5. **Naming**: Use descriptive theme IDs

```javascript
// Good: Use theme tokens
background: var(--palette-background-default);
color: var(--palette-text-primary);

// Bad: Hardcoded colors
background: #FFFFFF;
color: #000000;
```

### AI Features

1. **Context Limits**: Monitor token usage and message count
2. **Summarization**: Let auto-summarization handle long conversations
3. **Important Messages**: Mark key information for retention
4. **Persona Consistency**: Use consistent personas within conversations
5. **Privacy**: Don't store sensitive information in conversations

```javascript
// Good: Monitor token usage
if (conversation.messages.length > 50) {
  await contextMemory.summarizeConversation(conversationId);
}

// Good: Mark important context
contextMemory.markImportant(conversationId, messageId, 8);
```

---

## Troubleshooting

### Plugin Issues

**Issue**: Plugin won't activate
- Check if dependencies are registered
- Verify plugin ID is unique
- Check console for errors during onInit/onActivate

**Issue**: Commands not working
- Ensure commands are registered in onActivate
- Check command ID is correct
- Verify plugin is active

**Issue**: Storage not persisting
- Use plugin storage API: `this.api.getStorage(this.id)`
- Don't use direct localStorage access
- Check browser storage limits

### Theme Issues

**Issue**: Theme not applying
- Call `theme.apply()` after registration
- Check CSS variables in browser DevTools
- Verify theme ID matches

**Issue**: Low contrast warnings
- Use `theme.validateAccessibility()`
- Adjust colors to meet WCAG AA (4.5:1)
- Use contrast checking tools

**Issue**: Fonts not loading
- Ensure font is available or use fallback
- Use web-safe fonts
- Import custom fonts in CSS

### AI Features Issues

**Issue**: Context not preserved
- Check conversation ID is correct
- Ensure messages are being added
- Verify storage isn't full

**Issue**: Summarization not working
- Check if threshold is reached
- Call `summarizeConversation` manually
- Verify messages exist

**Issue**: Persona not affecting responses
- Set active persona: `personaManager.setActivePersona(id)`
- Pass persona config to AI: `persona.getAIConfig()`
- Check system prompt is being sent

---

## API Reference

### Plugin API Methods

- `registerCommand(id, handler, options)` - Register a command
- `unregisterCommand(id)` - Unregister a command
- `executeCommand(id, ...args)` - Execute a command
- `registerMenuItem(location, item)` - Register menu item
- `unregisterMenuItem(location, itemId)` - Unregister menu item
- `registerPanel(id, panel)` - Register a panel
- `unregisterPanel(id)` - Unregister a panel
- `getStorage(pluginId)` - Get plugin storage
- `showNotification(options)` - Show notification
- `getContext()` - Get app context

### Theme Manager Methods

- `registerTheme(theme)` - Register a theme
- `unregisterTheme(themeId)` - Unregister a theme
- `getTheme(themeId)` - Get theme by ID
- `getAllThemes()` - Get all themes
- `applyTheme(themeId)` - Apply a theme
- `getCurrentTheme()` - Get current theme
- `loadFromStorage()` - Load theme from storage
- `importTheme(data)` - Import theme from JSON
- `exportTheme(themeId)` - Export theme to JSON
- `createBuilder(baseThemeId)` - Create theme builder

### Context Memory Methods

- `createConversation(id, metadata)` - Create conversation
- `addMessage(convId, role, content, metadata)` - Add message
- `getMessages(convId, limit)` - Get messages
- `getContext(convId, options)` - Get context for AI
- `summarizeConversation(convId)` - Summarize conversation
- `search(query, options)` - Search conversations
- `markImportant(convId, msgId, importance)` - Mark important
- `getImportantMessages(convId, minImportance)` - Get important
- `exportConversation(convId)` - Export conversation
- `importConversation(data)` - Import conversation
- `getStats()` - Get statistics

### Persona Manager Methods

- `registerPersona(persona)` - Register a persona
- `unregisterPersona(personaId)` - Unregister a persona
- `getPersona(personaId)` - Get persona by ID
- `getAllPersonas()` - Get all personas
- `setActivePersona(personaId)` - Set active persona
- `getActivePersona()` - Get active persona
- `importPersona(data)` - Import persona from JSON
- `exportPersona(personaId)` - Export persona to JSON
- `loadFromStorage()` - Load from storage

---

## Resources

- [Plugin Examples](../examples/example-plugin.js)
- [Theme Examples](../examples/example-themes.json)
- [Plugin System Source](../src/utils/plugins.js)
- [Theme System Source](../src/utils/themes.js)
- [AI Advanced Source](../src/utils/ai-advanced.js)

---

## Contributing

To contribute plugins or themes:

1. Create your plugin/theme following the examples
2. Test thoroughly
3. Document features and requirements
4. Submit a pull request with examples

For questions or issues, please open an issue on GitHub.
