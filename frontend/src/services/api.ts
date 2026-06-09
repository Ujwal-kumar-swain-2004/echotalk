import axios from 'axios';
import { resolvePageHostname } from './runtimeUrl';

const api = axios.create({
  baseURL: resolvePageHostname(import.meta.env.VITE_API_URL || '/api'),
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
