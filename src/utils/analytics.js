/**
 * Privacy-Focused Analytics and Telemetry
 *
 * Provides optional, privacy-focused analytics for improving the application.
 * All telemetry is opt-in and anonymous.
 *
 * @module utils/analytics
 */

/**
 * Analytics Event Types
 */
export const EventTypes = {
  // Application lifecycle
  APP_START: 'app_start',
  APP_EXIT: 'app_exit',
  APP_ERROR: 'app_error',

  // User interactions
  FEATURE_USED: 'feature_used',
  COMMAND_EXECUTED: 'command_executed',
  PLUGIN_ACTIVATED: 'plugin_activated',
  THEME_CHANGED: 'theme_changed',

  // Performance
  PERFORMANCE_METRIC: 'performance_metric',
  API_CALL: 'api_call',

  // AI interactions
  AI_MESSAGE_SENT: 'ai_message_sent',
  AI_RESPONSE_RECEIVED: 'ai_response_received',
  AI_ERROR: 'ai_error',
};

/**
 * Analytics Event
 *
 * Represents a single analytics event
 */
export class AnalyticsEvent {
  constructor(type, properties = {}) {
    this.id = this.generateId();
    this.type = type;
    this.properties = this.sanitizeProperties(properties);
    this.timestamp = Date.now();
    this.sessionId = this.getSessionId();
  }

  /**
   * Generate unique event ID
   */
  generateId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Sanitize properties to remove PII
   */
  sanitizeProperties(properties) {
    const sanitized = {};
    const sensitiveKeys = ['email', 'password', 'token', 'key', 'secret', 'address', 'phone'];

    for (const [key, value] of Object.entries(properties)) {
      // Skip sensitive keys
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        continue;
      }

      // Sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeProperties(value);
      } else if (typeof value === 'string') {
        // Truncate long strings to prevent PII leakage
        sanitized[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      properties: this.properties,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
    };
  }
}

/**
 * Analytics Manager
 *
 * Manages analytics collection and reporting
 */
export class AnalyticsManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : this.getConsentStatus();
    this.endpoint = options.endpoint || null;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000; // 30 seconds

    this.events = [];
    this.queue = [];
    this.flushTimer = null;

    if (this.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Get user consent status
   */
  getConsentStatus() {
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'true';
  }

  /**
   * Set user consent
   */
  setConsent(enabled) {
    this.enabled = enabled;
    localStorage.setItem('analytics_consent', enabled.toString());

    if (enabled) {
      this.startFlushTimer();
    } else {
      this.stopFlushTimer();
      this.clearEvents();
    }
  }

  /**
   * Track an event
   */
  track(type, properties = {}) {
    if (!this.enabled) {
      return;
    }

    const event = new AnalyticsEvent(type, properties);
    this.events.push(event);
    this.queue.push(event);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.type, event.properties);
    }

    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }

    return event;
  }

  /**
   * Track application start
   */
  trackAppStart() {
    return this.track(EventTypes.APP_START, {
      platform: this.getPlatform(),
      version: this.getVersion(),
    });
  }

  /**
   * Track application exit
   */
  trackAppExit() {
    return this.track(EventTypes.APP_EXIT, {
      sessionDuration: this.getSessionDuration(),
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, metadata = {}) {
    return this.track(EventTypes.FEATURE_USED, {
      feature: featureName,
      ...metadata,
    });
  }

  /**
   * Track command execution
   */
  trackCommandExecution(commandId, metadata = {}) {
    return this.track(EventTypes.COMMAND_EXECUTED, {
      command: commandId,
      ...metadata,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metricName, value, metadata = {}) {
    return this.track(EventTypes.PERFORMANCE_METRIC, {
      metric: metricName,
      value,
      ...metadata,
    });
  }

  /**
   * Track API call
   */
  trackAPICall(endpoint, method, duration, statusCode) {
    return this.track(EventTypes.API_CALL, {
      endpoint,
      method,
      duration,
      statusCode,
      success: statusCode >= 200 && statusCode < 300,
    });
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    return this.track(EventTypes.APP_ERROR, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500), // Limit stack trace length
      ...context,
    });
  }

  /**
   * Flush events to server
   */
  async flush() {
    if (this.queue.length === 0 || !this.endpoint) {
      return;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend.map((e) => e.toJSON()),
        }),
      });

      if (!response.ok) {
        console.error('Failed to send analytics events:', response.statusText);
        // Re-queue events on failure
        this.queue.push(...eventsToSend);
      }
    } catch (error) {
      console.error('Error sending analytics events:', error);
      // Re-queue events on failure
      this.queue.push(...eventsToSend);
    }
  }

  /**
   * Start automatic flush timer
   */
  startFlushTimer() {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
    this.queue = [];
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const eventsByType = {};

    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      queuedEvents: this.queue.length,
      eventsByType,
      enabled: this.enabled,
      sessionId: new AnalyticsEvent('temp').getSessionId(),
    };
  }

  /**
   * Get platform info
   */
  getPlatform() {
    if (typeof navigator !== 'undefined') {
      return {
        os: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 100), // Truncate to prevent fingerprinting
      };
    }
    return { os: 'unknown', userAgent: 'unknown' };
  }

  /**
   * Get application version
   */
  getVersion() {
    // This should be replaced with actual version from package.json
    return process.env.APP_VERSION || '1.0.0';
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    const sessionStart = sessionStorage.getItem('session_start_time');
    if (!sessionStart) {
      return 0;
    }
    return Date.now() - parseInt(sessionStart, 10);
  }
}

