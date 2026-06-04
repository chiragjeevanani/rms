import axios from 'axios';

// Helper to retrieve active token without repeating string literals
const getActiveToken = () => {
  return localStorage.getItem('pos_access') || 
         localStorage.getItem('staff_access') || 
         localStorage.getItem('admin_access') || 
         localStorage.getItem('kds_access') || 
         localStorage.getItem('user_token');
};

// 1. Intercept Global Axios Requests
axios.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Intercept Global Fetch Requests
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const isApiRequest = typeof url === 'string' && (!url.startsWith('http') || (apiUrl && url.startsWith(apiUrl)));

  if (isApiRequest) {
    options.headers = options.headers || {};
    
    // Check if headers is an instance of Headers
    if (options.headers instanceof Headers) {
      if (!options.headers.has('Authorization')) {
        const token = getActiveToken();
        if (token) {
          options.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    } else {
      if (!options.headers['Authorization'] && !options.headers['authorization']) {
        const token = getActiveToken();
        if (token) {
          options.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
  }

  return originalFetch(url, options);
};

