// API Configuration Constants
export const API_BASE_URL = 'https://aiinterviewerbackend-2.onrender.com';

// Legacy support - keep baseURL for existing components
export const baseURL = API_BASE_URL;

// Environment detection
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Log configuration in development
if (isDevelopment) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: isProduction ? 'production' : 'development',
  });
}

// Always log in production for debugging
console.log('Constants loaded - API_BASE_URL:', API_BASE_URL);
console.log('Constants loaded - baseURL:', baseURL);
