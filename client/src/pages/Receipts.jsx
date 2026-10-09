import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  QrCode,
  Search,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  MoreVertical,
  Check,
  FileText,
  ArrowUpDown,
  X,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import { useDeleteReceipt, useBulkDeleteReceipts } from '../queries/useReceiptMutations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ShareModal from '../components/receipts/ShareModal';
import { formatDate, formatCurrency } from '../utils/formatters';
import { usePersistentViewMode } from '../hooks/usePersistentViewMode';

const DEFAULT_CATEGORIES = [
  'All',
  'Electronics',
  'Groceries',
  'Hardware',
  'Appliances',
  'Utilities',
  'Office',
  'Others',
];

const Receipts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: fetchedCategories = [] } = useCategoriesQuery();
  const deleteMutation = useDeleteReceipt();
  const bulkDeleteMutation = useBulkDeleteReceipts();

  // URL search params
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  // Local search input & sorting
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
  const [viewMode, setViewMode] = usePersistentViewMode('billbox_receipts_view_mode', 'table');

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(null);
  const [shareModalReceipt, setShareModalReceipt] = useState(null);

  // Sync search input with URL params
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Construct query filters
  const queryFilters = useMemo(() => {
    const filters = {
      page: pageParam,
      limit: 25,
    };
    if (categoryParam && categoryParam !== 'All') {
      filters.category = categoryParam;
    }
    if (searchParam && searchParam.trim()) {
      filters.search = searchParam.trim();
    }
    return filters;
  }, [pageParam, categoryParam, searchParam]);

  // Query receipts
  const { data, isLoading, isError } = useReceiptsQuery(queryFilters);

  const rawReceipts = data?.receipts || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
        setIsBulkDeleteModalOpen(false);
        setDeletingReceipt(null);
        setShareModalReceipt(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter out removed IDs from selection
  useEffect(() => {
    if (Array.isArray(rawReceipts)) {
      const visibleSet = new Set(rawReceipts.map((r) => r._id));
      setSelectedIds((prev) => prev.filter((id) => visibleSet.has(id)));
    }
  }, [data]);

  // Client-side sort on loaded page receipts
  const sortedReceipts = useMemo(() => {
    const list = [...rawReceipts];
    if (sortBy === 'date-desc') {
      return list.sort((a, b) => new Date(b.purchaseDate || b.createdAt) - new Date(a.purchaseDate || a.createdAt));
    }
    if (sortBy === 'date-asc') {
      return list.sort((a, b) => new Date(a.purchaseDate || a.createdAt) - new Date(b.purchaseDate || b.createdAt));
    }
    if (sortBy === 'amount-desc') {
      return list.sort((a, b) => (b.grandTotal || b.totalAmount || 0) - (a.grandTotal || a.totalAmount || 0));
    }
    if (sortBy === 'amount-asc') {
      return list.sort((a, b) => (a.grandTotal || a.totalAmount || 0) - (b.grandTotal || b.totalAmount || 0));
    }
    return list;
  }, [rawReceipts, sortBy]);

  // Category pill list
  const categoryPills = useMemo(() => {
    const extra = fetchedCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...extra]));
  }, [fetchedCategories]);

  // Filter actions
  const handleSelectCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  // Selection handlers
  const visibleIds = sortedReceipts.map((r) => r._id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected = visibleIds.some((id) => selectedIds.includes(id));
  const isIndeterminate = someSelected && !allSelected;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;

    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: (res) => {
        const count = res?.count || selectedIds.length;
        toast.success(`Deleted ${count} ${count === 1 ? 'receipt' : 'receipts'}.`);
        setSelectedIds([]);
        setIsSelectionMode(false);
        setIsBulkDeleteModalOpen(false);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to delete selected receipts.';
        toast.error(msg);
      },
    });
  };

  // Single Delete
  const handleConfirmSingleDelete = () => {
    if (!deletingReceipt) return;
    const targetId = deletingReceipt._id;

    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        toast.success('Receipt deleted.');
        setSelectedIds((prev) => prev.filter((id) => id !== targetId));
        setDeletingReceipt(null);
      },
      onError: () => {
        toast.error('Failed to delete receipt.');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Could not load receipts"
        description="Something went wrong fetching your receipts. Please try refreshing."
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-canvas px-4 sm:px-6 md:px-8 lg:px-10 py-8 w-full space-y-6 text-brand-navy font-sans pb-28">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-semibold text-brand-navy tracking-tight leading-tight">
              Receipts Ledger
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-border/60 text-brand-navy border border-brand-border font-tabular">
              {total} total records
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Archived merchant purchases, digital invoices, and warranty documentation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
              isSelectionMode
                ? 'bg-brand-navy text-white border-brand-navy shadow-2xs'
                : 'bg-brand-surface text-slate-700 border-brand-border hover:bg-slate-50 shadow-2xs'
            }`}
          >
            {isSelectionMode ? 'Cancel Selection' : 'Select Records'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/receipts/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Receipt</span>
          </button>
        </div>
      </div>

      {/* 2. High-Productivity Search, Filter & Sort Bar */}
      <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 font-sans">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor, item name, invoice #..."
                style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
                className="w-full text-xs py-2.5 !pl-10 !pr-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-brand-surface border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors font-sans shadow-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium p-1 cursor-pointer z-10"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Right Toolbar: Sort Dropdown & View Mode Switcher */}
          <div className="flex items-center gap-2.5 justify-end shrink-0">
            <div 
              className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 select-none"
              style={{ whiteSpace: 'nowrap' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span 
                className="hidden sm:inline font-normal shrink-0" 
                style={{ whiteSpace: 'nowrap' }}
              >
                Sort&nbsp;by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none shrink-0"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            {/* View Mode Switcher: Table Ledger vs Card Grid */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table Ledger View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-brand-surface text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-brand-surface text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {(categoryParam !== 'All' || searchParam) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchParams(new URLSearchParams({ page: '1' }));
                }}
                className="text-xs font-medium text-brand-navy hover:text-brand-primary hover:underline px-2 py-1.5 cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {categoryPills.map((cat) => {
            const isSelected = categoryParam === cat || (cat === 'All' && !categoryParam);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Receipts Presentation: Empty State / Table Ledger View / Card Grid View */}
      {sortedReceipts.length === 0 ? (
        <div className="bg-brand-surface border border-slate-200/90 rounded-2xl shadow-xs p-8 font-sans">
          <EmptyState
            title={categoryParam !== 'All' || searchParam ? 'No receipts match criteria' : 'No receipts cataloged yet'}
            description={
              categoryParam !== 'All' || searchParam
                ? 'Try broadening your search term or selecting another category.'
                : 'Add your first receipt to track purchases and warranty lifecycles.'
            }
            actionLabel={categoryParam !== 'All' || searchParam ? 'Clear Filters' : 'Add Receipt'}
            onAction={
              categoryParam !== 'All' || searchParam
                ? () => {
                    setSearchTerm('');
                    setSearchParams(new URLSearchParams({ page: '1' }));
                  }
                : () => navigate('/receipts/new')
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE LEDGER VIEW */
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xs overflow-hidden font-sans">
          {/* Table Column Headers */}
          <div className="bg-brand-canvas border-b border-brand-border px-6 py-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-brand-navy/70">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {isSelectionMode && (
                <div
                  onClick={handleToggleSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                    allSelected
                      ? 'bg-brand-primary border-brand-primary text-white'
                      : isIndeterminate
                      ? 'bg-brand-border border-brand-primary text-brand-navy font-bold'
                      : 'bg-brand-surface border-brand-border hover:border-brand-primary'
                  }`}
                  title={allSelected ? 'Deselect all' : 'Select all'}
                >
                  {allSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {isIndeterminate && <span className="text-[10px] leading-none mb-0.5">–</span>}
                </div>
              )}
              <span>Merchant / Store</span>
            </div>

            <div className="hidden md:flex items-center gap-12 text-right">
              <span className="w-28 text-left">Category</span>
              <span className="w-20 text-center">Items</span>
              <span className="w-32 text-right">Grand Total</span>
              <span className="w-16 text-right">Actions</span>
            </div>
            <div className="md:hidden">
              <span>Total</span>
            </div>
          </div>

          {/* Ledger Rows */}
          <div className="divide-y divide-slate-100">
            {sortedReceipts.map((receipt) => {
              const products = receipt.products || [];
              const itemCount = products.length || 1;
              const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
              const categoryName = products[0]?.category || 'General';
              const isSelected = selectedIds.includes(receipt._id);
              const storeInitials = vendorName.substring(0, 2).toUpperCase();
              const amt = receipt.grandTotal != null ? receipt.grandTotal : (receipt.totalAmount != null ? receipt.totalAmount : 0);

              return (
                <div
                  key={receipt._id}
                  onClick={() => {
                    if (isSelectionMode) {
                      handleToggleSelectRow(receipt._id);
                    } else {
                      navigate(`/receipts/${receipt._id}`);
                    }
                  }}
                  className={`px-5 sm:px-6 py-4 flex items-center justify-between gap-4 cursor-pointer transition-colors group ${
                    isSelected ? 'bg-brand-border/30' : 'hover:bg-brand-canvas'
                  }`}
                >
                  {/* Left Column: Avatar + Store Name + Invoice/Date */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Checkbox (in selection mode) */}
                    {isSelectionMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectRow(receipt._id);
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0 ${
                          isSelected
                            ? 'bg-brand-primary border-brand-primary text-white'
                            : 'bg-brand-surface border-brand-border hover:border-brand-primary'
                        }`}
                        title={isSelected ? 'Deselect receipt' : 'Select receipt'}
                      >
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Merchant Monogram Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-brand-canvas border border-brand-border font-medium text-xs text-brand-navy flex items-center justify-center shrink-0 group-hover:bg-brand-border/50 transition-colors">
                      {storeInitials}
                    </div>

                    {/* Vendor Name & Date Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-brand-navy group-hover:text-brand-primary transition-colors truncate">
                          {vendorName}
                        </h3>
                        <span className="md:hidden inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 font-sans">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-normal mt-0.5 flex items-center gap-2">
                        {receipt.invoiceNumber && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-medium">
                            #{receipt.invoiceNumber}
                          </span>
                        )}
                        <span className="font-tabular">
                          {formatDate(receipt.purchaseDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Desktop Columns: Category & Items */}
                  <div className="hidden md:flex items-center gap-12 shrink-0">
                    {/* Category Tag */}
                    <div className="w-28 text-left">
                      <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full truncate max-w-full">
                        {categoryName}
                      </span>
                    </div>

                    {/* Items Count Badge */}
                    <div className="w-20 text-center">
                      <span className="inline-block text-[11px] font-medium text-slate-500 font-tabular">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Grand Total */}
                    <div className="w-32 text-right">
                      <span className="text-sm sm:text-base font-medium text-slate-900 font-tabular block leading-none">
                        {formatCurrency(amt, receipt.currency || 'INR')}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Grand Total */}
                  <div className="md:hidden text-right shrink-0">
                    <span className="text-sm font-medium text-slate-900 font-tabular block">
                      {formatCurrency(amt, receipt.currency || 'INR')}
                    </span>
                    <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                      {categoryName}
                    </span>
                  </div>

                  {/* Action Buttons: QR Share + More Menu */}
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setShareModalReceipt(receipt)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Share / QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === receipt._id ? null : receipt._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === receipt._id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-brand-surface border border-slate-200/90 rounded-xl shadow-lg py-1 z-30 font-sans text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/receipts/${receipt._id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/receipts/${receipt._id}?edit=true`);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setShareModalReceipt(receipt);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-400" />
                            <span>Share QR Code</span>
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeletingReceipt(receipt);
                            }}
                            className="w-full text-left px-3 py-2 text-brand-navy hover:bg-brand-border/30 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-brand-navy/70" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {sortedReceipts.map((receipt) => {
            const products = receipt.products || [];
            const itemCount = products.length || 1;
            const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
            const categoryName = products[0]?.category || 'General';
            const isSelected = selectedIds.includes(receipt._id);
            const storeInitials = vendorName.substring(0, 2).toUpperCase();
            const amt = receipt.grandTotal != null ? receipt.grandTotal : (receipt.totalAmount != null ? receipt.totalAmount : 0);

            return (
              <div
                key={receipt._id}
                onClick={() => {
                  if (isSelectionMode) {
                    handleToggleSelectRow(receipt._id);
                  } else {
                    navigate(`/receipts/${receipt._id}`);
                  }
                }}
                className={`bg-brand-surface border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
                  isSelected ? 'border-brand-primary bg-brand-border/20 ring-1 ring-brand-primary' : 'border-brand-border hover:border-brand-primary/60'
                }`}
              >
                <div>
                  {/* Top Bar: Monogram + Checkbox + Category + Item Count */}
                  <div className="flex items-center justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      {isSelectionMode && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRow(receipt._id);
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                            isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-surface border-brand-border hover:border-brand-primary'
                          }`}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="w-8 h-8 rounded-xl bg-brand-canvas border border-brand-border font-medium text-xs text-brand-navy flex items-center justify-center shrink-0 uppercase tracking-tight group-hover:bg-brand-border/50 transition-colors">
                        {storeInitials}
                      </div>
                      <span className="text-[11px] font-medium text-brand-navy bg-brand-border/40 border border-brand-border px-2.5 py-0.5 rounded-full truncate max-w-[130px]">
                        {categoryName}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-brand-navy/80 bg-brand-canvas border border-brand-border px-2 py-0.5 rounded-full font-tabular shrink-0">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Vendor Name & Date Metadata */}
                  <h3 className="text-sm font-medium text-brand-navy group-hover:text-brand-primary transition-colors truncate" title={vendorName}>
                    {vendorName}
                  </h3>

                  <div className="text-[11px] text-slate-400 font-normal mt-1 flex items-center gap-2">
                    {receipt.invoiceNumber && (
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">
                        #{receipt.invoiceNumber}
                      </span>
                    )}
                    <span className="font-tabular">
                      {formatDate(receipt.purchaseDate)}
                    </span>
                  </div>

                  {/* Product items preview */}
                  {products.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-normal line-clamp-1">
                        {products.map((p) => p.productName || p.name).filter(Boolean).slice(0, 2).join(', ')}
                        {products.length > 2 && ` +${products.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Grand Total + QR Share & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Total</span>
                    <span className="text-base font-semibold text-slate-900 font-tabular">
                      {formatCurrency(amt, receipt.currency || 'INR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setShareModalReceipt(receipt)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Share / QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === receipt._id ? null : receipt._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === receipt._id && (
                        <div className="absolute right-0 bottom-full mb-1 w-36 bg-brand-surface border border-slate-200/90 rounded-xl shadow-lg py-1 z-30 font-sans text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/receipts/${receipt._id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/receipts/${receipt._id}?edit=true`);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setShareModalReceipt(receipt);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-400" />
                            <span>Share QR Code</span>
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeletingReceipt(receipt);
                            }}
                            className="w-full text-left px-3 py-2 text-brand-navy hover:bg-brand-border/30 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-brand-navy/70" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer (shared across Table and Grid modes) */}
      {sortedReceipts.length > 0 && (
        <div className="bg-brand-surface border border-slate-200/90 rounded-2xl px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-sans shadow-xs">
          <span>
            Showing <strong className="text-slate-900 font-tabular font-medium">{sortedReceipts.length}</strong> of{' '}
            <strong className="text-slate-900 font-tabular font-medium">{total}</strong> total receipts
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pageParam - 1)}
                disabled={pageParam <= 1}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-brand-surface border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="font-tabular px-1">
                Page {pageParam} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(pageParam + 1)}
                disabled={pageParam >= totalPages}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-brand-surface border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Floating Bulk Action Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-y-1/2 z-40 bg-slate-900 text-white shadow-xl rounded-2xl px-5 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-800">
          <span className="text-xs font-bold font-tabular text-slate-200">
            {selectedIds.length} {selectedIds.length === 1 ? 'receipt' : 'receipts'} selected
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-brand-navy rounded-xl hover:bg-brand-navy-hover transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* 6. Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <h3 className="text-base font-semibold text-slate-900">Delete Selected Receipts</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Are you sure you want to permanently delete {selectedIds.length} receipt(s)? This action cannot be reversed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-brand-surface border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-navy rounded-xl hover:bg-brand-navy-hover transition-colors cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : `Confirm Delete (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Single Delete Modal */}
      {deletingReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <h3 className="text-base font-semibold text-slate-900">Delete Receipt</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Are you sure you want to delete the receipt from <strong className="text-slate-900 font-medium">{deletingReceipt.storeName || 'Merchant'}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReceipt(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-brand-surface border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-navy rounded-xl hover:bg-brand-navy-hover transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Share Modal */}
      {shareModalReceipt && (
        <ShareModal
          receipt={shareModalReceipt}
          onClose={() => setShareModalReceipt(null)}
        />
      )}
    </div>
  );
};

export default Receipts;
