import { create } from 'zustand';
import api from '../lib/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  // only show loading spinner if a token exists and we need to validate it
  loading: !!localStorage.getItem('accessToken'),
  error: null,

  setUser: (user) => set({ user }),

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      set({ user: data.user, accessToken: data.accessToken, error: null });
    }
    return data;
  },

  login: async (email, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login', { email, password, rememberMe });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, error: null });
    return data;
  },

  googleLogin: async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, error: null });
    return data;
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null });
  },

  fetchMe: async () => {
    // no token = no need to call the API, just mark loading done
    if (!localStorage.getItem('accessToken')) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, loading: false });
    }
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  verifyEmail: async (token) => {
    const { data } = await api.get(`/auth/verify-email?token=${token}`);
    return data;
  },

  resendVerification: async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  },
}));