import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      return data.data;
    },
  });
};

export const useGoogleAuth = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/google', payload);
      return data.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.post('/auth/register', userData);
      return data.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/forgot-password', payload);
      return data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/reset-password', payload);
      return data;
    },
  });
};
