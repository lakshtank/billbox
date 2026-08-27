import { Link } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../utils/formatters';

const ReceiptCard = ({ receipt }) => {
  const isPdf = receipt.fileType === 'pdf' || receipt.fileUrl?.toLowerCase().endsWith('.pdf');
  const products = receipt.products || [];
  const itemCount = products.length || 1;
  const vendorTitle = receipt.storeName?.trim() || 'Untitled Merchant';
  const firstProdName = products[0]?.productName || receipt.productName || 'Purchased Item';

  return (
    <Link
      to={`/receipts/${receipt._id}`}
      className={`group block no-underline text-slate-900 bg-white border hover:border-slate-300 rounded-xl p-4 transition-all duration-150 ease-in-out hover:shadow-md flex flex-col justify-between h-full min-h-[210px] ${
        receipt.needsReview ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/90'
      }`}
    >
      {/* Top Meta Header: Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-tabular">
            {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
          </span>
          {receipt.needsReview && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300">
              ⚠️ Review Flagged
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {receipt.fileUrl ? (
            <span
              className="text-[10px] font-mono font-medium tracking-wider text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100/80 rounded border border-slate-200/60"
              title={isPdf ? 'PDF Receipt Attached' : 'Image Receipt Attached'}
            >
              {isPdf ? 'PDF' : 'IMG'}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              MANUAL
            </span>
          )}
        </div>
      </div>

      {/* Main Content: Vendor Title as Heading */}
      <div className="mb-3 space-y-1">
        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {vendorTitle}
        </h3>

        <p className="text-xs text-slate-600 font-medium line-clamp-1">
          {firstProdName}
        </p>

        {itemCount > 1 && (
          <p className="text-[11px] text-slate-400 font-semibold">
            + {itemCount - 1} more {itemCount - 1 === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Metadata Rows */}
      <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Purchase Date</span>
          <span className="font-semibold text-slate-700 font-tabular">
            {formatDate(receipt.purchaseDate)}
          </span>
        </div>

        {receipt.invoiceNumber && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Invoice #</span>
            <span className="font-mono text-slate-700 truncate max-w-[130px]">
              #{receipt.invoiceNumber}
            </span>
          </div>
        )}
      </div>

      {/* Thin Solid Separator */}
      <div className="border-t border-slate-100 my-2.5" />

      {/* Bottom Footer Row: Category & Total Price */}
      <div className="flex items-end justify-between min-w-0">
        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
          {products[0]?.category || 'General'}
        </span>

        <div className="text-right shrink-0 ml-2">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">
            GRAND TOTAL
          </span>
          <span className="text-sm font-bold text-slate-900 font-tabular tracking-tight">
            {formatCurrency(receipt.grandTotal || receipt.totalAmount, receipt.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ReceiptCard;
