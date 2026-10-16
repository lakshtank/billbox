import * as React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Search,
  X,
  Filter,
  Package,
  Bell,
  BellOff,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import toast from '@/lib/toast';
import { useProductsQuery } from '../queries/useProductsQuery';
import { useUpdateProduct } from '../queries/useProductMutations';
import RouteSkeleton from '@/components/common/RouteSkeleton';
import PageContentTransition from '@/components/common/PageContentTransition';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import * as m from 'motion/react-m';
import { LayoutGroup, AnimatePresence, useInView } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useMotionTier } from '@/hooks/useMotionTier';
import { spring, variants } from '@/lib/motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../constants/category.constants';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { id: 'expiring_soon', label: 'Expiring', icon: Clock },
  { id: 'all', label: 'All', icon: Package },
  { id: 'active', label: 'Covered', icon: ShieldCheck },
  { id: 'expired', label: 'Expired', icon: AlertTriangle },
  { id: 'none', label: 'No cover', icon: FileText },
];

const calculateWarrantyMetrics = (product) => {
  const expiryDate = product.warrantyExpiryDate;
  const purchaseDate =
    product.purchaseDate || product.receiptId?.purchaseDate || product.createdAt;

  if (!expiryDate) {
    return {
      status: 'none',
      daysLeft: null,
      daysText: '—',
      elapsedPercent: 0,
      isExpired: false,
      isExpiringSoon: false,
      statusColor: 'text-fg-3',
      railClass: '',
      badgeBg: 'bg-subtle text-fg-3 border-line-subtle',
      badgeLabel: 'No cover',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const purch = purchaseDate
    ? new Date(purchaseDate)
    : new Date(exp.getTime() - 365 * 24 * 60 * 60 * 1000);
  purch.setHours(0, 0, 0, 0);

  const totalDuration = Math.max(1, exp.getTime() - purch.getTime());
  const elapsedDuration = Math.max(0, today.getTime() - purch.getTime());
  const elapsedPercent = Math.min(
    100,
    Math.max(0, Math.round((elapsedDuration / totalDuration) * 100))
  );

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      daysLeft: diffDays,
      daysText: `Expired ${Math.abs(diffDays)}d ago`,
      elapsedPercent: 100,
      isExpired: true,
      isExpiringSoon: false,
      statusColor: 'text-bad-fg',
      railClass: 'border-l-3 border-bad-line',
      badgeBg: 'bg-bad-bg text-bad-fg border-bad-line',
      badgeLabel: 'Expired',
    };
  }

  if (diffDays <= 30) {
    return {
      status: 'expiring_soon',
      daysLeft: diffDays,
      daysText: diffDays === 0 ? 'Expires today' : `${diffDays}d left`,
      elapsedPercent,
      isExpired: false,
      isExpiringSoon: true,
      statusColor: 'text-warn-fg',
      railClass: 'border-l-3 border-warn-line',
      badgeBg: 'bg-warn-bg text-warn-fg border-warn-line',
      badgeLabel: 'Expiring soon',
    };
  }

  return {
    status: 'active',
    daysLeft: diffDays,
    daysText:
      diffDays > 365
        ? `${(diffDays / 365).toFixed(1)}y left`
        : `${diffDays}d left`,
    elapsedPercent,
    isExpired: false,
    isExpiringSoon: false,
    statusColor: 'text-ok-fg',
    railClass: '',
    badgeBg: 'bg-ok-bg text-ok-fg border-ok-line',
    badgeLabel: 'Covered',
  };
};

