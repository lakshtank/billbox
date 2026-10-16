import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

import { DEFAULT_CATEGORIES } from '../constants/category.constants';

export const fetchCategories = async () => {
  try {
    const { data } = await api.get('/categories');
    if (Array.isArray(data?.data?.categories)) return data.data.categories;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.categories)) return data.categories;
    if (Array.isArray(data)) return data;
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
};
