import { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, X, FileText, Image as ImageIcon } from 'lucide-react';

const ReceiptViewer = ({ fileUrl, fileName = 'Receipt Document', fileType = 'image', onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const fullFileUrl = fileUrl?.startsWith('http')
    ? fileUrl
    : `${getFileHost()}${fileUrl || ''}`;

  const isPdf = fileType === 'pdf' || fileUrl?.toLowerCase().includes('.pdf');

  // Fallback timer for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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
      const response = await fetch(fullFileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;

      // Extract file extension or default
      const extMatch = fullFileUrl.match(/\.([a-z0-9]+)(\?|$)/i);
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
      link.href = fullFileUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Document Viewer - ${fileName}`}
    >
      {/* Responsive Modal Container Card */}
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col w-[95vw] max-w-7xl h-[92vh] overflow-hidden text-slate-900 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center shrink-0">
              {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate" title={fileName}>
                {fileName}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Original document</p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {!isPdf && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 hover:bg-slate-200/60 rounded text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-medium px-1.5 text-slate-700 min-w-[40px] text-center select-none font-tabular">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-1.5 hover:bg-slate-200/60 rounded text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-200 mx-0.5" />

                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-slate-200/60 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 hover:bg-slate-200/60 rounded text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-2"
                  title="Reset View"
                >
                  Reset
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close viewer"
            >
              <X className="w-4 h-4" />
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
          className="flex-1 min-h-0 relative bg-slate-100/50 overflow-auto flex items-center justify-center p-2 sm:p-4"
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 gap-2 font-sans">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-700 rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading document...</span>
            </div>
          )}

          {hasError ? (
            <div className="text-center p-8 max-w-sm space-y-3 font-sans">
              <p className="text-sm font-semibold text-slate-900">Couldn't load this document</p>
              <p className="text-xs text-slate-500">
                The document preview could not be displayed directly in browser frame.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Original File
              </button>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              <iframe
                src={`${fullFileUrl}#toolbar=0&navpanes=0&view=FitH`}
                title={fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="w-full h-full border-none bg-white"
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
                src={fullFileUrl}
                alt={fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                draggable={false}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
