import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUploadBatch, useBatchStatusQuery } from '../../queries/useUploadMutations';
import useUiStore from '../../store/uiStore';
import LoadingSpinner from '../common/LoadingSpinner';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

const BatchUploader = () => {
  const navigate = useNavigate();
  const uploadBatchMutation = useUploadBatch();
  const { activeBatchId, setActiveBatchId } = useUiStore();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: batchData } = useBatchStatusQuery(activeBatchId);

  const handleDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setErrorMsg('');

      if (rejectedFiles && rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];

        if (error.code === 'file-too-large') {
          setErrorMsg(`One or more files exceed the maximum size limit of ${MAX_FILE_SIZE_MB}MB.`);
          toast.error(`File size limit is ${MAX_FILE_SIZE_MB}MB.`);
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
          setErrorMsg(`You can upload a maximum of ${MAX_FILES} files per batch.`);
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
      toast.error('File selection is mandatory for batch OCR.');
      return;
    }

    if (selectedFiles.length > MAX_FILES) {
      setErrorMsg(`Maximum of ${MAX_FILES} files allowed per batch.`);
      toast.error(`Maximum ${MAX_FILES} files allowed per batch.`);
      return;
    }

    uploadBatchMutation.mutate(selectedFiles, {
      onSuccess: (data) => {
        toast.success(`Batch upload started for ${selectedFiles.length} files!`);
        setActiveBatchId(data.batchId);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to start batch upload.';
        setErrorMsg(msg);
        toast.error(msg);
      },
    });
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

  const isProcessingBatch = !!activeBatchId;
  const completedCount = batchData?.completedFiles || 0;
  const totalCount = batchData?.totalFiles || selectedFiles.length || 1;
  const progressPercent = Math.min(Math.round((completedCount / totalCount) * 100), 100);
  const isFinished = completedCount >= totalCount && totalCount > 0;

  return (
    <div className="space-y-6 font-sans text-[#0F172A]">
      {/* File Selection Mode */}
      {!isProcessingBatch && (
        <div className="space-y-6">
          {selectedFiles.length === 0 && (
            <div
              {...getRootProps()}
              className={`rounded-xl border border-dashed text-center cursor-pointer transition-colors p-8 md:p-12 ${
                isDragActive
                  ? 'border-[#047857] bg-emerald-50/30'
                  : 'border-[#E2E8F0] hover:border-slate-400 bg-white'
              } ${uploadBatchMutation.isPending ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />

              <div className="space-y-3">
                <div className="w-10 h-10 text-[#64748B] mx-auto flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {isDragActive ? 'Drop receipt files here...' : 'Click or drag & drop multiple receipts'}
                  </p>
                  <p className="text-xs text-[#64748B] font-normal">
                    Upload up to {MAX_FILES} receipts at once (JPG, PNG, WEBP, PDF up to 10MB each)
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors shadow-xs mt-3 inline-flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                >
                  Select files (0/{MAX_FILES})
                </button>
              </div>
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <input {...getInputProps()} />
              <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
                <span className="text-sm font-bold text-[#0F172A]">
                  Selected receipt files ({selectedFiles.length} of {MAX_FILES} max)
                </span>

                <div className="flex items-center gap-3">
                  {selectedFiles.length < MAX_FILES ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        open();
                      }}
                      className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      + Add file
                    </button>
                  ) : (
                    <span className="text-xs text-[#64748B] font-medium">
                      Maximum {MAX_FILES} files selected
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Hairline Divided Rows */}
              <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="py-3 px-1 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-[#64748B] font-mono">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0F172A] truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1 cursor-pointer"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-[#64748B] font-normal">
                  Ready to process {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                </span>
                <button
                  type="button"
                  onClick={handleStartBatchUpload}
                  disabled={uploadBatchMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#059669] rounded-lg transition-colors shadow-xs"
                >
                  {uploadBatchMutation.isPending ? 'Starting batch OCR...' : `Start batch OCR (${selectedFiles.length} files)`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Processing & Status Tracking View */}
      {isProcessingBatch && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Batch processing progress
              </h2>
              <p className="text-xs text-[#64748B] font-normal mt-0.5">
                {isFinished
                  ? 'All receipts in batch have completed OCR processing'
                  : 'Processing receipts sequentially to ensure OCR accuracy'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetBatch}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              New batch upload
            </button>
          </div>

          {/* Thin Flat Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-[#64748B] font-tabular">
              <span>Overall progress</span>
              <span>
                {completedCount} / {totalCount} files ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
              <div
                className="h-full bg-[#047857] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* File Status List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] tracking-wider uppercase">
              <span>File name</span>
              <span className="pr-4">Status</span>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {batchData?.files?.map((f, idx) => (
                <div
                  key={f._id || idx}
                  className="py-3 px-1 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0F172A] truncate">
                      {f.originalName || `File #${idx + 1}`}
                    </p>
                    {f.status === 'failed' && (
                      <p className="text-[11px] text-rose-600 font-medium truncate mt-0.5">
                        {f.errorMessage || 'OCR processing failed'}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {f.status === 'queued' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                        <svg className="w-3.5 h-3.5 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="9" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Queued
                      </span>
                    )}
                    {f.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]">
                        <svg className="w-3.5 h-3.5 text-[#047857] animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    )}
                    {(f.status === 'needs_review' || f.status === 'ready') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                        <svg className="w-3.5 h-3.5 text-[#047857] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ready for review
                      </span>
                    )}
                    {f.status === 'saved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                        <svg className="w-3.5 h-3.5 text-[#047857] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Saved
                      </span>
                    )}
                    {f.status === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                        <svg className="w-3.5 h-3.5 text-[#DC2626] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="9" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar when Complete */}
          {isFinished && (
            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-[#64748B] font-normal">
                Batch processing complete. Review extracted data and save receipts.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/receipts/batch/${activeBatchId}`)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#059669] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Review & save batch receipts →
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 border-l-4 border-l-rose-500 bg-white text-rose-800 text-xs font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default BatchUploader;
