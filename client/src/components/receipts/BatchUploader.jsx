import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import toast from '@/lib/toast';
import {
  Upload,
  Zap,
  WifiOff,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useUploadBatch, useBatchStatusQuery, isOfflineModeActive } from '../../queries/useUploadMutations';
import useUiStore from '../../store/uiStore';
import { Button } from '@/components/ui/button';
import { BorderBeam } from '@/components/ui/border-beam';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

export function BatchUploader() {
  const navigate = useNavigate();
  const uploadBatchMutation = useUploadBatch();
  const { activeBatchId, setActiveBatchId } = useUiStore();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [forceOfflineMode, setForceOfflineMode] = useState(() => isOfflineModeActive());

  useEffect(() => {
    localStorage.removeItem('billbox_offline_mode');
  }, []);

  const toggleOfflineMode = (e) => {
    e.stopPropagation();
    const nextVal = !forceOfflineMode;
    setForceOfflineMode(nextVal);
    sessionStorage.setItem('billbox_offline_mode', nextVal ? 'true' : 'false');
    localStorage.removeItem('billbox_offline_mode');
    if (nextVal) {
      toast.success('Offline OCR engine active for batch.');
    } else {
      toast.success('Cloud engine active for batch.');
    }
  };

  const { data: batchData } = useBatchStatusQuery(activeBatchId);

  const handleDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setErrorMsg('');

      if (rejectedFiles && rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];

        if (error.code === 'file-too-large') {
          setErrorMsg(`One or more files exceed the maximum size limit of ${MAX_FILE_SIZE_MB} MB.`);
          toast.error(`File size limit is ${MAX_FILE_SIZE_MB} MB.`);
        } else if (error.code === 'file-invalid-type') {
          setErrorMsg('Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.');
          toast.error('Only JPG, PNG, WEBP, and PDF files are allowed.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (!acceptedFiles || acceptedFiles.length === 0) return;

      setSelectedFiles((prev) => {
        const combined = [...prev, ...acceptedFiles];
        if (combined.length > MAX_FILES) {
          setErrorMsg(`Maximum of ${MAX_FILES} files allowed per batch.`);
          toast.error(`Maximum ${MAX_FILES} files allowed per batch.`);
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    disabled: uploadBatchMutation.isPending || !!activeBatchId,
  });

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg('');
  };

  const handleStartBatchUpload = () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least 1 receipt file for batch upload.');
      toast.error('File selection is required for batch upload.');
      return;
    }

    uploadBatchMutation.mutate(
      { files: selectedFiles, forceOffline: forceOfflineMode },
      {
        onSuccess: (data) => {
          toast.success(`Batch upload queued for ${selectedFiles.length} files.`);
          setActiveBatchId(data.batchId);
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to start batch upload.';
          setErrorMsg(msg);
          toast.error(msg);
        },
      }
    );
  };

  const handleResetBatch = () => {
    setActiveBatchId(null);
    setSelectedFiles([]);
    setErrorMsg('');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${Math.round(kb)} KB`;
  };

  const isProcessingBatch = Boolean(activeBatchId);
  const completedCount = batchData?.completedFiles || 0;
  const totalCount = batchData?.totalFiles || selectedFiles.length || 1;
  const progressPercent = Math.min(Math.round((completedCount / totalCount) * 100), 100);
  const isFinished = completedCount >= totalCount && totalCount > 0;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. File Selection / Pre-Upload Mode */}
      {!isProcessingBatch && (
        <div className="space-y-4">
          {/* Engine control strip */}
          <div className="flex items-center justify-between p-3 rounded-[10px] border border-line bg-surface text-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-[6px] bg-subtle border border-line-subtle flex items-center justify-center text-fg">
                <Zap className="size-3.5 text-accent" />
              </div>
              <div>
                <div className="font-semibold text-fg flex items-center gap-2">
                  <span>{forceOfflineMode ? 'Local Offline Batch Engine' : 'Cloud Processing Batch Engine'}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                      forceOfflineMode
                        ? 'bg-subtle text-fg-2 border border-line'
                        : 'bg-accent-tint text-accent border border-accent/20'
                    }`}
                  >
                    {forceOfflineMode ? 'Offline' : 'Cloud Engine'}
                  </span>
                </div>
                <p className="text-[11px] text-fg-3">
                  Upload up to {MAX_FILES} receipts at once for bulk queue extraction.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleOfflineMode}
              className="h-7 text-xs gap-1.5 shrink-0"
            >
              {forceOfflineMode ? (
                <>
                  <WifiOff className="size-3 text-fg-3" />
                  <span>Use Cloud Engine</span>
                </>
              ) : (
                <>
                  <Zap className="size-3 text-accent" />
                  <span>Switch to Offline OCR</span>
                </>
              )}
            </Button>
          </div>

          {/* Dropzone */}
          {selectedFiles.length === 0 && (
            <div
              {...getRootProps()}
              className={cn(
                'relative w-full min-h-[220px] rounded-[12px] border border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors duration-fast overflow-hidden',
                isDragActive
                  ? 'border-accent bg-accent-tint/30'
                  : 'border-line-strong bg-surface hover:border-accent hover:bg-subtle/30'
              )}
            >
              <input {...getInputProps()} />

              {/* Border Beam on drag-over */}
              {isDragActive && (
                <BorderBeam
                  size={120}
                  duration={4}
                  colorFrom="#124E66"
                  colorTo="#3E97B0"
                  borderWidth={2}
                />
              )}

              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <m.div
                  animate={{ scale: isDragActive ? 1.08 : 1 }}
                  transition={spring.snappy}
                  className="size-11 rounded-[10px] bg-subtle border border-line-subtle text-fg flex items-center justify-center shadow-2xs"
                >
                  <Upload className="size-5 text-accent" />
                </m.div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-fg">
                    {isDragActive ? 'Release to upload' : 'Drop multiple receipts here or browse'}
                  </p>
                  <p className="text-xs text-fg-3">
                    Upload up to {MAX_FILES} receipts at once (PDF, JPG, PNG, WEBP · up to 10 MB each)
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs font-medium pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                >
                  Select files (0/{MAX_FILES})
                </Button>
              </div>
            </div>
          )}

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="rounded-[12px] border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <input {...getInputProps()} />
              <div className="flex items-center justify-between pb-3 border-b border-line-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-fg">Queue</span>
                  <span className="text-xs font-mono text-fg-3 tnum">
                    ({selectedFiles.length} of {MAX_FILES} files)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedFiles.length < MAX_FILES && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        open();
                      }}
                      className="h-7 text-xs"
                    >
                      + Add file
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="h-7 text-xs text-fg-3 hover:text-bad-fg"
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              {/* File list */}
              <div className="divide-y divide-line-subtle">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="py-2.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <span className="text-xs font-mono text-fg-3">#{idx + 1}</span>
                      <FileText className="size-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-fg truncate">{file.name}</p>
                        <p className="text-[11px] text-fg-3 font-mono">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(idx)}
                      className="size-7 p-0 text-fg-3 hover:text-bad-fg"
                      title="Remove file"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Bottom Launch Row */}
              <div className="pt-3 border-t border-line-subtle flex items-center justify-between gap-4">
                <span className="text-xs text-fg-3">
                  Ready to process {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                </span>
                <Button
                  type="button"
                  size="md"
                  variant="default"
                  onClick={handleStartBatchUpload}
                  disabled={uploadBatchMutation.isPending}
                  className="gap-2"
                >
                  {uploadBatchMutation.isPending
                    ? 'Starting batch OCR...'
                    : `Start batch OCR (${selectedFiles.length} files)`}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Batch Processing Status View */}
      {isProcessingBatch && (
        <div className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-line-subtle">
            <div>
              <h3 className="text-base font-semibold text-fg">Batch processing progress</h3>
              <p className="text-xs text-fg-3 mt-0.5">
                {isFinished
                  ? 'All receipts in batch have completed OCR extraction'
                  : 'Processing receipts sequentially to extract structured records'}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetBatch}
              className="text-xs"
            >
              New batch upload
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-fg-3 tnum">
              <span>Overall progress</span>
              <span>
                {completedCount} / {totalCount} files ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-line-subtle">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* File Status List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-line-subtle text-xs font-semibold text-fg-3 uppercase tracking-wider">
              <span>Document</span>
              <span className="pr-2">Status</span>
            </div>

            <div className="divide-y divide-line-subtle">
              {batchData?.files?.map((f, idx) => (
                <div
                  key={f._id || idx}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-fg truncate">
                      {f.originalName || `File #${idx + 1}`}
                    </p>
                    {f.status === 'failed' && (
                      <p className="text-[11px] text-bad-fg font-medium truncate mt-0.5">
                        {f.errorMessage || 'OCR processing failed'}
                      </p>
                    )}
                    {f.extractedData?.storeName && (
                      <m.p
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[11px] text-fg-3 truncate mt-0.5"
                      >
                        {f.extractedData.storeName} {f.extractedData.grandTotal != null ? `· ₹${f.extractedData.grandTotal}` : ''}
                      </m.p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <AnimatePresence mode="wait">
                      {f.status === 'queued' && (
                        <m.span
                          key="queued"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-subtle text-fg-3 border border-line-subtle"
                        >
                          <Clock className="size-3 text-fg-3" />
                          <span>Queued</span>
                        </m.span>
                      )}
                      {f.status === 'processing' && (
                        <m.span
                          key="processing"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-accent-tint text-accent border border-accent/20"
                        >
                          <Loader2 className="size-3 animate-spin text-accent" />
                          <span>Processing...</span>
                        </m.span>
                      )}
                      {(f.status === 'needs_review' || f.status === 'ready') && (
                        <m.span
                          key="ready"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-warn-bg text-warn-fg border border-warn-line"
                        >
                          <CheckCircle2 className="size-3 text-warn-fg" />
                          <span>Ready for review</span>
                        </m.span>
                      )}
                      {f.status === 'saved' && (
                        <m.span
                          key="saved"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-ok-bg text-ok-fg border border-ok-line"
                        >
                          <CheckCircle2 className="size-3 text-ok-fg" />
                          <span>Saved</span>
                        </m.span>
                      )}
                      {f.status === 'failed' && (
                        <m.span
                          key="failed"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-bad-bg text-bad-fg border border-bad-line"
                        >
                          <AlertCircle className="size-3 text-bad-fg" />
                          <span>Failed</span>
                        </m.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row when finished */}
          {isFinished && (
            <div className="pt-4 border-t border-line-subtle flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-fg-3">
                Batch processing complete. Review extracted line items and save receipts.
              </p>
              <Button
                type="button"
                variant="default"
                size="md"
                onClick={() => navigate(`/receipts/batch/${activeBatchId}`)}
                className="gap-2"
              >
                <span>Review & save batch receipts</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-[8px] border border-bad-line bg-bad-bg text-bad-fg text-xs font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}

export default BatchUploader;
