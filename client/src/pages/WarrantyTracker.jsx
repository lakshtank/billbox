import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';

const WarrantyTracker = () => {
  const navigate = useNavigate();

  // Fetch receipts filtered by warranty status
  const { data: activeData, isLoading: loadingActive } = useReceiptsQuery({
    warrantyStatus: 'active',
    limit: 100,
  });

  const { data: expiringData, isLoading: loadingExpiring } = useReceiptsQuery({
    warrantyStatus: 'expiring_soon',
    limit: 100,
  });

  const { data: expiredData, isLoading: loadingExpired } = useReceiptsQuery({
    warrantyStatus: 'expired',
    limit: 100,
  });

  const [showExpired, setShowExpired] = useState(false);

  const isLoading = loadingActive || loadingExpiring || loadingExpired;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Helper to extract products from receipts array
  const extractProducts = (receipts = [], filterStatus) => {
    const list = [];
    receipts.forEach((receipt) => {
      const prods = Array.isArray(receipt.products) && receipt.products.length > 0
        ? receipt.products
        : [{ ...receipt, receiptId: receipt._id }];

      prods.forEach((prod) => {
        if (!filterStatus || prod.warrantyStatus === filterStatus) {
          list.push({
            product: prod,
            receipt,
          });
        }
      });
    });
    return list;
  };

  const activeItems = extractProducts(activeData?.receipts || [], 'active');
  const expiringItems = extractProducts(expiringData?.receipts || [], 'expiring_soon');
  const expiredItems = extractProducts(expiredData?.receipts || [], 'expired');

  // Combined list of non-expired items for active grid (expiring soon items listed first)
  const currentActiveWarranties = [...expiringItems, ...activeItems];
  const totalWarrantyCount = currentActiveWarranties.length + expiredItems.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* 1. Page Header Row */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Warranty Tracker
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Track your product warranties and never miss an expiration date.
          </p>
        </div>

        <button
          onClick={() => navigate('/receipts/new')}
          className="px-4 py-2 text-xs font-bold text-white bg-[#047857] rounded-xl hover:bg-[#059669] transition-colors shadow-xs cursor-pointer"
        >
          Add receipt
        </button>
      </div>

      {/* 2. Summary Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Expiring soon
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-tabular text-amber-700 block leading-tight">
            {expiringItems.length}
          </span>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Active warranties
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-tabular text-emerald-800 block leading-tight">
            {activeItems.length + expiringItems.length}
          </span>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Expired warranties
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-tabular text-rose-700 block leading-tight">
            {expiredItems.length}
          </span>
        </div>
      </div>

      {totalWarrantyCount === 0 ? (
        <EmptyState
          title="No product warranties being tracked"
          description="Log receipts with warranty durations to automatically track expiration dates and receive notifications."
          actionLabel="Add Receipt with Warranty"
          onAction={() => navigate('/receipts/new')}
        />
      ) : (
        <div className="space-y-8">
          {/* 3. Active Warranties Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Active Warranties ({currentActiveWarranties.length})
            </h2>

            {currentActiveWarranties.length === 0 ? (
              <p className="text-xs text-slate-400">No active warranties currently tracked.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentActiveWarranties.map(({ product, receipt }, idx) => (
                  <WarrantyCard key={product._id || idx} product={product} receipt={receipt} />
                ))}
              </div>
            )}
          </div>

          {/* 4. Expired Warranties Collapsible Section */}
          {expiredItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Expired warranties ({expiredItems.length})
                </h2>

                <button
                  type="button"
                  onClick={() => setShowExpired((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{showExpired ? 'Hide expired' : 'Show expired'}</span>
                  <svg
                    className={`transition-transform duration-200 ${showExpired ? 'rotate-180' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {showExpired && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {expiredItems.map(({ product, receipt }, idx) => (
                    <WarrantyCard key={product._id || idx} product={product} receipt={receipt} isExpired />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Editorial Fintech Warranty Card Component
 */
const WarrantyCard = ({ product, receipt, isExpired }) => {
  const getDaysRemainingText = () => {
    if (!product.warrantyExpiryDate) return 'No date';
    const expiry = new Date(product.warrantyExpiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const isExpiringSoon = product.warrantyStatus === 'expiring_soon';

  return (
    <Link
      to={`/receipts/${receipt._id}`}
      className="group block no-underline text-slate-900 bg-white border border-[#E2E8F0] hover:border-slate-300 hover:shadow-xs rounded-2xl p-5 transition-all flex flex-col justify-between h-full min-h-[220px]"
    >
      <div>
        {/* Top Pills Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Status Pill (No dot, no icon) */}
          {isExpired ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-sans">
              Expired
            </span>
          ) : isExpiringSoon ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 font-sans">
              Expiring soon
            </span>
          ) : (
            /* Accent Color 2/3: Active Warranty Pill */
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-sans">
              Active warranty
            </span>
          )}

          {/* Neutral Outlined Pill for Days Remaining (No color fill, plain gray border) */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-600 border border-slate-200 font-tabular">
            {getDaysRemainingText()}
          </span>
        </div>

        {/* Vendor Name */}
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
          {receipt.storeName?.trim() || 'Merchant'}
        </span>

        {/* Product Name (Visual Anchor) */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5 group-hover:text-emerald-800 transition-colors">
          {product.productName || 'Untitled Product'}
        </h3>

        {/* Brand Name (Plain inline text, NOT a boxed tag) */}
        {product.brand && (
          <p className="text-xs text-slate-500 font-normal mt-0.5 leading-tight">
            Brand: {product.brand}
          </p>
        )}
      </div>

      <div>
        {/* Hairline Divider 1 */}
        <div className="border-t border-slate-100 my-3" />

        {/* Two-Row Meta List */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-slate-400 font-normal">Purchase date</span>
            <span className="font-medium text-slate-700 font-tabular">
              {formatDate(receipt.purchaseDate)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span className="text-slate-400 font-normal">Warranty expiry</span>
            <span className="font-medium text-slate-900 font-tabular">
              {formatDate(product.warrantyExpiryDate)}
            </span>
          </div>
        </div>

        {/* Hairline Divider 2 */}
        <div className="border-t border-slate-100 my-3" />

        {/* Bottom Row: Category & Price */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]">
            {product.category || 'General'}
          </span>

          <span className="text-sm font-bold text-slate-900 font-tabular tracking-tight">
            {formatCurrency(product.lineTotal || product.unitPrice, receipt.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default WarrantyTracker;
