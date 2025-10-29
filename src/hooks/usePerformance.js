/**
 * React hooks for performance optimization
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { debounce, throttle, perfTracker } from '../utils/performance';

/**
 * Hook for debounced value
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled value
 * @param {*} value - Value to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {*} Throttled value
 */
export function useThrottle(value, limit = 100) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook for debounced callback
 * @param {Function} callback - Callback to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies
 * @returns {Function} Debounced callback
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    debounce((...args) => callbackRef.current(...args), delay),
    [delay, ...deps]
  );
}

/**
 * Hook for throttled callback
 * @param {Function} callback - Callback to throttle
 * @param {number} limit - Time limit in milliseconds
 * @param {Array} deps - Dependencies
 * @returns {Function} Throttled callback
 */
export function useThrottledCallback(callback, limit = 100, deps = []) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    throttle((...args) => callbackRef.current(...args), limit),
    [limit, ...deps]
  );
}

/**
 * Hook for measuring component render performance
 * @param {string} componentName - Name of component
 */
export function useRenderPerformance(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    perfTracker.mark(`${componentName}-render-${renderCount.current}`);

    if (duration > 16.67) { // Slower than 60fps
      console.warn(
        `${componentName} render #${renderCount.current} took ${duration.toFixed(2)}ms (>16.67ms threshold)`
      );
    }

    startTime.current = endTime;
  });

  return renderCount.current;
}

/**
 * Hook for intersection observer (lazy loading, infinite scroll)
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} [ref, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px'
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return [targetRef, isIntersecting];
}

/**
 * Hook for lazy loading images
 * @param {string} src - Image source
 * @param {string} placeholder - Placeholder image
 * @returns {Object} { ref, loaded, error }
 */
export function useLazyImage(src, placeholder = null) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (isIntersecting && !loaded && !error) {
      const img = new Image();

      img.onload = () => {
        setCurrentSrc(src);
        setLoaded(true);
      };

      img.onerror = () => {
        setError(new Error('Failed to load image'));
      };

      img.src = src;
    }
  }, [isIntersecting, src, loaded, error]);

  return { ref, src: currentSrc, loaded, error };
}

/**
 * Hook for window resize with debounce
 * @param {number} delay - Debounce delay
 * @returns {Object} { width, height }
 */
export function useWindowSize(delay = 200) {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const handleResize = useDebouncedCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, delay);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return size;
}

/**
 * Hook for idle callback
 * @param {Function} callback - Callback to execute
 * @param {Array} deps - Dependencies
 */
export function useIdleCallback(callback, deps = []) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback);
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 1);
      return () => clearTimeout(id);
    }
  }, deps);
}

/**
 * Hook for previous value
 * @param {*} value - Current value
 * @returns {*} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for comparing objects/arrays for memoization
 * @param {*} value - Value to compare
 * @returns {*} Stable reference
 */
export function useDeepMemo(value) {
  const ref = useRef();

  if (!ref.current || JSON.stringify(ref.current) !== JSON.stringify(value)) {
    ref.current = value;
  }

  return ref.current;
}

/**
 * Hook for async data with loading/error states
 * @param {Function} asyncFn - Async function
 * @param {Array} deps - Dependencies
 * @returns {Object} { data, loading, error, refetch }
 */
export function useAsyncData(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook for optimized event listener
 * @param {string} eventName - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 */
export function useEventListener(eventName, handler, options = {}) {
  const {
    element = window,
    enabled = true,
    capture = false
  } = options;

  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event) => savedHandler.current(event);

    element.addEventListener(eventName, eventListener, capture);

    return () => {
      element.removeEventListener(eventName, eventListener, capture);
    };
  }, [eventName, element, enabled, capture]);
}

/**
 * Hook for local storage with JSON serialization
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {Array} [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default {
  useDebounce,
  useThrottle,
  useDebouncedCallback,
  useThrottledCallback,
  useRenderPerformance,
  useIntersectionObserver,
  useLazyImage,
  useWindowSize,
  useIdleCallback,
  usePrevious,
  useDeepMemo,
  useAsyncData,
  useEventListener,
  useLocalStorage
};
