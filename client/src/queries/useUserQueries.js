import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

// Fetch profile & stats
export const useUserProfileQuery = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/profile');
      return data.data;
    },
  });
};

// Update profile
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (profileData) => {
      const { data } = await api.put('/auth/profile', profileData);
      return data.data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        setUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};

// Change password
export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return data;
    },
  });
};

// Connect Google account
export const useConnectGoogleMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: async ({ credential }) => {
      const { data } = await api.post('/auth/connect-google', { credential });
      return data.data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};

// Disconnect Google account
export const useDisconnectGoogleMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: async ({ newPassword } = {}) => {
      const { data } = await api.post('/auth/disconnect-google', { newPassword });
      return data.data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};

