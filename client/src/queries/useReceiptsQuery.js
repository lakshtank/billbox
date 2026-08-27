import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useReceiptsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['receipts', filters],
    queryFn: async () => {
      const { data } = await api.get('/receipts', { params: filters });
      return data.data;
    },
  });
};

export const useReceiptQuery = (id) => {
  return useQuery({
    queryKey: ['receipts', id],
    queryFn: async () => {
      const { data } = await api.get(`/receipts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};
