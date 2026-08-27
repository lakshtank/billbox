import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QrCode, SlidersHorizontal, Search, X } from 'lucide-react';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import { useDeleteReceipt, useBulkDeleteReceipts } from '../queries/useReceiptMutations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ShareModal from '../components/receipts/ShareModal';
import { formatDate, formatCurrency } from '../utils/formatters';

const DEFAULT_CATEGORIES = [
  'Hardware',
  'Groceries',
  'Electronics',
  'Utilities',
  'Office',
  'Travel',
  'Other',
];

const Receipts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: fetchedCategories = [] } = useCategoriesQuery();
  const deleteMutation = useDeleteReceipt();
  const bulkDeleteMutation = useBulkDeleteReceipts();

  const userCatNames = Array.isArray(fetchedCategories)
    ? fetchedCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : [];
  const categoryPillList = Array.from(new Set(['All', ...DEFAULT_CATEGORIES, ...userCatNames]));

  // URL search params
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  // Local state for search & filter modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [tempCategory, setTempCategory] = useState(categoryParam);

  // Selection mode state (OFF by default)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk delete modal state
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Per-row 3-dot menu & single delete modal state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(null);

  // Share Modal State
  const [shareModalReceipt, setShareModalReceipt] = useState(null);

  // Sync search input when URL param changes externally
  useEffect(() => {
    setSearchTerm(searchParam);
    setTempCategory(categoryParam);
  }, [searchParam, categoryParam]);

  // Construct query filters
  const queryFilters = {
    page: pageParam,
    limit: 20,
  };
  if (categoryParam && categoryParam !== 'All') {
    queryFilters.category = categoryParam;
  }
  if (searchParam && searchParam.trim()) {
    queryFilters.search = searchParam.trim();
  }

  // Query receipts with current filters
  const { data, isLoading, isError } = useReceiptsQuery(queryFilters);

  const receipts = data?.receipts || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const hasActiveFilters = Boolean(searchParam || (categoryParam && categoryParam !== 'All'));

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (tempCategory && tempCategory !== 'All') params.set('category', tempCategory);
    params.set('page', '1');
    setSearchParams(params);
    setIsFilterModalOpen(false);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setTempCategory('All');
    setSearchParams(new URLSearchParams({ page: '1' }));
    setIsFilterModalOpen(false);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  // Close menus on click outside or Escape
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

  // Filter out selected IDs that are no longer visible when query data changes
  useEffect(() => {
    if (Array.isArray(receipts)) {
      const visibleSet = new Set(receipts.map((r) => r._id));
      setSelectedIds((prev) => prev.filter((id) => visibleSet.has(id)));
    }
  }, [data]);

  // Select All & Row Selection Logic
  const visibleIds = receipts.map((r) => r._id);
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

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  // Bulk Delete Handler
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

  // Single Delete Handler
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
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* Search & Filter Popup Modal (Wider, Dropping from top) */}
      {isFilterModalOpen && (
        <div 
          onClick={() => setIsFilterModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-6 sm:pt-12 px-4 pb-6 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl w-full max-w-2xl sm:max-w-3xl space-y-5 animate-in slide-in-from-top-6 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-none">Search & Filter Receipts</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Filter invoices by keyword, merchant, or category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-4">
              {/* Search Keyword */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Search Keyword
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by vendor, item, invoice #..."
                    className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors font-sans"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Category Filter
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {categoryPillList.map((cat) => {
                    const isSelected = tempCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTempCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-xl transition-colors font-semibold border cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-2 cursor-pointer"
                >
                  Reset All
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#047857] hover:bg-[#059669] rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    Apply & Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Page Header Row */}
      <div className="flex items-center justify-between gap-4 pb-1 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Receipts
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Manage, search, and export your purchases and invoice records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Compact Filter & Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs ${
              hasActiveFilters
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Search & Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => navigate('/receipts/new')}
            className="px-4 py-2 text-xs font-bold text-white bg-[#047857] rounded-xl hover:bg-[#059669] transition-colors shadow-xs cursor-pointer"
          >
            Add receipt
          </button>
        </div>
      </div>

      {/* Active Filter Chips Strip */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-400 font-medium text-[11px]">Active Filters:</span>
          {searchParam && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              <span>"{searchParam}"</span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('search');
                  setSearchParams(params);
                }}
                className="hover:text-emerald-950 cursor-pointer font-bold"
              >
                ✕
              </button>
            </span>
          )}
          {categoryParam && categoryParam !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              <span>Category: {categoryParam}</span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('category');
                  setSearchParams(params);
                }}
                className="hover:text-emerald-950 cursor-pointer font-bold"
              >
                ✕
              </button>
            </span>
          )}
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 3. Results Count & Selection Toolbar Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1 border-b border-slate-100 pb-2">
        {!isSelectionMode ? (
          <>
            <div>Showing {receipts.length} of {total} receipts</div>
            {receipts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSelectionMode(true)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Select
              </button>
            )}
          </>
        ) : (
          <>
            <div
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  allSelected
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : isIndeterminate
                    ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-bold'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                {allSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isIndeterminate && <span className="text-[10px] leading-none mb-0.5">–</span>}
              </div>
              <span className="font-medium text-xs text-slate-700">Select all</span>
            </div>

            <button
              type="button"
              onClick={handleExitSelectionMode}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* 4. Receipts List */}
      {receipts.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No receipts match your search/filters' : 'No receipts logged yet'}
          description={
            hasActiveFilters
              ? 'Try broadening your search term or selecting a different category.'
              : 'Add your first receipt to start tracking purchases and warranties.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Receipt'}
          onAction={hasActiveFilters ? handleClearAllFilters : () => navigate('/receipts/new')}
        />
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs divide-y divide-slate-100">
          {receipts.map((receipt) => {
            const products = receipt.products || [];
            const itemCount = products.length || 1;
            const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
            const categoryName = products[0]?.category || 'General';
            const isSelected = selectedIds.includes(receipt._id);

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
                className={`py-4 md:py-4.5 px-2 flex items-center justify-between gap-4 cursor-pointer transition-colors group ${
                  isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Checkbox */}
                {isSelectionMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectRow(receipt._id);
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0 ${
                      isSelected
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-white border-slate-300 hover:border-slate-400'
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

                {/* Left Side: Vendor Name + Item Count Badge + Invoice / Date */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors truncate"
                      title={vendorName}
                    >
                      {vendorName}
                    </h3>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 shrink-0 font-sans">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-1.5 font-sans">
                    {receipt.invoiceNumber && (
                      <>
                        <span className="font-mono text-slate-500">Invoice #{receipt.invoiceNumber}</span>
                        <span className="text-slate-300">•</span>
                      </>
                    )}
                    <span className="font-tabular">{formatDate(receipt.purchaseDate)}</span>
                  </div>
                </div>

                {/* Right Side: Category Name + Grand Total */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {categoryName}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-tabular tracking-tight leading-none block">
                    {formatCurrency(receipt.grandTotal || receipt.totalAmount, receipt.currency)}
                  </span>
                </div>

                {/* Actions: Small QR Icon + 3-Dot Menu */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Small QR Code Button */}
                  <button
                    type="button"
                    onClick={() => setShareModalReceipt(receipt)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Share Receipt"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {/* 3-Dot Action Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === receipt._id ? null : receipt._id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Actions"
                    >
                      <span className="text-base font-bold leading-none select-none">⋮</span>
                    </button>

                    {openMenuId === receipt._id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-md py-1 z-30 font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/receipts/${receipt._id}?edit=true`);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setShareModalReceipt(receipt);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Share
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeletingReceipt(receipt);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-4 text-slate-500 font-sans">
          <span>
            Page <strong className="text-slate-900 font-tabular">{page}</strong> of <strong className="text-slate-900 font-tabular">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-slate-900 shadow-lg rounded-xl px-5 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-semibold text-slate-900 font-tabular">
            {selectedIds.length} {selectedIds.length === 1 ? 'receipt' : 'receipts'} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleExitSelectionMode}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-slate-900">Delete Receipts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Delete {selectedIds.length} selected receipt(s)? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedIds.length} receipt(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Modal */}
      {deletingReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-slate-900">Delete Receipt</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Delete receipt from <strong className="text-slate-900">{deletingReceipt.storeName || 'Merchant'}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReceipt(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Share Modal */}
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
