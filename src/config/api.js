// API Configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aiinterviewerbackend-2.onrender.com';

export const API_ENDPOINTS = {
  base: API_BASE_URL,
  
  // Authentication
  auth: {
    login: `${API_BASE_URL}/auth/login/`,
    register: `${API_BASE_URL}/auth/register/`,
    logout: `${API_BASE_URL}/auth/logout/`,
    refresh: `${API_BASE_URL}/auth/refresh/`,
    profile: `${API_BASE_URL}/auth/profile/`,
  },
  
  // Candidates
  candidates: {
    list: `${API_BASE_URL}/candidates/`,
    create: `${API_BASE_URL}/candidates/`,
    detail: (id) => `${API_BASE_URL}/candidates/${id}/`,
    update: (id) => `${API_BASE_URL}/candidates/${id}/`,
    delete: (id) => `${API_BASE_URL}/candidates/${id}/`,
  },
  
  // Jobs
  jobs: {
    list: `${API_BASE_URL}/jobs/`,
    create: `${API_BASE_URL}/jobs/`,
    detail: (id) => `${API_BASE_URL}/jobs/${id}/`,
    update: (id) => `${API_BASE_URL}/jobs/${id}/`,
    delete: (id) => `${API_BASE_URL}/jobs/${id}/`,
  },
  
  // Interviews
  interviews: {
    list: `${API_BASE_URL}/interviews/`,
    create: `${API_BASE_URL}/interviews/`,
    detail: (id) => `${API_BASE_URL}/interviews/${id}/`,
    update: (id) => `${API_BASE_URL}/interviews/${id}/`,
    delete: (id) => `${API_BASE_URL}/interviews/${id}/`,
    schedule: `${API_BASE_URL}/interviews/schedule/`,
    slots: `${API_BASE_URL}/interviews/slots/`,
  },
  
  // AI Interview
  aiInterview: {
    session: (sessionKey) => `${API_BASE_URL}/interview_app/?session_key=${sessionKey}`,
    questions: `${API_BASE_URL}/interview_app/get_questions/`,
    submitAnswer: `${API_BASE_URL}/interview_app/submit_answer/`,
    completeInterview: `${API_BASE_URL}/interview_app/complete_interview/`,
    results: (sessionId) => `${API_BASE_URL}/interview_app/results/${sessionId}/`,
  },
  
  // Dashboard
  dashboard: {
    stats: `${API_BASE_URL}/api/dashboard/stats/`,
    analytics: `${API_BASE_URL}/api/dashboard/analytics/`,
  },
  
  // Hiring Agencies
  hiringAgencies: {
    list: `${API_BASE_URL}/hiring_agencies/`,
    create: `${API_BASE_URL}/hiring_agencies/`,
    detail: (id) => `${API_BASE_URL}/hiring_agencies/${id}/`,
    update: (id) => `${API_BASE_URL}/hiring_agencies/${id}/`,
    delete: (id) => `${API_BASE_URL}/hiring_agencies/${id}/`,
  },
  
  // Companies
  companies: {
    list: `${API_BASE_URL}/companies/`,
    create: `${API_BASE_URL}/companies/`,
    detail: (id) => `${API_BASE_URL}/companies/${id}/`,
    update: (id) => `${API_BASE_URL}/companies/${id}/`,
    delete: (id) => `${API_BASE_URL}/companies/${id}/`,
  },
  
  // Resumes
  resumes: {
    list: `${API_BASE_URL}/resumes/`,
    upload: `${API_BASE_URL}/resumes/upload/`,
    detail: (id) => `${API_BASE_URL}/resumes/${id}/`,
    delete: (id) => `${API_BASE_URL}/resumes/${id}/`,
  },
  
  // Notifications
  notifications: {
    list: `${API_BASE_URL}/notifications/`,
    markRead: (id) => `${API_BASE_URL}/notifications/${id}/mark_read/`,
    markAllRead: `${API_BASE_URL}/notifications/mark_all_read/`,
  },
};

// API request helper
export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Token ${token}` }),
      ...options.headers,
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Environment detection
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Log API configuration in development
if (isDevelopment) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: isProduction ? 'production' : 'development',
  });
}
