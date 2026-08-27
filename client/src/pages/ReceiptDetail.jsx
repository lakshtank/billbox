import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Share2 } from 'lucide-react';
import { useReceiptQuery } from '../queries/useReceiptsQuery';
import { useDeleteReceipt, useUpdateReceipt } from '../queries/useReceiptMutations';
import ReceiptForm from '../components/receipts/ReceiptForm';
import ReceiptViewer from '../components/receipts/ReceiptViewer';
import ShareModal from '../components/receipts/ShareModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ReceiptStatusControl from '../components/receipts/ReceiptStatusControl';
import { formatDate, formatCurrency } from '../utils/formatters';

const ReceiptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditParam = searchParams.get('edit') === 'true';
  const [isEditing, setIsEditing] = useState(isEditParam);
  const [showViewer, setShowViewer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data, isLoading, isError } = useReceiptQuery(id);
  const deleteMutation = useDeleteReceipt();
  const updateMutation = useUpdateReceipt();

  const receipt = data?.receipt;
  const products = receipt?.products || [];

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this receipt and all its products?')) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Receipt deleted.');
        navigate('/receipts');
      },
      onError: () => {
        toast.error('Failed to delete receipt.');
      },
    });
  };

  const handleUpdate = (payload) => {
    updateMutation.mutate(
      { id, ...payload },
      {
        onSuccess: () => {
          toast.success('Receipt updated.');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Failed to update receipt.');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <EmptyState
        title="Receipt not found"
        description="The receipt you are looking for does not exist or was deleted."
        actionLabel="Back to Receipts"
        onAction={() => navigate('/receipts')}
      />
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            ← Cancel
          </button>
          <h1 className="text-xl font-bold text-slate-900">Edit Receipt</h1>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <ReceiptForm
            initialData={receipt}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      </div>
    );
  }

  const isPdf = receipt.fileType === 'pdf' || receipt.fileUrl?.toLowerCase().endsWith('.pdf');
  const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';

  const totalReceiptSavings = products.reduce((acc, prod) => {
    if (prod.discountAmount != null && Number(prod.discountAmount) > 0) {
      return acc + Number(prod.discountAmount);
    }
    if (prod.originalUnitPrice != null && prod.unitPrice != null && Number(prod.originalUnitPrice) > Number(prod.unitPrice)) {
      const qty = Number(prod.quantity) || 1;
      return acc + ((Number(prod.originalUnitPrice) - Number(prod.unitPrice)) * qty);
    }
    return acc;
  }, 0) + Number(receipt?.discountAmount || 0);

  const sumLineTotals = products.reduce((acc, prod) => acc + Number(prod.lineTotal || prod.unitPrice || 0), 0);
  const grandVal = receipt.grandTotal || receipt.totalAmount;
  const subVal = receipt.subtotal;
  const taxVal = Number(receipt.taxAmount || 0);
  const shipVal = Number(receipt.shippingAmount || 0);
  const discVal = Number(receipt.discountAmount || 0);

  const matchesGrand = grandVal != null && Math.abs(sumLineTotals - grandVal) <= 1.00;
  const matchesSub = subVal != null && Math.abs(sumLineTotals - subVal) <= 1.00;
  const matchesReconciled = grandVal != null && Math.abs((sumLineTotals - discVal + taxVal + shipVal) - grandVal) <= 1.00;

  const isTrueMismatch = receipt.needsReview && products.length > 0 && !matchesGrand && !matchesSub && !matchesReconciled;

  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* Document Viewer Modal */}
      {showViewer && receipt.fileUrl && (
        <ReceiptViewer
          fileUrl={receipt.publicToken ? `/api/public/receipts/${receipt.publicToken}/file` : receipt.fileUrl}
          fileName={`${vendorName} Receipt`}
          fileType={receipt.fileType}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Upgraded Share Modal */}
      {showShareModal && (
        <ShareModal
          receipt={receipt}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* 1. Breadcrumb Row */}
      <div className="flex items-center justify-between gap-4 text-xs font-normal text-slate-500">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/receipts" className="hover:text-slate-900 transition-colors no-underline text-slate-500 shrink-0">
            Receipts
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium truncate max-w-[250px] sm:max-w-xs md:max-w-md">
            {vendorName}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <ReceiptStatusControl receipt={receipt} />
        </div>
      </div>

      {/* Flagged Review Alert */}
      {isTrueMismatch && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span>⚠️</span>
            <span>
              <strong>Review Required:</strong> Line item math mismatch detected. Please verify extracted amounts.
            </span>
          </div>
          <button onClick={() => setIsEditing(true)} className="px-3 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors">
            Edit Details
          </button>
        </div>
      )}

      {/* 2. Header Block Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex items-start justify-between gap-6 pb-6 min-w-0 flex-wrap">
        <div className="min-w-0 flex-1">
          {/* Accent Color 1/3: Item count badge */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 mb-2">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight truncate" title={vendorName}>
            {vendorName}
          </h1>

          {/* Invoice Subtitle */}
          {receipt.invoiceNumber && (
            <p className="text-xs text-slate-500 font-mono mt-1">
              Invoice #{receipt.invoiceNumber}
            </p>
          )}
        </div>

        {/* Grand Total */}
        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              GRAND TOTAL
            </span>
            {totalReceiptSavings > 0 && (
              <span className="text-[11px] font-medium text-[#047857] font-tabular">
                Saved {formatCurrency(totalReceiptSavings, receipt.currency)}
              </span>
            )}
          </div>
          <span className="text-3xl sm:text-4xl font-bold text-slate-900 font-tabular tracking-tight leading-none">
            {formatCurrency(receipt.grandTotal || receipt.totalAmount, receipt.currency)}
          </span>
        </div>
      </div>

      {/* 3. Metadata Strip */}
      <div className="rounded-xl border border-slate-200 bg-white grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
        <div className="p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Purchase Date
          </span>
          <span className="text-sm font-semibold text-slate-900 font-tabular block">
            {formatDate(receipt.purchaseDate)}
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Subtotal
          </span>
          <span className="text-sm font-semibold text-slate-900 font-tabular block">
            {formatCurrency(receipt.subtotal, receipt.currency)}
          </span>
        </div>

        {receipt.discountAmount > 0 && (
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Discount / Savings
            </span>
            <span className="text-sm font-semibold text-[#047857] font-tabular block">
              -{formatCurrency(receipt.discountAmount, receipt.currency)}
            </span>
          </div>
        )}

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Tax & Shipping
          </span>
          <span className="text-sm font-semibold text-slate-900 font-tabular block">
            {formatCurrency((receipt.taxAmount || 0) + (receipt.shippingAmount || 0), receipt.currency)}
          </span>
        </div>

        <div className="p-4 space-y-1 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Document File
          </span>
          {receipt.fileUrl ? (
            <button
              type="button"
              onClick={() => setShowViewer(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-600 transition-colors text-left"
            >
              <span>{isPdf ? 'View PDF' : 'View Original Document'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Manual Entry</span>
          )}
        </div>
      </div>

      {/* 4. Line Items List */}
      <div className="space-y-2 pt-2">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 border-b border-slate-200 pb-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-7">Product / Item</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2 sm:col-span-1 text-right">Line Total</div>
        </div>

        {/* Product Rows (Hairline dividers only) */}
        <div className="divide-y divide-slate-100">
          {products.map((prod, idx) => (
            <div key={prod._id || idx} className="py-3.5 grid grid-cols-12 gap-4 items-center">
              {/* Product Info */}
              <div className="col-span-6 sm:col-span-7 pr-2">
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {prod.productName}
                </h4>
                {(() => {
                  const parts = [];
                  if (prod.brand) parts.push(prod.brand);
                  if (prod.category) parts.push(prod.category);

                  if (prod.warrantyPeriodValue && prod.warrantyPeriodValue > 0) {
                    const unitStr = prod.warrantyPeriodValue === 1
                      ? (prod.warrantyPeriodUnit?.replace(/s$/, '') || 'month')
                      : (prod.warrantyPeriodUnit || 'months');

                    let warrantyText = `${prod.warrantyPeriodValue} ${unitStr} warranty`;
                    let warrantyClass = 'text-slate-500';

                    if (prod.warrantyStatus === 'expiring_soon') {
                      warrantyText = `${prod.warrantyPeriodValue} ${unitStr} warranty (expiring soon)`;
                      warrantyClass = 'text-amber-600 font-medium';
                    } else if (prod.warrantyStatus === 'expired') {
                      warrantyText = `Warranty expired`;
                      warrantyClass = 'text-rose-600 font-medium';
                    }

                    parts.push(<span key="warranty" className={warrantyClass}>{warrantyText}</span>);
                  }

                  if (parts.length === 0) return null;

                  return (
                    <p className="text-xs text-slate-500 font-normal mt-0.5 leading-normal flex items-center gap-1.5 flex-wrap">
                      {parts.map((part, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5">
                          {index > 0 && <span className="text-slate-300 select-none">·</span>}
                          <span>{part}</span>
                        </span>
                      ))}
                    </p>
                  );
                })()}
              </div>

              {/* Numeric Columns */}
              <div className="col-span-2 text-right text-sm font-medium font-tabular text-slate-700">
                {prod.quantity || 1}
              </div>

              <div className="col-span-2 text-right text-sm font-medium font-tabular text-slate-700">
                {prod.originalUnitPrice != null && Number(prod.originalUnitPrice) > Number(prod.unitPrice || 0) && (
                  <span className="text-xs text-[#64748B] line-through font-normal mr-1.5">
                    {formatCurrency(prod.originalUnitPrice, receipt.currency)}
                  </span>
                )}
                {formatCurrency(prod.unitPrice, receipt.currency)}
              </div>

              <div className="col-span-2 sm:col-span-1 text-right text-sm font-bold font-tabular text-slate-900">
                {formatCurrency(prod.lineTotal || prod.unitPrice, receipt.currency)}
                {prod.discountAmount > 0 && (
                  <span className="text-[11px] font-medium text-[#047857] block font-sans">
                    Saved {formatCurrency(prod.discountAmount, receipt.currency)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes if present */}
      {receipt.notes && (
        <div className="border-t border-slate-100 pt-4 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Notes
          </span>
          <p className="text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-wrap">
            {receipt.notes}
          </p>
        </div>
      )}

      {/* 5. Action Row */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        {/* Destructive Delete Button with subtle red tint */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-600" />
          <span>Share</span>
        </button>

        {/* Accent Color 3/3: Solid Deep Emerald Green Primary Button */}
        {receipt.fileUrl ? (
          <button
            type="button"
            onClick={() => setShowViewer(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            View Document
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            Edit Receipt
          </button>
        )}
      </div>
    </div>
  );
};

export default ReceiptDetail;
