/**
 * Hello World Plugin
 * Demonstrates basic plugin capabilities
 */

// This function is called when the plugin is enabled
function activate(api) {
  api.log_info('Hello World plugin activated!');

  // Get plugin settings
  const greetingMessage = api.get_setting('greeting_message', 'Hello from Clippy!');
  const showOnStartup = api.get_setting('show_on_startup', true);

  // Show notification on startup if enabled
  if (showOnStartup) {
    api.show_notification(
      'Hello World Plugin',
      greetingMessage,
      'info'
    );
  }

  // Store activation time
  const activationTime = new Date().toISOString();
  api.set_storage('last_activated', activationTime);

  // Get activation count
  let activationCount = api.get_storage('activation_count', 0);
  activationCount++;
  api.set_storage('activation_count', activationCount);

  api.log_info(`This plugin has been activated ${activationCount} time(s)`);

  // Log the activation
  api.show_notification(
    'Plugin Stats',
    `Activated ${activationCount} time(s). Last: ${activationTime}`,
    'info'
  );
}

// This function is called when the plugin is disabled
function deactivate() {
  clippy.log_info('Hello World plugin deactivated!');

  clippy.show_notification(
    'Goodbye',
    'Hello World plugin has been disabled',
    'info'
  );
}

// Export functions (not needed in current implementation as they're called directly)
// But useful for documentation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { activate, deactivate };
}
