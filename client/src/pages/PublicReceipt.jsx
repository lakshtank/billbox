import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Download, FileText, FileQuestion, Printer } from 'lucide-react';
import ReceiptViewer from '../components/receipts/ReceiptViewer';
import { Skeleton } from '../components/ui/skeleton';
import { Money } from '../components/data/Money';
import { Button } from '../components/ui/button';

const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export default function PublicReceipt() {
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
      const baseUrl = getBaseApiUrl();
      const fileApiUrl = `${baseUrl}/public/receipts/${publicToken}/file`;
      const response = await fetch(fileApiUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
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
      const baseUrl = getBaseApiUrl();
      window.open(`${baseUrl}/public/receipts/${publicToken}/file`, '_blank');
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-app text-fg flex items-center justify-center p-6 font-sans">
        <div className="max-w-[480px] w-full bg-surface border border-line rounded-[14px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-36 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <Skeleton className="size-10 rounded-full" />
          </div>
          <div className="space-y-3 py-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
          <Skeleton className="h-10 w-full rounded-[8px]" />
        </div>
      </div>
    );
  }

  // Invalid / Revoked / Expired Token
  if (isError || !receipt) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[420px] w-full bg-white border border-slate-200 rounded-[12px] p-8 shadow-xs space-y-4">
          <div className="size-10 rounded-[10px] bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
            <FileQuestion className="size-5" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            This link is no longer available.
          </h1>
          <p className="text-xs text-slate-500 leading-normal">
            The shared receipt link has been revoked, expired, or does not exist.
          </p>
          <div className="pt-2">
            <Button asChild size="sm">
              <Link to="/">Go to BillBox</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
  const products = receipt.products || [];
  const publicFileUrl = `${getBaseApiUrl()}/public/receipts/${publicToken}/file`;
  const grandTotal = receipt.grandTotal != null ? receipt.grandTotal : receipt.totalAmount || 0;
  const currency = receipt.currency || 'INR';
  const sharedDate = receipt.updatedAt || receipt.createdAt || new Date();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white print:p-0 py-8 px-4 flex flex-col justify-between">
      {/* Document Viewer Modal */}
      {showViewer && (
        <ReceiptViewer
          fileUrl={publicFileUrl}
          originalFileUrl={receipt.fileUrl}
          fileData={receipt.fileData}
          mimeType={receipt.mimeType}
          fileName={`${vendorName} Receipt`}
          fileType={receipt.fileType}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Centred 680px Printable Column */}
      <div className="max-w-[680px] w-full mx-auto bg-white border border-slate-200 print:border-0 rounded-[12px] p-6 sm:p-8 shadow-xs print:shadow-none space-y-6">
        {/* Header: Wordmark + Shared Receipt Neutral Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs">
              B
            </div>
            <span className="font-semibold text-slate-950 text-base tracking-tight">
              BillBox
            </span>
          </div>

          <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
            Shared receipt
          </span>
        </div>

        {/* Merchant & Invoice Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {vendorName}
            </h1>
            {receipt.invoiceNumber && (
              <div className="text-xs font-mono text-slate-500">
                Invoice #{receipt.invoiceNumber}
              </div>
            )}
            <div className="text-xs text-slate-500 pt-0.5">
              Purchased: <strong className="font-medium text-slate-800">{new Date(receipt.purchaseDate).toLocaleDateString()}</strong>
            </div>
          </div>

          {/* Grand Total Display */}
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Total
            </span>
            <div className="text-3xl font-bold tracking-tight text-slate-950 font-mono">
              <Money value={grandTotal} currency={currency} />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {receipt.category || 'Receipt Total'}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500">1</td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    <Money value={grandTotal} currency={currency} />
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-950">
                    <Money value={grandTotal} currency={currency} />
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => (
                  <tr key={p._id || idx}>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">
                        {p.productName || 'Line item'}
                      </div>
                      {p.brand && (
                        <div className="text-[11px] text-slate-400">{p.brand}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {p.quantity || 1}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      <Money value={p.unitPrice} currency={currency} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-950">
                      <Money value={p.lineTotal || p.unitPrice} currency={currency} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Breakdown details */}
        {(receipt.taxAmount || receipt.shippingAmount || receipt.discountAmount) && (
          <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3 text-slate-600 max-w-xs ml-auto text-right">
            {receipt.subtotal != null && (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <Money value={receipt.subtotal} currency={currency} />
              </div>
            )}
            {receipt.taxAmount != null && (
              <div className="flex justify-between">
                <span>Tax</span>
                <Money value={receipt.taxAmount} currency={currency} />
              </div>
            )}
            {receipt.discountAmount != null && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <Money value={-receipt.discountAmount} currency={currency} />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: View document & Download (hidden on print) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Printer className="size-3.5" />
            <span>Print</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowViewer(true)}
            className="gap-1.5 text-xs text-slate-700"
          >
            <FileText className="size-3.5" />
            <span>View document</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </Button>
        </div>

        {/* Footer: Shared on {date} */}
        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          Shared on {new Date(sharedDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
