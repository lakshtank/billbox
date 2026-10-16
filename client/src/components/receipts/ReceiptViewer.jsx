import { useState, useEffect, useRef, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, ExternalLink, X, FileText, Image as ImageIcon } from 'lucide-react';

const ReceiptViewer = ({
  fileUrl,
  originalFileUrl = null,
  fileData = null,
  mimeType = null,
  fileName = 'Receipt Document',
  fileType = 'image',
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [detectedContentType, setDetectedContentType] = useState(mimeType || null);

  const containerRef = useRef(null);

  const getFileHost = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    }
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return '';
    }
    return 'http://localhost:5000';
  };

  const fullFileUrl = useMemo(() => {
    if (!fileUrl) return '';
    let url = fileUrl.startsWith('http') ? fileUrl : `${getFileHost()}${fileUrl}`;
    if (url.includes('/uploads/') && !url.includes('token=')) {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('billbox_token') || localStorage.getItem('token'))
        : null;
      if (token) {
        url += (url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`;
      }
    }
    return url;
  }, [fileUrl]);

  // Robust determination whether the document is a PDF
  const isPdf = useMemo(() => {
    if (detectedContentType?.includes('application/pdf')) return true;
    if (mimeType?.includes('application/pdf')) return true;
    if (fileType === 'pdf') return true;
    if (originalFileUrl && /\.pdf($|\?)/i.test(originalFileUrl)) return true;
    if (fileUrl && /\.pdf($|\?)/i.test(fileUrl)) return true;
    return false;
  }, [detectedContentType, mimeType, fileType, originalFileUrl, fileUrl]);

  // Generate an in-memory blob URL from fileData (MongoDB Base64) as guaranteed fallback
  const localBlobUrl = useMemo(() => {
    if (!fileData) return null;
    try {
      const binary = atob(fileData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const effType = mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');
      const blob = new Blob([bytes], { type: effType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Error converting fileData to blob URL:', e);
      return null;
    }
  }, [fileData, mimeType, isPdf]);

  useEffect(() => {
    return () => {
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [localBlobUrl]);

  const [activeSourceUrl, setActiveSourceUrl] = useState(() => fullFileUrl || localBlobUrl || '');

  useEffect(() => {
    if (fullFileUrl) {
      setActiveSourceUrl(fullFileUrl);
    } else if (localBlobUrl) {
      setActiveSourceUrl(localBlobUrl);
    }
  }, [fullFileUrl, localBlobUrl]);

  // Pre-flight check to verify that file exists and detect real Content-Type
  useEffect(() => {
    if (!fullFileUrl && localBlobUrl) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    if (!fullFileUrl && !localBlobUrl) {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('No document URL provided.');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    fetch(fullFileUrl)
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          if (localBlobUrl) {
            setActiveSourceUrl(localBlobUrl);
            setIsLoading(false);
            return;
          }
          try {
            const data = await res.json();
            setErrorMessage(data.message || 'Original document file is not available.');
          } catch {
            setErrorMessage('Unable to load document preview.');
          }
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          if (localBlobUrl) {
            setActiveSourceUrl(localBlobUrl);
            setIsLoading(false);
            return;
          }
          try {
            const data = await res.json();
            setErrorMessage(data.message || 'Original document file is not available.');
          } catch {
            setErrorMessage('Document preview unavailable.');
          }
          setHasError(true);
          setIsLoading(false);
          return;
        }

        setDetectedContentType(contentType);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          if (localBlobUrl) {
            setActiveSourceUrl(localBlobUrl);
            setIsLoading(false);
            return;
          }
          console.warn('Document pre-flight check error:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fullFileUrl, localBlobUrl]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    if (isPdf) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.15, 3));
    } else {
      setZoom((prev) => Math.max(prev - 0.15, 0.5));
    }
  };

  // Drag to pan
  const handleMouseDown = (e) => {
    if (isPdf || zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Direct File Download Handler (Blob fetch to save file directly without opening a new window)
  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const downloadTarget = activeSourceUrl || fullFileUrl;
      const response = await fetch(downloadTarget);
      if (!response.ok) {
        throw new Error('File download unavailable');
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        throw new Error('File download unavailable');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;

      // Extract file extension or default
      const extMatch = (originalFileUrl || fullFileUrl || '').match(/\.([a-z0-9]+)(\?|$)/i);
      const ext = extMatch ? extMatch[1] : isPdf ? 'pdf' : 'png';
      const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = cleanName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
        ? cleanName
        : `${cleanName}.${ext}`;

      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
        setIsDownloading(false);
      }, 200);
    } catch (err) {
      console.error('Blob download failed, falling back to direct link download', err);
      const link = document.createElement('a');
      link.href = localBlobUrl || fullFileUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Document Viewer - ${fileName}`}
    >
      {/* Responsive Modal Container Card */}
      <div
        className="bg-surface border border-line rounded-[16px] shadow-2xl flex flex-col w-[95vw] max-w-7xl h-[92vh] overflow-hidden text-fg font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="h-14 px-5 border-b border-line flex items-center justify-between gap-4 bg-surface shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-[10px] bg-surface-subtle text-accent border border-line flex items-center justify-center shrink-0">
              {isPdf ? <FileText className="size-4" /> : <ImageIcon className="size-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-fg truncate" title={fileName}>
                {fileName}
              </h2>
              <p className="text-[11px] text-fg-muted">Original document</p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {!isPdf && !hasError && (
              <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-[8px] border border-line">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 hover:bg-hover rounded-[6px] text-fg-muted hover:text-fg disabled:opacity-40 transition-colors cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="text-xs font-mono font-medium px-1.5 text-fg min-w-[40px] text-center select-none font-tabular">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-1.5 hover:bg-hover rounded-[6px] text-fg-muted hover:text-fg disabled:opacity-40 transition-colors cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="size-3.5" />
                </button>

                <div className="w-px h-4 bg-line mx-0.5" />

                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-hover rounded-[6px] text-fg-muted hover:text-fg transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 hover:bg-hover rounded-[6px] text-xs font-medium text-fg-muted hover:text-fg transition-colors cursor-pointer px-2"
                  title="Reset View"
                >
                  Reset
                </button>
              </div>
            )}

            {!hasError && (
              <>
                <a
                  href={activeSourceUrl || fullFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 text-xs font-medium text-fg bg-surface border border-line rounded-[8px] hover:bg-hover transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </a>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-3 py-1.5 text-xs font-medium text-fg bg-surface border border-line rounded-[8px] hover:bg-hover transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Download className="size-3.5" />
                  <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-[8px] text-fg-muted hover:text-fg hover:bg-hover flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close viewer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Full-bleed Content Viewer Area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 min-h-0 relative bg-subtle overflow-auto flex items-center justify-center p-2 sm:p-4"
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 z-10 gap-2 font-sans">
              <div className="size-6 border-2 border-line border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-fg-muted font-medium">Loading document...</span>
            </div>
          )}

          {hasError ? (
            <div className="text-center p-8 max-w-sm space-y-3 font-sans">
              <div className="size-12 mx-auto rounded-full bg-surface-subtle flex items-center justify-center text-fg-muted border border-line">
                <FileText className="size-6" />
              </div>
              <p className="text-sm font-semibold text-fg">Document Unavailable</p>
              <p className="text-xs text-fg-muted leading-relaxed">
                {errorMessage || 'The original scanned file for this receipt is not available on disk or was created manually.'}
              </p>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full rounded-[12px] overflow-hidden border border-line bg-surface shadow-xs">
              <iframe
                src={`${activeSourceUrl}#toolbar=1&navpanes=0&view=FitH`}
                title={fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  if (localBlobUrl && activeSourceUrl !== localBlobUrl) {
                    setActiveSourceUrl(localBlobUrl);
                    return;
                  }
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="w-full h-full border-none bg-surface"
              />
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={activeSourceUrl}
                alt={fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  if (localBlobUrl && activeSourceUrl !== localBlobUrl) {
                    setActiveSourceUrl(localBlobUrl);
                    return;
                  }
                  setIsLoading(false);
                  setHasError(true);
                }}
                draggable={false}
                className="max-w-full max-h-full object-contain rounded-[8px] shadow-sm border border-line bg-surface"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
