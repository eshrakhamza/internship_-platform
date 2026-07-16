// lib/api-client.ts
import axios from 'axios';

// Use the environment variable with correct fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`, // Add /api here since your routes are /api/...
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔧 API Client configured with baseURL:', apiClient.defaults.baseURL);

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          const response = await axios.post(
            `${API_URL}/api/auth/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
            }
          );
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;