import * as React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Scan,
  FileText,
  ShieldCheck,
  Trash2,
  Edit3,
  Store,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useDashboardQuery } from '../queries/useDashboardQuery';
import { useActivityFeedQuery } from '../queries/useDashboardExtraQueries';
import { useRemindersQuery } from '../queries/useRemindersQuery';
import { PageHeader } from '../components/common/PageHeader';
import { KpiTile } from '../components/data/KpiTile';
import { SpendingChart } from '../components/data/SpendingChart';
import { Money } from '../components/data/Money';
import { StatusBadge } from '../components/data/StatusBadge';
import { DateCell } from '../components/data/DateCell';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useViewTransitionNavigate, useViewTransitionState } from '@/context/ViewTransitionContext';
import EmptyState from '../components/common/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import PageContentTransition from '@/components/common/PageContentTransition';
import * as m from 'motion/react-m';
import { spring } from '@/lib/motion';
import { useOverviewIntro } from '@/hooks/useOverviewIntro';
import { cn } from '../lib/utils';

/**
 * Helper: format relative timestamp for activity feed
 */
function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getActivityIcon(type) {
  switch (type) {
    case 'receipt_ocr_scanned':
      return <Scan className="size-3.5 text-accent" />;
    case 'receipt_created':
      return <FileText className="size-3.5 text-accent" />;
    case 'product_created':
      return <ShieldCheck className="size-3.5 text-ok-fg" />;
    case 'product_updated':
      return <Edit3 className="size-3.5 text-accent" />;
    case 'receipt_deleted':
    case 'product_deleted':
      return <Trash2 className="size-3.5 text-bad-fg" />;
    default:
      return <Clock className="size-3.5 text-fg-3" />;
  }
}

function RecentReceiptRow({ r, currency, onNavigate }) {
  const statusKey = r.needsReview
    ? 'needs_review'
    : r.status === 'archived'
    ? 'expired'
    : 'reconciled';
  const to = `/receipts/${r._id}`;
  const isTransitioning = useViewTransitionState(to);

  return (
    <tr
      data-intro="row"
      onClick={() => onNavigate(to)}
      className="hover:bg-hover transition-colors cursor-pointer group"
    >
      <td className="p-2.5 font-medium text-fg group-hover:text-accent">
        <div className="flex items-center gap-2">
          <div
            style={isTransitioning ? { viewTransitionName: `receipt-avatar-${r._id}` } : undefined}
            className="size-6 rounded bg-subtle border border-line flex items-center justify-center shrink-0"
          >
            <Store className="size-3 text-fg-3" />
          </div>
          <span
            style={isTransitioning ? { viewTransitionName: `receipt-title-${r._id}` } : undefined}
            className="truncate max-w-[180px]"
          >
            {r.storeName || 'Merchant'}
          </span>
        </div>
      </td>
      <td className="p-2.5">
        <DateCell value={r.purchaseDate || r.createdAt} />
      </td>
      <td className="p-2.5 text-right font-medium">
        <Money
          value={r.grandTotal != null ? r.grandTotal : (r.totalAmount || 0)}
          currency={r.currency || currency}
        />
      </td>
      <td className="p-2.5 text-right">
        <StatusBadge status={statusKey} />
      </td>
    </tr>
  );
}

/**
 * Step 12: Overview Page (/)
 * - Answers: What did I spend, what loses cover soon, did anything fail, what changed.
 * - Header: "Overview" / "Your spending and warranty status." with range selector: [30d] [90d] [1y] [All] stored in URL (?range=90d)
 * - 4 KPI tiles: Total spend, Receipts, Under warranty, Expiring in 30d
 * - Middle row (8/4 split): Spend over time (area chart) & Expiring soon
 * - Bottom row (8/4 split): Recent receipts (5-row table) & Activity feed
 * - Needs-review banner only when count > 0
 * - Greeting removed. Real user name only in sidebar.
 */
const RANGE_BUTTONS = [
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: '1y', label: '1y' },
  { id: 'all', label: 'All' },
];

