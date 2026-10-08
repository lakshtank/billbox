import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const isOfflineModeActive = () => {
  if (typeof window === 'undefined') return false;
  // Strict rule: Gemini is active by default. Shuts down only if explicitly toggled in current session.
  return sessionStorage.getItem('billbox_offline_mode') === 'true';
};

export const useUploadSingle = () => {
  return useMutation({
    mutationFn: async (input) => {
      const file = input instanceof File || input instanceof Blob ? input : input?.file;
      const forceOffline = input?.forceOffline !== undefined ? input.forceOffline : isOfflineModeActive();

      const formData = new FormData();
      formData.append('file', file);
      if (forceOffline) {
        formData.append('offline', 'true');
      }

      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      if (forceOffline) {
        headers['x-force-offline'] = 'true';
      }

      const { data } = await api.post('/upload/single', formData, { headers });
      return data.data; // unwraps standard { success, message, data }
    },
  });
};

export const useUploadBatch = () => {
  return useMutation({
    mutationFn: async (input) => {
      const files = Array.isArray(input) ? input : input?.files || [];
      const forceOffline = input?.forceOffline !== undefined ? input.forceOffline : isOfflineModeActive();

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      if (forceOffline) {
        formData.append('offline', 'true');
      }

      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      if (forceOffline) {
        headers['x-force-offline'] = 'true';
      }

      const { data } = await api.post('/upload/batch', formData, { headers });
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
