import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, Search, ArrowRight, Calendar, ShoppingBag, FileText, ArrowUpDown, SlidersHorizontal, X } from 'lucide-react';
import { useStoresQuery } from '../queries/useStoresQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';

const SORT_OPTIONS = [
  { id: 'spend_desc', label: 'Highest Spend' },
  { id: 'receipts_desc', label: 'Most Receipts' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'name_asc', label: 'Store Name (A–Z)' },
];

const Stores = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'spend_desc';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  // Local state for Search & Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [tempSort, setTempSort] = useState(sortParam);

  useEffect(() => {
    setSearchTerm(searchParam);
    setTempSort(sortParam);
  }, [searchParam, sortParam]);

  const filters = {
    page: pageParam,
    limit: 15,
    search: searchParam.trim(),
    sortBy: sortParam,
  };

  const { data, isLoading, isError } = useStoresQuery(filters);
  const { stores = [], total = 0, page = 1, totalPages = 1 } = data || {};

  const hasActiveFilters = Boolean(searchParam || sortParam !== 'spend_desc');

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (tempSort && tempSort !== 'spend_desc') params.set('sort', tempSort);
    params.set('page', '1');
    setSearchParams(params);
    setIsFilterModalOpen(false); // pop up should be gayab
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setTempSort('spend_desc');
    setSearchParams(new URLSearchParams({ page: '1' }));
    setIsFilterModalOpen(false);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
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
        title="Could not load stores"
        description="Something went wrong fetching your store history. Please try refreshing."
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
                  <h3 className="text-base font-extrabold text-slate-900 leading-none">Search & Filter Merchants</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Filter stores by name or sort by spending / frequency</p>
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
                  Search Merchant Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by store or vendor name..."
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

              {/* Sort Options */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Sort Order
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = tempSort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTempSort(opt.id)}
                        className={`text-xs px-3.5 py-2 rounded-xl font-semibold border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
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
            Stores & Merchants
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Track spending, order frequency, and purchase history by merchant.
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
          {sortParam !== 'spend_desc' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              <span>Sort: {SORT_OPTIONS.find((s) => s.id === sortParam)?.label || sortParam}</span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('sort');
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

      {/* 3. Results Count Strip */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-b border-slate-100 pb-2">
        <div>Showing {stores.length} of {total} merchants</div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* 4. Stores List */}
      {stores.length === 0 ? (
        <EmptyState
          title={searchParam ? 'No stores match your search' : 'No store history found'}
          description={
            searchParam
              ? 'Try searching with a different merchant name.'
              : 'Upload receipts to automatically populate your merchant spending history.'
          }
          actionLabel={searchParam ? 'Clear Search' : 'Add Receipt'}
          onAction={searchParam ? handleClearSearch : () => navigate('/receipts/new')}
        />
      ) : (
        <div className="divide-y divide-slate-100 border-b border-slate-100 font-sans">
          {stores.map((store) => {
            const currency = store.currency || 'INR';
            return (
              <div
                key={store.storeKey || store.storeName}
                onClick={() => navigate(`/stores/${encodeURIComponent(store.storeName)}`)}
                className="py-4 md:py-5 px-2 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors group"
              >
                {/* Left: Store Name & Badges */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3
                      className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate"
                      title={store.storeName}
                    >
                      {store.storeName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 font-normal">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 font-tabular">
                      <FileText className="w-3 h-3 text-slate-500" />
                      <span>{store.receiptCount} {store.receiptCount === 1 ? 'receipt' : 'receipts'}</span>
                    </span>

                    {store.productCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 font-tabular">
                        <ShoppingBag className="w-3 h-3 text-slate-500" />
                        <span>{store.productCount} {store.productCount === 1 ? 'item' : 'items'}</span>
                      </span>
                    )}

                    {store.latestPurchaseDate && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Last purchase: <strong className="font-semibold text-slate-700 font-tabular">{formatDate(store.latestPurchaseDate)}</strong></span>
                        </span>
                      </>
                    )}
                  </div>

                  {store.categories && store.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {store.categories.map((cat) => (
                        <span
                          key={cat}
                          className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Total Spend & Arrow */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Total Spend
                    </span>
                    <span className="text-base sm:text-xl font-bold text-slate-900 font-tabular tracking-tight leading-none block">
                      {formatCurrency(store.totalSpent, 'INR')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination */}
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
    </div>
  );
};

export default Stores;
