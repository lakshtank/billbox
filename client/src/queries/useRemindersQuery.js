import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';

export const useRemindersQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['reminders', filters],
    queryFn: async () => {
      const { data } = await api.get('/reminders', { params: filters });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useUpdateReminderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, reminderEnabled, reminderLeadDays }) => {
      const { data } = await api.patch(`/reminders/${productId}`, {
        reminderEnabled,
        reminderLeadDays,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useTestReminderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => {
      const { data } = await api.post(`/reminders/${productId}/test`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useScanRemindersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/reminders/scan-now');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
    },
  });
};
