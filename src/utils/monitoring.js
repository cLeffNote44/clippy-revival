/**
 * Production Monitoring and Observability
 *
 * Provides monitoring, health checks, and observability for production deployment.
 *
 * @module utils/monitoring
 */

/**
 * Health Check Manager
 *
 * Monitors system health and provides detailed health reports
 */
export class HealthCheckManager {
  constructor() {
    this.checks = new Map();
    this.results = new Map();
    this.lastCheckTime = null;
  }

  /**
   * Register a health check
   * @param {string} name - Check name
   * @param {Function} checkFn - Async function that returns health status
   * @param {Object} options - Check options
   */
  registerCheck(name, checkFn, options = {}) {
    const {
      critical = false,
      timeout = 5000,
      interval = 60000,
      description = '',
    } = options;

    this.checks.set(name, {
      name,
      checkFn,
      critical,
      timeout,
      interval,
      description,
      lastRun: null,
      lastStatus: null,
    });
  }

  /**
   * Run a specific health check
   * @param {string} name - Check name
   * @returns {Promise<Object>} Health check result
   */
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();

    try {
      // Run check with timeout
      const result = await this.withTimeout(check.checkFn(), check.timeout);

      const healthResult = {
        name,
        status: 'healthy',
        message: result?.message || 'Check passed',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        details: result?.details || {},
      };

      check.lastRun = Date.now();
      check.lastStatus = 'healthy';
      this.results.set(name, healthResult);

      return healthResult;
    } catch (error) {
      const healthResult = {
        name,
        status: check.critical ? 'critical' : 'unhealthy',
        message: error.message,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        error: error.stack,
      };

      check.lastRun = Date.now();
      check.lastStatus = healthResult.status;
      this.results.set(name, healthResult);

      return healthResult;
    }
  }

  /**
   * Run all health checks
   * @returns {Promise<Object>} Overall health report
   */
  async runAllChecks() {
    const checkNames = Array.from(this.checks.keys());
    const results = await Promise.all(
      checkNames.map((name) => this.runCheck(name))
    );

    this.lastCheckTime = Date.now();

    // Determine overall status
    const hascritical = results.some((r) => r.status === 'critical');
    const hasUnhealthy = results.some((r) => r.status === 'unhealthy');

    const overallStatus = hasCritical
      ? 'critical'
      : hasUnhealthy
      ? 'degraded'
      : 'healthy';

    return {
      status: overallStatus,
      timestamp: this.lastCheckTime,
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter((r) => r.status === 'healthy').length,
        unhealthy: results.filter((r) => r.status === 'unhealthy').length,
        critical: results.filter((r) => r.status === 'critical').length,
      },
    };
  }

  /**
   * Get health report
   * @returns {Object} Current health status
   */
  getHealthReport() {
    const results = Array.from(this.results.values());

    if (results.length === 0) {
      return {
        status: 'unknown',
        message: 'No health checks have been run',
        timestamp: Date.now(),
      };
    }

    const hasCritical = results.some((r) => r.status === 'critical');
    const hasUnhealthy = results.some((r) => r.status === 'unhealthy');

    const status = hasCritical ? 'critical' : hasUnhealthy ? 'degraded' : 'healthy';

    return {
      status,
      timestamp: this.lastCheckTime,
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter((r) => r.status === 'healthy').length,
        unhealthy: results.filter((r) => r.status === 'unhealthy').length,
        critical: results.filter((r) => r.status === 'critical').length,
      },
    };
  }

  /**
   * Helper: run function with timeout
   */
  async withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeout)
      ),
    ]);
  }

  /**
   * Clear all checks and results
   */
  clear() {
    this.checks.clear();
    this.results.clear();
    this.lastCheckTime = null;
  }
}

/**
 * Application Metrics Collector
 *
 * Collects and aggregates application metrics
 */