function DashboardSkeleton({ range, handleRangeChange }) {
  return (
    <div className="space-y-6 font-sans select-none" aria-busy="true">
      <PageHeader
        title="Overview"
        description="Your spending and warranty status."
        actions={
          <div className="inline-flex items-center p-1 bg-subtle border border-line rounded-[8px] text-xs font-medium">
            {RANGE_BUTTONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRangeChange(r.id)}
                className={cn(
                  'px-2.5 py-1 rounded-[6px] transition-all cursor-pointer font-medium',
                  range === r.id
                    ? 'bg-surface text-fg font-semibold shadow-xs'
                    : 'text-fg-3 hover:text-fg hover:bg-hover/60'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* 4 KPI Tile Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-[10px] border border-line bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Middle Row Skeletons (8/4 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 p-5 rounded-[10px] border border-line bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-4 p-5 rounded-[10px] border border-line bg-surface space-y-4">
          <Skeleton className="h-5 w-28 rounded" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-line-subtle last:border-0">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row Skeletons (8/4 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-5 rounded-[10px] border border-line bg-surface space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 p-5 rounded-[10px] border border-line bg-surface space-y-4">
          <Skeleton className="h-5 w-20 rounded" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useViewTransitionNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const range = searchParams.get('range') || '30d';

  const { data: stats, isLoading, isError } = useDashboardQuery();
  const { data: activities = [], isLoading: activitiesLoading } = useActivityFeedQuery(5);
  const { data: remindersData } = useRemindersQuery();

  const scopeRef = React.useRef(null);
  useOverviewIntro(scopeRef, Boolean(stats && !isLoading));

  const handleRangeChange = (newRange) => {
    setSearchParams({ range: newRange });
  };

  const currency = user?.defaultCurrency || stats?.baseCurrency || 'INR';

  // Compute upcoming expiring items (sorted by daysRemaining ascending, max 5)
  const expiringItems = React.useMemo(() => {
    const rawList = Array.isArray(remindersData?.items)
      ? remindersData.items
      : Array.isArray(stats?.warrantyTimeline)
      ? stats.warrantyTimeline
      : [];
    return rawList
      .filter((i) => i && i.daysRemaining > 0 && i.daysRemaining <= 90)
      .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0))
      .slice(0, 5);
  }, [remindersData, stats]);

  // Compute spend and chart data based on selected range
  const { filteredSpend, displayDelta, deltaLabel, chartData } = React.useMemo(() => {
    const rawPoints = Array.isArray(stats?.spendingOverTime) ? stats.spendingOverTime : [];
    if (!rawPoints.length) {
      return {
        filteredSpend: stats?.totalSpent || 0,
        displayDelta: stats?.spentVsLastMonthDiff,
        deltaLabel: 'vs previous period',
        chartData: [],
      };
    }

    const now = new Date();
    let cutoff = new Date(0); // All time

    if (range === '30d') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === '1y') {
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const pointsInRange = rawPoints.filter((pt) => {
      const ptDate = new Date(pt.rawDate || pt.date);
      return !isNaN(ptDate.getTime()) ? ptDate >= cutoff : true;
    });

    const spendSum = range === '30d'
      ? (stats?.thisMonthSpent || stats?.totalSpent || 0)
      : pointsInRange.reduce((acc, pt) => acc + (pt.amount || 0), 0);

    return {
      filteredSpend: range === 'all' ? (stats?.totalSpent || 0) : spendSum,
      displayDelta: range === '30d' ? stats?.spentVsLastMonthDiff : undefined,
      deltaLabel: 'vs previous period',
      chartData: pointsInRange.length ? pointsInRange : rawPoints,
    };
  }, [stats, range]);



  if (isError) {
    return (
      <EmptyState
        title="Unable to load overview"
        description="We ran into an issue fetching your overview data. Please try refreshing."
      />
    );
  }

  const totalReceipts = stats?.totalReceipts || 0;
  const activeWarranties = stats?.activeWarranties || 0;
  const expiringCount = stats?.expiringWarranties || 0;
  const needsReviewCount = stats?.needsReviewCount || 0;
  const recentReceipts = stats?.recentReceipts || [];

  const rangeButtons = [
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
    { id: '1y', label: '1y' },
    { id: 'all', label: 'All' },
  ];

  const headerActions = (
    <div className="relative inline-flex items-center p-1 bg-subtle border border-line rounded-[8px] text-xs font-medium">
      {rangeButtons.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => handleRangeChange(r.id)}
          className={cn(
            'relative px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer font-medium z-1',
            range === r.id
              ? 'text-fg font-semibold'
              : 'text-fg-3 hover:text-fg hover:bg-hover/40'
          )}
        >
          {range === r.id && (
            <m.span
              layoutId="range-pill"
              className="absolute inset-0 rounded-[6px] bg-surface shadow-xs border border-line-subtle -z-1"
              transition={spring.snappy}
            />
          )}
          <span className="relative z-10">{r.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <PageContentTransition
      isLoading={isLoading && !stats}
      skeleton={<DashboardSkeleton range={range} handleRangeChange={handleRangeChange} />}
      className="space-y-6 font-sans"
    >
      <div ref={scopeRef} className="space-y-6">
        {/* 1. Header with Range Selector */}
        <div data-intro="header">
          <PageHeader
            title="Overview"
            description="Your spending and warranty status."
            actions={headerActions}
          />
        </div>

        {/* 2. Needs Review Alert Banner (only when count > 0) */}
        {needsReviewCount > 0 && (
          <div
            role="alert"
            className="rounded-[12px] border border-warn-line bg-warn-bg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warn-solid shrink-0" />
              <span className="text-sm font-medium text-warn-fg">
                {needsReviewCount} {needsReviewCount === 1 ? 'receipt needs' : 'receipts need'} review — totals don&apos;t match
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/receipts?status=needs_review')}
              className="shrink-0 border-warn-line hover:bg-warn-bg text-warn-fg font-medium"
            >
              Review
            </Button>
          </div>
        )}

        {/* 3. Four KPI Tiles (grid-cols-4 >=1024, 2 on tablet, 1 on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* KPI 1: Total spend */}
          <KpiTile
            data-intro="kpi"
            label="Total spend"
            numericValue={filteredSpend}
            currency={currency}
            delta={displayDelta}
            deltaLabel={deltaLabel}
            hint={range === 'all' ? 'All time' : `${range} period`}
            to="/receipts"
            className="h-full"
          />

          {/* KPI 2: Receipts */}
          <KpiTile
            data-intro="kpi"
            label="Receipts"
            numericValue={totalReceipts}
            unit={totalReceipts === 1 ? 'receipt' : 'receipts'}
            delta={stats?.receiptsDiff !== undefined && stats.receiptsDiff !== 0 ? (stats.receiptsDiff > 0 ? `+${stats.receiptsDiff}` : stats.receiptsDiff) : undefined}
            deltaLabel="vs previous period"
            hint="All time"
            to="/receipts"
            className="h-full"
          />

          {/* KPI 3: Under warranty */}
          <KpiTile
            data-intro="kpi"
            label="Under warranty"
            numericValue={activeWarranties}
            unit={stats?.totalProducts ? `of ${stats.totalProducts} products` : 'products'}
            hint="Active protection"
            to="/warranties"
            className="h-full"
          />

          {/* KPI 4: Expiring in 30d */}
          <KpiTile
            data-intro="kpi"
            label="Expiring in 30d"
            numericValue={expiringCount}
            footerLinkText="View →"
            hint="Safe horizon"
            to="/warranties?status=expiring_soon"
            className="h-full"
          />
        </div>

      {/* 4. Middle Row: 8/4 split — Spend over time & Expiring soon */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (8 cols): Spend over time Area Chart */}
        <div data-intro="panel" className="lg:col-span-8 flex flex-col h-full min-h-[360px]">
          {totalReceipts === 0 ? (
            <div className="rounded-[12px] border border-line bg-surface p-8 text-center flex flex-col items-center justify-center min-h-[280px] h-full flex-1">
              <EmptyState
                title="No receipts yet"
                description="Upload a receipt to start tracking your spending and warranties."
                actionLabel="Upload receipt"
                onAction={() => navigate('/receipts/new')}
              />
            </div>
          ) : (
            <SpendingChart
              data={chartData}
              title="Spend over time"
              className="h-full flex-1 min-h-[360px]"
            />
          )}
        </div>

        {/* Right (4 cols): Expiring soon list */}
        <div data-intro="panel" className="lg:col-span-4 rounded-[12px] border border-line bg-surface p-4 shadow-2xs text-left h-full min-h-[360px] flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                Expiring soon
              </span>
              <Link
                to="/warranties"
                className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {expiringItems.length === 0 ? (
              <div className="py-12 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                <div className="size-10 rounded-full bg-subtle border border-line flex items-center justify-center text-fg-3">
                  <ShieldCheck className="size-5 text-accent" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-fg">No imminent expiries</p>
                  <p className="text-[11px] text-fg-3 max-w-[220px]">
                    All active warranties are covered beyond 90 days.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-line-subtle my-1">
                {expiringItems.map((item) => {
                  const days = item.daysRemaining || 0;
                  const isUrgent = days <= 30;

                  return (
                    <Link
                      key={item._id}
                      to={`/products/${item._id}`}
                      className="py-2.5 px-1.5 flex items-center justify-between gap-3 hover:bg-hover rounded-[8px] transition-colors group text-left cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg group-hover:text-accent truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-fg-3 truncate mt-0.5">
                          {item.brand || item.storeName || 'Merchant'} ·{' '}
                          <DateCell value={item.expiryDate || item.warrantyExpiryDate} />
                        </p>
                      </div>

                      <Badge
                        variant={isUrgent ? 'warn' : 'neutral'}
                        className="shrink-0 font-mono text-[11px] tnum"
                      >
                        {days}d
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-auto border-t border-line-subtle shrink-0">
            <Link
              to="/warranties"
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage all warranties</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: 8/4 split — Recent receipts table & Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (8 cols): Recent receipts 5-row table */}
        <div data-intro="panel" className="lg:col-span-8 rounded-[12px] border border-line bg-surface p-4 shadow-2xs text-left h-full min-h-[350px] flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle mb-3 shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                Recent receipts
              </span>
              <Link
                to="/receipts"
                className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {recentReceipts.length === 0 ? (
              <div className="py-12 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                <div className="size-10 rounded-full bg-subtle border border-line flex items-center justify-center text-fg-3">
                  <Store className="size-5 text-fg-3" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-fg">No receipts recorded yet</p>
                  <p className="text-[11px] text-fg-3">
                    Upload your first receipt to see transactions here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <table className="w-full text-xs text-left font-sans">
                  <thead className="bg-subtle text-fg-3 border-b border-line">
                    <tr>
                      <th className="p-2.5 font-semibold">Merchant</th>
                      <th className="p-2.5 font-semibold">Date</th>
                      <th className="p-2.5 font-semibold text-right">Total</th>
                      <th className="p-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {recentReceipts.slice(0, 5).map((r) => (
                      <RecentReceiptRow
                        key={r._id}
                        r={r}
                        currency={currency}
                        onNavigate={navigate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-3 mt-auto border-t border-line-subtle flex items-center justify-between text-xs text-fg-3 shrink-0">
            <span>Showing latest {Math.min(recentReceipts.length, 5)} receipts</span>
            <Link
              to="/receipts"
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all receipts</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Right (4 cols): Activity feed */}
        <div data-intro="panel" className="lg:col-span-4 rounded-[12px] border border-line bg-surface p-4 shadow-2xs text-left h-full min-h-[350px] flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                Activity
              </span>
              <Link
                to="/receipts"
                className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {activitiesLoading ? (
              <div className="py-12 text-center text-xs text-fg-3 flex-1 flex items-center justify-center">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="py-12 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                <div className="size-10 rounded-full bg-subtle border border-line flex items-center justify-center text-fg-3">
                  <Clock className="size-5 text-fg-3" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-fg">No activity logged yet</p>
                  <p className="text-[11px] text-fg-3 max-w-[220px]">
                    Recent uploads and updates will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-line-subtle my-1">
                {activities.slice(0, 5).map((act) => (
                  <div
                    key={act._id}
                    className="py-2.5 px-1.5 flex items-center justify-between gap-3 hover:bg-hover rounded-[8px] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-[6px] bg-subtle border border-line flex items-center justify-center shrink-0">
                        {getActivityIcon(act.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-fg truncate">
                          {act.title || act.action || 'Event recorded'}
                        </p>
                        <p className="text-[11px] text-fg-3 truncate">
                          {act.message || act.description || ''}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-fg-3 font-mono tnum shrink-0">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-auto border-t border-line-subtle flex items-center justify-between text-xs text-fg-3 shrink-0">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3 text-fg-3" />
              <span>Audit feed</span>
            </span>
            <Link
              to="/receipts"
              className="text-xs font-medium text-accent hover:underline cursor-pointer"
            >
              Receipts
            </Link>
          </div>
        </div>
      </div>
      </div>
    </PageContentTransition>
  );
}

export default Dashboard;
