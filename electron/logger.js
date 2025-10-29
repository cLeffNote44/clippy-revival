/**
 * Structured logging for Electron main process
 * Uses electron-log for file and console logging with rotation
 */

const log = require('electron-log');
const path = require('path');
const { app } = require('electron');

// Configure log file location
log.transports.file.resolvePath = () => {
  const logsPath = app ? path.join(app.getPath('userData'), 'logs') : './logs';
  return path.join(logsPath, 'clippy-main.log');
};

// Configure file transport
log.transports.file.level = 'debug';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10 MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Configure console transport
log.transports.console.level = 'info';
log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}';

// Create a custom logger with structured data support
class Logger {
  constructor() {
    this.log = log;
  }

  /**
   * Format log message with context
   */
  formatMessage(message, context = {}) {
    if (Object.keys(context).length === 0) {
      return message;
    }
    const contextStr = JSON.stringify(context);
    return `${message} ${contextStr}`;
  }

  /**
   * Debug level logging
   */
  debug(message, context = {}) {
    this.log.debug(this.formatMessage(message, context));
  }

  /**
   * Info level logging
   */
  info(message, context = {}) {
    this.log.info(this.formatMessage(message, context));
  }

  /**
   * Warning level logging
   */
  warn(message, context = {}) {
    this.log.warn(this.formatMessage(message, context));
  }

  /**
   * Error level logging
   */
  error(message, error = null, context = {}) {
    if (error instanceof Error) {
      this.log.error(this.formatMessage(message, {
        ...context,
        error: error.message,
        stack: error.stack
      }));
    } else {
      this.log.error(this.formatMessage(message, context));
    }
  }

  /**
   * Log exceptions with full stack trace
   */
  exception(error, context = {}) {
    this.log.error(this.formatMessage('Unhandled Exception', {
      ...context,
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    }));
  }

  /**
   * Log crash report
   */
  crash(error, context = {}) {
    this.log.error(this.formatMessage('Application Crash', {
      ...context,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Get the underlying electron-log instance
   */
  getLog() {
    return this.log;
  }

  /**
   * Get log file path
   */
  getLogPath() {
    return log.transports.file.getFile().path;
  }
}

// Create singleton instance
const logger = new Logger();

// Setup global error handlers
function setupErrorHandlers() {
  // Catch uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.exception(error, { type: 'uncaughtException' });
    console.error('Uncaught Exception:', error);
  });

  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', reason, {
      type: 'unhandledRejection',
      promise: promise.toString()
    });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Log when process is about to exit
  process.on('exit', (code) => {
    logger.info('Process exiting', { exitCode: code });
  });
}

// Initialize error handlers
setupErrorHandlers();

// Export logger
module.exports = logger;

// Export convenience functions
module.exports.debug = (message, context) => logger.debug(message, context);
module.exports.info = (message, context) => logger.info(message, context);
module.exports.warn = (message, context) => logger.warn(message, context);
module.exports.error = (message, error, context) => logger.error(message, error, context);
module.exports.exception = (error, context) => logger.exception(error, context);
module.exports.crash = (error, context) => logger.crash(error, context);
module.exports.getLogPath = () => logger.getLogPath();
