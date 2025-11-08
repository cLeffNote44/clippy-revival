/**
 * Clipboard History Plugin
 * Tracks clipboard history and provides quick access
 *
 * Note: Actual clipboard reading/writing requires additional API implementation
 * This is a demonstration of how the plugin would work
 */

let checkTaskId = null;
let lastClipboardContent = '';

// This function is called when the plugin is enabled
function activate(api) {
  api.log_info('Clipboard History plugin activated!');

  // Get settings
  const maxHistoryItems = api.get_setting('max_history_items', 50);
  const checkInterval = api.get_setting('check_interval', 2);
  const enableNotifications = api.get_setting('enable_notifications', false);
  const aiCategorization = api.get_setting('ai_categorization', false);

  // Initialize clipboard history if not exists
  let history = api.get_storage('clipboard_history', []);
  api.log_info(`Loaded ${history.length} clipboard history items`);

  // Store settings for use in checks
  api.set_storage('max_history_items', maxHistoryItems);
  api.set_storage('enable_notifications', enableNotifications);
  api.set_storage('ai_categorization', aiCategorization);

  // Schedule clipboard checks
  // Note: In a real implementation, this would periodically check the system clipboard
  try {
    checkTaskId = api.create_task(
      'Clipboard Check',
      'clipboard_history_check',
      'interval',
      checkInterval
    );

    api.log_info(`Scheduled clipboard check every ${checkInterval} second(s)`);
  } catch (error) {
    api.log_error(`Failed to create scheduled task: ${error}`);
  }

  // Show activation notification
  api.show_notification(
    'Clipboard History',
    `Tracking up to ${maxHistoryItems} clipboard items`,
    'info'
  );

  // Provide usage tips
  const stats = getClipboardStats(api);
  api.show_notification(
    'Clipboard Stats',
    `Total items tracked: ${stats.totalItems}, Most common type: ${stats.mostCommonType}`,
    'info'
  );
}

// This function is called when the plugin is disabled
function deactivate() {
  clippy.log_info('Clipboard History plugin deactivated!');

  const stats = getClipboardStats(clippy);

  clippy.show_notification(
    'Clipboard History',
    `Plugin disabled. Total items tracked: ${stats.totalItems}`,
    'info'
  );
}

// Add item to clipboard history
function addToHistory(api, content, type = 'text') {
  try {
    // Get current history
    let history = api.get_storage('clipboard_history', []);

    // Don't add if it's the same as the last item
    if (history.length > 0 && history[0].content === content) {
      return;
    }

    // Create new history item
    const item = {
      content: content,
      type: type,
      timestamp: new Date().toISOString(),
      category: 'uncategorized'
    };

    // Use AI to categorize if enabled
    const aiCategorization = api.get_storage('ai_categorization', false);
    if (aiCategorization && content.length < 500) {
      try {
        const prompt = `Categorize this clipboard content into one word (code, url, email, text, number, or other): "${content.substring(0, 100)}"`;
        const response = api.chat(prompt, 'clipboard-categorization');

        if (response && response.response) {
          item.category = response.response.toLowerCase().trim();
        }
      } catch (error) {
        api.log_warning(`AI categorization failed: ${error}`);
      }
    }

    // Add to history (at the beginning)
    history.unshift(item);

    // Limit history size
    const maxHistoryItems = api.get_storage('max_history_items', 50);
    if (history.length > maxHistoryItems) {
      history = history.slice(0, maxHistoryItems);
    }

    // Save updated history
    api.set_storage('clipboard_history', history);

    // Show notification if enabled
    const enableNotifications = api.get_storage('enable_notifications', false);
    if (enableNotifications) {
      const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
      api.show_notification(
        'Clipboard Updated',
        `Saved: ${preview}`,
        'info'
      );
    }

    // Update statistics
    let totalCopies = api.get_storage('total_copies', 0);
    totalCopies++;
    api.set_storage('total_copies', totalCopies);

    api.log_info(`Added item to clipboard history. Total items: ${history.length}`);

  } catch (error) {
    api.log_error(`Failed to add to clipboard history: ${error}`);
  }
}

// Get clipboard statistics
function getClipboardStats(api) {
  const history = api.get_storage('clipboard_history', []);
  const totalCopies = api.get_storage('total_copies', 0);

  // Count by category
  const categoryCounts = {};
  history.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  // Find most common category
  let mostCommonType = 'none';
  let maxCount = 0;
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = category;
    }
  }

  return {
    totalItems: history.length,
    totalCopies: totalCopies,
    mostCommonType: mostCommonType,
    categoryCounts: categoryCounts
  };
}

// Search clipboard history
function searchHistory(api, query) {
  const history = api.get_storage('clipboard_history', []);

  const results = history.filter(item =>
    item.content.toLowerCase().includes(query.toLowerCase())
  );

  api.log_info(`Found ${results.length} items matching "${query}"`);

  return results;
}

// Clear old clipboard history
function clearOldHistory(api, daysOld = 30) {
  let history = api.get_storage('clipboard_history', []);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const originalCount = history.length;
  history = history.filter(item =>
    new Date(item.timestamp) > cutoffDate
  );

  api.set_storage('clipboard_history', history);
  const removedCount = originalCount - history.length;

  api.log_info(`Removed ${removedCount} old clipboard items`);
  api.show_notification(
    'Clipboard Cleanup',
    `Removed ${removedCount} items older than ${daysOld} days`,
    'info'
  );

  return removedCount;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    activate,
    deactivate,
    addToHistory,
    getClipboardStats,
    searchHistory,
    clearOldHistory
  };
}
