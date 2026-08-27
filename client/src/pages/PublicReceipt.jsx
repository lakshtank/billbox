import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Download, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import ReceiptViewer from '../components/receipts/ReceiptViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/formatters';

const PublicReceipt = () => {
  const { publicToken } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchPublicReceipt = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        const { data } = await api.get(`/public/receipts/${publicToken}`);
        if (data.success && data.data.receipt) {
          setReceipt(data.data.receipt);
        } else {
          setIsError(true);
        }
      } catch (err) {
        console.error('Error fetching public receipt:', err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (publicToken) {
      fetchPublicReceipt();
    }
  }, [publicToken]);

  const handleDownload = async () => {
    if (!publicToken || isDownloading) return;
    setIsDownloading(true);

    try {
      const baseUrl =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? '/api'
          : 'http://localhost:5000/api';
      const fileApiUrl = `${baseUrl}/public/receipts/${publicToken}/file`;
      const response = await fetch(fileApiUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const safeVendor = (receipt?.storeName || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = receipt?.fileType === 'pdf' ? 'pdf' : 'png';
      link.download = `${safeVendor}_receipt.${ext}`;
      
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
        setIsDownloading(false);
      }, 200);
    } catch (err) {
      console.error('Public download error:', err);
      const baseUrl =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? '/api'
          : 'http://localhost:5000/api';
      window.open(`${baseUrl}/public/receipts/${publicToken}/file`, '_blank');
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans text-slate-900">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-slate-900">Link Invalid or Expired</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This shared receipt link is invalid, un-shared, or no longer exists.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Go to BillBox
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
  const products = receipt.products || [];
  const publicFileUrl = `${API_BASE_URL}/public/receipts/${publicToken}/file`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header Branding Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold tracking-tight text-lg no-underline">
          <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-black">
            B
          </span>
          <span>BillBox</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Verified Public Receipt</span>
        </div>
      </header>

      {/* In-App Document Viewer Modal */}
      {showViewer && (
        <ReceiptViewer
          fileUrl={publicFileUrl}
          fileName={`${vendorName} Receipt`}
          fileType={receipt.fileType}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Main Public Receipt Card */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-10 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Strip */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100 flex-wrap">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 mb-2">
                Shared Receipt
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                {vendorName}
              </h1>
              {receipt.invoiceNumber && (
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Invoice #{receipt.invoiceNumber}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Grand Total
              </span>
              <span className="text-3xl font-bold text-slate-900 font-tabular tracking-tight">
                {formatCurrency(receipt.grandTotal || receipt.totalAmount, receipt.currency)}
              </span>
            </div>
          </div>

          {/* Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Purchase Date</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {formatDate(receipt.purchaseDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Line Items</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {products.length || 1} {products.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block mb-0.5">File Format</span>
              <span className="font-semibold text-slate-900 uppercase font-mono">
                {receipt.fileType || 'Document'}
              </span>
            </div>
          </div>

          {/* Products Table (if present) */}
          {products.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Items Summary
              </h3>
              <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                {products.map((p, idx) => (
                  <div key={p._id || idx} className="py-3 flex items-center justify-between text-xs gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block truncate">
                        {p.productName || 'Line Item'}
                      </span>
                      {p.brand && <span className="text-[11px] text-slate-400 block">{p.brand}</span>}
                    </div>
                    <div className="text-right font-tabular">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(p.lineTotal || p.unitPrice, receipt.currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Qty: {p.quantity || 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 flex-wrap">
            <button
              type="button"
              onClick={() => setShowViewer(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View document</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white mt-auto">
        <p>Shared via <strong className="text-slate-700 font-bold">BillBox</strong> • Receipts & Warranty Tracking</p>
      </footer>
    </div>
  );
};

export default PublicReceipt;
