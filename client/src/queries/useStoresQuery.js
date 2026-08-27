import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useStoresQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['stores', filters],
    queryFn: async () => {
      const { data } = await api.get('/stores', { params: filters });
      return data.data;
    },
  });
};

export const useStoreDetailQuery = (storeName) => {
  return useQuery({
    queryKey: ['store', storeName],
    queryFn: async () => {
      if (!storeName) return null;
      const { data } = await api.get(`/stores/${encodeURIComponent(storeName)}`);
      return data.data;
    },
    enabled: Boolean(storeName),
  });
};
