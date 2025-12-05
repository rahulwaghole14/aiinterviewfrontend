// API Configuration Constants
// Use environment variable if available, otherwise use Render backend URL
const getApiBaseUrl = () => {
  // Check for Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Check for process.env (for build-time)
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Production: Use Render backend URL
  if (import.meta.env.PROD) {
    return 'https://aiinterviewerbackend-2.onrender.com';
  }
  // Development: Use localhost
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getApiBaseUrl();

// Legacy support - keep baseURL for existing components
export const baseURL = API_BASE_URL;

// Environment detection
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Log configuration in development
