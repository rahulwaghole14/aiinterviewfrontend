// API Configuration Constants
// Use environment variable if available, otherwise use Talaro AI backend URL
const getApiBaseUrl = () => {
  // Check for Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Check for process.env (for build-time)
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Use Talaro AI backend URL for both development and production
  return 'https://talaroai-310576915040.asia-southeast1.run.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Legacy support - keep baseURL for existing components
export const baseURL = API_BASE_URL;

// Environment detection
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
  console.log('Environment:', isProduction ? 'Production' : 'Development');
}
