import * as React from 'react';
import {
  Filter,
  Table as TableIcon,
  LayoutGrid,
  RotateCcw,
  Check,
  CheckSquare,
} from 'lucide-react';
import { cn } from 'cn';
import { usePreferences } from '@/context/PreferencesContext';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import * as m from 'motion/react-m';
import { spring } from '@/lib/motion';

/**
 * FilterBar Component
 * Step 9.7:
 * - Single row: search · filter chips (Category, Warranty, Date, Status) · sort · density · view switch · "Reset"
 * - Active filters become removable chips under the bar
 * - Integrates with density and viewMode preferences
 */
export function FilterBar({
  searchValue = '',
  onSearchChange,
  categories = [],
  selectedCategories = [],
  onCategoryToggle,
  warrantyStatus = 'all',
  onWarrantyStatusChange,
  status = 'all',
  onStatusChange,
  statusOptions = [],
  sortOptions = [],
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters = false,
  showViewToggle = true,
  isSelectMode = false,
  onToggleSelectMode,
  selectedCount = 0,
  className,
}) {
  const { viewMode, setViewMode } = usePreferences();
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const activeFilterCount =
    (selectedCategories.length || 0) +
    (warrantyStatus && warrantyStatus !== 'all' ? 1 : 0) +
    (status && status !== 'all' ? 1 : 0);

  return (
    <div className={cn('flex flex-col gap-2.5 w-full', className)}>
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Filter Chips */}
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchInput
              size="sm"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onClear={() => onSearchChange?.('')}
              placeholder="Search..."
            />
          </div>

          {/* Step 16.3: Mobile Filter Sheet Trigger (< sm) */}
          <Button
            type="button"
            variant={hasActiveFilters ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className={cn(
              'sm:hidden h-9 text-xs gap-1.5 cursor-pointer',
              hasActiveFilters && 'bg-accent text-on-accent'
            )}
          >
            <Filter className="size-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-on-accent/20 px-1.5 py-0.2 text-[10px] font-semibold tnum">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Select Mode Toggle Button (near left side of list) */}
          {onToggleSelectMode && (
            <Button
              type="button"
              variant={isSelectMode ? 'default' : 'secondary'}
              size="sm"
              onClick={onToggleSelectMode}
              className={cn(
                'h-9 text-xs gap-1.5 transition-colors cursor-pointer',
                isSelectMode
                  ? 'bg-accent text-on-accent hover:bg-accent/90 font-medium shadow-xs'
                  : 'text-fg-2 hover:text-fg'
              )}
              title={isSelectMode ? 'Deactivate select mode' : 'Activate select mode'}
              aria-pressed={isSelectMode}
            >
              <CheckSquare className="size-3.5" />
              <span>
                {isSelectMode
                  ? selectedCount > 0
                    ? `Selected (${selectedCount})`
                    : 'Done'
                  : 'Select'}
              </span>
              {isSelectMode && selectedCount > 0 && (
                <span className="ml-0.5 rounded-full bg-on-accent/20 px-1.5 py-0.2 text-[10px] font-semibold tnum">
                  {selectedCount}
                </span>
              )}
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-2">
            {/* Category Filter Popover */}
          {categories.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    'h-9 text-xs gap-1.5',
                    selectedCategories.length > 0 && 'border-accent text-accent bg-accent-tint/40 font-medium'
                  )}
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
                <div className="px-2 py-1 text-xs font-semibold text-fg-3 border-b border-line mb-1">
                  Filter by Category
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-line-subtle text-xs">
                  {categories.map((cat) => {
                    const isChecked = selectedCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-hover rounded cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onCategoryToggle?.(cat)}
                        />
                        <span className="text-sm text-fg capitalize truncate">{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Warranty Status Filter Popover */}
          {onWarrantyStatusChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    'h-9 text-xs gap-1.5',
                    warrantyStatus !== 'all' && 'border-accent text-accent bg-accent-tint/40 font-medium'
                  )}
                >
                  <span>Warranty{warrantyStatus !== 'all' ? `: ${warrantyStatus}` : ''}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                {[
                  { value: 'all', label: 'All Warranties' },
                  { value: 'active', label: 'Covered (Active)' },
                  { value: 'expiring', label: 'Expiring Soon (≤30d)' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'none', label: 'No Warranty' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onWarrantyStatusChange(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-[6px] transition-colors cursor-pointer text-left',
                      warrantyStatus === opt.value
                        ? 'bg-accent-tint text-accent font-medium'
                        : 'text-fg hover:bg-hover'
                    )}
                  >
                    <span>{opt.label}</span>
                    {warrantyStatus === opt.value && <Check className="size-3.5 text-accent" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          {/* Status Filter Popover */}
          {onStatusChange && statusOptions.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    'h-9 text-xs gap-1.5',
                    status !== 'all' && 'border-accent text-accent bg-accent-tint/40 font-medium'
                  )}
                >
                  <span>
                    {status === 'all'
                      ? 'Status'
                      : `Status: ${statusOptions.find((o) => o.value === status)?.label || status}`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-[6px] transition-colors cursor-pointer text-left',
                      status === opt.value
                        ? 'bg-accent-tint text-accent font-medium'
                        : 'text-fg hover:bg-hover'
                    )}
                  >
                    <span>{opt.label}</span>
                    {status === opt.value && <Check className="size-3.5 text-accent" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 text-xs text-fg-3 hover:text-bad-fg gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Right: Sort, Density & View Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort Select */}
          {sortOptions.length > 0 && (
            <div className="w-40">
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger size="sm" className="h-9 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="end">
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Density is locked to comfortable and professional per user requirement */}
          {/* setDensity helper preserved */}

          {/* View Mode Toggle (Table vs Grid) with Slider Animation */}
          {showViewToggle && (
            <div className="relative flex h-9 items-center rounded-[8px] border border-line bg-surface p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'relative z-10 flex size-7.5 items-center justify-center rounded-[6px] transition-colors cursor-pointer',
                  viewMode === 'table'
                    ? 'text-fg font-semibold'
                    : 'text-fg-3 hover:text-fg'
                )}
                aria-label="Table view"
                title="Table view"
              >
                {viewMode === 'table' && (
                  <m.div
                    layoutId="filterbar-view-mode-pill"
                    className="absolute inset-0 rounded-[6px] bg-subtle border border-line-subtle shadow-2xs"
                    transition={spring.snappy}
                  />
                )}
                <TableIcon className="relative z-10 size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'relative z-10 flex size-7.5 items-center justify-center rounded-[6px] transition-colors cursor-pointer',
                  viewMode === 'grid'
                    ? 'text-fg font-semibold'
                    : 'text-fg-3 hover:text-fg'
                )}
                aria-label="Grid view"
                title="Grid view"
              >
                {viewMode === 'grid' && (
                  <m.div
                    layoutId="filterbar-view-mode-pill"
                    className="absolute inset-0 rounded-[6px] bg-subtle border border-line-subtle shadow-2xs"
                    transition={spring.snappy}
                  />
                )}
                <LayoutGrid className="relative z-10 size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 6.5 Accessible Active Filters Indicator (Zero visual layout shift: list below never moves downwards) */}
      <div className="sr-only" aria-live="polite">
        {hasActiveFilters && <span>Active filters:</span>}
      </div>

      {/* Step 16.3: Mobile Filters Vaul Sheet (snap points [0.5, 1], sticky Apply) */}
      <ResponsiveModal
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        title="Filter & Refine"
        description="Filter by category, warranty status, or view mode"
        snapPoints={[0.5, 1]}
      >
        <div className="flex flex-col gap-4 py-2 font-sans text-left">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-fg-3 uppercase tracking-wider block">
                Category
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-0.5">
                {categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onCategoryToggle?.(cat)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs border transition-colors capitalize cursor-pointer',
                        isChecked
                          ? 'bg-accent text-on-accent border-accent font-medium'
                          : 'bg-subtle text-fg border-line hover:border-line-strong'
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warranty Status */}
          {onWarrantyStatusChange && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-fg-3 uppercase tracking-wider block">
                Warranty Status
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'all', label: 'All Warranties' },
                  { value: 'active', label: 'Covered' },
                  { value: 'expiring', label: 'Expiring Soon' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'none', label: 'No Warranty' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onWarrantyStatusChange(opt.value)}
                    className={cn(
                      'px-2.5 py-1.5 text-xs rounded-md border text-left transition-colors cursor-pointer',
                      warrantyStatus === opt.value
                        ? 'bg-accent/10 border-accent text-accent font-semibold'
                        : 'border-line hover:bg-hover text-fg'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          {onStatusChange && statusOptions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-fg-3 uppercase tracking-wider block">
                Status
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value)}
                    className={cn(
                      'px-2.5 py-1.5 text-xs rounded-md border text-left transition-colors cursor-pointer',
                      status === opt.value
                        ? 'bg-accent/10 border-accent text-accent font-semibold'
                        : 'border-line hover:bg-hover text-fg'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Apply & Reset Actions at bottom */}
          <div className="sticky bottom-0 bg-surface pt-3 border-t border-line-subtle flex items-center justify-between gap-3 mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onResetFilters?.();
              }}
              disabled={!hasActiveFilters}
              className="text-xs text-fg-3 hover:text-fg"
            >
              Reset all
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setMobileFilterOpen(false)}
              className="px-6 h-9 text-xs bg-accent text-on-accent hover:bg-accent-hover font-semibold cursor-pointer"
            >
              Apply filters
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}

export default FilterBar;
