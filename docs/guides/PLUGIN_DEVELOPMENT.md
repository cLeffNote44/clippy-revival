# Clippy Revival - Plugin Development Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-08

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Plugin Structure](#plugin-structure)
4. [Plugin Manifest](#plugin-manifest)
5. [Plugin API Reference](#plugin-api-reference)
6. [Permissions System](#permissions-system)
7. [Example Plugins](#example-plugins)
8. [Best Practices](#best-practices)
9. [Security Guidelines](#security-guidelines)
10. [Testing Plugins](#testing-plugins)
11. [Publishing Plugins](#publishing-plugins)

---

## Introduction

The Clippy Revival plugin system allows developers to extend Clippy's functionality with custom features. Plugins run in a sandboxed environment with granular permissions and have access to a rich API for interacting with the system, AI, notifications, and more.

### Key Features

- **Sandboxed Execution**: Plugins run in isolated environments with permission-based access control
- **Rich API**: Access AI chat, system metrics, notifications, storage, scheduling, and HTTP requests
- **Easy Distribution**: Simple JSON manifest and JavaScript implementation
- **Hot Reload**: Enable, disable, and reload plugins without restarting Clippy
- **Settings Management**: Built-in UI for plugin configuration

---

## Getting Started

### Prerequisites

- Clippy Revival 1.0.0 or higher
- Basic knowledge of JavaScript
- Text editor or IDE

### Creating Your First Plugin

1. **Create Plugin Directory**
   ```bash
   mkdir plugins/my-first-plugin
   cd plugins/my-first-plugin
   ```

2. **Create Plugin Manifest** (`plugin.json`)
   ```json
   {
     "id": "my-first-plugin",
     "name": "My First Plugin",
     "version": "1.0.0",
     "description": "My awesome Clippy plugin",
     "author": {
       "name": "Your Name",
       "email": "your.email@example.com"
     },
     "entry": "index.js",
     "permissions": ["notifications.show"],
     "category": "utilities",
     "license": "MIT"
   }
   ```

3. **Create Plugin Code** (`index.js`)
   ```javascript
   function activate(api) {
     api.log_info('My plugin activated!');
     api.show_notification(
       'Hello!',
       'My first plugin is running!',
       'info'
     );
   }

   function deactivate() {
     clippy.log_info('My plugin deactivated!');
   }
   ```

4. **Install and Enable**
   - Open Clippy Revival
   - Navigate to Settings → Manage Plugins
   - Your plugin should appear in the list
   - Toggle the switch to enable it

---

## Plugin Structure

A plugin consists of at minimum two files:

```
plugins/
└── my-plugin/
    ├── plugin.json      # Plugin manifest (required)
    ├── index.js         # Main plugin code (required)
    ├── icon.png         # Plugin icon (optional, 256x256 recommended)
    ├── README.md        # Plugin documentation (optional)
    └── settings.json    # User settings (auto-generated)
```

### File Descriptions

- **plugin.json**: Manifest describing your plugin's metadata, permissions, and settings
- **index.js**: Main JavaScript file containing `activate()` and `deactivate()` functions
- **icon.png**: Visual icon displayed in the plugin manager
- **README.md**: Documentation for your plugin
- **settings.json**: Automatically created to store user-configured settings

---

## Plugin Manifest

The `plugin.json` file defines your plugin's metadata and requirements.

### Required Fields

```json
{
  "id": "unique-plugin-id",
  "name": "Human Readable Name",
  "version": "1.0.0",
  "entry": "index.js",
  "author": {
    "name": "Author Name"
  }
}
```

### Complete Schema

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Plugin description (max 200 chars)",
  "author": {
    "name": "Your Name",
    "email": "your@email.com",
    "url": "https://yourwebsite.com"
  },
  "entry": "index.js",
  "icon": "icon.png",
  "permissions": [
    "ai.chat",
    "notifications.show"
  ],
  "settings": [
    {
      "key": "enable_feature",
      "type": "boolean",
      "label": "Enable Feature",
      "description": "Enable this awesome feature",
      "default": true
    }
  ],
  "category": "productivity",
  "license": "MIT",
  "keywords": ["automation", "productivity"],
  "minClippyVersion": "1.0.0",
  "homepage": "https://github.com/user/plugin",
  "repository": "https://github.com/user/plugin"
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (lowercase, alphanumeric, hyphens only) |
| `name` | string | Yes | Display name (1-50 characters) |
| `version` | string | Yes | Semantic version (x.y.z) |
| `entry` | string | Yes | Main JavaScript file |
| `author` | object | Yes | Author information |
| `description` | string | No | Short description (max 200 chars) |
| `icon` | string | No | Icon file path |
| `permissions` | array | No | Required permissions (see Permissions section) |
| `settings` | array | No | Plugin settings schema |
| `category` | string | No | Plugin category |
| `license` | string | No | SPDX license identifier |
| `keywords` | array | No | Search keywords (max 10) |
| `minClippyVersion` | string | No | Minimum Clippy version required |
| `homepage` | string | No | Plugin website URL |
| `repository` | string | No | Source code repository URL |

---

## Plugin API Reference

The Plugin API is accessed via the `api` parameter passed to your `activate()` function.

### AI Methods

#### `chat(message, session_id?)`
Send a message to AI and get a response.

```javascript
const response = api.chat('What is the weather like?', 'my-plugin-session');
console.log(response.response); // AI's response text
```

**Required Permission:** `ai.chat`

#### `get_models()`
Get list of available AI models.

```javascript
const models = api.get_models();
console.log(models); // ['llama3.2', 'mistral', ...]
```

**Required Permission:** `ai.models`

---

### System Methods

#### `get_system_metrics()`
Get current system resource metrics.

```javascript
const metrics = api.get_system_metrics();
console.log(metrics);
// {
//   cpu: 45.2,
//   memory: 62.8,
//   disk: 70.5,
//   network: { sent: 1024, received: 2048 }
// }
```

**Required Permission:** `system.metrics`

---

### Notification Methods

#### `show_notification(title, message, icon?)`
Display a desktop notification.

```javascript
api.show_notification(
  'Task Complete',
  'Your task has finished successfully!',
  'success'
);
```

**Icons:** `info`, `success`, `warning`, `error`

**Required Permission:** `notifications.show`

---

### Storage Methods

#### `get_storage(key, default?)`
Get a value from plugin persistent storage.

```javascript
const lastRun = api.get_storage('last_run', null);
```

**Required Permission:** `storage.read`

#### `set_storage(key, value)`
Set a value in plugin persistent storage.

```javascript
api.set_storage('last_run', new Date().toISOString());
```

**Required Permission:** `storage.write`

---

### Settings Methods

#### `get_setting(key, default?)`
Get a plugin setting value.

```javascript
const interval = api.get_setting('check_interval', 5);
```

**No permission required** - Settings are plugin-specific.

#### `set_setting(key, value)`
Set a plugin setting value.

```javascript
api.set_setting('check_interval', 10);
```

**No permission required** - Settings are plugin-specific.

---

### Scheduler Methods

#### `create_task(name, action, schedule_type, schedule_value)`
Create a scheduled task.

```javascript
const taskId = api.create_task(
  'Daily Backup',
  'backup_data',
  'interval',
  86400  // seconds (1 day)
);
```

**Schedule Types:**
- `interval`: Run every N seconds
- `cron`: Cron expression (future support)
- `once`: Run once at specific time (future support)

**Required Permission:** `scheduler.create`

---

### HTTP Methods

#### `http_get(url, headers?)`
Make an HTTP GET request.

```javascript
const response = api.http_get('https://api.example.com/data', {
  'Authorization': 'Bearer token'
});
console.log(response.status);  // 200
console.log(response.body);    // Response body
```

**Required Permission:** `network.http`

#### `http_post(url, data?, headers?)`
Make an HTTP POST request.

```javascript
const response = api.http_post('https://api.example.com/data', {
  name: 'Test',
  value: 123
});
```

**Required Permission:** `network.http`

---

### Logging Methods

#### `log_info(message)`
Log an info message.

```javascript
api.log_info('Plugin started successfully');
```

**No permission required**

#### `log_error(message)`
Log an error message.

```javascript
api.log_error('Failed to connect to API');
```

**No permission required**

#### `log_warning(message)`
Log a warning message.

```javascript
api.log_warning('Rate limit approaching');
```

**No permission required**

---

## Permissions System

Plugins must declare required permissions in their manifest. Users can review permissions before enabling a plugin.

### Available Permissions

| Permission | Level | Description |
|------------|-------|-------------|
| `ai.chat` | Low | Send messages to AI |
| `ai.models` | Low | List available AI models |
| `system.metrics` | Low | Read system metrics |
| `system.execute` | **High** | Execute system commands |
| `files.read` | Medium | Read files from disk |
| `files.write` | **High** | Write files to disk |
| `files.delete` | **High** | Delete files |
| `network.http` | Medium | Make HTTP requests |
| `network.websocket` | Medium | Use WebSocket connections |
| `notifications.show` | Low | Show notifications |
| `clipboard.read` | Medium | Read clipboard content |
| `clipboard.write` | Medium | Write to clipboard |
| `scheduler.create` | Low | Create scheduled tasks |
| `scheduler.read` | Low | Read scheduled tasks |
| `storage.read` | Low | Read plugin storage |
| `storage.write` | Low | Write plugin storage |

### Permission Levels

- **Low Risk**: Safe operations that don't modify system state
- **Medium Risk**: Operations that access sensitive data or network
- **High Risk**: Operations that can modify or delete data

---

## Example Plugins

### Hello World Plugin

Simple plugin demonstrating basic notifications and storage.

**Location:** `plugins/hello-world/`

**Features:**
- Shows greeting notification on activation
- Tracks activation count
- Demonstrates settings usage

### System Monitor Plugin

Advanced plugin with AI integration and scheduling.

**Location:** `plugins/system-monitor/`

**Features:**
- Monitors system resources (CPU, memory, disk)
- Uses AI to provide performance insights
- Creates scheduled tasks for periodic monitoring
- Sends alerts when thresholds are exceeded

### Clipboard History Plugin

Complex plugin showcasing storage and AI categorization.

**Location:** `plugins/clipboard-history/`

**Features:**
- Tracks clipboard history
- AI-powered categorization
- Search functionality
- Automatic cleanup of old items

---

## Best Practices

### Code Organization

1. **Keep it Simple**: Each plugin should do one thing well
2. **Error Handling**: Always wrap API calls in try-catch blocks
3. **Cleanup**: Use `deactivate()` to clean up resources
4. **Logging**: Use appropriate log levels (info, warning, error)

### Performance

1. **Async Operations**: Don't block the main thread
2. **Resource Cleanup**: Remove event listeners and timers in `deactivate()`
3. **Efficient Storage**: Don't store large amounts of data
4. **Rate Limiting**: Limit API calls and HTTP requests

### User Experience

1. **Clear Notifications**: Use concise, actionable notification messages
2. **Sensible Defaults**: Provide good default settings
3. **Documentation**: Include a README explaining your plugin
4. **Versioning**: Follow semantic versioning

### Example: Error Handling

```javascript
function activate(api) {
  try {
    const metrics = api.get_system_metrics();
    api.show_notification('System Status', `CPU: ${metrics.cpu}%`, 'info');
  } catch (error) {
    api.log_error(`Failed to get metrics: ${error}`);
    api.show_notification('Error', 'Failed to read system metrics', 'error');
  }
}
```

---

## Security Guidelines

### DO

- ✅ Request only necessary permissions
- ✅ Validate all user input
- ✅ Use HTTPS for API calls
- ✅ Store sensitive data securely
- ✅ Handle errors gracefully
- ✅ Document security requirements

### DON'T

- ❌ Store passwords in plain text
- ❌ Make requests to untrusted URLs
- ❌ Execute arbitrary code
- ❌ Access system files unnecessarily
- ❌ Bypass permission checks
- ❌ Include malicious code

### Security Checklist

- [ ] All permissions are justified and documented
- [ ] User input is validated and sanitized
- [ ] API keys are stored securely (use storage API)
- [ ] HTTP requests use HTTPS
- [ ] Error messages don't leak sensitive information
- [ ] Plugin doesn't execute user-provided code

---

## Testing Plugins

### Manual Testing

1. **Enable Plugin**: Test activation process
2. **Check Logs**: Review `backend/logs/clippy.log` for plugin messages
3. **Test Settings**: Verify settings UI and persistence
4. **Test Permissions**: Ensure permission checks work
5. **Disable Plugin**: Test cleanup and deactivation

### Testing Checklist

- [ ] Plugin loads without errors
- [ ] Activation shows expected behavior
- [ ] Settings persist across restarts
- [ ] Permissions are enforced
- [ ] Notifications display correctly
- [ ] Storage works properly
- [ ] Deactivation cleans up resources
- [ ] No memory leaks after enable/disable cycles

### Debugging

Enable debug logging in Clippy:

```javascript
// In your plugin
api.log_info('Debug: Current state = ' + JSON.stringify(state));
```

Check logs:
```bash
tail -f backend/logs/clippy.log
```

---

## Publishing Plugins

### Preparation

1. **Complete Manifest**: Fill in all metadata fields
2. **Add README**: Document installation and usage
3. **Add Icon**: Create a 256x256 PNG icon
4. **Test Thoroughly**: Follow testing checklist
5. **Choose License**: Add LICENSE file

### Distribution

Currently, plugins are distributed by copying the plugin folder to `plugins/` directory.

**Future:** Plugin marketplace with automatic installation.

### Plugin Package Structure

```
my-plugin-1.0.0.zip
└── my-plugin/
    ├── plugin.json
    ├── index.js
    ├── icon.png
    ├── README.md
    └── LICENSE
```

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

---

## API Roadmap

### Planned Features

- **File System API**: Read/write files with user permission
- **Clipboard API**: Full clipboard read/write support
- **UI Extensions**: Add custom UI panels
- **Database API**: SQLite database access
- **WebSocket API**: Real-time communication
- **Event System**: Subscribe to Clippy events
- **Inter-Plugin Communication**: Plugins can talk to each other

### Experimental APIs

Some APIs are in development and may change:

- `system.execute()` - Execute system commands (high security risk)
- `files.*` - File system operations
- `clipboard.*` - Clipboard operations

---

## Support & Resources

- **Documentation**: This guide
- **GitHub Issues**: https://github.com/cLeffNote44/clippy-revival/issues
- **Example Plugins**: See `plugins/` directory
- **API Reference**: See Plugin API Reference section above

---

## Changelog

### Version 1.0.0 (2025-11-08)

- Initial plugin system release
- Core API implementation
- Permission system
- Plugin manager UI
- Example plugins

---

**Happy Plugin Development! 📎**

For questions or feedback, please open an issue on GitHub or contact the Clippy Revival team.
