# Clippy Revival Plugins

This directory contains plugins for Clippy Revival. Plugins extend Clippy's functionality with custom features.

## Included Example Plugins

### 1. Hello World (`hello-world/`)
A simple example plugin demonstrating:
- Basic notifications
- Settings management
- Storage API usage
- Activation tracking

**Permissions Required:** `notifications.show`, `storage.read`, `storage.write`

### 2. System Monitor (`system-monitor/`)
Advanced monitoring plugin featuring:
- Real-time system resource monitoring
- AI-powered performance insights
- Scheduled health checks
- Alert notifications when thresholds are exceeded

**Permissions Required:** `system.metrics`, `ai.chat`, `notifications.show`, `storage.read`, `storage.write`, `scheduler.create`

### 3. Clipboard History (`clipboard-history/`)
Productivity plugin that provides:
- Clipboard history tracking
- AI-powered content categorization
- Search functionality
- Automatic cleanup of old items

**Permissions Required:** `clipboard.read`, `clipboard.write`, `notifications.show`, `storage.read`, `storage.write`, `scheduler.create`, `ai.chat`

## Installing Plugins

1. Copy plugin folder to this `plugins/` directory
2. Open Clippy Revival
3. Navigate to Settings → Manage Plugins
4. Find your plugin in the list
5. Toggle the switch to enable it

## Creating Plugins

See [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md) for a comprehensive guide on creating your own plugins.

### Quick Start

```bash
# Create new plugin directory
mkdir plugins/my-plugin
cd plugins/my-plugin

# Create manifest
cat > plugin.json << EOF
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "author": { "name": "Your Name" },
  "entry": "index.js",
  "permissions": ["notifications.show"]
}
EOF

# Create plugin code
cat > index.js << EOF
function activate(api) {
  api.show_notification('Hello!', 'My plugin is running!', 'info');
}

function deactivate() {
  clippy.log_info('Plugin deactivated');
}
EOF
```

## Plugin Structure

Each plugin requires at minimum:
- `plugin.json` - Plugin manifest with metadata
- `index.js` - Main JavaScript file with `activate()` and `deactivate()` functions

Optional files:
- `icon.png` - Plugin icon (256x256 recommended)
- `README.md` - Plugin documentation
- `settings.json` - User settings (auto-generated)

## Security

Plugins run in a sandboxed environment with permission-based access control. Users must approve permissions before enabling plugins.

### Permission Levels
- **Low Risk**: Safe operations (notifications, storage)
- **Medium Risk**: Sensitive data access (network, clipboard)
- **High Risk**: System modifications (file operations, command execution)

## Resources

- **Development Guide**: [PLUGIN_DEVELOPMENT.md](../PLUGIN_DEVELOPMENT.md)
- **API Reference**: See development guide
- **GitHub**: https://github.com/cLeffNote44/clippy-revival
- **Issues**: https://github.com/cLeffNote44/clippy-revival/issues

---

**Happy Plugin Development! 📎**
