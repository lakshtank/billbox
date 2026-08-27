import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';

// TODO: re-enable real public link generation once app is deployed with a real domain — see VITE_PUBLIC_BASE_URL
const IS_PUBLIC_SHARING_ENABLED = false;

// Public Base URL configuration for share links & QR codes.
// On deployment, set VITE_PUBLIC_BASE_URL in your env (e.g. https://billbox.app)
const PUBLIC_BASE_URL = (
  import.meta.env.VITE_PUBLIC_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
).replace(/\/$/, '');

const ShareModal = ({ receipt, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!receipt) return null;

  // Real public URL construction (used when IS_PUBLIC_SHARING_ENABLED is true)
  const realPublicUrl = receipt.publicToken ? `${PUBLIC_BASE_URL}/public/r/${receipt.publicToken}` : '';
  const realTruncatedUrl = realPublicUrl.replace(/^https?:\/\//, '');

  const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
  const formattedDate = receipt.purchaseDate ? formatDate(receipt.purchaseDate) : '';

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

  const handleCopyLink = () => {
    if (!IS_PUBLIC_SHARING_ENABLED) {
      toast('Sharing will be available once this app is deployed', { icon: 'ℹ️' });
      return;
    }
    navigator.clipboard.writeText(realPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (!IS_PUBLIC_SHARING_ENABLED) {
      toast('Sharing will be available once this app is deployed', { icon: 'ℹ️' });
      return;
    }
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `Receipt from ${vendorName}`,
        text: `View receipt from ${vendorName}`,
        url: realPublicUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share receipt - ${vendorName}`}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-left">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-snug">Share receipt</h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5" title={vendorName}>
              {vendorName} {formattedDate && `• ${formattedDate}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container (Live rendering vs Paused Placeholder) */}
        {IS_PUBLIC_SHARING_ENABLED ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mx-auto shadow-2xs">
            <QRCodeSVG value={realPublicUrl} size={240} level="H" includeMargin={true} />
          </div>
        ) : (
          <div className="w-[240px] h-[240px] bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 mx-auto p-4 select-none">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs font-semibold text-slate-700">QR Code Preview</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Live scannable QR code available when deployed
              </p>
            </div>
          </div>
        )}

        {/* Truncated Link Display / Placeholder Text */}
        <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-center">
          <span className="text-[11px] font-mono text-slate-500 truncate block select-all">
            {IS_PUBLIC_SHARING_ENABLED
              ? realTruncatedUrl
              : 'Sharable link will appear here once BillBox is live'}
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>Copy link</span>
              </>
            )}
          </button>

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Share via...</span>
            </button>
          )}
        </div>

        {/* Reassuring Note */}
        <p className="text-[11px] text-slate-400 leading-relaxed px-2 border-t border-slate-100 pt-3">
          Anyone with this link can view and download this receipt.
        </p>
      </div>
    </div>
  );
};

export default ShareModal;
