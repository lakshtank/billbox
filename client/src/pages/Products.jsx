import * as React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from '@/lib/toast';
import {
  Package,
  Plus,
  Search,
  X,
  Filter,
  LayoutList,
  LayoutGrid,
  MoreHorizontal,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useProductsQuery } from '../queries/useProductsQuery';
import { useCreateProduct, useDeleteProduct } from '../queries/useProductMutations';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/data/StatusBadge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import RouteSkeleton from '@/components/common/RouteSkeleton';
import PageContentTransition from '@/components/common/PageContentTransition';
import { LayoutGroup } from 'motion/react';
import * as m from 'motion/react-m';
import { variants, spring } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatCurrency } from '../utils/formatters';
import { usePersistentViewMode } from '../hooks/usePersistentViewMode';
import { DEFAULT_CATEGORIES } from '../constants/category.constants';

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

export function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: fetchedCategories = [] } = useCategoriesQuery();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  const categoryOptions = useMemo(() => {
    const list = Array.isArray(fetchedCategories)
      ? fetchedCategories
      : Array.isArray(fetchedCategories?.categories)
      ? fetchedCategories.categories
      : [];
    const extra = list.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...extra]));
  }, [fetchedCategories]);

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
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [newProduct, setNewProduct] = useState({
    productName: '',
    brand: '',
    category: 'Electronics',
    quantity: 1,
    unitPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyPeriodMonths: 12,
  });

  const activeSort = SORT_OPTIONS.find((s) => s.id === sortParam) || SORT_OPTIONS[0];

  const queryFilters = useMemo(
    () => ({
      page: pageParam,
      limit: 20,
      search: searchParam,
      category: categoryParam,
      warrantyStatus: warrantyStatusParam,
      sortBy: activeSort.sortBy,
      sortOrder: activeSort.sortOrder,
    }),
    [pageParam, searchParam, categoryParam, warrantyStatusParam, activeSort]
  );

  const { data, isLoading, isError } = useProductsQuery(queryFilters);

  const products = useMemo(() => {
    if (Array.isArray(data)) return data.filter(Boolean);
    if (Array.isArray(data?.products)) return data.products.filter(Boolean);
    return [];
  }, [data]);
  const total = data?.total ?? products.length;
  const totalPages =
    data?.totalPages || Math.max(1, Math.ceil(total / (queryFilters.limit || 20)));

  // Sync search input with debounce into URL
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchParam) {
        const next = new URLSearchParams(searchParams);
        if (searchTerm.trim()) {
          next.set('search', searchTerm.trim());
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        setSearchParams(next);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParam, searchParams, setSearchParams]);

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
    const nextParams = new URLSearchParams(searchParams);
    if (next.length > 0) {
      nextParams.set('category', next.join(','));
    } else {
      nextParams.delete('category');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleCategoryChange = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') {
      next.delete('category');
    } else {
      next.set('category', cat);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleWarrantyStatusChange = (status) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'All') {
      next.delete('warrantyStatus');
    } else {
      next.set('warrantyStatus', status);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSortChange = (sortId) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', sortId);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    const priceNum = newProduct.unitPrice ? parseFloat(newProduct.unitPrice) : null;
    const monthsNum = newProduct.warrantyPeriodMonths
      ? parseInt(newProduct.warrantyPeriodMonths, 10)
      : null;
    const purchaseDate = newProduct.purchaseDate
      ? new Date(newProduct.purchaseDate)
      : new Date();

    let expiryDate = null;
    let warrantyStatus = 'none';

    if (monthsNum && monthsNum > 0) {
      const d = new Date(purchaseDate);
      d.setMonth(d.getMonth() + monthsNum);
      expiryDate = d;
      const now = new Date();
      warrantyStatus = expiryDate < now ? 'expired' : 'active';
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
        warrantyStatus,
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
            purchaseDate: new Date().toISOString().split('T')[0],
            warrantyPeriodMonths: 12,
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

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('Product deleted.');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Failed to delete product.');
        setDeleteTarget(null);
      },
    });
  };

  const hasAnimatedStagger = React.useRef(false);
  const shouldStagger = !hasAnimatedStagger.current && products.length > 0;
  React.useEffect(() => {
    if (products.length > 0) {
      hasAnimatedStagger.current = true;
    }
  }, [products.length]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedCategories.length > 0 || warrantyStatusParam !== 'All'
  );

  if (isError) {
    return (
      <div className="py-8">
        <EmptyState
          title="Could not load products"
          description="Something went wrong fetching your products. Please try refreshing."
        />
      </div>
    );
  }

  return (
    <PageContentTransition
      isLoading={isLoading && !data}
      skeleton={<RouteSkeleton section="products" />}
      className="space-y-4 w-full font-sans"
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <PageHeader
          title="Products"
          description="Registered merchandise, warranty lifecycles, and purchase values."
          className="p-0 border-0"
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 cursor-pointer text-xs h-8"
          >
            <Plus className="size-3.5" />
            <span>Add product</span>
          </Button>
        </div>
      </div>

      {/* 2. Search, Filter & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64 md:w-72 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, brand, merchant..."
            className="w-full text-xs h-9 pl-8 pr-7 bg-surface border border-line rounded-[8px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg text-xs p-1 cursor-pointer"
              title="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters & View Switcher with smooth mobile horizontal scroll */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-nowrap justify-start sm:justify-end shrink-0">
          {/* Multi-Category Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={`h-9 text-xs gap-1.5 shrink-0 ${
                  selectedCategories.length > 0 ? 'border-accent text-accent bg-accent-tint/40 font-medium' : ''
                }`}
              >
                <Filter className="size-3.5" />
                <span>Category</span>
                {selectedCategories.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-accent text-on-accent px-1.5 py-0.2 text-[10px] font-semibold tnum">
                    {selectedCategories.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="px-2 py-1 text-xs font-semibold text-fg-3 border-b border-line mb-1 flex items-center justify-between">
                <span>Filter by Category</span>
                {selectedCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('All')}
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-line-subtle text-xs">
                {categoryOptions.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-hover rounded cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleCategoryToggle(cat)}
                      />
                      <span className="text-sm text-fg capitalize truncate">{cat}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Warranty Status Filter */}
          <select
            value={warrantyStatusParam}
            onChange={(e) => handleWarrantyStatusChange(e.target.value)}
            className="w-auto text-xs h-9 px-3 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent cursor-pointer shrink-0"
          >
            {WARRANTY_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortParam}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-auto text-xs h-9 px-3 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent cursor-pointer shrink-0"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle with Slider Animation */}
          <div className="relative inline-flex items-center h-9 p-0.5 bg-subtle border border-line rounded-[8px] gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`relative z-10 h-7 px-2 rounded-[6px] transition-colors cursor-pointer flex items-center justify-center ${
                viewMode === 'table' ? 'text-fg font-medium' : 'text-fg-3 hover:text-fg'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              {viewMode === 'table' && (
                <m.div
                  layoutId="products-view-mode-pill"
                  className="absolute inset-0 rounded-[6px] bg-surface shadow-2xs border border-line-subtle"
                  transition={spring.snappy}
                />
              )}
              <LayoutList className="relative z-10 size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`relative z-10 h-7 px-2 rounded-[6px] transition-colors cursor-pointer flex items-center justify-center ${
                viewMode === 'grid' ? 'text-fg font-medium' : 'text-fg-3 hover:text-fg'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              {viewMode === 'grid' && (
                <m.div
                  layoutId="products-view-mode-pill"
                  className="absolute inset-0 rounded-[6px] bg-surface shadow-2xs border border-line-subtle"
                  transition={spring.snappy}
                />
              )}
              <LayoutGrid className="relative z-10 size-3.5" />
            </button>
          </div>

          {/* Inline Clear filters button (Zero layout shift: list below never moves downwards) */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 text-xs text-accent hover:underline cursor-pointer font-medium whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* 3. Product Listing (Table or Grid) */}
      {products.length === 0 ? (
        <div className="p-8 rounded-[12px] border border-line bg-surface">
          <EmptyState
            title="No products found"
            description={
              hasActiveFilters
                ? 'No items matched your active filters. Try clearing your search.'
                : 'You have not added any products yet. Upload a receipt or create one manually.'
            }
            actionLabel={hasActiveFilters ? 'Clear filters' : 'Add product'}
            onAction={hasActiveFilters ? handleClearFilters : () => setIsAddModalOpen(true)}
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="w-full">
          {/* Mobile Native App Cards View (<768px) */}
          <div className="md:hidden space-y-3">
            {products.map((prod) => {
              if (!prod) return null;
              const receipt =
                prod.receiptId && typeof prod.receiptId === 'object' ? prod.receiptId : null;
              const merchantName = receipt?.storeName || 'Merchant';
              const statusKey =
                prod.warrantyStatus ||
                (prod.warrantyExpiryDate && new Date(prod.warrantyExpiryDate) > new Date()
                  ? 'active'
                  : 'none');

              return (
                <div
                  key={`mobile-prod-${prod._id}`}
                  onClick={() => navigate(`/products/${prod._id}`)}
                  className="rounded-[12px] border border-line bg-surface p-4 shadow-2xs hover:border-line-strong transition-all cursor-pointer text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-10 rounded-[10px] bg-subtle border border-line flex items-center justify-center shrink-0 text-fg-3">
                        <Package className="size-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-fg truncate">
                          {prod.productName}
                        </h3>
                        <p className="text-xs text-fg-3 truncate">
                          {prod.brand ? `${prod.brand} • ` : ''}{merchantName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-fg tnum">
                        {formatCurrency(prod.unitPrice || 0, prod.currency || 'INR')}
                      </div>
                      <span className="text-[11px] text-fg-3 capitalize">
                        {prod.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-line-subtle flex items-center justify-between text-xs text-fg-3">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={statusKey} />
                    </div>
                    <span>
                      {prod.warrantyExpiryDate ? `Exp: ${formatDate(prod.warrantyExpiryDate)}` : 'No warranty'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>=768px) */}
          <div className="hidden md:block w-full overflow-hidden rounded-[12px] border border-line bg-surface shadow-2xs">
            <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar">
              <LayoutGroup id="billbox-products-rows">
                <table className="w-full text-left border-collapse table-fixed text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-subtle/50 border-b border-line text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-[260px]">Product</th>
                    <th className="py-2.5 px-3 w-[120px]">Brand</th>
                    <th className="py-2.5 px-3 w-[120px]">Category</th>
                    <th className="py-2.5 px-3 w-[150px]">Merchant</th>
                    <th className="py-2.5 px-3 w-[110px]">Purchased</th>
                    <th className="py-2.5 px-3 w-[120px]">Warranty</th>
                    <th className="py-2.5 px-3 w-[110px]">Expires</th>
                    <th className="py-2.5 px-3 w-[110px] text-right">Value</th>
                    <th className="py-2.5 px-2 w-[40px] text-center"></th>
                  </tr>
                </thead>
                <m.tbody
                  variants={variants.stagger(0.025)}
                  initial={shouldStagger ? 'hidden' : false}
                  animate="show"
                  className="divide-y divide-line-subtle"
                >
                  {products.map((prod, index) => {
                    if (!prod) return null;
                    const receipt =
                      prod.receiptId && typeof prod.receiptId === 'object' ? prod.receiptId : null;
                    const merchantName = receipt?.storeName || '—';
                    const purchaseDate = prod.purchaseDate || receipt?.purchaseDate;
                    const receiptId =
                      receipt?._id || (typeof prod.receiptId === 'string' ? prod.receiptId : null);
                    const statusKey =
                      prod.warrantyStatus === 'expiring_soon' ? 'expiring' : prod.warrantyStatus || 'none';
                    const isStaggered = index < 12;
                    const enableLayout = products.length <= 50;

                    return (
                      <m.tr
                        key={prod._id}
                        layout={enableLayout ? 'position' : false}
                        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                        variants={variants.fade}
                        initial={shouldStagger && isStaggered ? 'hidden' : false}
                        animate="show"
                        onClick={() => navigate(`/products/${prod._id}`)}
                        className="hover:bg-subtle/40 transition-colors cursor-pointer group"
                      >
                      {/* Product */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-[8px] bg-subtle border border-line-subtle flex items-center justify-center shrink-0 text-fg-3 group-hover:text-accent group-hover:border-accent-line transition-colors">
                            <Package className="size-4" />
                          </div>
                          <div className="font-semibold text-fg group-hover:text-accent transition-colors truncate">
                            {prod.productName}
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-3 text-fg-2 truncate align-middle">
                        {prod.brand || '—'}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-fg-2 truncate align-middle">
                        {prod.category || 'General'}
                      </td>

                      {/* Merchant */}
                      <td className="py-3 px-3 text-fg-2 truncate align-middle">
                        {merchantName}
                      </td>

                      {/* Purchased */}
                      <td className="py-3 px-3 text-fg-3 font-mono tnum align-middle">
                        {purchaseDate ? formatDate(purchaseDate) : '—'}
                      </td>

                      {/* Warranty Status */}
                      <td className="py-3 px-3 align-middle">
                        <StatusBadge status={statusKey} />
                      </td>

                      {/* Expires */}
                      <td className="py-3 px-3 text-fg-2 font-mono tnum align-middle">
                        {prod.warrantyExpiryDate ? formatDate(prod.warrantyExpiryDate) : '—'}
                      </td>

                      {/* Value */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-fg tnum align-middle whitespace-nowrap">
                        {prod.unitPrice != null
                          ? formatCurrency(prod.unitPrice, receipt?.currency)
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-2 text-center align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0 text-fg-3 hover:text-fg cursor-pointer"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => navigate(`/products/${prod._id}`)}
                              className="cursor-pointer"
                            >
                              View details
                            </DropdownMenuItem>
                            {receiptId && (
                              <DropdownMenuItem
                                onClick={() => navigate(`/receipts/${receiptId}`)}
                                className="cursor-pointer"
                              >
                                View receipt
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(prod)}
                              className="text-bad-fg hover:bg-bad-bg/20 cursor-pointer"
                            >
                              Delete product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                        </m.tr>
                      );
                    })}
                </m.tbody>
              </table>
            </LayoutGroup>
          </div>
        </div>
      </div>
      ) : (
        /* Grid View with Step 6 Stagger & Card Micro-interactions */
        <LayoutGroup id="billbox-products-grid">
          <m.div
            key="products-grid-container"
            variants={variants.stagger(0.02)}
            initial={shouldStagger ? 'hidden' : false}
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {products.map((prod, index) => {
              if (!prod) return null;
              const receipt =
                prod.receiptId && typeof prod.receiptId === 'object' ? prod.receiptId : null;
              const statusKey =
                prod.warrantyStatus === 'expiring_soon' ? 'expiring' : prod.warrantyStatus || 'none';
              const merchantName = receipt?.storeName || '—';
              const isStaggered = index < 12;

              return (
                <m.div
                  key={prod._id}
                  layout={products.length <= 50 ? 'position' : false}
                  variants={variants.fadeUp}
                  initial={shouldStagger && isStaggered ? 'hidden' : false}
                  animate="show"
                  whileHover={{ y: -2, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  onClick={() => navigate(`/products/${prod._id}`)}
                  className="p-4 rounded-[12px] border border-line bg-surface hover:border-line-strong transition-shadow cursor-pointer space-y-3 shadow-2xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="size-8 rounded-[8px] bg-subtle border border-line-subtle flex items-center justify-center text-fg-3 group-hover:text-accent group-hover:border-accent-line transition-colors shrink-0">
                        <Package className="size-4" />
                      </div>
                      <StatusBadge status={statusKey} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-fg group-hover:text-accent transition-colors line-clamp-1">
                        {prod.productName}
                      </h3>
                      <p className="text-xs text-fg-3 mt-0.5 truncate">
                        {prod.brand ? `${prod.brand} · ` : ''}{prod.category || 'General'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line-subtle flex items-center justify-between text-xs">
                    <span className="text-fg-3 truncate max-w-[120px]">{merchantName}</span>
                    <span className="font-mono font-semibold text-fg tnum">
                      {prod.unitPrice != null
                        ? formatCurrency(prod.unitPrice, receipt?.currency)
                        : '—'}
                    </span>
                  </div>
                </m.div>
              );
            })}
          </m.div>
        </LayoutGroup>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-fg-3">
          <span>
            Page {pageParam} of {totalPages} ({total} items)
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageParam <= 1}
              onClick={() => handlePageChange(pageParam - 1)}
              className="h-7 text-xs cursor-pointer"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageParam >= totalPages}
              onClick={() => handlePageChange(pageParam + 1)}
              className="h-7 text-xs cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* 5. Add Product Modal */}
      <ResponsiveModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Add product"
        description="Register merchandise directly to track coverage and purchase history."
        size="md"
        className="p-6"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-prod-name" className="text-xs">
              Product name *
            </Label>
            <Input
              id="add-prod-name"
              value={newProduct.productName}
              onChange={(e) =>
                setNewProduct({ ...newProduct, productName: e.target.value })
              }
              placeholder="e.g. MacBook Pro 16, Sony WH-1000XM5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-prod-brand" className="text-xs">
                Brand (optional)
              </Label>
              <Input
                id="add-prod-brand"
                value={newProduct.brand}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, brand: e.target.value })
                }
                placeholder="e.g. Apple, Sony"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-prod-cat" className="text-xs">
                Category
              </Label>
              <select
                id="add-prod-cat"
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
                className="w-full text-xs h-9 px-2.5 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-prod-price" className="text-xs">
                Purchase price (₹)
              </Label>
              <Input
                id="add-prod-price"
                type="number"
                step="0.01"
                value={newProduct.unitPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, unitPrice: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-prod-date" className="text-xs">
                Purchase date
              </Label>
              <Input
                id="add-prod-date"
                type="date"
                value={newProduct.purchaseDate}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, purchaseDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-prod-warranty" className="text-xs">
              Warranty duration (months)
            </Label>
            <Input
              id="add-prod-warranty"
              type="number"
              min="0"
              value={newProduct.warrantyPeriodMonths}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  warrantyPeriodMonths: e.target.value,
                })
              }
              placeholder="12"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Add product'}
            </Button>
          </DialogFooter>
        </form>
      </ResponsiveModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete product"
        message={`Are you sure you want to remove "${deleteTarget?.productName}"? This action cannot be undone.`}
        confirmText="Delete product"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </PageContentTransition>
  );
}

export default Products;
