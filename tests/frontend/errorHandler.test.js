import {
  handleApiError,
  handleError,
  checkBackendConnection,
  retryWithBackoff
} from '../../src/services/errorHandler';
import { useToastStore } from '../../src/components/Toast';

// Mock toast store
jest.mock('../../src/components/Toast', () => ({
  useToastStore: {
    getState: jest.fn(() => ({
      error: jest.fn(),
      showToast: jest.fn()
    }))
  }
}));

// Save original console.error
const originalError = console.error;

describe('errorHandler Service', () => {
  let mockLogError;
  let mockErrorToast;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockLogError = jest.fn();
    mockErrorToast = jest.fn();

    window.electronAPI = {
      ...window.electronAPI,
      logError: mockLogError
    };

    useToastStore.getState.mockReturnValue({
      error: mockErrorToast,
      showToast: jest.fn()
    });
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('handleApiError', () => {
    test('handles network error ECONNREFUSED', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      const result = handleApiError(error);

      expect(result.title).toBe('Connection Failed');
      expect(result.message).toContain('Cannot connect to the backend service');
      expect(mockErrorToast).toHaveBeenCalledWith(result.message, result.title);
    });

    test('handles HTTP 404 error', () => {
      const error = {
        response: { status: 404 },
        message: 'Not found'
      };

      const result = handleApiError(error);

      expect(result.title).toBe('Not Found');
      expect(result.message).toContain('requested resource could not be found');
    });

    test('handles HTTP 500 error', () => {
      const error = {
        response: { status: 500 },
        message: 'Internal server error'
      };

      const result = handleApiError(error);

      expect(result.title).toBe('Server Error');
      expect(result.message).toContain('internal server error');
    });

    test('handles HTTP 401 unauthorized', () => {
      const error = {
        response: { status: 401 },
        message: 'Unauthorized'
      };

      const result = handleApiError(error);

      expect(result.title).toBe('Unauthorized');
      expect(result.message).toContain('not authorized');
    });

    test('handles Ollama-related errors', () => {
      const error = {
        message: 'Failed to connect to Ollama service'
      };

      const result = handleApiError(error);

      expect(result.title).toBe('Ollama Not Running');
      expect(result.message).toContain('Ollama');
    });

    test('handles model not found error', () => {
      const error = {
        message: 'Model not found in Ollama'
      };

      const result = handleApiError(error);

      expect(result.title).toBe('AI Model Not Found');
      expect(result.message).toContain('model is not installed');
    });

    test('shows toast by default', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      handleApiError(error);

      expect(mockErrorToast).toHaveBeenCalled();
    });

    test('does not show toast when showToast is false', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      handleApiError(error, { showToast: false });

      expect(mockErrorToast).not.toHaveBeenCalled();
    });

    test('logs to electronAPI when available', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused', stack: 'stack trace' };

      handleApiError(error);

      expect(mockLogError).toHaveBeenCalled();
      const logCall = mockLogError.mock.calls[0][0];
      expect(logCall.type).toBe('api_error');
      expect(logCall.code).toBe('ECONNREFUSED');
      expect(logCall.message).toBe('Connection refused');
    });

    test('does not crash when electronAPI is unavailable', () => {
      delete window.electronAPI;
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      expect(() => handleApiError(error)).not.toThrow();
    });

    test('uses custom message when provided', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const customMessage = {
        title: 'Custom Title',
        message: 'Custom message'
      };

      const result = handleApiError(error, { customMessage });

      expect(result.title).toBe('Custom Title');
      expect(result.message).toBe('Custom message');
    });

    test('logs to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);

      process.env.NODE_ENV = originalEnv;
    });

    test('does not log to console when logError is false', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      handleApiError(error, { logError: false });

      expect(console.error).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    test('handles unknown error codes with default message', () => {
      const error = { message: 'Some random error' };

      const result = handleApiError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toBe('Some random error');
    });

    test('handles error with nested error.error.code', () => {
      const error = {
        error: { code: 'ENOENT' },
        message: 'File not found'
      };

      const result = handleApiError(error);

      expect(result.title).toBe('File Not Found');
    });
  });

  describe('handleError', () => {
    test('handles general error with context', () => {
      const error = new Error('Something went wrong');

      handleError(error, 'TestContext');

      expect(console.error).toHaveBeenCalledWith('TestContext Error:', error);
      expect(mockErrorToast).toHaveBeenCalled();
    });

    test('uses Application as default context', () => {
      const error = new Error('Something went wrong');

      handleError(error);

      expect(console.error).toHaveBeenCalledWith('Application Error:', error);
    });

    test('shows toast by default', () => {
      const error = new Error('Test error');

      handleError(error);

      expect(mockErrorToast).toHaveBeenCalled();
    });

    test('does not show toast when showToast is false', () => {
      const error = new Error('Test error');

      handleError(error, 'Context', { showToast: false });

      expect(mockErrorToast).not.toHaveBeenCalled();
    });

    test('logs to electronAPI with context', () => {
      const error = new Error('Test error');

      handleError(error, 'TestContext');

      expect(mockLogError).toHaveBeenCalled();
      const logCall = mockLogError.mock.calls[0][0];
      expect(logCall.type).toBe('general_error');
      expect(logCall.context).toBe('TestContext');
    });

    test('does not log when logError is false', () => {
      const error = new Error('Test error');

      handleError(error, 'Context', { logError: false });

      expect(console.error).not.toHaveBeenCalled();
    });

    test('returns user-friendly error object', () => {
      const error = new Error('Test error message');

      const result = handleError(error);

      expect(result.title).toBe('Error');
      expect(result.message).toBe('Test error message');
    });
  });

  describe('checkBackendConnection', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      window.electronAPI = {
        ...window.electronAPI,
        getBackendUrl: jest.fn(() => Promise.resolve('http://localhost:43110'))
      };
    });

    test('returns true when backend is healthy', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await checkBackendConnection();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:43110/health', { timeout: 5000 });
    });

    test('returns false when backend is not healthy', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await checkBackendConnection();

      expect(result).toBe(false);
      expect(mockErrorToast).toHaveBeenCalled();
    });

    test('returns false when fetch fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await checkBackendConnection();

      expect(result).toBe(false);
      expect(mockErrorToast).toHaveBeenCalled();
    });

    test('displays custom error message on failure', async () => {
      global.fetch.mockRejectedValue(new Error('Connection refused'));

      await checkBackendConnection();

      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect'),
        'Backend Connection Failed'
      );
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('succeeds on first try', async () => {
      const mockFn = jest.fn(() => Promise.resolve('success'));

      const promise = retryWithBackoff(mockFn, 3, 1000);
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('retries on failure and eventually succeeds', async () => {
      let attempts = 0;
      const mockFn = jest.fn(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const promise = retryWithBackoff(mockFn, 3, 1000);

      // Advance timers for first retry (1000ms)
      await Promise.resolve();
      jest.advanceTimersByTime(1000);

      // Advance timers for second retry (2000ms)
      await Promise.resolve();
      jest.advanceTimersByTime(2000);

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('throws error after max retries', async () => {
      const mockFn = jest.fn(() => Promise.reject(new Error('Persistent error')));

      const promise = retryWithBackoff(mockFn, 3, 1000);

      // Advance timers for all retries
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('uses exponential backoff delays', async () => {
      const mockFn = jest.fn(() => Promise.reject(new Error('Error')));
      const delays = [];

      const promise = retryWithBackoff(mockFn, 3, 100);

      // Track delays
      for (let i = 0; i < 2; i++) {
        const start = Date.now();
        await Promise.resolve();
        jest.advanceTimersByTime(100 * Math.pow(2, i));
        delays.push(Date.now() - start);
      }

      await promise.catch(() => {});

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('respects custom max retries', async () => {
      const mockFn = jest.fn(() => Promise.reject(new Error('Error')));

      const promise = retryWithBackoff(mockFn, 5, 100);

      // Advance timers for all retries
      for (let i = 0; i < 4; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(100 * Math.pow(2, i));
      }

      await promise.catch(() => {});

      expect(mockFn).toHaveBeenCalledTimes(5);
    });

    test('respects custom initial delay', async () => {
      let attempts = 0;
      const mockFn = jest.fn(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Error'));
        }
        return Promise.resolve('success');
      });

      const promise = retryWithBackoff(mockFn, 3, 500);

      // First retry should wait 500ms
      await Promise.resolve();
      jest.advanceTimersByTime(500);

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error code extraction', () => {
    test('extracts status code from axios error', () => {
      const error = {
        response: { status: 404 },
        message: 'Not found'
      };

      const result = handleApiError(error, { showToast: false });

      expect(result.title).toBe('Not Found');
    });

    test('extracts code from network error', () => {
      const error = {
        code: 'ETIMEDOUT',
        message: 'Timeout'
      };

      const result = handleApiError(error, { showToast: false });

      expect(result.title).toBe('Connection Timeout');
    });

    test('extracts code from nested error object', () => {
      const error = {
        error: { code: 'EACCES' },
        message: 'Permission denied'
      };

      const result = handleApiError(error, { showToast: false });

      expect(result.title).toBe('Permission Denied');
    });

    test('handles error without any code', () => {
      const error = {
        message: 'Generic error'
      };

      const result = handleApiError(error, { showToast: false });

      expect(result.title).toBe('Error');
      expect(result.message).toBe('Generic error');
    });
  });
});