/**
 * Usage Metrics Collector
 *
 * Collects usage metrics for feature optimization
 */
export class UsageMetricsCollector {
  constructor() {
    this.features = new Map();
    this.commands = new Map();
    this.sessions = [];
    this.startTime = Date.now();
  }

  /**
   * Record feature usage
   */
  recordFeatureUsage(featureName) {
    const current = this.features.get(featureName) || {
      name: featureName,
      count: 0,
      firstUsed: Date.now(),
      lastUsed: Date.now(),
    };

    current.count++;
    current.lastUsed = Date.now();

    this.features.set(featureName, current);
  }

  /**
   * Record command usage
   */
  recordCommandUsage(commandId, duration = 0) {
    const current = this.commands.get(commandId) || {
      id: commandId,
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      firstUsed: Date.now(),
      lastUsed: Date.now(),
    };

    current.count++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.count;
    current.lastUsed = Date.now();

    this.commands.set(commandId, current);
  }

  /**
   * Start new session
   */
  startSession() {
    const session = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      events: [],
    };

    this.sessions.push(session);
    return session;
  }

  /**
   * End current session
   */
  endSession() {
    if (this.sessions.length === 0) {
      return;
    }

    const session = this.sessions[this.sessions.length - 1];
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
  }

  /**
   * Get top features
   */
  getTopFeatures(limit = 10) {
    const features = Array.from(this.features.values());
    return features
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((f) => ({
        name: f.name,
        count: f.count,
        lastUsed: f.lastUsed,
      }));
  }

  /**
   * Get top commands
   */
  getTopCommands(limit = 10) {
    const commands = Array.from(this.commands.values());
    return commands
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        count: c.count,
        avgDuration: Math.round(c.avgDuration),
      }));
  }

  /**
   * Get usage summary
   */
  getUsageSummary() {
    const totalFeatures = this.features.size;
    const totalCommands = this.commands.size;
    const totalFeatureUsage = Array.from(this.features.values()).reduce(
      (sum, f) => sum + f.count,
      0
    );
    const totalCommandUsage = Array.from(this.commands.values()).reduce(
      (sum, c) => sum + c.count,
      0
    );
    const totalSessions = this.sessions.length;
    const avgSessionDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;

    return {
      uptime: Date.now() - this.startTime,
      features: {
        total: totalFeatures,
        totalUsage: totalFeatureUsage,
        top: this.getTopFeatures(5),
      },
      commands: {
        total: totalCommands,
        totalUsage: totalCommandUsage,
        top: this.getTopCommands(5),
      },
      sessions: {
        total: totalSessions,
        avgDuration: Math.round(avgSessionDuration),
      },
    };
  }

  /**
   * Export data for analysis
   */
  exportData() {
    return {
      features: Array.from(this.features.values()),
      commands: Array.from(this.commands.values()),
      sessions: this.sessions,
      summary: this.getUsageSummary(),
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.features.clear();
    this.commands.clear();
    this.sessions = [];
  }
}

