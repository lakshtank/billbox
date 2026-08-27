import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useProductsQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: filters });
      return data.data;
    },
  });
};

export const useProductQuery = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/products/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
};
