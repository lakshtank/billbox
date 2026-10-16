import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Layers, PenTool } from 'lucide-react';
import toast from '@/lib/toast';
import { useCreateReceipt } from '../queries/useReceiptMutations';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import ReceiptForm from '../components/receipts/ReceiptForm';
import ReceiptUploader from '../components/receipts/ReceiptUploader';
import BatchUploader from '../components/receipts/BatchUploader';
import ReceiptReviewForm from '../components/receipts/ReceiptReviewForm';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'scan', label: 'Upload', icon: Sparkles, iconClass: 'text-accent' },
  { id: 'batch', label: 'Batch', icon: Layers, iconClass: 'text-fg-2' },
  { id: 'manual', label: 'Manual', icon: PenTool, iconClass: 'text-fg-2' },
];

const MODES_INDEX = { scan: 0, batch: 1, manual: 2, review: 3 };

const bubbleSlideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 54 : dir < 0 ? -54 : 0,
    opacity: 0,
    scale: 0.97,
    filter: 'blur(2px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 380, damping: 28, mass: 0.75 },
      scale: { type: 'spring', stiffness: 420, damping: 24, mass: 0.7 },
      opacity: { duration: 0.22, ease: [0.2, 0, 0, 1] },
      filter: { duration: 0.2 },
    },
  },
  exit: (dir) => ({
    x: dir > 0 ? -54 : dir < 0 ? 54 : 0,
    opacity: 0,
    scale: 0.97,
    filter: 'blur(2px)',
    transition: {
      x: { type: 'spring', stiffness: 380, damping: 28, mass: 0.75 },
      scale: { duration: 0.16 },
      opacity: { duration: 0.16 },
      filter: { duration: 0.16 },
    },
  }),
};

export function AddReceipt() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const createMutation = useCreateReceipt();

  // Mode: 'scan' (Upload) | 'batch' (Batch) | 'manual' (Manual) | 'review' (Two-Pane Review)
  const getInitialMode = useCallback(() => {
    const tab = searchParams.get('tab') || searchParams.get('mode');
    if (tab === 'batch' || searchParams.get('batch') === 'true') return 'batch';
    if (tab === 'manual') return 'manual';
    return 'scan';
  }, [searchParams]);

  const [mode, setMode] = useState(getInitialMode);
  const [direction, setDirection] = useState(0);
  const [ocrData, setOcrData] = useState(null);
  const [handwritingNote, setHandwritingNote] = useState(false);

  // Sync mode if query params change externally (browser back/forward, command palette, etc.)
  useEffect(() => {
    const targetMode = getInitialMode();
    if (targetMode !== mode && mode !== 'review') {
      const prevIdx = MODES_INDEX[mode] ?? 0;
      const nextIdx = MODES_INDEX[targetMode] ?? 0;
      setDirection(nextIdx > prevIdx ? 1 : -1);
      setMode(targetMode);
    }
  }, [getInitialMode, mode]);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    const prevIdx = MODES_INDEX[mode] ?? 0;
    const nextIdx = MODES_INDEX[newMode] ?? 0;
    setDirection(nextIdx > prevIdx ? 1 : -1);
    setMode(newMode);
    setHandwritingNote(false);
    setSearchParams({ tab: newMode }, { replace: true });
  };

  const handleScanSuccess = (data) => {
    setOcrData(data);
    setHandwritingNote(false);
    setDirection(1);
    setMode('review');
  };

  const handleHandwritingDetected = (data) => {
    setOcrData(data);
    setHandwritingNote(true);
    setDirection(1);
    setMode('review');
  };

  const handleManualSubmit = (payload) => {
    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success('Receipt saved successfully.');
        const receiptId = data?.receipt?._id || data?._id;
        if (receiptId) {
          navigate(`/receipts/${receiptId}`, { viewTransition: true });
        } else {
          navigate('/receipts', { viewTransition: true });
        }
      },
      onError: (err) => {
        const message = err.response?.data?.message || 'Failed to save receipt.';
        toast.error(message);
      },
    });
  };

  const handleReviewSuccess = (data) => {
    const receiptId = data?.receipt?._id || data?._id;
    if (receiptId) {
      navigate(`/receipts/${receiptId}`, { viewTransition: true });
    } else {
      navigate('/receipts', { viewTransition: true });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title={mode === 'review' ? 'Review receipt' : 'Add receipt'}
        description={
          mode === 'review'
            ? 'Verify extracted totals, merchant, and line items side-by-side with your document.'
            : 'Upload single or batch receipts for instant OCR extraction, or enter details manually.'
        }
        actions={
          mode === 'review' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOcrData(null);
                setDirection(-1);
                handleModeSwitch('scan');
              }}
              className="gap-1.5 text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Scan another document</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/receipts')}
              className="gap-1.5 text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to receipts</span>
            </Button>
          )
        }
      />

      {/* 2. Segmented Mode Switcher (Upload · Batch · Manual) with Sliding Bubble Pill */}
      {mode !== 'review' && (
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-line pb-4">
          <div className="relative inline-flex items-center p-1 bg-subtle rounded-[10px] border border-line-subtle gap-1 text-xs select-none w-full sm:w-auto justify-between sm:justify-start">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.id;
              return (
                <m.button
                  key={tab.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleModeSwitch(tab.id)}
                  className={cn(
                    'relative z-1 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-[7px] font-medium transition-colors cursor-pointer text-center',
                    isActive ? 'text-fg font-semibold' : 'text-fg-3 hover:text-fg'
                  )}
                >
                  {isActive && (
                    <m.span
                      layoutId="add-receipt-mode-slider"
                      className="absolute inset-0 rounded-[7px] bg-surface shadow-xs border border-line-subtle -z-1"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 26,
                        mass: 0.7,
                      }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'size-3.5 relative z-10 transition-colors',
                      isActive ? tab.iconClass : 'text-fg-3'
                    )}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </m.button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Ingestion Body with Bubble Slide Animation */}
      <div className="relative w-full overflow-hidden min-h-[460px]">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {mode === 'scan' && (
            <m.div
              key="scan"
              custom={direction}
              variants={bubbleSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <ReceiptUploader
                onSuccess={handleScanSuccess}
                onHandwritingDetected={handleHandwritingDetected}
              />
            </m.div>
          )}

          {mode === 'batch' && (
            <m.div
              key="batch"
              custom={direction}
              variants={bubbleSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <BatchUploader />
            </m.div>
          )}

          {mode === 'manual' && (
            <m.div
              key="manual"
              custom={direction}
              variants={bubbleSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <ReceiptForm
                onSubmit={handleManualSubmit}
                isSubmitting={createMutation.isPending}
              />
            </m.div>
          )}

          {mode === 'review' && ocrData && (
            <m.div
              key="review"
              custom={direction}
              variants={bubbleSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <ReceiptReviewForm
                ocrData={ocrData}
                handwritingDetected={handwritingNote}
                onCancel={() => {
                  setOcrData(null);
                  handleModeSwitch('scan');
                }}
                onSuccess={handleReviewSuccess}
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AddReceipt;