function DaysLeftCell({ metrics }) {
  const tier = useMotionTier();
  const { daysLeft, status, statusColor, daysText } = metrics;
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '60px' });

  const targetDays = daysLeft != null ? Math.abs(daysLeft) : null;
  const initialRoll =
    targetDays != null && targetDays > 0
      ? Math.ceil(targetDays * 1.25) + 3
      : targetDays;
  const [animatedDays, setAnimatedDays] = useState(
    tier === 'none' ? targetDays : initialRoll
  );

  React.useEffect(() => {
    if (tier === 'none' || targetDays == null) {
      setAnimatedDays(targetDays);
      return;
    }
    if (isInView) {
      setAnimatedDays(targetDays);
    }
  }, [isInView, targetDays, tier]);

  if (status === 'none' || daysLeft == null) {
    return <span className="font-mono text-xs text-fg-3">—</span>;
  }

  if (tier === 'none') {
    return (
      <span className={`font-mono font-bold text-xs tnum ${statusColor}`}>
        {daysText}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-0.5 font-mono font-bold text-xs tnum ${statusColor}`}
      aria-label={daysText}
    >
      {daysLeft < 0 ? (
        <>
          <span>Expired </span>
          <NumberFlow
            value={animatedDays ?? targetDays}
            transformTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
            spinTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
          />
          <span>d ago</span>
        </>
      ) : daysLeft === 0 ? (
        <span>Expires today</span>
      ) : (
        <>
          <NumberFlow
            value={animatedDays ?? targetDays}
            transformTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
            spinTiming={{ duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
          />
          <span>d left</span>
        </>
      )}
    </span>
  );
}

function WarrantyCoverBar({ metrics }) {
  const tier = useMotionTier();
  if (metrics.status === 'none') {
    return <span className="text-xs text-fg-3">—</span>;
  }

  const fraction = Math.min(1, Math.max(0, metrics.elapsedPercent / 100));
  const barColor = metrics.isExpired
    ? 'bg-bad'
    : metrics.isExpiringSoon
    ? 'bg-warn'
    : 'bg-accent';

  return (
    <div className="space-y-1">
      <div className="w-24 h-1 rounded-full bg-subtle overflow-hidden">
        <m.div
          className={`h-full rounded-full ${barColor}`}
          style={{ transformOrigin: 'left', width: '100%', willChange: 'transform' }}
          initial={tier !== 'none' ? { scaleX: 0 } : { scaleX: fraction }}
          whileInView={tier !== 'none' ? { scaleX: fraction } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[10px] text-fg-3 font-mono tnum block">
        {metrics.elapsedPercent}% elapsed
      </span>
    </div>
  );
}

function WarrantyRowReminderSwitch({ product, onToggle }) {
  const [checked, setChecked] = useState(Boolean(product.reminderEnabled));
  const [shaking, setShaking] = useState(false);

  React.useEffect(() => {
    setChecked(Boolean(product.reminderEnabled));
  }, [product.reminderEnabled]);

  const handleChange = async (next) => {
    const previous = checked;
    setChecked(next);
    try {
      await onToggle(product._id, next);
    } catch {
      setChecked(previous);
      setShaking(true);
    }
  };

  return (
    <Switch
      checked={checked}
      shake={shaking}
      onAnimationEnd={() => setShaking(false)}
      onCheckedChange={handleChange}
      aria-label={`Toggle reminder for ${product.productName}`}
    />
  );
}

export function WarrantyTracker() {
  const navigate = useNavigate();
  const tier = useMotionTier();
  const [activeTab, setActiveTab] = useState('expiring_soon');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Query all products with high limit to compute live tab counts and metrics
  const { data, isLoading, refetch } = useProductsQuery({ limit: 5000 });
  const updateProductMutation = useUpdateProduct();

  const allProducts = useMemo(() => {
    if (Array.isArray(data)) return data.filter(Boolean);
    if (Array.isArray(data?.products)) return data.products.filter(Boolean);
    return [];
  }, [data]);

  // Compute metrics and live summary counts
  const { enrichedProducts, counts } = useMemo(() => {
    let covered = 0;
    let expiring = 0;
    let expired = 0;
    let none = 0;

    const list = allProducts.map((p) => {
      const metrics = calculateWarrantyMetrics(p);
      if (metrics.status === 'active') covered++;
      else if (metrics.status === 'expiring_soon') expiring++;
      else if (metrics.status === 'expired') expired++;
      else none++;

      return {
        ...p,
        metrics,
      };
    });

    return {
      enrichedProducts: list,
      counts: {
        all: list.length,
        active: covered,
        expiring_soon: expiring,
        expired,
        none,
      },
    };
  }, [allProducts]);

  // Filter products by activeTab, search query, and category
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return enrichedProducts.filter((item) => {
      // 1. Tab filter
      if (activeTab !== 'all') {
        if (item.metrics.status !== activeTab) return false;
      }

      // 2. Category filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(item.category)) return false;
      }

      // 3. Search query
      if (q) {
        const prodName = (item.productName || '').toLowerCase();
        const brand = (item.brand || '').toLowerCase();
        const storeName = (item.receiptId?.storeName || '').toLowerCase();
        if (!prodName.includes(q) && !brand.includes(q) && !storeName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedProducts, activeTab, selectedCategories, searchTerm]);

  const handleCategoryToggle = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Toggle reminder for individual product with promise return
  const handleToggleReminder = (productId, enabled) => {
    return updateProductMutation
      .mutateAsync({ id: productId, updates: { reminderEnabled: enabled } })
      .then(() => {
        toast.success(`Warranty reminder ${enabled ? 'enabled' : 'disabled'}.`);
      })
      .catch((err) => {
        toast.error('Failed to update reminder status.');
        throw err;
      });
  };

  // Row selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  const handleToggleSelectRow = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const handleBulkReminders = (enabled) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    Promise.all(
      ids.map((id) =>
        updateProductMutation.mutateAsync({ id, updates: { reminderEnabled: enabled } })
      )
    )
      .then(() => {
        toast.success(`Updated reminders for ${ids.length} products.`);
        setSelectedIds(new Set());
      })
      .catch(() => {
        toast.error('Failed to update some products.');
      });
  };

  const hasAnimatedStagger = React.useRef(false);
  const shouldStagger = !hasAnimatedStagger.current && filteredProducts.length > 0;
  React.useEffect(() => {
    if (filteredProducts.length > 0) {
      hasAnimatedStagger.current = true;
    }
  }, [filteredProducts.length]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedCategories.length > 0 || activeTab !== 'expiring_soon'
  );

  return (
    <PageContentTransition
      isLoading={isLoading && allProducts.length === 0}
      skeleton={<RouteSkeleton section="warranties" />}
      className="space-y-4 w-full font-sans"
    >
      {/* 1. Header Toolbar with Inline Stat Shortcuts */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <PageHeader
            title="Warranties"
            description="Track expiration dates and coverage timelines across your assets."
            className="p-0 border-0"
          />
        </div>

        {/* Right-side summary strip: 4 clickable tab shortcuts (desktop only to prevent clutter on mobile) */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-ok-bg text-ok-fg border-ok-line'
                : 'bg-surface text-fg-2 border-line hover:border-ok-line/50'
            }`}
          >
            <ShieldCheck className="size-3.5 text-ok-fg" />
            <span>Covered</span>
            <span className="font-mono font-semibold tnum">
              ({tier !== 'none' ? <NumberFlow value={counts.active} /> : counts.active})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expiring_soon')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expiring_soon'
                ? 'bg-warn-bg text-warn-fg border-warn-line'
                : 'bg-surface text-fg-2 border-line hover:border-warn-line/50'
            }`}
          >
            <Clock className="size-3.5 text-warn-fg" />
            <span>Expiring</span>
            <span className="font-mono font-semibold tnum">
              ({tier !== 'none' ? <NumberFlow value={counts.expiring_soon} /> : counts.expiring_soon})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expired'
                ? 'bg-bad-bg text-bad-fg border-bad-line'
                : 'bg-surface text-fg-2 border-line hover:border-bad-line/50'
            }`}
          >
            <AlertTriangle className="size-3.5 text-bad-fg" />
            <span>Expired</span>
            <span className="font-mono font-semibold tnum">
              ({tier !== 'none' ? <NumberFlow value={counts.expired} /> : counts.expired})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('none')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'none'
                ? 'bg-subtle text-fg border-line-strong'
                : 'bg-surface text-fg-3 border-line hover:border-line-strong'
            }`}
          >
            <FileText className="size-3.5 text-fg-3" />
            <span>No cover</span>
            <span className="font-mono font-semibold tnum">
              ({tier !== 'none' ? <NumberFlow value={counts.none} /> : counts.none})
            </span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & Quick Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Segmented Quick Tabs with layoutId gliding active indicator & smooth touch scroll */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex items-center p-1 bg-subtle rounded-[10px] border border-line-subtle gap-1 text-xs shrink-0 min-w-max">
            {STATUS_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              const tabCount = counts[tab.id] ?? counts.all;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] font-medium transition-colors cursor-pointer whitespace-nowrap z-10 ${
                    isSelected
                      ? 'text-fg font-semibold'
                      : 'text-fg-3 hover:text-fg'
                  }`}
                >
                  {isSelected && (
                    <m.div
                      layoutId="warranty-tab"
                      className="absolute inset-0 bg-surface rounded-[7px] border border-line-subtle shadow-xs z-[-1]"
                      transition={spring.snappy}
                    >
                      <div className="absolute bottom-0 inset-x-2.5 h-[2px] bg-accent rounded-full" />
                    </m.div>
                  )}
                  <Icon className={`size-3.5 ${isSelected ? 'text-accent' : 'text-fg-3'}`} />
                  <span>{tab.label}</span>
                  <span className="font-mono text-[11px] tnum px-1.5 py-0.2 rounded-full bg-subtle/80 text-fg-3">
                    {tier !== 'none' ? (
                      <NumberFlow
                        value={tabCount}
                        transformTiming={{ duration: 300, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                        spinTiming={{ duration: 300, easing: 'cubic-bezier(.16, 1, .3, 1)' }}
                      />
                    ) : (
                      tabCount
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search warranties..."
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
                    onClick={() => setSelectedCategories([])}
                    className="text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-line-subtle text-xs">
                {DEFAULT_CATEGORIES.map((cat) => {
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

          {/* Inline Clear filters button (Zero layout shift: list below never moves downwards) */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategories([]);
                setActiveTab('expiring_soon');
              }}
              className="h-9 text-xs text-accent hover:underline cursor-pointer font-medium whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* 3. Floating Bulk Action Bar (fixed at bottom, zero vertical layout shift for table rows) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <m.div
            initial={{ y: 24, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 24, opacity: 0, x: '-50%' }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed bottom-6 left-1/2 z-50 flex h-11 items-center justify-between gap-4 rounded-[12px] border border-accent/40 bg-surface/95 backdrop-blur-md px-4 py-2 text-xs shadow-xl min-w-[340px] max-w-[90vw]"
          >
            <span className="font-semibold text-accent tnum">
              {selectedIds.size} {selectedIds.size === 1 ? 'product' : 'products'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkReminders(true)}
                className="h-7 text-xs gap-1 border-accent-line text-accent cursor-pointer"
              >
                <Bell className="size-3" />
                <span>Enable alerts</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkReminders(false)}
                className="h-7 text-xs gap-1 border-accent-line text-accent cursor-pointer"
              >
                <BellOff className="size-3" />
                <span>Disable alerts</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="h-7 text-xs text-fg-3 hover:text-fg cursor-pointer"
              >
                Clear
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* 4. Warranties Table with 140ms list crossfade on activeTab */}
      <PullToRefresh onRefresh={refetch}>
        <AnimatePresence mode="wait">
        <m.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
          className="w-full"
        >
          {filteredProducts.length === 0 ? (
            <div className="p-8 rounded-[12px] border border-line bg-surface">
              <EmptyState
                title="No warranties found"
                description={
                  searchTerm || selectedCategories.length > 0
                    ? 'Try clearing your filters or search keywords.'
                    : 'No registered products match this warranty lifecycle stage.'
                }
                actionLabel="Add receipt"
                onAction={() => navigate('/receipts/new')}
              />
            </div>
          ) : (
            <div className="w-full">
              {/* Mobile Native App Cards View (<768px) */}
              <div className="md:hidden space-y-3">
                {filteredProducts.map((product) => {
                  if (!product) return null;
                  const { metrics } = product;
                  const isChecked = selectedIds.has(product._id);
                  const receipt =
                    product.receiptId && typeof product.receiptId === 'object'
                      ? product.receiptId
                      : null;
                  const merchantName = receipt?.storeName || 'Merchant';

                  return (
                    <div
                      key={`mobile-warranty-${product._id}`}
                      onClick={() => navigate(`/products/${product._id}`)}
                      className={cn(
                        'relative rounded-[12px] border border-line bg-surface p-4 shadow-2xs hover:border-line-strong transition-all cursor-pointer select-none',
                        metrics.railClass
                      )}
                    >
                      {/* Top: Checkbox + Product Name + Status Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectRow(product._id, e);
                            }}
                            className="p-1 -ml-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggleSelectRow(product._id, e)}
                              className="rounded border-line size-4 cursor-pointer accent-accent"
                            />
                          </div>
                          <div className="size-9 rounded-lg bg-subtle border border-line-subtle flex items-center justify-center shrink-0 text-fg-3">
                            <Package className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-fg truncate">
                              {product.productName}
                            </h3>
                            <p className="text-xs text-fg-3 truncate">
                              {product.brand ? `${product.brand} • ` : ''}{merchantName}
                            </p>
                          </div>
                        </div>
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0', metrics.badgeBg)}>
                          {metrics.badgeLabel}
                        </span>
                      </div>

                      {/* Coverage Progress Bar */}
                      <div className="mt-3.5 pt-2.5 border-t border-line-subtle">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-fg-3">Coverage horizon</span>
                          <span className={cn('font-medium', metrics.statusColor)}>
                            {metrics.daysText}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-subtle overflow-hidden border border-line-subtle">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              metrics.status === 'expired'
                                ? 'bg-bad-line'
                                : metrics.status === 'expiring_soon'
                                ? 'bg-warn-solid'
                                : 'bg-ok-line'
                            )}
                            style={{ width: `${Math.min(100, Math.max(5, 100 - metrics.elapsedPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: Expiry Date + Reminder Switch */}
                      <div className="mt-3 flex items-center justify-between text-xs text-fg-3 pt-2 border-t border-line-subtle">
                        <span>
                          {product.warrantyExpiryDate ? `Expires: ${formatDate(product.warrantyExpiryDate)}` : 'No expiry date'}
                        </span>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px]">Reminder</span>
                          <WarrantyRowReminderSwitch
                            product={product}
                            onToggle={handleToggleReminder}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>=768px) */}
              <div className="hidden md:block w-full overflow-hidden rounded-[12px] border border-line bg-surface shadow-2xs">
                <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar">
                  <LayoutGroup id="billbox-warranty-rows">
                    <table className="w-full text-left border-collapse table-fixed text-xs min-w-[850px]">
                      <thead>
                        <tr className="bg-subtle/50 border-b border-line text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredProducts.length > 0 &&
                                selectedIds.size === filteredProducts.length
                              }
                              onChange={handleToggleSelectAll}
                              className="rounded border-line size-3.5 cursor-pointer accent-accent"
                            />
                          </th>
                          <th className="py-2.5 px-3 w-[260px]">Product</th>
                          <th className="py-2.5 px-3 w-[150px]">Merchant</th>
                          <th className="py-2.5 px-3 w-[110px]">Purchased</th>
                          <th className="py-2.5 px-3 w-[110px]">Expires</th>
                          <th className="py-2.5 px-3 w-[120px]">Days left</th>
                          <th className="py-2.5 px-3 w-[120px]">Coverage bar</th>
                          <th className="py-2.5 px-3 w-[80px] text-center">Reminder</th>
                          <th className="py-2.5 px-2 w-[40px] text-center"></th>
                        </tr>
                      </thead>
                    <m.tbody
                      variants={variants.stagger(0.015)}
                      initial={shouldStagger ? 'hidden' : false}
                      animate="show"
                      className="divide-y divide-line-subtle"
                    >
                      {filteredProducts.map((product, index) => {
                          if (!product) return null;
                          const { metrics } = product;
                          const isChecked = selectedIds.has(product._id);
                          const isStaggered = index < 12;
                          const enableLayout = filteredProducts.length <= 50;
                          const receipt =
                            product.receiptId && typeof product.receiptId === 'object'
                              ? product.receiptId
                              : null;
                          const merchantName = receipt?.storeName || 'Merchant';
                          const purchaseDate =
                            product.purchaseDate || receipt?.purchaseDate;
                          const receiptId =
                            receipt?._id ||
                            (typeof product.receiptId === 'string' ? product.receiptId : null);

                          return (
                            <m.tr
                              key={product._id}
                              layout={enableLayout ? 'position' : false}
                              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                              variants={variants.fade}
                              initial={shouldStagger && isStaggered ? 'hidden' : false}
                              animate="show"
                              onClick={() => navigate(`/products/${product._id}`)}
                              className={`hover:bg-subtle/40 transition-colors cursor-pointer group ${metrics.railClass}`}
                            >
                              {/* Checkbox */}
                              <td
                                className="py-3 px-3 text-center align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleToggleSelectRow(product._id, e)}
                                  className="rounded border-line size-3.5 cursor-pointer accent-accent"
                                />
                              </td>

                              {/* Product Name + Brand */}
                              <td className="py-3 px-3 align-middle">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="size-8 rounded-[8px] bg-subtle border border-line-subtle flex items-center justify-center shrink-0 text-fg-3 group-hover:text-accent group-hover:border-accent-line transition-colors">
                                    <Package className="size-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-fg group-hover:text-accent transition-colors truncate">
                                      {product.productName}
                                    </div>
                                    <div className="text-[11px] text-fg-3 truncate">
                                      {product.brand ? product.brand : product.category || 'General'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Merchant */}
                              <td className="py-3 px-3 text-fg-2 truncate align-middle">
                                {merchantName}
                              </td>

                              {/* Purchased */}
                              <td className="py-3 px-3 text-fg-3 font-mono tnum align-middle">
                                {purchaseDate ? formatDate(purchaseDate) : '—'}
                              </td>

                              {/* Expires */}
                              <td className="py-3 px-3 text-fg-2 font-mono tnum align-middle">
                                {product.warrantyExpiryDate
                                  ? formatDate(product.warrantyExpiryDate)
                                  : '—'}
                              </td>

                              {/* Days Left (NumberFlow countdown from rounded-up start) */}
                              <td className="py-3 px-3 align-middle">
                                <DaysLeftCell metrics={metrics} />
                              </td>

                              {/* Coverage Progress Bar (scaleX from 0 to fraction, 500ms ease.emph, whileInView once) */}
                              <td className="py-3 px-3 align-middle">
                                <WarrantyCoverBar metrics={metrics} />
                              </td>

                              {/* Reminder Switch (optimistic with rollback shake) */}
                              <td
                                className="py-3 px-3 text-center align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <WarrantyRowReminderSwitch
                                  product={product}
                                  onToggle={handleToggleReminder}
                                />
                              </td>

                              {/* Action Menu */}
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
                                      onClick={() => navigate(`/products/${product._id}`)}
                                      className="cursor-pointer"
                                    >
                                      View product details
                                    </DropdownMenuItem>
                                    {receiptId && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          navigate(`/receipts/${receiptId}`)
                                        }
                                        className="cursor-pointer"
                                      >
                                        View source receipt
                                      </DropdownMenuItem>
                                    )}
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
          )}
        </m.div>
      </AnimatePresence>
      </PullToRefresh>
    </PageContentTransition>
  );
}

export default WarrantyTracker;
