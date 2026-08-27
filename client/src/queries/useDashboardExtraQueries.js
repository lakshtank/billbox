import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useWarrantyTimelineQuery = () => {
  return useQuery({
    queryKey: ['dashboard', 'warranty-timeline'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/warranty-timeline');
      return data.data;
    },
  });
};

export const useActivityFeedQuery = (limit = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/activity?limit=${limit}`);
      return data.data?.activities || [];
    },
  });
};
