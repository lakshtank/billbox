import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Package, 
  Plus, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ArrowUpDown,
  X,
  LayoutList,
  LayoutGrid,
  Store,
  Calendar,
  ExternalLink,
  Tag
} from 'lucide-react';
import { useProductsQuery } from '../queries/useProductsQuery';
import { useCreateProduct } from '../queries/useProductMutations';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';
import { usePersistentViewMode } from '../hooks/usePersistentViewMode';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Hardware',
  'Utilities',
  'Office',
  'Others',
];

const WARRANTY_FILTERS = [
  { id: 'All', label: 'All Items' },
  { id: 'active', label: 'Under Warranty' },
  { id: 'expiring_soon', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'none', label: 'No Warranty' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'oldest', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  { id: 'price-desc', label: 'Highest Price', sortBy: 'unitPrice', sortOrder: 'desc' },
  { id: 'price-asc', label: 'Lowest Price', sortBy: 'unitPrice', sortOrder: 'asc' },
  { id: 'warranty', label: 'Expiring Soonest', sortBy: 'warrantyExpiryDate', sortOrder: 'asc' },
];

const getBrandMonogram = (name, brand) => {
  if (brand && brand.trim()) {
    const words = brand.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return brand.substring(0, 2).toUpperCase();
  }
  if (name && name.trim()) {
    return name.substring(0, 2).toUpperCase();
  }
  return 'PR';
};

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: fetchedCategories = [] } = useCategoriesQuery();
  const createMutation = useCreateProduct();

  // URL search params
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const warrantyStatusParam = searchParams.get('warrantyStatus') || 'All';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [viewMode, setViewMode] = usePersistentViewMode('billbox_products_view_mode', 'table');
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

  // Sync search input with URL param
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Categories list
  const categoryPillList = useMemo(() => {
    const userCatNames = Array.isArray(fetchedCategories)
      ? fetchedCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
      : [];
    return Array.from(new Set(['All', ...DEFAULT_CATEGORIES, ...userCatNames]));
  }, [fetchedCategories]);

  // Construct query filters
  const currentSortObj = SORT_OPTIONS.find((s) => s.id === sortParam) || SORT_OPTIONS[0];
  const filters = useMemo(() => {
    const q = { 
      page: pageParam, 
      limit: viewMode === 'grid' ? 12 : 20,
      sortBy: currentSortObj.sortBy,
      sortOrder: currentSortObj.sortOrder
    };
    if (categoryParam !== 'All') q.category = categoryParam;
    if (searchParam.trim()) q.search = searchParam.trim();
    if (warrantyStatusParam !== 'All') q.warrantyStatus = warrantyStatusParam;
    return q;
  }, [pageParam, categoryParam, searchParam, warrantyStatusParam, currentSortObj, viewMode]);

  const { data, isLoading, isError } = useProductsQuery(filters);
  const { products = [], total = 0, page = 1, totalPages = 1 } = data || {};

  const hasActiveFilters = Boolean(
    searchParam ||
    (categoryParam && categoryParam !== 'All') ||
    (warrantyStatusParam && warrantyStatusParam !== 'All') ||
    sortParam !== 'newest'
  );

  // Filter Handlers
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

  const handleSelectWarranty = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'All') {
      params.delete('warrantyStatus');
    } else {
      params.set('warrantyStatus', status);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
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

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams({ page: '1' }));
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
    <div className="min-h-screen bg-brand-canvas px-4 sm:px-6 md:px-8 lg:px-10 py-8 w-full space-y-6 text-brand-navy font-sans pb-28">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-brand-navy tracking-tight leading-tight">
              Products Inventory
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-border/60 text-brand-navy border border-brand-border font-tabular">
              {total} {total === 1 ? 'total record' : 'total records'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Registered merchandise, warranty lifecycles, and item purchase histories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. High-Productivity Inline Search, Filter & Controls Bar */}
      <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 font-sans">
        {/* Top: Live Search Input + Sort Dropdown + View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product name, brand, model..."
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
                value={sortParam}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none shrink-0"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher: Table Ledger vs Card Grid */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
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
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-brand-surface text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Warranty Status Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            WARRANTY:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {WARRANTY_FILTERS.map((wf) => {
              const isSelected = warrantyStatusParam === wf.id;
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => handleSelectWarranty(wf.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                  }`}
                >
                  {wf.id === 'active' && <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />}
                  {wf.id === 'expiring_soon' && <Clock className="w-3.5 h-3.5 text-brand-primary" />}
                  {wf.id === 'expired' && <AlertTriangle className="w-3.5 h-3.5 text-brand-navy/60" />}
                  <span>{wf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom: Category Quick-Pills (Scrollable) */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            CATEGORY:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {categoryPillList.map((cat) => {
              const isSelected = categoryParam === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-brand-navy hover:text-brand-primary hover:underline font-medium cursor-pointer shrink-0 ml-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Products Presentation */}
      {products.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No products match your filters' : 'No products registered yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search query, warranty status, or category filter.'
              : 'Add your first product or upload an invoice to start tracking item lifecycles.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Add Product'}
          onAction={hasActiveFilters ? handleClearAllFilters : () => setIsAddModalOpen(true)}
        />
      ) : viewMode === 'table' ? (
        /* TABLE LEDGER VIEW */
        <div className="bg-brand-surface border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden font-sans">
          {/* Table Header Row */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-12 sm:col-span-5 md:col-span-4">PRODUCT & SPECIFICATION</div>
            <div className="hidden sm:block sm:col-span-2 text-left">CATEGORY</div>
            <div className="hidden md:block md:col-span-3 text-left">PURCHASE SOURCE</div>
            <div className="col-span-7 sm:col-span-3 md:col-span-2 text-right sm:text-center">WARRANTY</div>
            <div className="col-span-5 sm:col-span-2 md:col-span-1 text-right">VALUE</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {products.map((product) => {
              const receipt = product.receiptId;
              const currency = receipt?.currency || 'INR';
              const price = product.lineTotal || product.unitPrice;
              const monogram = getBrandMonogram(product.productName, product.brand);

              // Warranty Status formatting
              let warrantyNode = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal text-slate-500 bg-slate-100 border border-slate-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>No warranty</span>
                </span>
              );

              if (product.warrantyStatus === 'active') {
                warrantyNode = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-border/60 text-brand-navy border border-brand-border">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>Under Warranty</span>
                  </span>
                );
              } else if (product.warrantyStatus === 'expiring_soon') {
                warrantyNode = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-border text-brand-navy border border-brand-primary/50">
                    <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>Expiring Soon</span>
                  </span>
                );
              } else if (product.warrantyStatus === 'expired') {
                warrantyNode = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-canvas text-brand-navy/70 border border-brand-border">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-navy/60 shrink-0" />
                    <span>Expired</span>
                  </span>
                );
              }

              return (
                <div
                  key={product._id}
                  onClick={() => navigate(`/products/${product._id}`)}
                  className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-brand-border/20 transition-colors cursor-pointer group"
                >
                  {/* Column 1: Product Monogram, Name & Brand */}
                  <div className="col-span-12 sm:col-span-5 md:col-span-4 flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-canvas border border-brand-border text-brand-navy font-semibold text-xs flex items-center justify-center shrink-0 uppercase tracking-tight group-hover:bg-brand-border/50 group-hover:text-brand-navy group-hover:border-brand-border transition-colors">
                      {monogram}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-sm font-medium text-brand-navy group-hover:text-brand-primary transition-colors truncate"
                        title={product.productName}
                      >
                        {product.productName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
                        {product.brand && (
                          <span className="font-normal text-slate-600">{product.brand}</span>
                        )}
                        {product.brand && product.quantity > 1 && <span>•</span>}
                        {product.quantity > 1 && (
                          <span className="font-tabular text-slate-500">Qty: {product.quantity}</span>
                        )}
                        {/* Mobile Category indicator */}
                        <span className="sm:hidden text-slate-400">• {product.category || 'Others'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Category Pill */}
                  <div className="hidden sm:block sm:col-span-2 text-left">
                    <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full truncate max-w-full">
                      {product.category || 'Others'}
                    </span>
                  </div>

                  {/* Column 3: Linked Receipt / Merchant */}
                  <div className="hidden md:block md:col-span-3 text-left min-w-0">
                    {receipt ? (
                      <div>
                        <span className="text-xs font-medium text-slate-800 block truncate" title={receipt.storeName}>
                          {receipt.storeName || 'Merchant'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-tabular block mt-0.5">
                          {formatDate(receipt.purchaseDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-normal">Direct Entry</span>
                    )}
                  </div>

                  {/* Column 4: Warranty Status */}
                  <div className="col-span-7 sm:col-span-3 md:col-span-2 text-left sm:text-center">
                    {warrantyNode}
                  </div>

                  {/* Column 5: Value & Arrow */}
                  <div className="col-span-5 sm:col-span-2 md:col-span-1 flex items-center justify-end gap-2 text-right">
                    <span className="text-sm font-medium font-tabular text-slate-900 tracking-tight">
                      {price != null ? formatCurrency(price, currency) : '—'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 transition-colors shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {products.map((product) => {
            const receipt = product.receiptId;
            const currency = receipt?.currency || 'INR';
            const price = product.lineTotal || product.unitPrice;
            const monogram = getBrandMonogram(product.productName, product.brand);

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/products/${product._id}`)}
                className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Monogram + Category + Warranty Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-canvas border border-brand-border text-brand-navy font-semibold text-xs flex items-center justify-center uppercase tracking-tight group-hover:bg-brand-border/50 group-hover:text-brand-navy transition-colors">
                        {monogram}
                      </div>
                      <span className="text-[11px] font-medium text-brand-navy bg-brand-border/40 border border-brand-border px-2 py-0.5 rounded-full">
                        {product.category || 'Others'}
                      </span>
                    </div>

                    {/* Warranty pill */}
                    {product.warrantyStatus === 'active' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-navy bg-brand-border/60 border border-brand-border px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-brand-primary" />
                        <span>Active</span>
                      </span>
                    )}
                    {product.warrantyStatus === 'expiring_soon' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy bg-brand-border border border-brand-primary/50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-brand-primary" />
                        <span>Expiring</span>
                      </span>
                    )}
                    {product.warrantyStatus === 'expired' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-navy/70 bg-brand-canvas border border-brand-border px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-brand-navy/60" />
                        <span>Expired</span>
                      </span>
                    )}
                    {(!product.warrantyStatus || product.warrantyStatus === 'none') && (
                      <span className="text-[11px] font-normal text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
                        No warranty
                      </span>
                    )}
                  </div>

                  <h3
                    className="text-sm font-medium text-brand-navy group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug"
                    title={product.productName}
                  >
                    {product.productName}
                  </h3>

                  {product.brand && (
                    <span className="text-xs text-slate-500 font-normal mt-1 block">
                      Brand: {product.brand}
                    </span>
                  )}
                </div>

                {/* Card Bottom: Origin and Spend */}
                <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Purchased from</span>
                    <span className="font-medium text-slate-800 block truncate" title={receipt?.storeName || 'Direct Entry'}>
                      {receipt?.storeName || 'Direct Entry'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Value
                    </span>
                    <span className="text-base font-semibold text-slate-900 font-tabular">
                      {price != null ? formatCurrency(price, currency) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-2 text-slate-500 font-sans">
          <span>
            Showing <strong className="text-slate-900 font-tabular">{products.length}</strong> of{' '}
            <strong className="text-slate-900 font-tabular">{total}</strong> products
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-brand-surface border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="font-tabular px-1">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-brand-surface border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 6. Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-brand-surface rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 font-sans animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Add New Product</h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Register an item and track its warranty lifecycle independently.</p>
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
                <label className="block font-medium text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M3, Sony WH-1000XM5"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-brand-surface focus:border-slate-400 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Sony"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-brand-surface focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:bg-brand-surface focus:border-slate-400 font-sans text-xs cursor-pointer"
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
                  <label className="block font-medium text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14999"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-brand-surface focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:bg-brand-surface focus:border-slate-400 font-sans text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Warranty Period (Months)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12 or 24 months (0 for none)"
                  value={newProduct.warrantyPeriodMonths}
                  onChange={(e) => setNewProduct({ ...newProduct, warrantyPeriodMonths: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-brand-surface focus:border-slate-400 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
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
