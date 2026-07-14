/// <reference types="vite/client" />
import axios from 'axios';

const getBaseUrl = () => {
  return localStorage.getItem('server_url') || (import.meta as any).env.VITE_API_BASE_URL || 'https://scholar-0ko6.onrender.com';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to dynamicly update baseURL before each request
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const schoolId = localStorage.getItem('school_id');
    if (schoolId) {
      config.headers['id-etablissement'] = schoolId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
