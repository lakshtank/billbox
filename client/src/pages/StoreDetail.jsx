import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Store,
  FileText,
  ShoppingBag,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { useStoreDetailQuery } from '../queries/useStoresQuery';
import ReceiptViewer from '../components/receipts/ReceiptViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';

const StoreDetail = () => {
  const { storeName } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useStoreDetailQuery(storeName);
  const [activeTab, setActiveTab] = useState('receipts'); // 'receipts' | 'products'
  const [activeViewerReceipt, setActiveViewerReceipt] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !data?.stats) {
    return (
      <EmptyState
        title="Merchant not found"
        description="Could not find transaction history for this merchant."
        actionLabel="Back to Stores"
        onAction={() => navigate('/stores')}
      />
    );
  }

  const { stats, receipts = [], products = [] } = data;
  const currency = stats.currency || 'INR';

  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* Receipt Viewer Modal */}
      {activeViewerReceipt && (
        <ReceiptViewer
          fileUrl={activeViewerReceipt.fileUrl}
          fileName={`${stats.storeName} Receipt`}
          fileType={activeViewerReceipt.fileType}
          onClose={() => setActiveViewerReceipt(null)}
        />
      )}

      {/* 1. Breadcrumb Row */}
      <div className="flex items-center gap-1.5 text-xs font-normal text-slate-500">
        <Link to="/stores" className="hover:text-slate-900 transition-colors font-medium">
          Stores
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate">{stats.storeName}</span>
      </div>

      {/* 2. Store Header Row Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {stats.categories && stats.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60"
              >
                {cat}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            {stats.storeName}
          </h1>

          <p className="text-xs text-[#64748B] font-medium mt-1.5 flex items-center gap-2 flex-wrap">
            {stats.firstPurchaseDate && (
              <span>First purchase: <strong className="font-semibold text-slate-800 font-tabular">{formatDate(stats.firstPurchaseDate)}</strong></span>
            )}
            {stats.latestPurchaseDate && (
              <>
                <span className="text-slate-300">•</span>
                <span>Latest purchase: <strong className="font-semibold text-slate-800 font-tabular">{formatDate(stats.latestPurchaseDate)}</strong></span>
              </>
            )}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Spend at Store
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-tabular tracking-tight">
            {formatCurrency(stats.totalSpent, 'INR')}
          </span>
        </div>
      </div>

      {/* 3. Metric Summary Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs font-sans">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL RECEIPTS
          </span>
          <span className="text-2xl font-black text-slate-900 font-tabular">
            {stats.receiptCount}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Verified bills
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs font-sans">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            PRODUCTS BOUGHT
          </span>
          <span className="text-2xl font-black text-slate-900 font-tabular">
            {stats.productCount}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Tracked items
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs font-sans">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            AVG. BILL AMOUNT
          </span>
          <span className="text-2xl font-black text-slate-900 font-tabular">
            {formatCurrency(stats.averageSpend, 'INR')}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Per receipt average
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs font-sans">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            ACTIVE WARRANTIES
          </span>
          <span className="text-2xl font-black text-emerald-800 font-tabular">
            {stats.activeWarrantyCount || products.filter((p) => p.warrantyStatus === 'active').length}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Covered items
          </span>
        </div>
      </div>

      {/* 4. Tab Navigation Strip */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`pb-3 px-1 font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'receipts'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Receipts ({receipts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-1 font-semibold transition-colors relative cursor-pointer ml-4 ${
              activeTab === 'products'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Products & Warranties ({products.length})
          </button>
        </div>

        {/* Tab 1: Receipts List */}
        {activeTab === 'receipts' && (
          <div className="divide-y divide-slate-100 border-b border-slate-100">
            {receipts.map((rcpt) => {
              const amt = rcpt.grandTotal != null ? rcpt.grandTotal : rcpt.totalAmount || 0;
              const rcptCurrency = rcpt.currency || currency;

              return (
                <div
                  key={rcpt._id}
                  className="py-4 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
                >
                  <div
                    onClick={() => navigate(`/receipts/${rcpt._id}`)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors font-tabular">
                        {formatDate(rcpt.purchaseDate)}
                      </span>
                      {rcpt.invoiceNumber && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          #{rcpt.invoiceNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-2">
                      <span>{rcpt.products?.length || 1} {rcpt.products?.length === 1 ? 'item' : 'items'}</span>
                      {rcpt.category && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{rcpt.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Total */}
                  <div className="flex items-center gap-4 shrink-0">
                    {rcpt.fileUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveViewerReceipt(rcpt);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">View Doc</span>
                      </button>
                    )}

                    <div
                      onClick={() => navigate(`/receipts/${rcpt._id}`)}
                      className="text-right cursor-pointer"
                    >
                      <span className="text-base sm:text-lg font-bold text-slate-900 font-tabular block">
                        {formatCurrency(amt, rcptCurrency)}
                      </span>
                    </div>

                    <ArrowRight
                      onClick={() => navigate(`/receipts/${rcpt._id}`)}
                      className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Products List */}
        {activeTab === 'products' && (
          <div className="divide-y divide-slate-100 border-b border-slate-100">
            {products.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No individual products recorded for this merchant yet.
              </div>
            ) : (
              products.map((prod) => {
                const price = prod.lineTotal || prod.unitPrice;

                let warrantyBadge = (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    No warranty
                  </span>
                );

                if (prod.warrantyStatus === 'active') {
                  warrantyBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      <span>Under Warranty</span>
                    </span>
                  );
                } else if (prod.warrantyStatus === 'expiring_soon') {
                  warrantyBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Expiring Soon</span>
                    </span>
                  );
                } else if (prod.warrantyStatus === 'expired') {
                  warrantyBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      <span>Expired</span>
                    </span>
                  );
                }

                return (
                  <div
                    key={prod._id}
                    onClick={() => navigate(`/products/${prod._id}`)}
                    className="py-4 px-2 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                          {prod.productName}
                        </h3>
                        {prod.brand && (
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-sans">
                            {prod.brand}
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                          {prod.category}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-2">
                        {prod.quantity > 1 && (
                          <span className="font-tabular">Qty: {prod.quantity}</span>
                        )}
                        {prod.warrantyExpiryDate && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Expires: <strong className="font-semibold text-slate-700 font-tabular">{formatDate(prod.warrantyExpiryDate)}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:block shrink-0">
                      {warrantyBadge}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Spend
                        </span>
                        <span className="text-base sm:text-lg font-bold text-slate-900 font-tabular tracking-tight leading-none block">
                          {price != null ? formatCurrency(price, currency) : '—'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetail;
