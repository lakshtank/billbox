import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useUploadSingle = () => {
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data; // unwraps standard { success, message, data }
    },
  });
};

export const useUploadBatch = () => {
  return useMutation({
    mutationFn: async (files) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const { data } = await api.post('/upload/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
  });
};

export const useBatchStatusQuery = (batchId) => {
  return useQuery({
    queryKey: ['batchStatus', batchId],
    queryFn: async () => {
      const { data } = await api.get(`/upload/batch/${batchId}`);
      return data.data;
    },
    enabled: !!batchId,
    refetchInterval: (query) => {
      const batchData = query.state.data;
      if (!batchData) return 2000;
      // Stop refetching when all files are completed (needs_review, saved, or failed)
      if (batchData.completedFiles >= batchData.totalFiles) {
        return false;
      }
      return 2000;
    },
  });
};

export const useSaveBatchFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ batchId, fileIndex, receiptData }) => {
      const { data } = await api.post(
        `/upload/batch/${batchId}/files/${fileIndex}/save`,
        receiptData
      );
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchStatus', variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
