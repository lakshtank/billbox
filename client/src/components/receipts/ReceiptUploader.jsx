import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import * as m from 'motion/react-m';
import toast from '@/lib/toast';
import {
  Upload,
  FileText,
  X,
  Zap,
  WifiOff,
  AlertCircle,
} from 'lucide-react';
import { useUploadSingle, isOfflineModeActive } from '../../queries/useUploadMutations';
import { Button } from '@/components/ui/button';
import { BorderBeam } from '@/components/ui/border-beam';
import { spring, ease } from '@/lib/motion';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

export function ReceiptUploader({ onSuccess, onHandwritingDetected }) {
  const uploadMutation = useUploadSingle();
  const [dragError, setDragError] = useState('');
  const [forceOfflineMode, setForceOfflineMode] = useState(() => isOfflineModeActive());
  const [currentFile, setCurrentFile] = useState(null);
  const [activeStep, setActiveStep] = useState(1); // 1 = reading, 2 = extracting, 3 = matching

  useEffect(() => {
    localStorage.removeItem('billbox_offline_mode');
  }, []);

  // Step progression effect during upload
  useEffect(() => {
    if (!uploadMutation.isPending) {
      setActiveStep(1);
      return;
    }

    const t1 = setTimeout(() => setActiveStep(2), 1200);
    const t2 = setTimeout(() => setActiveStep(3), 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [uploadMutation.isPending]);

  const isPdf = currentFile?.type === 'application/pdf';

  // Generate object preview URL for uploaded image/document
  const previewUrl = useMemo(() => {
    if (!currentFile) return null;
    if (currentFile.type.startsWith('image/') || currentFile.type === 'application/pdf') {
      try {
        return URL.createObjectURL(currentFile);
      } catch {
        return null;
      }
    }
    return null;
  }, [currentFile]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const toggleOfflineMode = (e) => {
    e.stopPropagation();
    const nextVal = !forceOfflineMode;
    setForceOfflineMode(nextVal);
    sessionStorage.setItem('billbox_offline_mode', nextVal ? 'true' : 'false');
    localStorage.removeItem('billbox_offline_mode');
    if (nextVal) {
      toast.success('Offline OCR engine active.');
    } else {
      toast.success('Gemini AI engine active.');
    }
  };

  const handleProcessFile = useCallback(
    (file) => {
      setDragError('');
      setCurrentFile(file);

      uploadMutation.mutate(
        { file, forceOffline: forceOfflineMode },
        {
          onSuccess: (data) => {
            if (data.handwritingDetected) {
              toast.info('Handwritten text detected. Please verify extracted items.');
              if (onHandwritingDetected) {
                onHandwritingDetected(data);
              } else if (onSuccess) {
                onSuccess(data);
              }
            } else {
              toast.success('Receipt scanned successfully.');
              if (onSuccess) {
                onSuccess(data);
              }
            }
          },
          onError: (err) => {
            const msg = err.response?.data?.message || 'Failed to scan receipt image.';
            setDragError(msg);
            toast.error(msg);
            setCurrentFile(null);
          },
        }
      );
    },
    [uploadMutation, onSuccess, onHandwritingDetected, forceOfflineMode]
  );

  const handleDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setDragError('');

      if (rejectedFiles && rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];

        if (error.code === 'file-too-large') {
          const msg = `File is too large. Maximum size allowed is ${MAX_FILE_SIZE_MB} MB.`;
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
      handleProcessFile(acceptedFiles[0]);
    },
    [handleProcessFile]
  );

  // Clipboard paste support (Step 7.1)
  useEffect(() => {
    const handlePaste = (e) => {
      if (uploadMutation.isPending) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleProcessFile(blob);
            toast.info('Processing receipt from clipboard image.');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleProcessFile, uploadMutation.isPending]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    disabled: uploadMutation.isPending,
  });

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Subtle Engine Status Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-fg-3">
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 text-accent" />
          <span className="font-medium text-fg-2">
            {forceOfflineMode ? 'Local OCR Engine active' : 'AI-assisted OCR active'}
          </span>
          <span className="text-line-strong">·</span>
          <span className="text-[11px]">
            {forceOfflineMode
              ? 'On-device Tesseract processing'
              : 'Auto-extracts merchant, date, items, and tax'}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleOfflineMode}
          className="text-[11px] text-fg-3 hover:text-accent font-medium transition-colors cursor-pointer flex items-center gap-1"
        >
          {forceOfflineMode ? (
            <>
              <Zap className="size-3 text-accent" />
              <span>Switch to Cloud AI</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3 text-fg-3" />
              <span>Use Offline OCR</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Upload / Processing Area */}
      {uploadMutation.isPending ? (
        /* Full Original Receipt Scanning Layout (Left: Real Document Scan with Laser Beam, Right: Extraction Stages & Telemetry) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px] lg:min-h-[740px] items-stretch">
          {/* LEFT PANE: Full Original Document with Scanning Laser Animation */}
          <div className="lg:col-span-7 flex flex-col rounded-[14px] border border-line bg-surface p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-line-subtle shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-fg">Live document scanning</span>
              </div>
              <span className="text-[11px] font-mono text-fg-3 truncate max-w-[200px]">
                {currentFile?.name}
              </span>
            </div>

            {/* Document display area with layoutId="doc-thumb", luminous laser line and viewfinder corners - full document shown with zero scrollbar */}
            <m.div
              layoutId="doc-thumb"
              className="scan relative flex-1 min-h-[500px] sm:min-h-[620px] lg:min-h-[700px] rounded-[10px] bg-subtle/50 border border-line-subtle flex items-center justify-center overflow-hidden"
            >
              {/* Luminous laser beam sweeping across the document */}
              <div className="laser-line" />

              {/* High-tech Viewfinder / Scanning corner brackets */}
              <div className="absolute top-3 left-3 size-4 border-t-2 border-l-2 border-accent/80 pointer-events-none z-10" />
              <div className="absolute top-3 right-3 size-4 border-t-2 border-r-2 border-accent/80 pointer-events-none z-10" />
              <div className="absolute bottom-3 left-3 size-4 border-b-2 border-l-2 border-accent/80 pointer-events-none z-10" />
              <div className="absolute bottom-3 right-3 size-4 border-b-2 border-r-2 border-accent/80 pointer-events-none z-10" />

              {/* Subtle scanning grid lines overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(18,78,102,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(18,78,102,0.04)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

              {isPdf && previewUrl ? (
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  title="PDF Document"
                  scrolling="no"
                  className="w-full h-full min-h-[500px] sm:min-h-[620px] lg:min-h-[700px] rounded-[8px] border-0 relative z-5 pointer-events-none bg-white overflow-hidden shadow-2xs"
                />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Original Receipt Document"
                  className="w-full h-full object-contain max-h-[720px] select-none p-2 relative z-5 filter drop-shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center relative z-5">
                  <div className="size-16 rounded-[12px] bg-surface border border-line flex items-center justify-center text-accent shadow-xs mb-3">
                    <FileText className="size-8" />
                  </div>
                  <p className="text-sm font-semibold text-fg">{currentFile?.name || 'Document'}</p>
                  <p className="text-xs text-fg-3 font-mono mt-1">
                    {currentFile?.size ? `${(currentFile.size / 1024).toFixed(1)} KB` : 'Processing document'}
                  </p>
                  <span className="mt-4 px-3 py-1 rounded-full bg-accent-tint text-accent text-[11px] font-medium border border-accent/20">
                    Extracting structured fields...
                  </span>
                </div>
              )}
            </m.div>
          </div>

          {/* RIGHT PANE: Extraction Stages, File Details & Real-Time Telemetry */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-[14px] border border-line bg-surface p-6 shadow-xs space-y-6">
            {/* 1. Header with file details & cancel */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-line-subtle shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-[4px] bg-accent-tint text-accent text-[11px] font-semibold uppercase tracking-wider border border-accent/20">
                    {forceOfflineMode ? 'Local Engine' : 'AI Engine'}
                  </span>
                  <span className="text-[11px] text-fg-3 font-mono">
                    {currentFile?.size ? `${(currentFile.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-fg truncate" title={currentFile?.name}>
                  {currentFile?.name || 'Receipt Document'}
                </h4>
                <p className="text-xs text-fg-3 mt-0.5">
                  Analyzing document geometry and extracting itemized rows
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  uploadMutation.reset();
                  setCurrentFile(null);
                }}
                className="size-8 p-0 text-fg-3 hover:text-bad-fg hover:bg-bad-bg/20 shrink-0"
                title="Cancel upload"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* 2. 3-Step Progress Stages with Connected Vertical Line & Checkmark Drawing */}
            <div className="space-y-6 flex-1 py-1">
              <div className="relative space-y-6 pl-1">
                {/* Vertical Progress Spine */}
                <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-line-subtle -z-0">
                  <m.div
                    className="w-full bg-ok-fg origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{
                      scaleY: activeStep === 3 ? 1 : activeStep === 2 ? 0.5 : 0,
                    }}
                    transition={{ duration: 0.35, ease: ease.out }}
                    style={{ height: '100%' }}
                  />
                </div>

                {/* Stage 1: Reading document */}
                <div className="relative z-10 flex items-start gap-3.5">
                  <div className="size-6 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {activeStep > 1 ? (
                      <svg className="size-4 text-ok-fg" viewBox="0 0 16 16">
                        <m.path
                          d="M3 8.5l3.5 3.5 6.5-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.22, ease: ease.out }}
                        />
                      </svg>
                    ) : (
                      <svg className="size-4 animate-spin text-accent" viewBox="0 0 16 16">
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="26 12"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm transition-colors',
                        activeStep === 1
                          ? 'font-semibold text-fg'
                          : activeStep > 1
                          ? 'font-medium text-fg-2'
                          : 'text-fg-3'
                      )}
                    >
                      Reading document
                    </p>
                    <p className="text-xs text-fg-3 mt-0.5">
                      {activeStep > 1
                        ? 'Image rasterized and text blocks mapped'
                        : 'Parsing visual coordinates and text glyphs...'}
                    </p>
                  </div>
                </div>

                {/* Stage 2: Extracting fields & totals */}
                <div className="relative z-10 flex items-start gap-3.5">
                  <div className="size-6 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {activeStep > 2 ? (
                      <svg className="size-4 text-ok-fg" viewBox="0 0 16 16">
                        <m.path
                          d="M3 8.5l3.5 3.5 6.5-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.22, ease: ease.out }}
                        />
                      </svg>
                    ) : activeStep === 2 ? (
                      <svg className="size-4 animate-spin text-accent" viewBox="0 0 16 16">
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="26 12"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <div className="size-2 rounded-full bg-line-strong" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm transition-colors',
                        activeStep === 2
                          ? 'font-semibold text-fg'
                          : activeStep > 2
                          ? 'font-medium text-fg-2'
                          : 'text-fg-3'
                      )}
                    >
                      Extracting fields & totals
                    </p>
                    <p className="text-xs text-fg-3 mt-0.5">
                      {activeStep > 2
                        ? 'Merchant, date, taxes, and subtotal parsed'
                        : activeStep === 2
                        ? 'Detecting vendor, invoice number, and financial amounts...'
                        : 'Waiting for text block analysis'}
                    </p>
                  </div>
                </div>

                {/* Stage 3: Matching categories & calculating line items */}
                <div className="relative z-10 flex items-start gap-3.5">
                  <div className="size-6 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {activeStep === 3 ? (
                      <svg className="size-4 animate-spin text-accent" viewBox="0 0 16 16">
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="26 12"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <div className="size-2 rounded-full bg-line-strong" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm transition-colors',
                        activeStep === 3 ? 'font-semibold text-fg' : 'text-fg-3'
                      )}
                    >
                      Matching categories & calculating line items
                    </p>
                    <p className="text-xs text-fg-3 mt-0.5">
                      {activeStep === 3
                        ? 'Categorizing products, warranty terms, and verifying item totals...'
                        : 'Final reconciliation and catalog classification'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extraction Telemetry Box */}
              <div className="p-3.5 rounded-[10px] bg-subtle/50 border border-line-subtle space-y-2">
                <div className="flex items-center justify-between text-[11px] text-fg-3 font-medium">
                  <span>Extraction telemetry</span>
                  <span className="font-mono text-accent inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                    Live stream
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-fg-3">Vendor / Store:</span>
                    <span className={activeStep > 1 ? 'font-medium text-fg' : 'text-fg-3 font-mono text-[11px]'}>
                      {activeStep > 1 ? 'Identified' : 'Analyzing...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-fg-3">Line items:</span>
                    <span className={activeStep > 2 ? 'font-medium text-fg' : 'text-fg-3 font-mono text-[11px]'}>
                      {activeStep > 2 ? 'Parsed' : 'Detecting rows...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-fg-3">Math reconciliation:</span>
                    <span className={activeStep === 3 ? 'font-medium text-accent' : 'text-fg-3 font-mono text-[11px]'}>
                      {activeStep === 3 ? 'Verifying penny totals' : 'Queued'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Footer with step indicator */}
            <div className="pt-3 border-t border-line-subtle flex items-center justify-between text-xs text-fg-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                <span>Processing original document</span>
              </div>
              <span className="font-mono text-[11px] text-fg-2 font-medium tnum">
                {activeStep === 1 ? 'Step 1 of 3' : activeStep === 2 ? 'Step 2 of 3' : 'Step 3 of 3'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Step 7.1: Dropzone with BorderBeam, Spring Scale on Hover, and Caption Switch */
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

          {/* Border Beam (Magic UI celestial teal #124E66 to #3E97B0) while dragging over */}
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
            {/* Icon tile scales 1 -> 1.08 with spring.snappy on drag-over */}
            <m.div
              animate={{ scale: isDragActive ? 1.08 : 1 }}
              transition={spring.snappy}
              className="size-11 rounded-[10px] bg-subtle border border-line-subtle text-fg flex items-center justify-center shadow-2xs"
            >
              <Upload className="size-5 text-accent" />
            </m.div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">
                {isDragActive ? 'Release to upload' : 'Drop a receipt here or browse'}
              </p>
              <p className="text-xs text-fg-3">
                PDF, JPG, PNG, WEBP · up to 10 MB · or paste from clipboard
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
              Browse files
            </Button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {dragError && (
        <div className="flex items-center gap-2 p-3 rounded-[8px] border border-bad-line bg-bad-bg text-bad-fg text-xs font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{dragError}</span>
        </div>
      )}
    </div>
  );
}

export default ReceiptUploader;