export class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  /**
   * Record a counter metric
   * @param {string} name - Metric name
   * @param {number} value - Value to add (default: 1)
   * @param {Object} labels - Metric labels
   */
  counter(name, value = 1, labels = {}) {
    const key = this.getMetricKey(name, labels);
    const current = this.metrics.get(key) || { type: 'counter', value: 0, labels };
    current.value += value;
    current.lastUpdated = Date.now();
    this.metrics.set(key, current);
  }

  /**
   * Record a gauge metric
   * @param {string} name - Metric name
   * @param {number} value - Current value
   * @param {Object} labels - Metric labels
   */
  gauge(name, value, labels = {}) {
    const key = this.getMetricKey(name, labels);
    this.metrics.set(key, {
      type: 'gauge',
      value,
      labels,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Record a histogram metric
   * @param {string} name - Metric name
   * @param {number} value - Value to record
   * @param {Object} labels - Metric labels
   */
  histogram(name, value, labels = {}) {
    const key = this.getMetricKey(name, labels);
    const current = this.metrics.get(key) || {
      type: 'histogram',
      values: [],
      labels,
    };

    current.values.push(value);
    current.lastUpdated = Date.now();

    // Keep only last 1000 values
    if (current.values.length > 1000) {
      current.values = current.values.slice(-1000);
    }

    this.metrics.set(key, current);
  }

  /**
   * Get metric value
   * @param {string} name - Metric name
   * @param {Object} labels - Metric labels
   * @returns {*} Metric value
   */
  getMetric(name, labels = {}) {
    const key = this.getMetricKey(name, labels);
    const metric = this.metrics.get(key);

    if (!metric) return null;

    if (metric.type === 'histogram') {
      return this.calculateHistogramStats(metric.values);
    }

    return metric.value;
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    const metrics = {};

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.type === 'histogram') {
        metrics[key] = {
          type: 'histogram',
          ...this.calculateHistogramStats(metric.values),
          labels: metric.labels,
        };
      } else {
        metrics[key] = {
          type: metric.type,
          value: metric.value,
          labels: metric.labels,
        };
      }
    }

    return {
      metrics,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate histogram statistics
   */
  calculateHistogramStats(values) {
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Calculate percentile
   */
  percentile(sorted, p) {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate metric key
   */
  getMetricKey(name, labels) {
    if (Object.keys(labels).length === 0) return name;

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.startTime = Date.now();
  }
}

/**
 * Error Tracker
 *
 * Tracks and aggregates application errors
 */
export class ErrorTracker {
  constructor(options = {}) {
    this.maxErrors = options.maxErrors || 100;
    this.errors = [];
    this.errorCounts = new Map();
  }

  /**
   * Track an error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  trackError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    // Add to error list
    this.errors.unshift(errorData);

    // Trim to max size
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Update error counts
    const key = `${error.name}:${error.message}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', error, context);
    }

    return errorData;
  }

  /**
   * Get recent errors
   * @param {number} limit - Number of errors to return
   * @returns {Array} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const errorsByType = {};

    for (const error of this.errors) {
      errorsByType[error.name] = (errorsByType[error.name] || 0) + 1;
    }

    return {
      total: this.errors.length,
      byType: errorsByType,
      topErrors: this.getTopErrors(5),
    };
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors(limit = 5) {
    const sorted = Array.from(this.errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    return sorted.map(([key, count]) => {
      const [name, message] = key.split(':', 2);
      return { name, message, count };
    });
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
    this.errorCounts.clear();
  }
}

/**
 * Performance Monitor
 *
 * Monitors application performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Mark a performance point
   * @param {string} name - Mark name
   */
  mark(name) {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name (optional, defaults to now)
   * @returns {number} Duration in milliseconds
   */
  measure(name, startMark, endMark = null) {
    const startTime = this.marks.get(startMark);
    if (startTime === undefined) {
      console.warn(`Start mark '${startMark}' not found`);
      return 0;
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    if (endTime === undefined) {
      console.warn(`End mark '${endMark}' not found`);
      return 0;
    }

    const duration = endTime - startTime;

    this.measures.push({
      name,
      startMark,
      endMark,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 1000 measures
    if (this.measures.length > 1000) {
      this.measures = this.measures.slice(-1000);
    }

    return duration;
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getSummary() {
    const measuresByName = {};

    for (const measure of this.measures) {
      if (!measuresByName[measure.name]) {
        measuresByName[measure.name] = [];
      }
      measuresByName[measure.name].push(measure.duration);
    }

    const summary = {};
    for (const [name, durations] of Object.entries(measuresByName)) {
      const sorted = [...durations].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);

      summary[name] = {
        count: sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / sorted.length,
        p95: sorted[Math.floor(sorted.length * 0.95)],
      };
    }

    return summary;
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    this.marks.clear();
    this.measures = [];
  }
}

// Singleton instances
export const healthCheck = new HealthCheckManager();
export const metrics = new MetricsCollector();
export const errorTracker = new ErrorTracker();
export const performanceMonitor = new PerformanceMonitor();

// Register default health checks
healthCheck.registerCheck(
  'frontend',
  async () => {
    // Check if React is rendering
    const hasReactRoot = document.getElementById('root') !== null;
    if (!hasReactRoot) {
      throw new Error('React root not found');
    }
    return { message: 'Frontend healthy' };
  },
  { critical: true, description: 'Frontend React application' }
);

healthCheck.registerCheck(
  'backend',
  async () => {
    // Check backend connectivity
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        timeout: 3000,
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      return { message: 'Backend healthy' };
    } catch (error) {
      throw new Error(`Backend unreachable: ${error.message}`);
    }
  },
  { critical: true, description: 'Backend FastAPI service' }
);

healthCheck.registerCheck(
  'storage',
  async () => {
    // Check localStorage availability
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return { message: 'Storage healthy' };
    } catch (error) {
      throw new Error(`Storage unavailable: ${error.message}`);
    }
  },
  { critical: false, description: 'LocalStorage availability' }
);

export default {
  HealthCheckManager,
  MetricsCollector,
  ErrorTracker,
  PerformanceMonitor,
  healthCheck,
  metrics,
  errorTracker,
  performanceMonitor,
};
