import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Zap, Wifi, WifiOff } from 'lucide-react';
import { useUploadSingle, isOfflineModeActive } from '../../queries/useUploadMutations';
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
  const [forceOfflineMode, setForceOfflineMode] = useState(() => isOfflineModeActive());

  // Listen to network online/offline events
  useEffect(() => {
    const handleStatus = () => {
      setForceOfflineMode(isOfflineModeActive());
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const toggleOfflineMode = (e) => {
    e.stopPropagation();
    const nextVal = !forceOfflineMode;
    setForceOfflineMode(nextVal);
    localStorage.setItem('billbox_offline_mode', nextVal ? 'true' : 'false');
    if (nextVal) {
      toast.success('⚡ Instant Offline Engine activated (Zero cloud latency)');
    } else {
      toast('🌐 Cloud AI Mode enabled (Auto-switches to local if internet lags)', { icon: 'ℹ️' });
    }
  };

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

      uploadMutation.mutate({ file, forceOffline: forceOfflineMode }, {
        onSuccess: (data) => {
          if (data.handwritingDetected) {
            toast('📝 Review and verify details with receipt preview', { icon: 'ℹ️' });
            if (onHandwritingDetected) {
              onHandwritingDetected(data);
            } else if (onSuccess) {
              onSuccess(data);
            }
          } else {
            const isLocal = data.engine === 'local-offline' || forceOfflineMode;
            toast.success(
              isLocal
                ? '⚡ Receipt scanned instantly via Local Offline OCR!'
                : 'Receipt scanned successfully!'
            );
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
    [uploadMutation, onSuccess, onHandwritingDetected, forceOfflineMode]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    disabled: uploadMutation.isPending,
  });

  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="space-y-4 text-[#0F172A]">
      {/* Network & Demo Mode Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${forceOfflineMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              <span>{forceOfflineMode ? (isLocalHost ? '⚡ Fast Offline Engine' : '⚡ Instant Demo Engine') : '🌐 Hybrid Cloud AI Mode'}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${forceOfflineMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {forceOfflineMode ? 'Fast Demo Active' : 'Online'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              {forceOfflineMode
                ? (isLocalHost
                    ? 'Processes directly on your PC using local Tesseract — Zero cloud latency (<2s)'
                    : 'High-speed multimodal AI pipeline with 3s anti-lag watchdog (<1.5s)')
                : 'Uses multimodal AI with 3s auto-fallback to prevent latency on slow internet'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleOfflineMode}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
            forceOfflineMode
              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
          }`}
          title="Toggle fast demo mode to eliminate lag"
        >
          {forceOfflineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>{isLocalHost ? 'Offline Mode: ON' : 'Demo Mode: ON'}</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>{isLocalHost ? 'Force Fast Offline' : 'Switch to Demo Fast'}</span>
            </>
          )}
        </button>
      </div>

      {/* Single Scan Dropzone */}
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
              <p className="text-sm font-bold text-[#0F172A]">
                {forceOfflineMode ? '⚡ Processing with Local Offline OCR...' : 'Scanning receipt with OCR...'}
              </p>
              <p className="text-xs text-[#64748B] font-normal">
                {forceOfflineMode
                  ? 'Extracting merchant, line items, and warranty on-device with zero network wait.'
                  : 'Extracting store, items, dates, and prices. Auto-switching to local if network slows.'}
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
