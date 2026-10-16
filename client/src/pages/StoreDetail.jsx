import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useStoreDetailQuery } from '../queries/useStoresQuery';
import { EmptyState } from '../components/common/EmptyState';
import { Money } from '../components/data/Money';
import { DateCell } from '../components/data/DateCell';
import { KpiTile } from '../components/data/KpiTile';
import { SpendingChart } from '../components/data/SpendingChart';
import { StatusBadge } from '../components/data/StatusBadge';
import { BarList } from '../components/data/BarList';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export default function StoreDetail() {
  const params = useParams();
  const rawStoreName = params['*'] ? `${params.storeName}/${params['*']}` : params.storeName;
  const storeName = decodeURIComponent(rawStoreName || '');
  const navigate = useNavigate();

  const { data, isLoading, isError } = useStoreDetailQuery(storeName);

  // Pagination for receipts table (10 per page per Step 18)
  const [receiptPage, setReceiptPage] = useState(1);
  const [activeTab, setActiveTab] = useState('receipts'); // 'receipts' | 'products'

  const RECEIPT_PAGE_SIZE = 10;

  const { stats, receipts = [], products = [] } = data || {};
  const currency = stats?.currency || 'INR';

  // Format monthly spend data for SpendingChart
  const spendChartData = useMemo(() => {
    if (!receipts || receipts.length === 0) return [];

    const sorted = [...receipts].sort(
      (a, b) => new Date(a.purchaseDate || 0) - new Date(b.purchaseDate || 0)
    );

    const monthMap = new Map();
    sorted.forEach((r) => {
      const d = new Date(r.purchaseDate || r.createdAt);
      const key = `${d.toLocaleString('default', { month: 'short' })} '${String(d.getFullYear()).slice(-2)}`;
      const amt = r.grandTotal != null ? r.grandTotal : r.totalAmount || 0;
      monthMap.set(key, (monthMap.get(key) || 0) + amt);
    });

    return Array.from(monthMap.entries()).map(([label, amount]) => ({
      label,
      amount: Math.round(amount),
    }));
  }, [receipts]);

  // Aggregate category spend for bar list
  const categorySpendData = useMemo(() => {
    if (!receipts || receipts.length === 0) return [];
    const map = new Map();
    receipts.forEach((r) => {
      const cat = r.category || 'General';
      const amt = r.grandTotal != null ? r.grandTotal : r.totalAmount || 0;
      map.set(cat, (map.get(cat) || 0) + amt);
    });

    const total = stats?.totalSpent || 1;
    return Array.from(map.entries())
      .map(([name, spend]) => ({
        name,
        spend,
        percentage: Math.min(100, Math.round((spend / total) * 100)),
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);
  }, [receipts, stats?.totalSpent]);

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[12px]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Store}
          title="Merchant not found"
          description="We couldn't find transaction history for this merchant."
          actionLabel="Back to Merchants"
          onAction={() => navigate('/stores')}
        />
      </div>
    );
  }

  // Paginated receipts
  const totalReceiptPages = Math.ceil(receipts.length / RECEIPT_PAGE_SIZE) || 1;
  const paginatedReceipts = receipts.slice(
    (receiptPage - 1) * RECEIPT_PAGE_SIZE,
    receiptPage * RECEIPT_PAGE_SIZE
  );

  const initial = (stats.storeName || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Back Link & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-fg-3">
        <Link
          to="/stores"
          className="hover:text-fg transition-colors inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>Merchants</span>
        </Link>
        <span>/</span>
        <span className="text-fg font-semibold truncate">{stats.storeName}</span>
      </div>

      {/* 2. Header: Avatar, Name, Caption "Grouped by merchant name" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-12 rounded-xl bg-subtle border border-line flex items-center justify-center font-bold text-xl text-fg shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg truncate">
              {stats.storeName}
            </h1>
            <p className="text-xs text-fg-3 font-normal mt-0.5">
              Grouped by merchant name
            </p>
          </div>
        </div>

        {/* Categories as Neutral Badges */}
        {Array.isArray(stats?.categories) && stats.categories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {stats.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-medium text-fg-2 bg-subtle px-2.5 py-1 rounded-md border border-line"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. 4 Stat Tiles: Total spend, Receipts, Average basket, First → last purchase */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Total spend"
          value={<Money value={stats.totalSpent} currency={currency} />}
          deltaLabel="All-time spend"
        />
        <KpiTile
          label="Receipts"
          value={stats.receiptCount}
          unit={stats.receiptCount === 1 ? 'receipt' : 'receipts'}
          deltaLabel="Transactions"
        />
        <KpiTile
          label="Average basket"
          value={<Money value={stats.averageSpend} currency={currency} />}
          deltaLabel="Per receipt"
        />
        <KpiTile
          label="First → last purchase"
          value={
            stats.latestPurchaseDate ? (
              <DateCell value={stats.latestPurchaseDate} />
            ) : (
              '—'
            )
          }
          hint={
            stats.firstPurchaseDate
              ? `First: ${new Date(stats.firstPurchaseDate).toLocaleDateString()}`
              : 'No purchase records'
          }
        />
      </div>

      {/* 4. Chart: spend over time & Bar list: spend by category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spend over time chart (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <SpendingChart
            data={spendChartData}
            title="Spend over time"
            height={260}
          />
        </div>

        {/* Spend by category bar list (5 cols on desktop) */}
        <div className="lg:col-span-5 rounded-[12px] border border-line bg-surface p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-line-subtle pb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
              Spend by category
            </span>
            <span className="text-xs text-fg-3 font-normal">
              {categorySpendData.length} categories
            </span>
          </div>

          {categorySpendData.length === 0 ? (
            <div className="py-8 text-center text-xs text-fg-3">
              No category breakdown available
            </div>
          ) : (
            <BarList
              data={categorySpendData.map((item) => ({
                name: item.name,
                value: item.spend,
                spend: item.spend,
                percentage: item.percentage,
              }))}
              currency={currency}
            />
          )}
        </div>
      </div>

      {/* 5. Receipts & Products Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-line text-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('receipts');
              setReceiptPage(1);
            }}
            className={`pb-2.5 px-1 font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'receipts'
                ? 'text-fg border-b-2 border-accent'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            Receipts ({receipts.length})
          </button>

          {products.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`pb-2.5 px-1 font-semibold transition-colors relative cursor-pointer ml-3 ${
                activeTab === 'products'
                  ? 'text-fg border-b-2 border-accent'
                : 'text-fg-3 hover:text-fg'
              }`}
            >
              Products & Warranties ({products.length})
            </button>
          )}
        </div>

        {/* Tab 1: Receipts Table (paginated 10 per page) */}
        {activeTab === 'receipts' && (
          <div className="rounded-[12px] border border-line bg-surface shadow-2xs overflow-hidden">
            {receipts.length === 0 ? (
              <div className="p-8 text-center text-sm text-fg-3">
                No receipts recorded for this merchant.
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <table className="w-full text-left border-collapse table-fixed text-sm">
                  <colgroup>
                    <col className="w-[20%] min-w-[130px]" />
                    <col className="w-[20%] min-w-[120px]" />
                    <col className="w-[20%] min-w-[120px]" />
                    <col className="w-[15%] min-w-[90px]" />
                    <col className="w-[15%] min-w-[110px]" />
                    <col className="w-[10%] min-w-[60px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-line bg-subtle text-xs font-medium text-fg-3 uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold">Invoice</th>
                      <th className="py-2.5 px-4 font-semibold">Category</th>
                      <th className="py-2.5 px-4 font-semibold">Items</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                      <th className="py-2.5 px-4 font-semibold text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {paginatedReceipts.map((rcpt) => {
                      const amt =
                        rcpt.grandTotal != null ? rcpt.grandTotal : rcpt.totalAmount || 0;
                      const rcptCurrency = rcpt.currency || currency;

                      return (
                        <tr
                          key={rcpt._id}
                          onClick={() => navigate(`/receipts/${rcpt._id}`)}
                          className="group hover:bg-hover/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-medium text-fg">
                            <DateCell value={rcpt.purchaseDate} />
                          </td>

                          <td className="py-3 px-4 font-mono text-xs text-fg-3">
                            {rcpt.invoiceNumber ? `#${rcpt.invoiceNumber}` : '—'}
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-xs text-fg-2 bg-subtle px-2 py-0.5 rounded border border-line-subtle">
                              {rcpt.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-fg-2 tnum">
                            {rcpt.products?.length || 1}{' '}
                            {rcpt.products?.length === 1 ? 'item' : 'items'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Money
                              value={amt}
                              currency={rcptCurrency}
                              className="font-semibold text-fg"
                            />
                          </td>

                          <td className="py-3 px-4 text-right">
                            <ChevronRight className="size-4 text-fg-3 group-hover:text-fg group-hover:translate-x-0.5 transition-all inline-block" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {receipts.length > RECEIPT_PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-subtle/50 text-xs text-fg-3">
                <div>
                  Showing{' '}
                  <span className="font-medium text-fg tnum">
                    {(receiptPage - 1) * RECEIPT_PAGE_SIZE + 1}
                  </span>
                  –
                  <span className="font-medium text-fg tnum">
                    {Math.min(receiptPage * RECEIPT_PAGE_SIZE, receipts.length)}
                  </span>{' '}
                  of <span className="font-medium text-fg tnum">{receipts.length}</span> receipts
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiptPage((p) => p - 1)}
                    disabled={receiptPage <= 1}
                    className="h-7 text-xs px-2.5"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiptPage((p) => p + 1)}
                    disabled={receiptPage >= totalReceiptPages}
                    className="h-7 text-xs px-2.5"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Products List */}
        {activeTab === 'products' && (
          <div className="rounded-[12px] border border-line bg-surface shadow-2xs overflow-hidden">
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed text-sm">
                <colgroup>
                  <col className="w-[35%] min-w-[200px]" />
                  <col className="w-[15%] min-w-[100px]" />
                  <col className="w-[20%] min-w-[120px]" />
                  <col className="w-[15%] min-w-[100px]" />
                  <col className="w-[15%] min-w-[90px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-line bg-subtle text-xs font-medium text-fg-3 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Product</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Warranty</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Price</th>
                    <th className="py-2.5 px-4 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {products.map((prod) => {
                    const price = prod.lineTotal || prod.unitPrice;

                    return (
                      <tr
                        key={prod._id}
                        onClick={() => navigate(`/products/${prod._id}`)}
                        className="group hover:bg-hover/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-fg group-hover:text-accent transition-colors truncate">
                            {prod.productName}
                          </div>
                          {prod.brand && (
                            <div className="text-xs text-fg-3">{prod.brand}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs text-fg-2">
                          {prod.category || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={prod.warrantyStatus || 'none'} />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Money
                            value={price}
                            currency={currency}
                            className="font-medium text-fg"
                          />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="size-4 text-fg-3 group-hover:text-fg group-hover:translate-x-0.5 transition-all inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
