import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Package,
  Plus,
  X,
} from 'lucide-react';
import { useStoresQuery } from '../queries/useStoresQuery';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { Money } from '../components/data/Money';
import { DateCell } from '../components/data/DateCell';
import { Button } from '../components/ui/button';
import RouteSkeleton from '@/components/common/RouteSkeleton';
import PageContentTransition from '@/components/common/PageContentTransition';
import * as m from 'motion/react-m';
import { LayoutGroup } from 'motion/react';
import { variants } from '@/lib/motion';

const SORT_OPTIONS = [
  { id: 'spend_desc', label: 'Highest spend' },
  { id: 'receipts_desc', label: 'Most receipts' },
  { id: 'recent', label: 'Most recent' },
  { id: 'name_asc', label: 'Merchant (A–Z)' },
];

export default function Stores() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'spend_desc';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  const [searchTerm, setSearchTerm] = useState(searchParam);

  // Sync internal state if URL changes
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Debounced search commit to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim() !== searchParam) {
        const params = new URLSearchParams(searchParams);
        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        setSearchParams(params, { replace: true });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, searchParam, searchParams, setSearchParams]);

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    if (newSort && newSort !== 'spend_desc') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const filters = {
    page: pageParam,
    limit: 15,
    search: searchParam.trim(),
    sortBy: sortParam,
  };

  const { data, isLoading, isError } = useStoresQuery(filters);
  const stores = Array.isArray(data?.stores)
    ? data.stores
    : Array.isArray(data)
    ? data
    : [];
  const total = data?.total ?? stores.length;
  const page = data?.page || 1;
  const totalPages = data?.totalPages || 1;

  const startIndex = total > 0 ? (page - 1) * 15 + 1 : 0;
  const endIndex = Math.min(page * 15, total);

  const hasAnimatedStagger = React.useRef(false);
  const shouldStagger = !hasAnimatedStagger.current && stores.length > 0;
  React.useEffect(() => {
    if (stores.length > 0) {
      hasAnimatedStagger.current = true;
    }
  }, [stores.length]);

  const hasActiveFilters = Boolean(searchParam.trim() || sortParam !== 'spend_desc');

  return (
    <PageContentTransition
      isLoading={isLoading && !data}
      skeleton={<RouteSkeleton section="stores" />}
      className="space-y-6 font-sans"
    >
      {/* 1. Page Header */}
      <PageHeader
        title="Merchants"
        description="Track spending, order frequency, and purchase history grouped by merchant."
        actions={
          <Button asChild size="sm" className="gap-1.5 shrink-0">
            <Link to="/receipts/new">
              <Plus className="size-4" />
              <span>Add receipt</span>
            </Link>
          </Button>
        }
      />

      {/* 2. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search merchants..."
            className="w-full text-sm pl-9 pr-8 py-1.5 rounded-lg border border-line bg-surface text-fg placeholder:text-fg-3 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-fg-3 font-medium hidden sm:inline">Sort:</span>
          <div className="relative inline-flex items-center">
            <select
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none w-auto shrink-0 text-xs h-9 pl-3 pr-8 rounded-[8px] border border-line bg-surface text-fg font-medium focus:outline-none focus:border-accent transition-colors cursor-pointer shadow-2xs"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-surface text-fg">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-3 pointer-events-none" />
          </div>

          {/* Inline Reset button (Zero layout shift: table below never moves downwards) */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                handleClearSearch();
                handleSortChange('spend_desc');
              }}
              className="h-9 text-xs text-accent hover:underline cursor-pointer font-medium whitespace-nowrap"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 3. Table Card */}
      <div className="rounded-[12px] border border-line bg-surface shadow-2xs overflow-hidden">
        {isError ? (
          <div className="p-8">
            <EmptyState
              icon={Store}
              title="Could not load merchants"
              description="Something went wrong while fetching your merchant list. Please try refreshing."
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          </div>
        ) : stores.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Store}
              title={searchParam ? 'No matching merchants found' : 'No merchants yet'}
              description={
                searchParam
                  ? `No stores matched "${searchParam}". Try a different search term.`
                  : 'Upload receipts to automatically organize and track your spending by store.'
              }
              actionLabel={searchParam ? 'Clear search' : 'Add receipt'}
              onAction={searchParam ? handleClearSearch : () => navigate('/receipts/new')}
            />
          </div>
        ) : (
          <div>
            {/* Mobile Native Merchant Cards View (<768px) */}
            <div className="md:hidden space-y-3 p-3">
              {stores.map((store) => {
                const initial = (store.storeName || '?').charAt(0).toUpperCase();
                const encodedName = encodeURIComponent(store.storeName);

                return (
                  <div
                    key={`mobile-store-${store.storeKey || store.storeName}`}
                    onClick={() => navigate(`/stores/${encodedName}`)}
                    className="flex flex-col rounded-[12px] border border-line bg-surface p-4 shadow-2xs hover:border-line-strong transition-all cursor-pointer text-left select-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-11 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center font-bold text-base text-accent shrink-0 shadow-xs">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[15px] text-fg truncate">
                            {store.storeName}
                          </h3>
                          {store.categories && store.categories.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {store.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat}
                                  className="text-[10px] text-fg-3 bg-subtle px-1.5 py-0.2 rounded border border-line-subtle capitalize"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-base text-fg tnum">
                          <Money value={store.totalSpend || 0} currency={store.currency || 'INR'} />
                        </div>
                        <span className="text-[11px] text-fg-3">
                          Total spend
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-line-subtle flex items-center justify-between text-xs text-fg-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-fg-2">
                          <FileText className="size-3.5 text-fg-3" />
                          {store.receiptCount} {store.receiptCount === 1 ? 'receipt' : 'receipts'}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-fg-2">
                          <Package className="size-3.5 text-fg-3" />
                          {store.productCount || 0} items
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-accent font-medium">
                        <span>View</span>
                        <ChevronRight className="size-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>=768px) */}
            <div className="hidden md:block overflow-x-auto overflow-y-hidden no-scrollbar">
              <LayoutGroup id="billbox-stores-rows">
                <table className="w-full text-left border-collapse table-fixed text-sm">
                <colgroup>
                  <col className="w-[35%] min-w-[220px]" />
                  <col className="w-[15%] min-w-[110px]" />
                  <col className="w-[15%] min-w-[110px]" />
                  <col className="w-[18%] min-w-[120px]" />
                  <col className="w-[17%] min-w-[120px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-line bg-subtle text-xs font-medium text-fg-3 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Merchant</th>
                    <th className="py-2.5 px-4 font-semibold">Receipts</th>
                    <th className="py-2.5 px-4 font-semibold">Products</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total spend</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Last purchase</th>
                  </tr>
                </thead>
                <m.tbody
                  variants={variants.stagger(0.015)}
                  initial={shouldStagger ? 'hidden' : false}
                  animate="show"
                  className="divide-y divide-line-subtle"
                >
                  {stores.map((store, index) => {
                      const initial = (store.storeName || '?').charAt(0).toUpperCase();
                      const encodedName = encodeURIComponent(store.storeName);
                      const isStaggered = index < 12;
                      const enableLayout = stores.length <= 50;
                      const rowKey = store.storeKey || store.storeName;

                      return (
                        <m.tr
                          key={rowKey}
                          layout={enableLayout ? 'position' : false}
                          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                          variants={variants.fade}
                          initial={shouldStagger && isStaggered ? 'hidden' : false}
                          animate="show"
                          onClick={() => navigate(`/stores/${encodedName}`)}
                          className="group hover:bg-hover/60 transition-colors cursor-pointer"
                        >
                          {/* Merchant Avatar + Name + Categories */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-9 rounded-lg bg-subtle border border-line flex items-center justify-center font-bold text-sm text-fg shrink-0 group-hover:border-line-strong transition-colors">
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-fg group-hover:text-accent transition-colors truncate">
                                  {store.storeName}
                                </div>
                                {store.categories && store.categories.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    {store.categories.slice(0, 2).map((cat) => (
                                      <span
                                        key={cat}
                                        className="text-[11px] text-fg-3 bg-subtle px-1.5 py-0.2 rounded border border-line-subtle truncate max-w-[110px]"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                    {store.categories.length > 2 && (
                                      <span className="text-[10px] text-fg-3">
                                        +{store.categories.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Receipts Count */}
                          <td className="py-3 px-4 text-fg-2">
                            <div className="flex items-center gap-1.5 font-medium tnum">
                              <FileText className="size-3.5 text-fg-3" />
                              <span>{store.receiptCount}</span>
                            </div>
                          </td>

                          {/* Products Count */}
                          <td className="py-3 px-4 text-fg-2">
                            <div className="flex items-center gap-1.5 font-medium tnum">
                              <Package className="size-3.5 text-fg-3" />
                              <span>{store.productCount || 0}</span>
                            </div>
                          </td>

                          {/* Total Spend */}
                          <td className="py-3 px-4 text-right">
                            <Money
                              value={store.totalSpent}
                              currency={store.currency || 'INR'}
                              className="font-semibold text-fg"
                            />
                          </td>

                          {/* Last Purchase Date */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <DateCell value={store.latestPurchaseDate} />
                              <ChevronRight className="size-4 text-fg-3 group-hover:text-fg group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                            </div>
                          </td>
                        </m.tr>
                      );
                    })}
                </m.tbody>
              </table>
            </LayoutGroup>
          </div>
        </div>
        )}

        {/* 4. Table Pagination Footer */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-subtle/50 text-xs text-fg-3">
            <div>
              Showing <span className="font-medium text-fg tnum">{startIndex}</span>–
              <span className="font-medium text-fg tnum">{endIndex}</span> of{' '}
              <span className="font-medium text-fg tnum">{total}</span> merchants
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="h-7 text-xs px-2.5"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-7 text-xs px-2.5"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContentTransition>
  );
}
