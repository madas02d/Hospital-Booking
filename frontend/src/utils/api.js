import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors for non-file upload requests
    if (error.response?.status === 401 && !error.config?.headers?.['Content-Type']?.includes('multipart/form-data')) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      // Do not hard redirect here to avoid aborting in-flight requests (e.g., file uploads)
    }
    return Promise.reject(error);
  }
);

export default api;
