import { useToastStore } from '../components/Toast';

/**
 * User-friendly error messages mapped from technical errors
 */
const ERROR_MESSAGES = {
  // Network errors
  'ECONNREFUSED': {
    title: 'Connection Failed',
    message: 'Cannot connect to the backend service. Please ensure the application is running properly.'
  },
  'ETIMEDOUT': {
    title: 'Connection Timeout',
    message: 'The request took too long to complete. Please check your connection and try again.'
  },
  'ENOTFOUND': {
    title: 'Service Not Found',
    message: 'Cannot find the backend service. Please restart the application.'
  },

  // HTTP errors
  '400': {
    title: 'Invalid Request',
    message: 'The request was invalid. Please check your input and try again.'
  },
  '401': {
    title: 'Unauthorized',
    message: 'You are not authorized to perform this action.'
  },
  '403': {
    title: 'Forbidden',
    message: 'Access to this resource is forbidden.'
  },
  '404': {
    title: 'Not Found',
    message: 'The requested resource could not be found.'
  },
  '500': {
    title: 'Server Error',
    message: 'An internal server error occurred. Please try again later.'
  },
  '503': {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again in a moment.'
  },

  // Ollama specific errors
  'OLLAMA_NOT_RUNNING': {
    title: 'Ollama Not Running',
    message: 'Cannot connect to Ollama. Please ensure Ollama is installed and running on your system.'
  },
  'MODEL_NOT_FOUND': {
    title: 'AI Model Not Found',
    message: 'The selected AI model is not installed. Please download it using Ollama first.'
  },
  'MODEL_LOAD_FAILED': {
    title: 'Model Load Failed',
    message: 'Failed to load the AI model. Please check that you have enough memory and try again.'
  },

  // File operation errors
  'EACCES': {
    title: 'Permission Denied',
    message: 'Permission denied. Please check that you have access to this file or folder.'
  },
  'ENOENT': {
    title: 'File Not Found',
    message: 'The file or folder could not be found.'
  },
  'EEXIST': {
    title: 'Already Exists',
    message: 'A file or folder with this name already exists.'
  },

  // Character pack errors
  'INVALID_CHARACTER_PACK': {
    title: 'Invalid Character Pack',
    message: 'The character pack is invalid or corrupted. Please check the file and try again.'
  },
  'CHARACTER_MANIFEST_ERROR': {
    title: 'Manifest Error',
    message: 'The character manifest file is missing or invalid.'
  }
};

/**
 * Extract error code from various error types
 */
function getErrorCode(error) {
  // Axios error
  if (error.response?.status) {
    return error.response.status.toString();
  }

  // Network error
  if (error.code) {
    return error.code;
  }

  // Custom error with code property
  if (error.error?.code) {
    return error.error.code;
  }

  return null;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyError(error) {
  const code = getErrorCode(error);

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Check if error message contains known patterns
  const errorMessage = error.message || error.toString();

  if (errorMessage.toLowerCase().includes('ollama')) {
    return ERROR_MESSAGES.OLLAMA_NOT_RUNNING;
  }

  if (errorMessage.toLowerCase().includes('model not found')) {
    return ERROR_MESSAGES.MODEL_NOT_FOUND;
  }

  // Default error message
  return {
    title: 'Error',
    message: errorMessage || 'An unexpected error occurred. Please try again.'
  };
}

/**
 * Handle API errors and show user-friendly messages
 */
export function handleApiError(error, options = {}) {
  const {
    showToast = true,
    logError = true,
    customMessage = null
  } = options;

  // Log to console in development
  if (logError && process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Get user-friendly error
  const userError = customMessage || getUserFriendlyError(error);

  // Show toast notification
  if (showToast) {
    useToastStore.getState().error(userError.message, userError.title);
  }

  // Log to Electron if available
  if (window.electronAPI && window.electronAPI.logError) {
    window.electronAPI.logError({
      type: 'api_error',
      code: getErrorCode(error),
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  return userError;
}

/**
 * Handle general errors
 */
export function handleError(error, context = 'Application', options = {}) {
  const {
    showToast = true,
    logError = true
  } = options;

  // Log to console
  if (logError) {
    console.error(`${context} Error:`, error);
  }

  const userError = getUserFriendlyError(error);

  // Show toast notification
  if (showToast) {
    useToastStore.getState().error(userError.message, userError.title);
  }

  // Log to Electron if available
  if (window.electronAPI && window.electronAPI.logError) {
    window.electronAPI.logError({
      type: 'general_error',
      context,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  return userError;
}

/**
 * Check if backend is available
 */
export async function checkBackendConnection() {
  try {
    const backendUrl = await window.electronAPI.getBackendUrl();
    const response = await fetch(`${backendUrl}/health`, { timeout: 5000 });

    if (!response.ok) {
      throw new Error('Backend health check failed');
    }

    return true;
  } catch (error) {
    handleApiError(error, {
      customMessage: {
        title: 'Backend Connection Failed',
        message: 'Failed to connect to the backend service. The application may not function properly.'
      }
    });
    return false;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export default {
  handleApiError,
  handleError,
  checkBackendConnection,
  retryWithBackoff
};
