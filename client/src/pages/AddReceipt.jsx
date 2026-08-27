import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateReceipt } from '../queries/useReceiptMutations';
import ReceiptForm from '../components/receipts/ReceiptForm';
import ReceiptUploader from '../components/receipts/ReceiptUploader';
import BatchUploader from '../components/receipts/BatchUploader';
import ReceiptReviewForm from '../components/receipts/ReceiptReviewForm';

const AddReceipt = () => {
  const navigate = useNavigate();
  const createMutation = useCreateReceipt();

  const [mode, setMode] = useState('scan'); // 'scan' | 'batch' | 'review' | 'manual'
  const [ocrData, setOcrData] = useState(null);
  const [handwritingNote, setHandwritingNote] = useState(false);

  const handleScanSuccess = (data) => {
    setOcrData(data);
    setHandwritingNote(false);
    setMode('review');
  };

  const handleHandwritingDetected = () => {
    setOcrData(null);
    setHandwritingNote(true);
    setMode('manual');
  };

  const handleManualSubmit = (payload) => {
    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success('Receipt saved successfully!');
        const receiptId = data?.receipt?._id || data?._id;
        if (receiptId) {
          navigate(`/receipts/${receiptId}`);
        } else {
          navigate('/receipts');
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
      navigate(`/receipts/${receiptId}`);
    } else {
      navigate('/receipts');
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-8 text-[#0F172A] font-sans">
      {/* 1. Page Header Row */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-2">
        <div>
          <h1 className="text-[30px] font-bold text-[#0F172A] tracking-[-0.02em] leading-none">
            Add receipt
          </h1>
          <p className="text-xs text-[#64748B] font-normal mt-1.5">
            Upload single or batch receipts for instant OCR extraction, or enter details manually
          </p>
        </div>

        {/* Mode Selector Tabs (Clean Segmented Control Pattern, No Emojis, No Heavy Boxes) */}
        {mode !== 'review' && (
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setMode('scan');
                setHandwritingNote(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'scan'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A] font-medium'
              }`}
            >
              Single scan
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('batch');
                setHandwritingNote(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'batch'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A] font-medium'
              }`}
            >
              Batch upload
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'manual'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A] font-medium'
              }`}
            >
              Enter manually
            </button>
          </div>
        )}
      </div>



      {/* Main Flow Render Area */}
      <div>
        {mode === 'scan' && (
          <ReceiptUploader
            onSuccess={handleScanSuccess}
            onHandwritingDetected={handleHandwritingDetected}
          />
        )}

        {mode === 'batch' && <BatchUploader />}

        {mode === 'review' && ocrData && (
          <ReceiptReviewForm
            ocrData={ocrData}
            onCancel={() => {
              setOcrData(null);
              setMode('scan');
            }}
            onSuccess={handleReviewSuccess}
          />
        )}

        {mode === 'manual' && (
          <ReceiptForm
            onSubmit={handleManualSubmit}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default AddReceipt;
