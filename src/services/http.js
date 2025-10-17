import axios from 'axios';
import config from '../config';

// Create axios instance with defaults
const http = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
http.interceptors.request.use(
  (requestConfig) => {
    // Add any auth tokens if needed
    const token = localStorage.getItem('auth_token');
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (config.app.isDev) {
      console.log(`[HTTP] ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, requestConfig.data);
    }
    
    return requestConfig;
  },
  (error) => {
    console.error('[HTTP] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (config.app.isDev) {
      console.log(`[HTTP] Response ${response.status}:`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log errors
    console.error('[HTTP] Response error:', error.response?.status, error.response?.data || error.message);
    
    // Retry logic for network errors
    if (!error.response && !originalRequest._retry && originalRequest._retryCount < config.api.retryAttempts) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.api.retryDelay));
      
      console.log(`[HTTP] Retrying request (attempt ${originalRequest._retryCount}/${config.api.retryAttempts})`);
      return http(originalRequest);
    }
    
    // Handle specific error codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new CustomEvent('unauthorized'));
          break;
        case 403:
          // Handle forbidden
          window.dispatchEvent(new CustomEvent('forbidden'));
          break;
        case 500:
        case 502:
        case 503:
          // Handle server errors
          window.dispatchEvent(new CustomEvent('server-error', { detail: error.response.data }));
          break;
      }
    }
    
    return Promise.reject(error);
  }
);

export default http;