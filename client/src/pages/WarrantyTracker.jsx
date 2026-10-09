import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  ArrowUpDown, 
  LayoutList, 
  LayoutGrid, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import { useProductsQuery } from '../queries/useProductsQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';
import { usePersistentViewMode } from '../hooks/usePersistentViewMode';

const STATUS_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'active', label: 'Active' },
  { id: 'expiring_soon', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
  { id: 'expiry-asc', label: 'Expiring Soonest' },
  { id: 'expiry-desc', label: 'Latest Expiry' },
  { id: 'amount-desc', label: 'Highest Value' },
  { id: 'amount-asc', label: 'Lowest Value' },
  { id: 'purchase-desc', label: 'Recently Purchased' },
];

const DEFAULT_CATEGORIES = [
  'All',
  'Electronics',
  'Appliances',
  'Hardware',
  'Groceries',
  'Fashion',
  'Furniture',
  'Others',
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
  return 'WA';
};

/**
 * Real-time calculation of days remaining and lifecycle status
 */
const calculateWarrantyMetrics = (product, receipt) => {
  const expiryDate = product.warrantyExpiryDate;
  const purchaseDate = product.purchaseDate || receipt?.purchaseDate || product.createdAt;

  if (!expiryDate) {
    return {
      status: 'none',
      diffDays: null,
      badgeText: 'No warranty',
      isExpired: false,
      isExpiringSoon: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      diffDays,
      badgeText: `Expired ${Math.abs(diffDays)}d ago`,
      isExpired: true,
      isExpiringSoon: false,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'expiring_soon',
      diffDays: 0,
      badgeText: 'Expires today',
      isExpired: false,
      isExpiringSoon: true,
    };
  }

  if (diffDays <= 30) {
    return {
      status: 'expiring_soon',
      diffDays,
      badgeText: `${diffDays} days left`,
      isExpired: false,
      isExpiringSoon: true,
    };
  }

  return {
    status: 'active',
    diffDays,
    badgeText: `${diffDays} days left`,
    isExpired: false,
    isExpiringSoon: false,
  };
};

