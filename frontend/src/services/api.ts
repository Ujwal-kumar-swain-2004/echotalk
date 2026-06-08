import axios from 'axios';
import { usePageHostname } from './runtimeUrl';

const api = axios.create({
  baseURL: usePageHostname(import.meta.env.VITE_API_URL || 'http://localhost:8080/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
