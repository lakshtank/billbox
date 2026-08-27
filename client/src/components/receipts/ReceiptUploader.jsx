import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useUploadSingle } from '../../queries/useUploadMutations';
import LoadingSpinner from '../common/LoadingSpinner';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

const ReceiptUploader = ({ onSuccess, onHandwritingDetected }) => {
  const uploadMutation = useUploadSingle();
  const [dragError, setDragError] = useState('');

  const handleDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setDragError('');

      if (rejectedFiles && rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];

        if (error.code === 'file-too-large') {
          const msg = `File is too large. Maximum size allowed is ${MAX_FILE_SIZE_MB}MB.`;
          setDragError(msg);
          toast.error(msg);
        } else if (error.code === 'file-invalid-type') {
          const msg = 'Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.';
          setDragError(msg);
          toast.error(msg);
        } else {
          setDragError(error.message);
          toast.error(error.message);
        }
        return;
      }

      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      uploadMutation.mutate(file, {
        onSuccess: (data) => {
          if (data.handwritingDetected) {
            toast.error('Handwriting or low-confidence receipt detected. Redirecting to manual entry.');
            if (onHandwritingDetected) {
              onHandwritingDetected(data);
            }
          } else {
            toast.success('Receipt scanned successfully!');
            if (onSuccess) {
              onSuccess(data);
            }
          }
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to scan receipt image.';
          setDragError(msg);
          toast.error(msg);
        },
      });
    },
    [uploadMutation, onSuccess, onHandwritingDetected]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    disabled: uploadMutation.isPending,
  });

  return (
    <div className="space-y-4 text-[#0F172A]">
      {/* Quiet, Minimal Single Scan Dropzone with 1px Dashed #E2E8F0 Hairline Border */}
      <div
        {...getRootProps()}
        className={`rounded-xl border border-dashed text-center cursor-pointer transition-colors p-8 md:p-12 ${
          isDragActive
            ? 'border-[#047857] bg-emerald-50/30'
            : 'border-[#E2E8F0] hover:border-slate-400 bg-white'
        } ${uploadMutation.isPending ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />

        {uploadMutation.isPending ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <LoadingSpinner size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">Scanning receipt with OCR...</p>
              <p className="text-xs text-[#64748B] font-normal">
                Extracting store, items, dates, and prices. Please wait a moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Minimal Line Upload Icon in Muted Gray */}
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
                {isDragActive ? 'Drop receipt file here...' : 'Click or drag & drop receipt here'}
              </p>
              <p className="text-xs text-[#64748B] font-normal">
                Supports JPG, PNG, WEBP, or PDF up to 10MB
              </p>
            </div>

            {/* Standard Outline Secondary Button */}
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors shadow-xs mt-3 inline-flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              Browse files
            </button>
          </div>
        )}
      </div>

      {dragError && (
        <div className="p-3.5 border-l-4 border-l-rose-500 bg-white text-rose-800 text-xs font-medium">
          {dragError}
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;