/**
 * Privacy-Safe Logger
 *
 * Logs events while respecting user privacy
 */
export class PrivacyLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.logLevel = options.logLevel || 'info';
    this.maxLogs = options.maxLogs || 1000;
    this.logs = [];
  }

  /**
   * Log levels
   */
  static LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  };

  /**
   * Get log level value
   */
  getLogLevelValue(level) {
    const levelMap = {
      error: PrivacyLogger.LogLevel.ERROR,
      warn: PrivacyLogger.LogLevel.WARN,
      info: PrivacyLogger.LogLevel.INFO,
      debug: PrivacyLogger.LogLevel.DEBUG,
    };
    return levelMap[level] || PrivacyLogger.LogLevel.INFO;
  }

  /**
   * Should log at level
   */
  shouldLog(level) {
    return this.enabled && this.getLogLevelValue(level) <= this.getLogLevelValue(this.logLevel);
  }

  /**
   * Sanitize message to remove PII
   */
  sanitize(message) {
    if (typeof message !== 'string') {
      return message;
    }

    // Remove potential email addresses
    message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');

    // Remove potential API keys/tokens
    message = message.replace(/[a-zA-Z0-9]{32,}/g, '[redacted]');

    // Remove potential file paths
    message = message.replace(/[A-Za-z]:\\[^\s]+/g, '[path]');
    message = message.replace(/\/[^\s]+/g, '[path]');

    return message;
  }

  /**
   * Log message
   */
  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const sanitizedMessage = this.sanitize(message);
    const sanitizedMetadata = this.sanitize(JSON.stringify(metadata));

    const logEntry = {
      level,
      message: sanitizedMessage,
      metadata: JSON.parse(sanitizedMetadata),
      timestamp: Date.now(),
    };

    this.logs.push(logEntry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${level.toUpperCase()}]`, sanitizedMessage, metadata);
    }
  }

  /**
   * Log error
   */
  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  /**
   * Log warning
   */
  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  /**
   * Log info
   */
  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  /**
   * Log debug
   */
  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  /**
   * Get logs
   */
  getLogs(options = {}) {
    const { level = null, limit = 100 } = options;

    let logs = this.logs;

    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    return logs.slice(-limit);
  }

  /**
   * Export logs
   */
  exportLogs() {
    return {
      logs: this.logs,
      count: this.logs.length,
      exportedAt: Date.now(),
    };
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
  }
}

// Singleton instances
export const analytics = new AnalyticsManager({
  enabled: false, // Disabled by default, requires user consent
});

export const usageMetrics = new UsageMetricsCollector();
export const privacyLogger = new PrivacyLogger();

// Initialize session tracking
if (typeof sessionStorage !== 'undefined') {
  const sessionStartTime = sessionStorage.getItem('session_start_time');
  if (!sessionStartTime) {
    sessionStorage.setItem('session_start_time', Date.now().toString());
  }
}

export default {
  AnalyticsManager,
  AnalyticsEvent,
  UsageMetricsCollector,
  PrivacyLogger,
  EventTypes,
  analytics,
  usageMetrics,
  privacyLogger,
};
