import * as React from 'react';
import * as m from 'motion/react-m';
import { useMotionValue, animate } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { getAuthenticatedFileUrl, createBlobUrlFromBase64 } from '@/utils/fileUrl';
import { spring } from '@/lib/motion';

/**
 * DocumentViewer Component
 * Supports standalone authenticated URLs, Blob URLs, and embedded base64 data URIs.
 * Handles both Images (with Motion gestures: mouse wheel zoom, drag pan with inertia, double-tap, touch pinch, and rotate) and PDFs.
 */
export function DocumentViewer({
  url,
  fileUrl,
  fileData,
  fileName,
  filename = 'document',
  type,
  fileType,
  mimeType,
  className,
}) {
  const scaleMV = useMotionValue(1);
  const xMV = useMotionValue(0);
  const yMV = useMotionValue(0);
  const [currentScale, setCurrentScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [useFallback, setUseFallback] = React.useState(false);

  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const touchDistRef = React.useRef(null);
  const initialPinchScaleRef = React.useRef(1);

  const resolvedFilename = fileName || filename;

  const isPdf =
    type === 'pdf' ||
    fileType === 'pdf' ||
    mimeType === 'application/pdf' ||
    (typeof url === 'string' && url.toLowerCase().includes('.pdf')) ||
    (typeof fileUrl === 'string' && fileUrl.toLowerCase().includes('.pdf'));

  // Sync currentScale state with scale motion value for UI percent readout
  React.useEffect(() => {
    const unsubscribe = scaleMV.on('change', (latest) => {
      setCurrentScale(latest);
    });
    return () => unsubscribe();
  }, [scaleMV]);

  // 1. Resolve secure, authenticated stream URL if URL or fileUrl is provided
  const authenticatedDirectUrl = React.useMemo(() => {
    const raw = url || fileUrl;
    if (!raw) return '';
    return getAuthenticatedFileUrl(raw);
  }, [url, fileUrl]);

  // 2. Generate in-memory Blob URL from fileData if available (for instant fallback)
  const localBlobUrl = React.useMemo(() => {
    if (!fileData) return null;
    return createBlobUrlFromBase64(
      fileData,
      mimeType || (isPdf ? 'application/pdf' : 'image/jpeg')
    );
  }, [fileData, mimeType, isPdf]);

  // 3. Fallback inline data URI
  const inlineDataUri = React.useMemo(() => {
    if (!fileData) return null;
    return fileData.startsWith('data:')
      ? fileData
      : `data:${mimeType || (isPdf ? 'application/pdf' : 'image/jpeg')};base64,${fileData}`;
  }, [fileData, mimeType, isPdf]);

  // Cleanup blob URL on unmount
  React.useEffect(() => {
    return () => {
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [localBlobUrl]);

  // Determine active display URL
  const activeUrl = React.useMemo(() => {
    if (useFallback) {
      return localBlobUrl || inlineDataUri || authenticatedDirectUrl || '';
    }
    return authenticatedDirectUrl || localBlobUrl || inlineDataUri || '';
  }, [useFallback, authenticatedDirectUrl, localBlobUrl, inlineDataUri]);

  // URL for new tab navigation (prefer authenticated direct link, otherwise blob)
  const tabNavigationUrl = authenticatedDirectUrl || localBlobUrl || inlineDataUri || '';

  // Reset viewer transformations and error states when document source changes
  React.useEffect(() => {
    setHasError(false);
    setUseFallback(false);
    setIsLoaded(false);
    scaleMV.set(1);
    xMV.set(0);
    yMV.set(0);
    setCurrentScale(1);
    setRotation(0);
  }, [url, fileUrl, fileData, scaleMV, xMV, yMV]);

  React.useEffect(() => {
    if (!activeUrl) {
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    setHasError(false);

    if (isPdf) {
      const timer = setTimeout(() => setIsLoaded(true), 400);
      return () => clearTimeout(timer);
    }

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [activeUrl, isPdf]);

  // Native wheel listener: useMotionValue(scale), clamp 0.5–4, animate with spring.snappy
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      if (isPdf || hasError || !activeUrl) return;
      e.preventDefault();

      const current = scaleMV.get();
      const zoomStep = e.deltaY < 0 ? 0.25 : -0.25;
      const target = Math.min(4, Math.max(0.5, Math.round((current + zoomStep) * 100) / 100));

      animate(scaleMV, target, spring.snappy);
      if (target <= 1) {
        animate(xMV, 0, spring.snappy);
        animate(yMV, 0, spring.snappy);
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [isPdf, hasError, activeUrl, scaleMV, xMV, yMV]);

  // Touch pinch-zoom listener
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
      initialPinchScaleRef.current = scaleMV.get();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistRef.current;
      const next = Math.min(4, Math.max(0.5, initialPinchScaleRef.current * factor));
      scaleMV.set(next);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      touchDistRef.current = null;
      const current = scaleMV.get();
      if (current <= 1) {
        animate(scaleMV, 1, spring.snappy);
        animate(xMV, 0, spring.snappy);
        animate(yMV, 0, spring.snappy);
      }
    }
  };

  const handleMediaError = () => {
    if (!useFallback && (localBlobUrl || inlineDataUri)) {
      setUseFallback(true);
      setIsLoaded(false);
    } else {
      setHasError(true);
    }
  };

  const handleZoomIn = () => {
    const current = scaleMV.get();
    const next = Math.min(4, Math.round((current + 0.25) * 100) / 100);
    animate(scaleMV, next, spring.snappy);
  };

  const handleZoomOut = () => {
    const current = scaleMV.get();
    const next = Math.max(0.5, Math.round((current - 0.25) * 100) / 100);
    animate(scaleMV, next, spring.snappy);
    if (next <= 1) {
      animate(xMV, 0, spring.snappy);
      animate(yMV, 0, spring.snappy);
    }
  };

  const handleResetZoom = () => {
    animate(scaleMV, 1, spring.snappy);
    animate(xMV, 0, spring.snappy);
    animate(yMV, 0, spring.snappy);
    setRotation(0);
  };

  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Double-click / double-tap: toggle fit (1x) ↔ 2×, animated with spring.snappy
  const handleDoubleClick = () => {
    if (isPdf) return;
    const current = scaleMV.get();
    if (current > 1.05) {
      handleResetZoom();
    } else {
      animate(scaleMV, 2, spring.snappy);
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-[12px] border border-line bg-subtle w-full h-full min-h-[380px]',
        className
      )}
    >
      {/* Top Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-line bg-surface/90 px-3 backdrop-blur-xs select-none z-10 shrink-0">
        <span className="text-xs font-medium text-fg-2 truncate max-w-[200px]">
          {resolvedFilename}
        </span>

        {/* Desktop Toolbar Controls */}
        <div className="hidden sm:flex items-center gap-1">
          {!isPdf && activeUrl && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 cursor-pointer"
                onClick={handleZoomOut}
                disabled={currentScale <= 0.5}
                title="Zoom out (Mouse wheel down)"
                aria-label="Zoom out"
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <span
                className="text-[11px] font-mono text-fg-3 px-1 tnum w-12 text-center cursor-pointer hover:text-fg transition-colors"
                onClick={handleResetZoom}
                title="Click to reset 100%"
              >
                {Math.round(currentScale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 cursor-pointer"
                onClick={handleZoomIn}
                disabled={currentScale >= 4}
                title="Zoom in (Mouse wheel up)"
                aria-label="Zoom in"
              >
                <ZoomIn className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 cursor-pointer"
                onClick={handleResetZoom}
                title="Fit to screen (Double-click image)"
                aria-label="Fit to screen"
              >
                <Maximize2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 cursor-pointer"
                onClick={handleRotate}
                title="Rotate 90°"
                aria-label="Rotate"
              >
                <RotateCw className="size-3.5" />
              </Button>
              <div className="h-4 w-px bg-line mx-1" />
            </>
          )}

          {tabNavigationUrl && (
            <>
              <a
                href={tabNavigationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex size-7 items-center justify-center rounded-md text-fg-3 hover:text-fg hover:bg-hover transition-colors"
                title="Open in new tab"
                aria-label="Open in new tab"
              >
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href={tabNavigationUrl}
                download={resolvedFilename}
                className="inline-flex size-7 items-center justify-center rounded-md text-fg-3 hover:text-fg hover:bg-hover transition-colors"
                title="Download file"
                aria-label="Download file"
              >
                <Download className="size-3.5" />
              </a>
            </>
          )}
        </div>

        {/* Mobile Download/Open icon in top bar */}
        {tabNavigationUrl && (
          <div className="sm:hidden flex items-center gap-1">
            <a
              href={tabNavigationUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex size-7 items-center justify-center rounded-md text-fg-3 hover:text-fg hover:bg-hover transition-colors"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Main Document Content Canvas with Mouse Wheel Zoom & Drag Pan */}
      <div
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'relative flex-1 flex items-center justify-center overflow-hidden p-2 min-h-[300px] bg-subtle select-none',
          !isPdf && currentScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        )}
      >
        {/* Step 16.3: Mobile Floating Pill Toolbar (< sm) */}
        {!isPdf && activeUrl && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-line bg-surface/90 px-2.5 py-1 shadow-lg backdrop-blur-md">
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={handleZoomOut}
              disabled={currentScale <= 0.5}
              aria-label="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span
              className="text-[11px] font-mono text-fg-3 px-1 tnum w-11 text-center cursor-pointer"
              onClick={handleResetZoom}
            >
              {Math.round(currentScale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={handleZoomIn}
              disabled={currentScale >= 4}
              aria-label="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={handleResetZoom}
              aria-label="Fit to screen"
            >
              <Maximize2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={handleRotate}
              aria-label="Rotate"
            >
              <RotateCw className="size-3.5" />
            </Button>
            {tabNavigationUrl && (
              <a
                href={tabNavigationUrl}
                download={resolvedFilename}
                className="inline-flex size-7 items-center justify-center rounded-md text-fg-3 hover:text-fg"
                aria-label="Download"
              >
                <Download className="size-3.5" />
              </a>
            )}
          </div>
        )}
        {!activeUrl ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center p-8 text-fg-3">
            <FileText className="size-8 text-fg-3" />
            <p className="text-xs font-medium text-fg">No document attached</p>
            <p className="text-[11px] text-fg-3">This receipt was entered manually without a file.</p>
          </div>
        ) : (
          <>
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-subtle text-fg-3 z-0">
                <Loader2 className="size-6 animate-spin text-accent" />
                <span className="text-xs font-medium">Loading preview...</span>
              </div>
            )}

            {hasError ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-8">
                <FileText className="size-10 text-fg-3" />
                <p className="text-xs font-medium text-fg">Unable to preview document directly</p>
                <p className="text-[11px] text-fg-3">
                  You can download or open the original file.
                </p>
                {tabNavigationUrl && (
                  <a
                    href={tabNavigationUrl}
                    download={resolvedFilename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-[8px] bg-accent px-3 py-1.5 text-xs font-medium text-on-accent hover:bg-accent-hover transition-colors"
                  >
                    <Download className="size-3.5" />
                    <span>Download file</span>
                  </a>
                )}
              </div>
            ) : isPdf ? (
              <object
                data={activeUrl}
                type="application/pdf"
                className="w-full h-full min-h-[420px] rounded-[8px] border-0 bg-surface shadow-2xs"
                onLoad={() => setIsLoaded(true)}
                onError={handleMediaError}
              >
                <iframe
                  src={activeUrl}
                  title={resolvedFilename}
                  className="w-full h-full min-h-[420px] rounded-[8px] border-0 bg-surface shadow-2xs"
                  onLoad={() => setIsLoaded(true)}
                  onError={handleMediaError}
                >
                  <p className="p-4 text-xs text-fg-3">
                    Your browser does not support inline PDFs.{' '}
                    <a
                      href={tabNavigationUrl}
                      download={resolvedFilename}
                      className="text-accent underline font-medium"
                    >
                      Download PDF
                    </a>
                  </p>
                </iframe>
              </object>
            ) : (
              <m.div
                drag={currentScale > 1}
                dragMomentum={true}
                dragElastic={0.08}
                style={{
                  x: xMV,
                  y: yMV,
                  scale: scaleMV,
                  rotate: rotation,
                }}
                className={cn(
                  'relative inline-flex items-center justify-center max-w-full max-h-[65vh] select-none',
                  currentScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                )}
              >
                <img
                  ref={imgRef}
                  src={activeUrl}
                  alt={resolvedFilename}
                  onLoad={() => setIsLoaded(true)}
                  onError={handleMediaError}
                  className={cn(
                    'max-w-full max-h-[65vh] object-contain select-none rounded shadow-2xs pointer-events-none',
                    !isLoaded && 'opacity-0'
                  )}
                  draggable={false}
                />
              </m.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentViewer;
