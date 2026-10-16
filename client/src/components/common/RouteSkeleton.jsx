import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';

/**
 * Route-specific skeleton loaders.
 * Accurately mirrors each page's distinct visual structure with ZERO layout mismatch:
 * - Receipts & Products: Header + FilterBar + Table (NO 4 cards)
 * - Warranties: Header + Summary Pills + Status Tabs + Table (NO 4 cards)
 * - Merchants: Header + SearchBar + Table (NO 4 cards)
 * - Overview: Header + 4 KPI Cards + 8/4 Split (Overview only!)
 */

function ReceiptsSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-[10px] border border-line bg-surface overflow-hidden p-4 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-line-subtle last:border-0 gap-4"
          >
            <Skeleton className="size-4 rounded shrink-0" />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-4 w-12 rounded shrink-0" />
            <Skeleton className="h-4 w-20 rounded shrink-0 hidden sm:block" />
            <Skeleton className="h-5 w-20 rounded shrink-0" />
            <Skeleton className="size-6 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4 w-full font-sans select-none" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-60 rounded-md" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-[10px] border border-line bg-surface overflow-hidden p-4 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-line-subtle last:border-0 gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-24 rounded-full shrink-0" />
            <Skeleton className="h-4 w-20 rounded shrink-0" />
            <Skeleton className="size-6 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WarrantiesSkeleton() {
  return (
    <div className="space-y-4 w-full font-sans select-none" aria-busy="true">
      {/* Header with summary pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-line">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-7 w-24 rounded-[8px]" />
          <Skeleton className="h-7 w-24 rounded-[8px]" />
          <Skeleton className="h-7 w-24 rounded-[8px]" />
          <Skeleton className="h-7 w-24 rounded-[8px]" />
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-[10px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-[7px]" />
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
          <Skeleton className="h-9 flex-1 rounded-[8px]" />
          <Skeleton className="h-9 w-32 rounded-[8px]" />
        </div>
      </div>

      {/* Warranties Table Card */}
      <div className="rounded-[10px] border border-line bg-surface overflow-hidden p-4 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-line-subtle last:border-0 gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-28 rounded shrink-0 hidden sm:block" />
            <Skeleton className="h-4 w-20 rounded shrink-0" />
            <Skeleton className="h-5 w-24 rounded shrink-0" />
            <Skeleton className="h-4 w-20 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StoresSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Stores Table Card */}
      <div className="rounded-[10px] border border-line bg-surface overflow-hidden p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 border-b border-line-subtle last:border-0 gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="size-9 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 rounded shrink-0" />
            <Skeleton className="h-4 w-24 rounded shrink-0" />
            <Skeleton className="h-4 w-20 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-8 w-44 rounded-[8px]" />
      </div>

      {/* 4 KPI Cards (Overview ONLY!) */}
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

      {/* Middle Row (8/4 split) */}
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
    </div>
  );
}

function SettingsProfileSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none" aria-busy="true">
      <div className="space-y-1.5 pb-2 border-b border-line">
        <Skeleton className="h-7 w-36 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="rounded-[10px] border border-line bg-surface p-6 space-y-5">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="space-y-3 max-w-md">
          <Skeleton className="h-9 w-full rounded-[8px]" />
          <Skeleton className="h-9 w-full rounded-[8px]" />
          <Skeleton className="h-9 w-32 rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}

function RemindersSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none" aria-busy="true">
      <div className="space-y-1.5 pb-2 border-b border-line">
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-line pb-1">
        <div className="flex items-center gap-6">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-6 w-24 rounded" />
        </div>
        <Skeleton className="h-8 w-64 rounded-lg" />
      </div>
      <div className="rounded-[12px] border border-line bg-surface overflow-hidden p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-line-subtle last:border-0 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceiptDetailSkeleton() {
  return (
    <div className="space-y-4 w-full font-sans select-none pb-16" aria-busy="true">
      {/* Back button & breadcrumb */}
      <div className="flex items-center gap-2 pb-2 border-b border-line">
        <Skeleton className="h-4 w-20 rounded" />
        <span className="text-fg-3 select-none">/</span>
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Hero header with avatar and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[12px] border border-line bg-surface">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-[9px]" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Two-pane layout: Left pane for financials & items, Right pane for DocumentViewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-[12px] border border-line bg-surface space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-line-subtle last:border-0">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-[12px] border border-line bg-surface space-y-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>

        {/* Right Column (5 cols) - Document preview */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-[12px] border border-line bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 rounded" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-7 rounded" />
                <Skeleton className="size-7 rounded" />
              </div>
            </div>
            <Skeleton className="h-80 w-full rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddReceiptSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none pb-16" aria-busy="true">
      <div className="space-y-1.5 pb-2 border-b border-line">
        <Skeleton className="h-7 w-36 rounded-md" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      <div className="flex items-center gap-2 p-1 bg-subtle rounded-[10px] w-fit">
        <Skeleton className="h-8 w-24 rounded-[8px]" />
        <Skeleton className="h-8 w-24 rounded-[8px]" />
        <Skeleton className="h-8 w-24 rounded-[8px]" />
      </div>
      <div className="rounded-[12px] border-2 border-dashed border-line bg-surface p-12 text-center space-y-4">
        <Skeleton className="size-12 rounded-full mx-auto" />
        <Skeleton className="h-5 w-64 rounded mx-auto" />
        <Skeleton className="h-4 w-48 rounded mx-auto" />
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6 w-full font-sans select-none pb-16" aria-busy="true">
      <div className="flex items-center gap-2 pb-2 border-b border-line">
        <Skeleton className="h-4 w-20 rounded" />
        <span className="text-fg-3 select-none">/</span>
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[12px] border border-line bg-surface">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-[10px]" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-[12px] border border-line bg-surface space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="p-5 rounded-[12px] border border-line bg-surface space-y-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RouteSkeleton: Accurately mirrors each destination route's unique layout.
 * Never renders 4 KPI cards on Receipts, Products, Warranties, or Stores!
 * Accurately differentiates list vs detail subroutes (e.g. /receipts vs /receipts/:id).
 */
export function RouteSkeleton({ section: explicitSection }) {
  const location = useLocation();
  const pathname = location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const primarySection = segments[0] || explicitSection || 'overview';
  const subSection = segments[1];

  if (primarySection === 'receipts') {
    if (subSection === 'new') {
      return <AddReceiptSkeleton />;
    }
    if (subSection && subSection !== 'batch') {
      return <ReceiptDetailSkeleton />;
    }
    return <ReceiptsSkeleton />;
  }

  if (primarySection === 'products') {
    if (subSection) {
      return <ProductDetailSkeleton />;
    }
    return <ProductsSkeleton />;
  }

  if (primarySection === 'stores' || primarySection === 'merchants') {
    return <StoresSkeleton />;
  }

  if (primarySection === 'warranties') {
    return <WarrantiesSkeleton />;
  }

  if (primarySection === 'reminders') {
    return <RemindersSkeleton />;
  }

  if (primarySection === 'settings' || primarySection === 'profile') {
    return <SettingsProfileSkeleton />;
  }

  if (primarySection === 'overview' || primarySection === 'dashboard') {
    return <DashboardSkeleton />;
  }

  return <DashboardSkeleton />;
}

export default RouteSkeleton;
