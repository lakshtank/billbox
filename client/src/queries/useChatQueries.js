import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook to send natural language queries to Ask BillBox AI
 */
export const useAskBillBoxMutation = () => {
  return useMutation({
    mutationFn: async ({ message, history }) => {
      const { data } = await api.post('/chat/ask', { message, history });
      return data.data;
    },
  });
};

/**
 * Hook to fetch dynamic suggested questions grounded in user's vault data
 */
export const useChatSuggestionsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['chat-suggestions'],
    queryFn: async () => {
      const { data } = await api.get('/chat/suggestions');
      return data.data?.suggestions || [];
    },
    enabled,
    staleTime: 60 * 1000,
  });
};
