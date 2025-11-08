/**
 * System Monitor Plugin
 * Monitors system resources and provides AI-powered insights
 */

let checkTaskId = null;

// This function is called when the plugin is enabled
function activate(api) {
  api.log_info('System Monitor plugin activated!');

  // Get settings
  const checkInterval = api.get_setting('check_interval', 5);
  const cpuThreshold = api.get_setting('cpu_threshold', 80);
  const memoryThreshold = api.get_setting('memory_threshold', 85);
  const enableAiInsights = api.get_setting('enable_ai_insights', true);

  // Store thresholds for use in scheduled task
  api.set_storage('cpu_threshold', cpuThreshold);
  api.set_storage('memory_threshold', memoryThreshold);
  api.set_storage('enable_ai_insights', enableAiInsights);

  // Initial system check
  performSystemCheck(api);

  // Schedule periodic system checks
  try {
    checkTaskId = api.create_task(
      'System Health Check',
      'system_monitor_check',
      'interval',
      checkInterval * 60  // Convert minutes to seconds
    );

    api.log_info(`Scheduled system check every ${checkInterval} minute(s)`);
  } catch (error) {
    api.log_error(`Failed to create scheduled task: ${error}`);
  }

  // Show activation notification
  api.show_notification(
    'System Monitor',
    `Monitoring system every ${checkInterval} minutes`,
    'info'
  );
}

// This function is called when the plugin is disabled
function deactivate() {
  clippy.log_info('System Monitor plugin deactivated!');

  clippy.show_notification(
    'System Monitor',
    'System monitoring has been disabled',
    'info'
  );
}

// Perform system health check
function performSystemCheck(api) {
  try {
    // Get system metrics
    const metrics = api.get_system_metrics();

    api.log_info(`System Check - CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%`);

    // Store latest metrics
    api.set_storage('last_check', new Date().toISOString());
    api.set_storage('last_metrics', metrics);

    // Check thresholds
    const cpuThreshold = api.get_storage('cpu_threshold', 80);
    const memoryThreshold = api.get_storage('memory_threshold', 85);
    const enableAiInsights = api.get_storage('enable_ai_insights', true);

    let alerts = [];

    if (metrics.cpu > cpuThreshold) {
      alerts.push(`CPU usage is high: ${metrics.cpu}%`);
    }

    if (metrics.memory > memoryThreshold) {
      alerts.push(`Memory usage is high: ${metrics.memory}%`);
    }

    // Show alerts if any
    if (alerts.length > 0) {
      const alertMessage = alerts.join('. ');

      api.show_notification(
        'System Alert',
        alertMessage,
        'warning'
      );

      // Get AI insights if enabled
      if (enableAiInsights) {
        try {
          const aiPrompt = `System Alert: ${alertMessage}. Current metrics - CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%, Disk: ${metrics.disk}%. Provide a brief (2-3 sentences) recommendation on what the user should do.`;

          const aiResponse = api.chat(aiPrompt, 'system-monitor-insights');

          // Show AI recommendation
          api.show_notification(
            'AI Recommendation',
            aiResponse.response || 'Unable to generate recommendation',
            'info'
          );

          api.log_info('AI insights generated successfully');
        } catch (error) {
          api.log_error(`Failed to get AI insights: ${error}`);
        }
      }

      // Track alert count
      let alertCount = api.get_storage('alert_count', 0);
      alertCount++;
      api.set_storage('alert_count', alertCount);
    }

    // Update check count
    let checkCount = api.get_storage('check_count', 0);
    checkCount++;
    api.set_storage('check_count', checkCount);

  } catch (error) {
    api.log_error(`System check failed: ${error}`);
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { activate, deactivate, performSystemCheck };
}
