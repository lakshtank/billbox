import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Package, 
  Plus, 
  X, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  SlidersHorizontal,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useProductsQuery } from '../queries/useProductsQuery';
import { useCreateProduct } from '../queries/useProductMutations';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

const WARRANTY_FILTERS = [
  { id: 'All', label: 'All Items' },
  { id: 'active', label: 'Under Warranty' },
  { id: 'expiring_soon', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'none', label: 'No Warranty' },
];

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: fetchedCategories = [] } = useCategoriesQuery();
  const createMutation = useCreateProduct();

  const userCatNames = Array.isArray(fetchedCategories)
    ? fetchedCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : [];
  const categoryPillList = Array.from(new Set(['All', ...DEFAULT_CATEGORIES, ...userCatNames]));

  // URL search params
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const warrantyStatusParam = searchParams.get('warrantyStatus') || 'All';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  // Local state for Search & Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [tempCategory, setTempCategory] = useState(categoryParam);
  const [tempWarrantyStatus, setTempWarrantyStatus] = useState(warrantyStatusParam);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: '',
    brand: '',
    category: 'Electronics',
    quantity: 1,
    unitPrice: '',
    warrantyPeriodMonths: 12,
    warrantyStatus: 'active',
  });

  // Sync search input with URL params
  useEffect(() => {
    setSearchTerm(searchParam);
    setTempCategory(categoryParam);
    setTempWarrantyStatus(warrantyStatusParam);
  }, [searchParam, categoryParam, warrantyStatusParam]);

  // Construct query filters
  const filters = { page: pageParam, limit: 12 };
  if (categoryParam !== 'All') filters.category = categoryParam;
  if (searchParam.trim()) filters.search = searchParam.trim();
  if (warrantyStatusParam !== 'All') filters.warrantyStatus = warrantyStatusParam;

  const { data, isLoading, isError } = useProductsQuery(filters);
  const { products = [], total = 0, page = 1, totalPages = 1 } = data || {};

  const hasActiveFilters = Boolean(
    searchParam ||
    (categoryParam && categoryParam !== 'All') ||
    (warrantyStatusParam && warrantyStatusParam !== 'All')
  );

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (tempCategory && tempCategory !== 'All') params.set('category', tempCategory);
    if (tempWarrantyStatus && tempWarrantyStatus !== 'All') params.set('warrantyStatus', tempWarrantyStatus);
    params.set('page', '1');
    setSearchParams(params);
    setIsFilterModalOpen(false);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setTempCategory('All');
    setTempWarrantyStatus('All');
    setSearchParams(new URLSearchParams({ page: '1' }));
    setIsFilterModalOpen(false);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleCreateProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    const priceNum = newProduct.unitPrice ? parseFloat(newProduct.unitPrice) : null;
    const monthsNum = newProduct.warrantyPeriodMonths ? parseInt(newProduct.warrantyPeriodMonths, 10) : null;
    
    let expiryDate = null;
    if (monthsNum && monthsNum > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + monthsNum);
      expiryDate = d;
    }

    createMutation.mutate(
      {
        productName: newProduct.productName.trim(),
        brand: newProduct.brand.trim(),
        category: newProduct.category,
        quantity: parseInt(newProduct.quantity, 10) || 1,
        unitPrice: priceNum,
        lineTotal: priceNum ? priceNum * (parseInt(newProduct.quantity, 10) || 1) : null,
        warrantyPeriodValue: monthsNum,
        warrantyPeriodUnit: 'months',
        warrantyPeriodMonths: monthsNum,
        warrantyExpiryDate: expiryDate,
        warrantyStatus: expiryDate ? 'active' : 'none',
      },
      {
        onSuccess: (res) => {
          toast.success('Product created successfully');
          setIsAddModalOpen(false);
          setNewProduct({
            productName: '',
            brand: '',
            category: 'Electronics',
            quantity: 1,
            unitPrice: '',
            warrantyPeriodMonths: 12,
            warrantyStatus: 'active',
          });
          if (res?.product?._id) {
            navigate(`/products/${res.product._id}`);
          }
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to create product';
          toast.error(msg);
        },
      }
    );
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
        title="Could not load products"
        description="Something went wrong fetching your products. Please try refreshing."
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
                  <h3 className="text-base font-extrabold text-slate-900 leading-none">Search & Filter Products</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Filter items by keyword, warranty status, or category</p>
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
                    placeholder="Product name, brand, model..."
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

              {/* Warranty Status Filter */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Warranty Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WARRANTY_FILTERS.map((wf) => {
                    const isSelected = tempWarrantyStatus === wf.id;
                    return (
                      <button
                        key={wf.id}
                        type="button"
                        onClick={() => setTempWarrantyStatus(wf.id)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {wf.label}
                      </button>
                    );
                  })}
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
            Products
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Manage your purchases, warranties, and item history as standalone assets.
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
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#047857] rounded-xl hover:bg-[#059669] transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add product</span>
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
          {warrantyStatusParam && warrantyStatusParam !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              <span>Warranty: {WARRANTY_FILTERS.find((w) => w.id === warrantyStatusParam)?.label || warrantyStatusParam}</span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('warrantyStatus');
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

      {/* 3. Results Count Strip */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1 border-b border-slate-100 pb-2">
        <div>Showing {products.length} of {total} products</div>
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

      {/* 4. Products List */}
      {products.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No products match your filters' : 'No products logged yet'}
          description={
            hasActiveFilters
              ? 'Try broadening your search keyword, category, or warranty status.'
              : 'Add your first product or upload a receipt to track items and warranties.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Product'}
          onAction={hasActiveFilters ? handleClearAllFilters : () => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs divide-y divide-slate-100">
          {products.map((product) => {
            const receipt = product.receiptId;
            const currency = receipt?.currency || 'INR';
            const price = product.lineTotal || product.unitPrice;

            // Warranty Badge formatting
            let warrantyBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                No warranty
              </span>
            );

            if (product.warrantyStatus === 'active') {
              warrantyBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Under Warranty</span>
                </span>
              );
            } else if (product.warrantyStatus === 'expiring_soon') {
              warrantyBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Expiring Soon</span>
                </span>
              );
            } else if (product.warrantyStatus === 'expired') {
              warrantyBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Expired</span>
                </span>
              );
            }

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/products/${product._id}`)}
                className="py-4 md:py-4.5 px-2 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors group"
              >
                {/* Left: Product Name, Brand & Linked Receipt Store */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate"
                      title={product.productName}
                    >
                      {product.productName}
                    </h3>

                    {product.brand && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 font-sans">
                        {product.brand}
                      </span>
                    )}

                    <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 font-sans">
                      {product.category || 'Others'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-2 font-sans">
                    {receipt ? (
                      <>
                        <span className="font-semibold text-slate-700">{receipt.storeName || 'Merchant'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-tabular">{formatDate(receipt.purchaseDate)}</span>
                      </>
                    ) : (
                      <span>Direct Product Entry</span>
                    )}
                    {product.quantity > 1 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-tabular">Qty: {product.quantity}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Center / Right: Warranty Status Badge */}
                <div className="hidden sm:block shrink-0">
                  {warrantyBadge}
                </div>

                {/* Right: Spend Amount & Arrow */}
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
          })}
        </div>
      )}

      {/* 5. Pagination Controls */}
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
                <p className="text-xs text-slate-500">Track an owned item and warranty independently.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M3, Sony WH-1000XM5"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Sony"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-400 font-sans text-xs"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14999"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warranty Period (Months)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12 or 24 months (0 for none)"
                  value={newProduct.warrantyPeriodMonths}
                  onChange={(e) => setNewProduct({ ...newProduct, warrantyPeriodMonths: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
