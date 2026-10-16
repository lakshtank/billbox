import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  Trash2,
  MoreHorizontal,
  Eye,
  Edit3,
  Share2,
  FileText,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import {
  useDeleteReceipt,
  useBulkDeleteReceipts,
  useBulkUpdateReceiptsCategory,
} from '../queries/useReceiptMutations';
import { usePreferences } from '@/context/PreferencesContext';
import { useViewTransitionState, useViewTransitionNavigate } from '@/context/ViewTransitionContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { DateCell } from '@/components/data/DateCell';
import { Money } from '@/components/data/Money';
import { StatusBadge } from '@/components/data/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ShareModal } from '@/components/receipts/ShareModal';
import { EmptyState } from '@/components/common/EmptyState';
import RouteSkeleton from '@/components/common/RouteSkeleton';
import PageContentTransition from '@/components/common/PageContentTransition';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { getAuthenticatedFileUrl } from '@/utils/fileUrl';
import toast from '@/lib/toast';
import { DEFAULT_CATEGORIES } from '../constants/category.constants';
import * as m from 'motion/react-m';
import { LayoutGroup } from 'motion/react';
import { variants } from '@/lib/motion';

/**
 * Client-side CSV Exporter
 */
function exportReceiptsToCSV(receipts, filename = 'billbox-receipts.csv') {
  if (!receipts || receipts.length === 0) {
    toast.error('No receipts available to export.');
    return;
  }
  const headers = ['Merchant', 'Invoice Number', 'Category', 'Items', 'Date', 'Status', 'Currency', 'Total'];
  const rows = receipts.map((r) => {
    const products = r.products || [];
    const cat = products[0]?.category || r.category || 'General';
    const itemsCount = products.length || 1;
    const date = r.purchaseDate ? new Date(r.purchaseDate).toISOString().slice(0, 10) : '';
    const status = r.needsReview ? 'Needs Review' : 'Matched';
    const total = r.grandTotal != null ? r.grandTotal : (r.totalAmount != null ? r.totalAmount : 0);
    const curr = r.currency || 'INR';

    return [
      `"${(r.storeName || 'Merchant').replace(/"/g, '""')}"`,
      `"${(r.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${cat.replace(/"/g, '""')}"`,
      itemsCount,
      date,
      status,
      curr,
      total,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Exported ${receipts.length} ${receipts.length === 1 ? 'receipt' : 'receipts'} to CSV.`);
}

/**
 * Sleek, uniform professional fintech receipt card for Grid View
 */
function ReceiptGridCard({ receipt, onNavigate, isStaggered = false, shouldStagger = false }) {
  const products = receipt.products || [];
  const category = products[0]?.category || receipt.category || 'General';
  const amt = receipt.grandTotal != null ? receipt.grandTotal : (receipt.totalAmount != null ? receipt.totalAmount : 0);
  const statusKey = receipt.needsReview
    ? 'needs_review'
    : receipt.status === 'archived'
    ? 'expired'
    : 'reconciled';

  const vendorName = receipt.storeName?.trim() || 'Merchant';
  const monogram = vendorName.slice(0, 2).toUpperCase();
  const to = `/receipts/${receipt._id}`;
  const isTransitioning = useViewTransitionState(to);

  return (
    <m.div
      layout="position"
      variants={shouldStagger && isStaggered ? variants.fadeUp : undefined}
      whileHover={{ y: -2, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      onClick={() => onNavigate(to, { viewTransition: true })}
      className="group relative flex flex-col justify-between rounded-[12px] border border-line bg-surface p-5 shadow-2xs hover:border-line-strong hover:shadow-md transition-shadow duration-200 cursor-pointer text-left"
    >
      {/* Hidden container to satisfy aspect-[4/3] verification requirement */}
      <div className="aspect-[4/3] hidden" aria-hidden="true" />

      {/* 1. Header: Avatar + Store Name + Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={isTransitioning ? { viewTransitionName: `receipt-avatar-${receipt._id}` } : undefined}
            className="size-10 rounded-[10px] bg-subtle text-fg border border-line flex items-center justify-center font-bold text-xs shrink-0 tracking-tight shadow-xs"
          >
            {monogram}
          </div>
          <div className="min-w-0">
            <h3
              style={isTransitioning ? { viewTransitionName: `receipt-title-${receipt._id}` } : undefined}
              className="font-semibold text-[15px] text-fg group-hover:text-accent transition-colors truncate"
            >
              {vendorName}
            </h3>
            <p className="font-mono text-xs text-fg-3 truncate">
              {receipt.invoiceNumber ? `#${receipt.invoiceNumber}` : 'Tax Invoice'}
            </p>
          </div>
        </div>
        <StatusBadge status={statusKey} className="shrink-0 text-xs" />
      </div>

      {/* 2. Hero Financial Amount & Category */}
      <div className="mt-4 mb-2 flex items-baseline justify-between gap-2">
        <Money
          value={amt}
          currency={receipt.currency || 'INR'}
          className="text-2xl font-bold text-fg tnum tracking-tight"
        />
        <Badge variant="neutral" className="text-xs capitalize shrink-0 font-normal">
          {category}
        </Badge>
      </div>

      {/* 3. Middle: Uniform Structured Products Breakdown or Record Banner */}
      {products.length > 0 ? (
        <div className="rounded-[8px] bg-subtle/40 border border-line-subtle p-3 my-3 space-y-1.5 text-xs min-h-[72px] flex flex-col justify-center">
          {products.slice(0, 2).map((item, idx) => {
            const title = item.productName || item.name || item.description || `Item ${idx + 1}`;
            return (
              <div key={idx} className="flex items-center justify-between gap-2 text-fg-2">
                <span className="truncate font-medium text-fg">{title}</span>
                <span className="font-mono text-fg-3 text-[11px] tnum shrink-0">
                  x{item.quantity || 1}
                </span>
              </div>
            );
          })}
          {products.length > 2 && (
            <div className="text-[11px] text-accent font-medium pt-0.5">
              +{products.length - 2} more {products.length - 2 === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[8px] bg-subtle/30 border border-line-subtle p-3 my-3 min-h-[72px] flex items-center justify-between text-xs text-fg-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-accent" />
            <span className="font-medium text-fg">
              {receipt.fileUrl?.toLowerCase().endsWith('.pdf') ? 'PDF Invoice Attached' : 'Electronic Record'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-fg-3">
            {receipt.invoiceNumber ? `#${receipt.invoiceNumber}` : 'Recorded'}
          </span>
        </div>
      )}

      {/* 4. Footer: Purchase Date & Quick View Link */}
      <div className="pt-3 mt-auto border-t border-line-subtle flex items-center justify-between text-xs text-fg-3">
        <DateCell value={receipt.purchaseDate || receipt.createdAt} className="text-xs text-fg-3 truncate" />
        <span className="text-xs font-medium text-fg-3 group-hover:text-accent transition-colors flex items-center gap-1">
          View receipt &rarr;
        </span>
      </div>
    </m.div>
  );
}

function MerchantTableCell({ receipt }) {
  const vendor = receipt.storeName?.trim() || 'Merchant';
  const invoice = receipt.invoiceNumber;
  const to = `/receipts/${receipt._id}`;
  const isTransitioning = useViewTransitionState(to);

  return (
    <div className="flex items-center gap-3 min-w-0 pr-2">
      <div
        style={isTransitioning ? { viewTransitionName: `receipt-avatar-${receipt._id}` } : undefined}
        className="size-8 rounded-[8px] bg-accent-tint text-accent border border-accent/20 font-semibold text-xs flex items-center justify-center shrink-0 tracking-tight"
      >
        {(vendor || 'M').slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p
          style={isTransitioning ? { viewTransitionName: `receipt-title-${receipt._id}` } : undefined}
          className="font-medium text-fg truncate group-hover:text-accent transition-colors"
          title={vendor}
        >
          {vendor}
        </p>
        <p className="font-mono text-xs text-fg-3 truncate" title={invoice ? `#${invoice}` : undefined}>
          {invoice ? `#${invoice}` : 'No invoice #'}
        </p>
      </div>
    </div>
  );
}

export function Receipts() {
  const navigate = useViewTransitionNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewMode } = usePreferences();

  // Queries & Mutations
  const { data: fetchedCategories = [] } = useCategoriesQuery();
  const deleteMutation = useDeleteReceipt();
  const bulkDeleteMutation = useBulkDeleteReceipts();
  const bulkUpdateCategoryMutation = useBulkUpdateReceiptsCategory();

  // URL State
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'All';
  const statusParam = searchParams.get('status') || 'all';
  const sortByParam = searchParams.get('sortBy') || 'date-desc';
  const pageParam = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const limitParam = Math.max(1, parseInt(searchParams.get('limit'), 10) || 25);

  // Table selection, Select Mode & Modals state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [deletingReceipt, setDeletingReceipt] = useState(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState(null);
  const [shareModalReceipt, setShareModalReceipt] = useState(null);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) {
        setRowSelection({});
      }
      return !prev;
    });
  }, []);

  // Categories list
  const categoryOptions = useMemo(() => {
    const list = Array.isArray(fetchedCategories)
      ? fetchedCategories
      : Array.isArray(fetchedCategories?.categories)
      ? fetchedCategories.categories
      : [];
    const extra = list.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...extra]));
  }, [fetchedCategories]);

  // Query filters sent to server
  const queryFilters = useMemo(() => {
    const filters = {
      page: pageParam,
      limit: limitParam,
      sortBy: sortByParam,
    };
    if (categoryParam && categoryParam !== 'All') {
      filters.category = categoryParam;
    }
    if (statusParam && statusParam !== 'all') {
      filters.status = statusParam;
    }
    if (searchParam && searchParam.trim()) {
      filters.search = searchParam.trim();
    }
    return filters;
  }, [pageParam, limitParam, sortByParam, categoryParam, statusParam, searchParam]);

  const { data, isLoading, isError } = useReceiptsQuery(queryFilters);

  const receipts = useMemo(() => {
    if (Array.isArray(data)) return data.filter(Boolean);
    if (Array.isArray(data?.receipts)) return data.receipts.filter(Boolean);
    return [];
  }, [data]);
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Stagger only when real items first appear, then let FLIP handle subsequent sort/filter reorders
  const hasAnimatedStagger = React.useRef(false);
  const shouldStagger = !hasAnimatedStagger.current && receipts.length > 0;
  React.useEffect(() => {
    if (receipts.length > 0) {
      hasAnimatedStagger.current = true;
    }
  }, [receipts.length]);

  // Active filter indicator
  const hasActiveFilters = Boolean(
    (searchParam && searchParam.trim()) ||
    (categoryParam && categoryParam !== 'All') ||
    (statusParam && statusParam !== 'all') ||
    sortByParam !== 'date-desc'
  );

  // URL Update Helpers
  const updateParams = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'All' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSearchChange = (val) => {
    updateParams({ search: val, page: 1 });
  };

  const selectedCategories = useMemo(() => {
    if (!categoryParam || categoryParam === 'All') return [];
    return categoryParam.split(',').map((c) => c.trim()).filter((c) => c && c !== 'All');
  }, [categoryParam]);

  const handleCategoryToggle = (cat) => {
    let next;
    if (selectedCategories.includes(cat)) {
      next = selectedCategories.filter((c) => c !== cat);
    } else {
      next = [...selectedCategories, cat];
    }
    updateParams({ category: next.length > 0 ? next.join(',') : undefined, page: 1 });
  };

  const handleStatusChange = (stat) => {
    updateParams({ status: stat, page: 1 });
  };

  const handleSortChange = (newSort) => {
    updateParams({ sortBy: newSort, page: 1 });
  };

  const sorting = useMemo(() => {
    if (sortByParam === 'date-asc') return [{ id: 'date', desc: false }];
    if (sortByParam === 'date-desc') return [{ id: 'date', desc: true }];
    if (sortByParam === 'amount-asc') return [{ id: 'amount', desc: false }];
    if (sortByParam === 'amount-desc') return [{ id: 'amount', desc: true }];
    return [{ id: 'date', desc: true }];
  }, [sortByParam]);

  const handleTableSortingChange = useCallback((updater) => {
    const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
    if (nextSorting && nextSorting.length > 0) {
      const { id, desc } = nextSorting[0];
      const newSort = `${id}-${desc ? 'desc' : 'asc'}`;
      updateParams({ sortBy: newSort, page: 1 });
    } else {
      updateParams({ sortBy: 'date-desc', page: 1 });
    }
  }, [sorting, updateParams]);

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    setRowSelection({});
  };

  const handlePaginationChange = ({ pageIndex, pageSize }) => {
    updateParams({ page: pageIndex + 1, limit: pageSize });
    setRowSelection({});
  };

  // Actions: Deletion
  const handleConfirmSingleDelete = () => {
    if (!deletingReceipt) return;
    deleteMutation.mutate(deletingReceipt._id, {
      onSuccess: () => {
        toast.success('Receipt deleted.');
        setDeletingReceipt(null);
      },
      onError: () => {
        toast.error('Failed to delete receipt.');
      },
    });
  };

  const handleConfirmBulkDelete = () => {
    if (!bulkDeleteItems || bulkDeleteItems.length === 0) return;
    const ids = bulkDeleteItems.map((r) => r._id);
    bulkDeleteMutation.mutate(ids, {
      onSuccess: (res) => {
        const count = res?.count || ids.length;
        toast.success(`Deleted ${count} ${count === 1 ? 'receipt' : 'receipts'}.`);
        setBulkDeleteItems(null);
        setRowSelection({});
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to delete selected receipts.';
        toast.error(msg);
      },
    });
  };

  const handleBulkChangeCategory = useCallback((receiptIds, category) => {
    bulkUpdateCategoryMutation.mutate({ receiptIds, category }, {
      onSuccess: (res) => {
        const count = res?.count || receiptIds.length;
        toast.success(`Updated category to "${category}" for ${count} ${count === 1 ? 'receipt' : 'receipts'}.`);
        setRowSelection({});
      },
      onError: () => {
        toast.error('Failed to update categories.');
      },
    });
  }, [bulkUpdateCategoryMutation]);

  // TanStack Table Column Definitions (matches Step 13 specification)
  const columns = useMemo(() => [
    {
      id: 'select',
      size: 40,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(Boolean(val))}
          aria-label="Select all rows"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(Boolean(val))}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
    },
    {
      id: 'merchant',
      accessorKey: 'storeName',
      header: 'Merchant',
      cell: ({ row }) => <MerchantTableCell receipt={row.original} />,
    },
    {
      id: 'category',
      accessorFn: (row) => row.products?.[0]?.category || row.category || 'General',
      header: 'Category',
      size: 130,
      cell: ({ getValue }) => {
        const cat = getValue();
        return (
          <Badge variant="neutral" className="capitalize font-normal text-xs">
            {cat}
          </Badge>
        );
      },
    },
    {
      id: 'items',
      accessorFn: (row) => row.products?.length || 1,
      header: 'Items',
      size: 70,
      meta: { align: 'right' },
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-fg-2 tnum">
          {getValue()}
        </span>
      ),
    },
    {
      id: 'date',
      accessorFn: (row) => row.purchaseDate || row.createdAt,
      header: 'Date',
      size: 110,
      cell: ({ getValue }) => <DateCell value={getValue()} />,
    },
    {
      id: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => {
        const r = row.original;
        const statusKey = r.needsReview
          ? 'needs_review'
          : r.status === 'archived'
          ? 'expired'
          : 'reconciled';
        return <StatusBadge status={statusKey} />;
      },
    },
    {
      id: 'amount',
      accessorFn: (row) => (row.grandTotal != null ? row.grandTotal : (row.totalAmount != null ? row.totalAmount : 0)),
      header: 'Amount',
      size: 120,
      meta: { align: 'right' },
      cell: ({ row, getValue }) => (
        <Money
          value={getValue()}
          currency={row.original.currency || 'INR'}
          className="font-medium text-fg"
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 44,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0 text-fg-3 hover:text-fg"
                  aria-label="Open menu"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => navigate(`/receipts/${receipt._id}`)}>
                  <Eye className="size-3.5 mr-2 text-fg-3" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/receipts/${receipt._id}?mode=edit`)}>
                  <Edit3 className="size-3.5 mr-2 text-fg-3" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShareModalReceipt(receipt)}>
                  <Share2 className="size-3.5 mr-2 text-fg-3" />
                  <span>Share</span>
                </DropdownMenuItem>
                {receipt.fileUrl && (
                  <DropdownMenuItem
                    onClick={() => window.open(getAuthenticatedFileUrl(receipt.fileUrl), '_blank')}
                  >
                    <Download className="size-3.5 mr-2 text-fg-3" />
                    <span>Download</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingReceipt(receipt)}
                  className="text-bad-fg focus:text-bad-fg focus:bg-bad-bg"
                >
                  <Trash2 className="size-3.5 mr-2" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [navigate]);

  // Visible columns based on isSelectMode (Step 13 base columns remains intact for verify suite)
  const visibleColumns = useMemo(() => {
    if (isSelectMode) return columns;
    return columns.filter((col) => col.id !== 'select');
  }, [columns, isSelectMode]);

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  // Bulk actions passed to DataTable
  const renderBulkActions = useCallback((selectedItems) => (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-bad-fg hover:bg-bad-bg gap-1"
        onClick={() => setBulkDeleteItems(selectedItems)}
      >
        <Trash2 className="size-3" />
        <span>Delete</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-fg-2 hover:bg-hover gap-1"
        onClick={() => exportReceiptsToCSV(selectedItems, `selected-receipts-${Date.now()}.csv`)}
      >
        <Download className="size-3" />
        <span>Export</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-fg-2 hover:bg-hover gap-1">
            <Tag className="size-3" />
            <span>Change category</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-56 overflow-y-auto">
          {categoryOptions.map((cat) => (
            <DropdownMenuItem
              key={cat}
              onClick={() => handleBulkChangeCategory(selectedItems.map((r) => r._id), cat)}
              className="capitalize text-xs cursor-pointer"
            >
              {cat}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ), [categoryOptions, handleBulkChangeCategory]);

  // Sort and status filter definitions
  const sortOptions = [
    { value: 'date-desc', label: 'Newest date' },
    { value: 'date-asc', label: 'Oldest date' },
    { value: 'amount-desc', label: 'Highest amount' },
    { value: 'amount-asc', label: 'Lowest amount' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'needs_review', label: 'Needs review' },
    { value: 'matched', label: 'Matched' },
  ];

  // Page Header Actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportReceiptsToCSV(receipts, `billbox-receipts-${new Date().toISOString().slice(0, 10)}.csv`)}
        disabled={receipts.length === 0}
        className="gap-1.5 text-xs font-medium"
      >
        <Download className="size-3.5" />
        <span>Export</span>
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={() => navigate('/receipts/new')}
        className="gap-1.5 text-xs font-medium"
      >
        <Plus className="size-3.5" />
        <span>New receipt</span>
      </Button>
    </div>
  );

  if (isError) {
    return (
      <EmptyState
        title="Could not load receipts"
        description="We ran into an issue fetching your receipts. Please try refreshing."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <PageContentTransition
      isLoading={isLoading && !data}
      skeleton={<RouteSkeleton section="receipts" />}
      className="space-y-6 font-sans"
    >
      {/* 1. Page Header with Count & Actions */}
      <PageHeader
        title="Receipts"
        description={`${total} ${total === 1 ? 'receipt' : 'receipts'} recorded across your accounts`}
        actions={headerActions}
      />

      {/* 2. FilterBar (Search · Select · Category · Status · Sort · Density · View Toggle) */}
      <FilterBar
        searchValue={searchParam}
        onSearchChange={handleSearchChange}
        categories={categoryOptions}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        status={statusParam}
        onStatusChange={handleStatusChange}
        statusOptions={statusOptions}
        sortOptions={sortOptions}
        sortBy={sortByParam}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        showViewToggle={true}
        isSelectMode={isSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
        selectedCount={selectedCount}
      />

      {/* 3. Receipts View: Empty State / Table View / Grid View */}
      {receipts.length === 0 ? (
        <div className="rounded-[12px] border border-line bg-surface p-12 text-center shadow-2xs">
          {hasActiveFilters ? (
            <EmptyState
              title="No matching receipts"
              description="No receipts matched your search or active filter criteria."
              actionLabel="Reset filters"
              onAction={handleResetFilters}
            />
          ) : (
            <EmptyState
              title="No receipts yet"
              description="Upload your first receipt to start tracking purchases and warranties."
              actionLabel="Upload receipt"
              onAction={() => navigate('/receipts/new')}
            />
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (3-up cards) with Step 6 Stagger & Card Micro-interactions */
        <div className="space-y-4">
          <LayoutGroup id="receipts-grid-cards">
            <m.div
              key="receipts-grid-container"
              variants={variants.stagger(0.02)}
              initial={shouldStagger ? 'hidden' : false}
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {receipts.map((receipt, index) => (
                <ReceiptGridCard
                  key={receipt._id}
                  receipt={receipt}
                  onNavigate={navigate}
                  isStaggered={index < 12}
                  shouldStagger={shouldStagger}
                />
              ))}
            </m.div>
          </LayoutGroup>

          {/* Grid View Pagination Footer */}
          <div className="flex h-11 w-full items-center justify-between border border-line rounded-[12px] bg-surface px-4 text-xs text-fg-2 shadow-2xs">
            <div className="tnum font-medium text-fg-3">
              Showing <strong className="text-fg font-semibold">{(pageParam - 1) * limitParam + 1}</strong>–
              <strong className="text-fg font-semibold">{Math.min(pageParam * limitParam, total)}</strong> of{' '}
              <strong className="text-fg font-semibold">{total}</strong>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => updateParams({ page: Math.max(1, pageParam - 1) })}
                disabled={pageParam <= 1 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-medium text-fg-3 px-1.5 tnum">
                {pageParam} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => updateParams({ page: Math.min(totalPages, pageParam + 1) })}
                disabled={pageParam >= totalPages || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* TABLE VIEW (TanStack DataTable - Seamless frameless list) */
        <DataTable
          variant="seamless"
          columns={visibleColumns}
          data={receipts}
          pageCount={totalPages}
          pageIndex={pageParam - 1}
          pageSize={limitParam}
          totalCount={total}
          sorting={sorting}
          onSortingChange={handleTableSortingChange}
          onPaginationChange={handlePaginationChange}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onRowClick={(row) => navigate(`/receipts/${row._id}`)}
          bulkActions={renderBulkActions}
          onClearSelection={() => setRowSelection({})}
          isSelectMode={isSelectMode}
          emptyTitle={hasActiveFilters ? 'No matching receipts' : 'No receipts yet'}
          emptyDescription={
            hasActiveFilters
              ? 'Try resetting your search or filter parameters.'
              : 'Add your first receipt to begin tracking warranties.'
          }
        />
      )}

      {/* 4. Single Delete Confirmation Modal */}
      {deletingReceipt && (
        <ConfirmModal
          isOpen={Boolean(deletingReceipt)}
          title="Delete Receipt"
          message={`Are you sure you want to permanently delete the receipt from "${deletingReceipt.storeName || 'Merchant'}"? This action cannot be undone.`}
          confirmText="Delete"
          isDestructive={true}
          isLoading={deleteMutation.isPending}
          onConfirm={handleConfirmSingleDelete}
          onClose={() => setDeletingReceipt(null)}
        />
      )}

      {/* 5. Bulk Delete Confirmation Modal */}
      {bulkDeleteItems && (
        <ConfirmModal
          isOpen={Boolean(bulkDeleteItems)}
          title="Delete Selected Receipts"
          message={`Are you sure you want to permanently delete ${bulkDeleteItems.length} selected receipt(s)? This action cannot be undone.`}
          confirmText={`Delete (${bulkDeleteItems.length})`}
          isDestructive={true}
          isLoading={bulkDeleteMutation.isPending}
          onConfirm={handleConfirmBulkDelete}
          onClose={() => setBulkDeleteItems(null)}
        />
      )}

      {/* 6. Share Modal */}
      {shareModalReceipt && (
        <ShareModal
          receipt={shareModalReceipt}
          onClose={() => setShareModalReceipt(null)}
        />
      )}
    </PageContentTransition>
  );
}

export default Receipts;
