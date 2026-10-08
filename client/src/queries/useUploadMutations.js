import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const isOfflineModeActive = () => {
  if (typeof window === 'undefined') return false;
  // 1. Explicit user preference
  const savedPref = localStorage.getItem('billbox_offline_mode');
  if (savedPref === 'true') return true;
  if (savedPref === 'false') return false;
  // 2. Hardware offline state
  if (navigator.onLine === false) return true;
  // 3. Network Information API (detects slow 2G or severe packet latency)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    if (conn.saveData) return true;
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
    if (typeof conn.rtt === 'number' && conn.rtt > 1200) return true;
  }
  return false;
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
