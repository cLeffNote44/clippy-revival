/**
 * Performance monitoring and optimization utilities
 * Provides tools for measuring and improving application performance
 */

/**
 * Performance metrics tracker
 */
class PerformanceTracker {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Mark the start of a performance measurement
   * @param {string} name - Name of the measurement
   */
  mark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  /**
   * Measure the time between two marks
   * @param {string} name - Name of the measurement
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name (optional, uses now if not provided)
   * @returns {number} Duration in milliseconds
   */
  measure(name, startMark, endMark = null) {
    if (typeof performance !== 'undefined') {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        this.measures.push({ name, duration, timestamp: Date.now() });
        return duration;
      }
    }
    return 0;
  }

  /**
   * Get all measures
   * @returns {Array} Array of measures
   */
  getMeasures() {
    return [...this.measures];
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.marks.clear();
    this.measures = [];
  }

  /**
   * Get performance metrics summary
   * @returns {Object} Summary of performance metrics
   */
  getSummary() {
    const byName = {};

    this.measures.forEach(({ name, duration }) => {
      if (!byName[name]) {
        byName[name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0
        };
      }

      const metric = byName[name];
      metric.count++;
      metric.total += duration;
      metric.min = Math.min(metric.min, duration);
      metric.max = Math.max(metric.max, duration);
      metric.avg = metric.total / metric.count;
    });

    return byName;
  }
}

// Global performance tracker instance
export const perfTracker = new PerformanceTracker();

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measure component render time
 * @param {string} componentName - Name of component
 * @param {Function} renderFn - Render function
 * @returns {*} Result of render function
 */
export function measureRender(componentName, renderFn) {
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  const measureName = `${componentName}-render`;

  perfTracker.mark(startMark);
  const result = renderFn();
  perfTracker.mark(endMark);

  const duration = perfTracker.measure(measureName, startMark, endMark);

  if (duration > 50) {
    console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Image optimization utilities
 */
export const imageOptimizer = {
  /**
   * Lazy load image
   * @param {HTMLImageElement} img - Image element
   * @param {string} src - Image source URL
   * @param {Object} options - Options
   */
  lazyLoad(img, src, options = {}) {
    const { placeholder = null, onLoad = null, onError = null } = options;

    if (placeholder) {
      img.src = placeholder;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            img.onload = () => {
              observer.disconnect();
              if (onLoad) onLoad();
            };
            img.onerror = () => {
              observer.disconnect();
              if (onError) onError();
            };
          }
        });
      });

      observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      img.src = src;
      if (onLoad) img.onload = onLoad;
      if (onError) img.onerror = onError;
    }
  },

  /**
   * Get optimal image dimensions
   * @param {number} originalWidth - Original width
   * @param {number} originalHeight - Original height
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Object} Optimal dimensions
   */
  getOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.floor(width),
      height: Math.floor(height)
    };
  },

  /**
   * Create thumbnail from image
   * @param {File|Blob} file - Image file
   * @param {number} maxSize - Maximum dimension
   * @returns {Promise<Blob>} Thumbnail blob
   */
  async createThumbnail(file, maxSize = 200) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const { width, height } = this.getOptimalDimensions(
          img.width,
          img.height,
          maxSize,
          maxSize
        );

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      img.src = URL.createObjectURL(file);
    });
  }
};

/**
 * Memory management utilities
 */
export const memoryManager = {
  /**
   * Check if memory usage is high
   * @returns {boolean} True if memory usage is high
   */
  isMemoryHigh() {
    if (performance.memory) {
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const usage = usedJSHeapSize / jsHeapSizeLimit;
      return usage > 0.9; // Over 90% usage
    }
    return false;
  },

  /**
   * Get memory usage info
   * @returns {Object|null} Memory usage info
   */
  getMemoryInfo() {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      return {
        used: usedJSHeapSize,
        total: totalJSHeapSize,
        limit: jsHeapSizeLimit,
        usagePercent: (usedJSHeapSize / jsHeapSizeLimit) * 100
      };
    }
    return null;
  },

  /**
   * Force garbage collection (if available)
   */
  gc() {
    if (global.gc) {
      global.gc();
    }
  }
};

/**
 * FPS (Frames Per Second) monitor
 */
export class FPSMonitor {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
    this.running = false;
  }

  /**
   * Start monitoring FPS
   * @param {Function} callback - Callback with FPS value
   */
  start(callback) {
    this.running = true;
    this.callback = callback;

    const loop = () => {
      if (!this.running) return;

      this.frames++;
      const now = performance.now();

      if (now >= this.lastTime + 1000) {
        this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
        this.frames = 0;
        this.lastTime = now;

        if (this.callback) {
          this.callback(this.fps);
        }
      }

      requestAnimationFrame(loop);
    };

    loop();
  }

  /**
   * Stop monitoring FPS
   */
  stop() {
    this.running = false;
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.fps;
  }
}

/**
 * Request Idle Callback wrapper for deferring non-critical work
 * @param {Function} callback - Callback to execute
 * @param {Object} options - Options
 */
export function scheduleIdleTask(callback, options = {}) {
  const { timeout = 2000 } = options;

  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * Batch updates to reduce re-renders
 */
export class BatchUpdater {
  constructor(flushDelay = 50) {
    this.flushDelay = flushDelay;
    this.updates = [];
    this.timeout = null;
  }

  /**
   * Add update to batch
   * @param {Function} updateFn - Update function
   */
  add(updateFn) {
    this.updates.push(updateFn);

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.flushDelay);
    }
  }

  /**
   * Flush all batched updates
   */
  flush() {
    if (this.updates.length === 0) return;

    const updates = [...this.updates];
    this.updates = [];
    this.timeout = null;

    updates.forEach((update) => update());
  }

  /**
   * Cancel pending updates
   */
  cancel() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.updates = [];
  }
}

/**
 * Calculate array chunk size for optimal performance
 * @param {number} itemCount - Number of items
 * @param {number} itemSize - Estimated size per item in bytes
 * @returns {number} Optimal chunk size
 */
export function calculateOptimalChunkSize(itemCount, itemSize = 100) {
  // Aim for chunks around 16KB (good balance for most scenarios)
  const targetChunkSize = 16 * 1024;
  const itemsPerChunk = Math.floor(targetChunkSize / itemSize);

  // Ensure reasonable bounds
  const minChunk = 10;
  const maxChunk = 1000;

  return Math.max(minChunk, Math.min(maxChunk, itemsPerChunk));
}

/**
 * Process large array in chunks to avoid blocking
 * @param {Array} array - Array to process
 * @param {Function} processFn - Processing function
 * @param {Object} options - Options
 * @returns {Promise<Array>} Processed results
 */
export async function processInChunks(array, processFn, options = {}) {
  const {
    chunkSize = calculateOptimalChunkSize(array.length),
    onProgress = null
  } = options;

  const results = [];
  const totalChunks = Math.ceil(array.length / chunkSize);

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    const chunkResults = chunk.map(processFn);
    results.push(...chunkResults);

    if (onProgress) {
      const progress = Math.min(100, ((i + chunkSize) / array.length) * 100);
      onProgress(progress);
    }

    // Yield to browser between chunks
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

export default {
  PerformanceTracker,
  perfTracker,
  debounce,
  throttle,
  measureRender,
  imageOptimizer,
  memoryManager,
  FPSMonitor,
  scheduleIdleTask,
  BatchUpdater,
  calculateOptimalChunkSize,
  processInChunks
};
