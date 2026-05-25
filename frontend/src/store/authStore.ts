import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  role: string;
  gender?: string;
  interests?: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, gender: string) => Promise<void>;
  loginGuest: (gender: string, interests: string[]) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth`;

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const { token, userId, username: resUsername, role } = response.data;
      
      const userData = { id: userId, username: resUsername, role };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ token, user: userData, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || err.response?.data || 'Login failed. Please check your credentials.', 
        isLoading: false 
      });
      throw err;
    }
  },

  register: async (username, email, password, gender) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/register`, { username, email, password, gender });
      const { token, userId, username: resUsername, role } = response.data;
      
      const userData = { id: userId, username: resUsername, role, gender };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ token, user: userData, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.', 
        isLoading: false 
      });
      throw err;
    }
  },

  loginGuest: async (gender, interests) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/guest`, { gender, interests });
      const { token, userId, username: resUsername, role } = response.data;
      
      const userData = { id: userId, username: resUsername, role, gender, interests };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ token, user: userData, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Guest login failed. Please try again.', 
        isLoading: false 
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null })
}));