const WarrantyTracker = () => {
  const navigate = useNavigate();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'expiring_soon' | 'expired'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('expiry-asc');
  const [viewMode, setViewMode] = usePersistentViewMode('billbox_warranty_view_mode', 'table');

  // Fetch receipts and products
  const { data: receiptsData, isLoading: loadingReceipts } = useReceiptsQuery({ limit: 150 });
  const { data: productsData, isLoading: loadingProducts } = useProductsQuery({ limit: 150 });

  const isLoading = loadingReceipts || loadingProducts;

  // Aggregate and deduplicate all warranty items
  const allWarrantyItems = useMemo(() => {
    const map = new Map();

    // 1. From Receipts
    const receiptsList = receiptsData?.receipts || [];
    receiptsList.forEach((receipt) => {
      const prods = Array.isArray(receipt.products) && receipt.products.length > 0
        ? receipt.products
        : [{ ...receipt, receiptId: receipt._id }];

      prods.forEach((prod) => {
        const hasWarranty = prod.warrantyExpiryDate || 
          (prod.warrantyPeriodMonths && prod.warrantyPeriodMonths > 0) ||
          (prod.warrantyPeriodValue && prod.warrantyPeriodValue > 0) ||
          (prod.warrantyStatus && prod.warrantyStatus !== 'none');

        if (hasWarranty) {
          const key = String(prod._id || `${receipt._id}-${prod.productName}`);
          map.set(key, {
            id: key,
            product: prod,
            receipt,
            metrics: calculateWarrantyMetrics(prod, receipt),
          });
        }
      });
    });

    // 2. From standalone Products list
    const prodsList = productsData?.products || [];
    prodsList.forEach((prod) => {
      const hasWarranty = prod.warrantyExpiryDate || 
        (prod.warrantyPeriodMonths && prod.warrantyPeriodMonths > 0) ||
        (prod.warrantyStatus && prod.warrantyStatus !== 'none');

      if (hasWarranty) {
        const key = String(prod._id);
        const existing = map.get(key);
        const receipt = prod.receiptId && typeof prod.receiptId === 'object' 
          ? prod.receiptId 
          : existing?.receipt || null;

        map.set(key, {
          id: key,
          product: prod,
          receipt,
          metrics: calculateWarrantyMetrics(prod, receipt),
        });
      }
    });

    return Array.from(map.values());
  }, [receiptsData, productsData]);

  // Aggregate counts
  const counts = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    allWarrantyItems.forEach((item) => {
      if (item.metrics.status === 'active') active++;
      else if (item.metrics.status === 'expiring_soon') expiringSoon++;
      else if (item.metrics.status === 'expired') expired++;
    });

    return {
      total: allWarrantyItems.length,
      active,
      expiringSoon,
      expired,
      totalActiveProtected: active + expiringSoon,
    };
  }, [allWarrantyItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let list = allWarrantyItems.filter((item) => {
      // Status tab
      if (activeTab === 'active' && item.metrics.status !== 'active') return false;
      if (activeTab === 'expiring_soon' && item.metrics.status !== 'expiring_soon') return false;
      if (activeTab === 'expired' && item.metrics.status !== 'expired') return false;

      // Category
      if (selectedCategory !== 'All') {
        const cat = item.product.category || item.receipt?.category || 'Others';
        if (cat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const prodName = (item.product.productName || '').toLowerCase();
        const brand = (item.product.brand || '').toLowerCase();
        const storeName = (item.receipt?.storeName || '').toLowerCase();
        if (!prodName.includes(q) && !brand.includes(q) && !storeName.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    list.sort((a, b) => {
      const priceA = Number(a.product.lineTotal || a.product.unitPrice || 0);
      const priceB = Number(b.product.lineTotal || b.product.unitPrice || 0);
      const dateA = new Date(a.product.warrantyExpiryDate || '2099-01-01').getTime();
      const dateB = new Date(b.product.warrantyExpiryDate || '2099-01-01').getTime();
      const purchA = new Date(a.receipt?.purchaseDate || a.product.purchaseDate || 0).getTime();
      const purchB = new Date(b.receipt?.purchaseDate || b.product.purchaseDate || 0).getTime();

      if (sortBy === 'expiry-asc') return dateA - dateB;
      if (sortBy === 'expiry-desc') return dateB - dateA;
      if (sortBy === 'amount-desc') return priceB - priceA;
      if (sortBy === 'amount-asc') return priceA - priceB;
      if (sortBy === 'purchase-desc') return purchB - purchA;
      return 0;
    });

    return list;
  }, [allWarrantyItems, activeTab, selectedCategory, searchTerm, sortBy]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || activeTab !== 'all' || selectedCategory !== 'All'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveTab('all');
    setSelectedCategory('All');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-canvas px-4 sm:px-6 md:px-8 lg:px-10 py-7 w-full space-y-5 text-brand-navy font-sans pb-28">
      {/* 1. Header Toolbar (Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-brand-navy tracking-tight leading-tight">
              Warranty Tracker
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/25 font-tabular">
              {counts.totalActiveProtected} active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Track warranty expiration dates and maintain coverage across your registered assets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/receipts/new')}
          className="px-4 py-2 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Receipt</span>
        </button>
      </div>

      {/* 2. Streamlined High-Productivity Filter Bar (Clean & Content-Focused) */}
      <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-3 font-sans">
        {/* Row 1: Search + Status Tabs + Sort & View Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, brand, merchant..."
              style={{ paddingLeft: '2.25rem', paddingRight: '2rem' }}
              className="w-full text-xs py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-brand-surface border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Quick-Tabs with embedded live counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {STATUS_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              let count = counts.total;
              if (tab.id === 'active') count = counts.active;
              if (tab.id === 'expiring_soon') count = counts.expiringSoon;
              if (tab.id === 'expired') count = counts.expired;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-xs border border-brand-primary'
                      : 'bg-brand-surface hover:bg-brand-primary/10 text-slate-700 hover:text-brand-primary border border-brand-border'
                  }`}
                >
                  {tab.id === 'active' && <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-primary'}`} />}
                  {tab.id === 'expiring_soon' && <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-600'}`} />}
                  {tab.id === 'expired' && <AlertTriangle className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-rose-600'}`} />}
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-tabular ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort & View Mode Switcher */}
          <div className="flex items-center gap-2 justify-end shrink-0">
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
                className="bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-medium rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none shrink-0"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table Ledger"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-brand-surface text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid Cards"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-brand-surface text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Quick-Pills (Single compact row) */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            CATEGORY:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-xs border border-brand-primary'
                      : 'bg-brand-surface hover:bg-brand-primary/10 text-slate-700 hover:text-brand-primary border border-brand-border'
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
              onClick={handleClearFilters}
              className="text-xs text-brand-navy hover:text-brand-primary hover:underline font-medium cursor-pointer shrink-0 ml-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Content: Immediate, High-Density Visibility */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No warranties match your filter criteria' : 'No product warranties logged'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search query, status tab, or category pill.'
              : 'Add your receipts with warranty durations to automatically track expiration lifecycles.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Add Receipt'}
          onAction={hasActiveFilters ? handleClearFilters : () => navigate('/receipts/new')}
        />
      ) : viewMode === 'table' ? (
        /* TABLE LEDGER VIEW (Maximum Immediate Visibility of Content) */
        <div className="bg-brand-surface border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden font-sans">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-12 sm:col-span-5 md:col-span-4">PRODUCT & ASSET</div>
            <div className="hidden sm:block sm:col-span-2 text-left">CATEGORY</div>
            <div className="hidden md:block md:col-span-3 text-left">MERCHANT & PURCHASE</div>
            <div className="col-span-7 sm:col-span-3 md:col-span-2 text-right sm:text-center">WARRANTY STATUS</div>
            <div className="col-span-5 sm:col-span-2 md:col-span-1 text-right">VALUE</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {filteredItems.map(({ id, product, receipt, metrics }) => {
              const currency = receipt?.currency || 'INR';
              const price = product.lineTotal || product.unitPrice;
              const monogram = getBrandMonogram(product.productName, product.brand);
              const destinationUrl = receipt?._id ? `/receipts/${receipt._id}` : `/products/${product._id}`;

              return (
                <div
                  key={id}
                  onClick={() => navigate(destinationUrl)}
                  className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-brand-border/20 transition-colors cursor-pointer group"
                >
                  {/* Column 1: Monogram + Product Name & Brand */}
                  <div className="col-span-12 sm:col-span-5 md:col-span-4 flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-canvas border border-brand-border text-brand-navy font-semibold text-xs flex items-center justify-center shrink-0 uppercase tracking-tight group-hover:bg-brand-border/50 group-hover:text-brand-navy transition-colors">
                      {monogram}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-sm font-medium text-brand-navy group-hover:text-brand-primary transition-colors truncate"
                        title={product.productName}
                      >
                        {product.productName || 'Untitled Asset'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        {product.brand && (
                          <span className="font-normal text-slate-600">{product.brand}</span>
                        )}
                        {product.brand && <span>•</span>}
                        <span className="font-tabular">Exp: {formatDate(product.warrantyExpiryDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Category Pill */}
                  <div className="hidden sm:block sm:col-span-2 text-left">
                    <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-full truncate max-w-full">
                      {product.category || receipt?.category || 'General'}
                    </span>
                  </div>

                  {/* Column 3: Store & Purchase Date */}
                  <div className="hidden md:block md:col-span-3 text-left min-w-0">
                    <span className="text-xs font-medium text-slate-800 block truncate" title={receipt?.storeName}>
                      {receipt?.storeName || 'Direct Asset Entry'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-tabular block mt-0.5">
                      {formatDate(receipt?.purchaseDate || product.purchaseDate)}
                    </span>
                  </div>

                  {/* Column 4: Warranty Status Badge */}
                  <div className="col-span-7 sm:col-span-3 md:col-span-2 text-left sm:text-center">
                    {metrics.isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-canvas text-brand-navy/70 border border-brand-border font-tabular">
                        <AlertTriangle className="w-3.5 h-3.5 text-brand-navy/60 shrink-0" />
                        <span>{metrics.badgeText}</span>
                      </span>
                    ) : metrics.isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-border text-brand-navy border border-brand-primary/50 font-tabular">
                        <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span>{metrics.badgeText}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-border/60 text-brand-navy border border-brand-border font-tabular">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                        <span>{metrics.badgeText}</span>
                      </span>
                    )}
                  </div>

                  {/* Column 5: Value & Action */}
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
        /* COMPACT CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {filteredItems.map(({ id, product, receipt, metrics }) => {
            const currency = receipt?.currency || 'INR';
            const price = product.lineTotal || product.unitPrice;
            const monogram = getBrandMonogram(product.productName, product.brand);
            const destinationUrl = receipt?._id ? `/receipts/${receipt._id}` : `/products/${product._id}`;

            return (
              <div
                key={id}
                onClick={() => navigate(destinationUrl)}
                className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top Bar: Monogram + Category + Status Pill */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/25 text-brand-primary font-bold text-xs flex items-center justify-center uppercase tracking-tight group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        {monogram}
                      </div>
                      <span className="text-[11px] font-medium text-brand-primary bg-brand-primary/10 border border-brand-primary/25 px-2 py-0.5 rounded-full">
                        {product.category || receipt?.category || 'General'}
                      </span>
                    </div>

                    {metrics.isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-tabular">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{metrics.badgeText}</span>
                      </span>
                    ) : metrics.isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full font-tabular">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{metrics.badgeText}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/30 px-2.5 py-0.5 rounded-full font-tabular">
                        <ShieldCheck className="w-3 h-3 text-brand-primary" />
                        <span>{metrics.badgeText}</span>
                      </span>
                    )}
                  </div>

                  {/* Merchant & Title */}
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block truncate">
                    {receipt?.storeName?.trim() || 'Direct Asset Entry'}
                  </span>
                  <h3
                    className="text-sm font-medium text-brand-navy group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug mt-0.5"
                    title={product.productName}
                  >
                    {product.productName || 'Untitled Asset'}
                  </h3>
                  {product.brand && (
                    <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                      Brand: {product.brand}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Expiry Date + Price */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Expires</span>
                    <span className={`font-medium font-tabular ${
                      metrics.isExpired ? 'text-brand-navy/70' : metrics.isExpiringSoon ? 'text-brand-primary font-bold' : 'text-slate-900'
                    }`}>
                      {formatDate(product.warrantyExpiryDate)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Value</span>
                    <span className="text-sm font-semibold text-slate-900 font-tabular">
                      {price != null ? formatCurrency(price, currency) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WarrantyTracker;
