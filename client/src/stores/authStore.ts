import { create } from 'zustand';
import { authAPI } from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'estimator' | 'viewer';
  is_active?: boolean;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  register: async (username: string, email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.register(username, email, password);
      set({ isLoading: false });
      // Auto-login after registration
      await get().login(username, password);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(username, password);
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      if (get().accessToken) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    }
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = get().refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refresh(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      set({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error: any) {
      // Refresh failed, logout user
      await get().logout();
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await authAPI.getMe();
      const { user } = response.data;

      set({
        user,
        isLoading: false,
      });
    } catch (error) {
      // Not authenticated or token expired
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  hydrate: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken,
          refreshToken,
        });
      } catch (error) {
        console.error('Failed to hydrate auth state:', error);
      }
    }
  },
}));
