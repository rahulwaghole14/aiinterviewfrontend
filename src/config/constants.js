// API Configuration Constants
// Use environment variable if available, otherwise use localhost
const getApiBaseUrl = () => {
  // Check for Vite environment variable (this should be used in Vite)
  if (import.meta.env.VITE_API_URL) {
    console.log('🔍 Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  // Always use localhost backend as fallback
  console.log('🔍 Using default localhost URL');
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🎯 Final API_BASE_URL:', API_BASE_URL);

// Legacy support - keep baseURL for existing components
export const baseURL = API_BASE_URL;

// Environment detection
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Log configuration in development
