import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/categories');
        return data.data?.categories || DEFAULT_CATEGORIES;
      } catch (err) {
        return DEFAULT_CATEGORIES;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
};
