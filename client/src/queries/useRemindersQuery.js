import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useRemindersQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['reminders', filters],
    queryFn: async () => {
      const { data } = await api.get('/reminders', { params: filters });
      return data.data;
    },
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
