import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const token = localStorage.getItem('token');
// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization':`Bearer ${token}`,
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data &&
      (error.response.data as any).message === 'Token expired' &&
      !originalRequest?.headers?._retry
    ) {
      // originalRequest.headers = originalRequest.headers || {};
      // originalRequest.headers._retry = true;
      
      // Here you could implement token refresh logic, but for now we just logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;