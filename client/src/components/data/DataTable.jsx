import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Download,
  X,
} from 'lucide-react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import * as m from 'motion/react-m';
import NumberFlow from '@number-flow/react';
import { cn } from 'cn';
import { usePreferences } from '@/context/PreferencesContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { variants, spring } from '@/lib/motion';
import { SwipeRow } from './SwipeRow';

/**
 * DataTable Component (TanStack Table)
 * Step 9.1:
 * - Container: surface, 1px line, radius 12, overflow hidden
 * - Header row: 36px (h-9), bg-subtle, overline text, sort arrow on active column
 * - Body rows: 40px (comfortable) / 32px (compact), 1px line-subtle divider, hover, selected + 2px accent rail
 * - Cell padding: 12px horizontal (px-3), first column 16px (pl-4). Numeric right-aligned + .tnum
 * - Bulk bar: replaces filter bar in-place when rows are selected
 * - Footer: server-side pagination with page-size select and prev/next controls
 */
export function DataTable({
  columns,
  data = [],
  pageCount = 1,
  pageIndex = 0,
  pageSize = 25,
  totalCount = 0,
  onPaginationChange,
  sorting = [],
  onSortingChange,
  rowSelection = {},
  onRowSelectionChange,
  onRowClick,
  onRowDelete,
  onRowShare,
  isLoading = false,
  error = null,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
  bulkActions,
  onClearSelection,
  variant = 'seamless',
  isSelectMode = false,
  className,
  renderMobileRow,
}) {
  const { density: userDensity } = usePreferences();
  const density = userDensity || 'comfortable';

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    getRowId: (originalRow, index) => originalRow?._id || originalRow?.id || String(index),
    onSortingChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // Step 14.3: Sticky table header shadow sentinel & observer
  const [isHeaderStuck, setIsHeaderStuck] = React.useState(false);
  const headerSentinelRef = React.useRef(null);

  React.useEffect(() => {
    const el = headerSentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderStuck(!entry.isIntersecting && entry.boundingClientRect.top <= 0);
      },
      { threshold: [0, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleRowClick = (row, e) => {
    // Prevent navigation if user clicked checkbox, link, or action button
    if (e?.target) {
      if (
        e.target.closest('input[type="checkbox"]') ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('[role="menuitem"]')
      ) {
        return;
      }
    }
    if (isSelectMode) {
      row.toggleSelected();
      return;
    }
    onRowClick?.(row.original, e);
  };

  const startRecord = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalCount);

  // Stagger only when real rows first appear, then let FLIP handle subsequent sort/filter reorders
  const hasAnimatedStagger = React.useRef(false);
  const rows = table.getRowModel().rows;
  const shouldStagger = !hasAnimatedStagger.current && rows.length > 0;
  React.useEffect(() => {
    if (rows.length > 0) {
      hasAnimatedStagger.current = true;
    }
  }, [rows.length]);

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {/* Step 6.3 Bulk Action Bar: Floating bottom dock (zero vertical layout shift for table rows) */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <m.div
            initial={{ y: 24, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 24, opacity: 0, x: '-50%' }}
            transition={spring.snappy}
            className="fixed bottom-6 left-1/2 z-50 flex h-11 items-center justify-between gap-4 rounded-[12px] border border-accent/40 bg-surface/95 backdrop-blur-md px-4 py-2 text-xs shadow-xl min-w-[320px] max-w-[90vw]"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-accent tnum inline-flex items-center gap-1.5">
                <NumberFlow value={selectedCount} />
                <span>selected</span>
              </span>
              <div className="h-4 w-px bg-accent/20" />
              {bulkActions ? (
                bulkActions(selectedRows.map((r) => r.original))
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-bad-fg hover:bg-bad-bg"
                    onClick={() => console.log('Bulk delete', selectedRows)}
                  >
                    <Trash2 className="size-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-fg-2 hover:bg-hover"
                    onClick={() => console.log('Bulk export', selectedRows)}
                  >
                    <Download className="size-3 mr-1" />
                    Export
                  </Button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                table.resetRowSelection();
                onClearSelection?.();
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-fg-2 hover:text-fg cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Clear</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main Table Container: seamless list by default (no enclosing box), supports card variant */}
      <div
        className={cn(
          'relative w-full',
          variant === 'card'
            ? 'overflow-hidden rounded-[12px] border border-line bg-surface shadow-2xs'
            : 'border-b border-line-subtle'
        )}
      >
        {/* Step 16.3: Mobile stacked list rows (< sm) */}
        {renderMobileRow && (
          <div className="sm:hidden divide-y divide-line-subtle border-b border-line-subtle">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <div key={`skel-m-${rIdx}`} className="h-14 px-3 flex flex-col justify-center gap-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))
            ) : rows.length === 0 ? (
              <div className="py-8 text-center">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </div>
            ) : (
              rows.map((row, index) => {
                const isSelected = row.getIsSelected();
                const rowKey = row.original?._id || row.original?.id || row.id;
                const hasSwipe = Boolean(onRowDelete || onRowShare);

                const rowContent = (
                  <div
                    onClick={(e) => handleRowClick(row, e)}
                    className={cn(
                      'min-h-[56px] transition-colors duration-fast active:bg-hover/80 cursor-pointer',
                      isSelected && 'bg-selected/60 border-l-2 border-l-accent'
                    )}
                  >
                    {renderMobileRow(row.original, {
                      isSelected,
                      row,
                      onRowClick: (e) => handleRowClick(row, e),
                    })}
                  </div>
                );

                return (
                  <m.div
                    key={`mobile-${rowKey}`}
                    layout="position"
                    variants={variants.fade}
                    initial={shouldStagger && index < 12 ? 'hidden' : false}
                    animate="show"
                  >
                    {hasSwipe ? (
                      <SwipeRow
                        onDelete={onRowDelete ? () => onRowDelete(row.original) : undefined}
                        onShare={onRowShare ? () => onRowShare(row.original) : undefined}
                      >
                        {rowContent}
                      </SwipeRow>
                    ) : (
                      rowContent
                    )}
                  </m.div>
                );
              })
            )}
          </div>
        )}

        <div className={cn("w-full overflow-x-auto overflow-y-hidden no-scrollbar", renderMobileRow && "hidden sm:block")}>
          {/* Step 14.3: 1px sentinel above sticky header */}
          <div ref={headerSentinelRef} className="h-px -mt-px pointer-events-none w-full" aria-hidden="true" />
          <LayoutGroup id="billbox-datatable-rows">
            <table className="w-full border-collapse text-left text-sm table-fixed">
            {/* Table Header: clean divider line, no heavy card box fill */}
            <thead data-stuck={isHeaderStuck ? "true" : undefined} className={cn("relative", isHeaderStuck && "data-stuck")}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className={cn(
                    'border-b border-line select-none sticky top-0 z-10 backdrop-blur-xs',
                    variant === 'card' ? 'h-9 bg-subtle/40' : 'h-10 bg-transparent'
                  )}
                >
                  {headerGroup.headers.map((header, idx) => {
                    const isSorted = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    const isSelectCol = header.column.id === 'select';
                    const colSize = header.column.columnDef.size;
                    const colStyle = isSelectCol
                      ? { width: '40px', minWidth: '40px', maxWidth: '40px' }
                      : colSize
                      ? { width: `${colSize}px`, minWidth: `${colSize}px` }
                      : { minWidth: '220px' };

                    return (
                      <th
                        key={header.id}
                        style={colStyle}
                        className={cn(
                          'text-[11px] font-semibold uppercase tracking-wider text-fg-3 whitespace-nowrap',
                          isSelectCol ? 'w-10 px-2 text-center' : 'px-3.5',
                          !isSelectCol && idx === 0 && 'pl-4',
                          canSort && 'cursor-pointer hover:text-fg transition-colors'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5',
                            isSelectCol && 'w-full justify-center',
                            header.column.columnDef.meta?.align === 'right' && 'w-full justify-end'
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="size-3 shrink-0">
                              {isSorted === 'asc' ? (
                                <ArrowUp className="size-3 text-accent" />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown className="size-3 text-accent" />
                              ) : (
                                <ArrowUpDown className="size-3 opacity-30 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Body with Step 6.1 Stagger & Step 6.2 FLIP Layout */}
            <m.tbody
              variants={variants.stagger(0.015)}
              initial={shouldStagger ? 'hidden' : false}
              animate="show"
              className="divide-y divide-line-subtle"
            >
              {isLoading ? (
                Array.from({ length: Math.min(5, pageSize || 5) }).map((_, rIdx) => (
                  <tr
                    key={`skel-row-${rIdx}`}
                    className={cn(
                      'border-b border-line-subtle last:border-0',
                      density === 'compact' ? 'h-8' : 'h-10'
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const isSelectCol = col.id === 'select';
                      const colSize = col.size;
                      const colStyle = isSelectCol
                        ? { width: '40px', minWidth: '40px', maxWidth: '40px' }
                        : colSize
                        ? { width: `${colSize}px`, minWidth: `${colSize}px` }
                        : { minWidth: '220px' };

                      return (
                        <td
                          key={`skel-cell-${cIdx}`}
                          style={colStyle}
                          className={cn(
                            'whitespace-nowrap align-middle',
                            isSelectCol ? 'w-10 px-2 text-center' : 'px-3.5',
                            !isSelectCol && cIdx === 0 && 'pl-4'
                          )}
                        >
                          <Skeleton
                            className={cn(
                              'h-4 rounded',
                              isSelectCol
                                ? 'size-4 mx-auto'
                                : cIdx === 0
                                ? 'w-6'
                                : cIdx === 1
                                ? 'w-36'
                                : cIdx === 2
                                ? 'w-24'
                                : 'w-16'
                            )}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-48 text-center text-bad-fg"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="font-semibold text-sm">Failed to load data</span>
                      <span className="text-xs text-fg-3">
                        {typeof error === 'string' ? error : error?.message || 'Server error'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center"
                  >
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const isSelected = row.getIsSelected();
                  const isStaggered = index < 12;
                  const enableLayout = rows.length <= 50;
                  const rowKey = row.original?._id || row.original?.id || row.id;

                  return (
                    <m.tr
                      key={rowKey}
                      layout={enableLayout ? 'position' : false}
                      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      variants={variants.fade}
                      initial={shouldStagger && isStaggered ? 'hidden' : false}
                      animate="show"
                      onClick={(e) => handleRowClick(row, e)}
                      className={cn(
                        'transition-colors duration-fast group',
                        // Comfortable (h-10 / h-12) and compact (h-8) specs
                        density === 'compact' ? 'h-8 text-xs' : 'h-10 md:h-12 text-sm',
                        onRowClick && 'cursor-pointer hover:bg-hover/50',
                        isSelected && 'bg-selected/60 border-l-2 border-l-accent'
                      )}
                    >
                      {row.getVisibleCells().map((cell, idx) => {
                        const isSelectCol = cell.column.id === 'select';
                        const colSize = cell.column.columnDef.size;
                        const colStyle = isSelectCol
                          ? { width: '40px', minWidth: '40px', maxWidth: '40px' }
                          : colSize
                          ? { width: `${colSize}px`, minWidth: `${colSize}px` }
                          : { minWidth: '220px' };

                        return (
                          <td
                            key={cell.id}
                            style={colStyle}
                            className={cn(
                              'whitespace-nowrap align-middle',
                              isSelectCol ? 'w-10 px-2 text-center' : 'px-3.5',
                              !isSelectCol && idx === 0 && 'pl-4',
                              cell.column.columnDef.meta?.align === 'right' && 'text-right tnum',
                              isSelected && idx === 0 && (!isSelectCol ? 'pl-3.5' : '')
                            )}
                          >
                            <div className={cn(isSelectCol && 'flex items-center justify-center w-full')}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </m.tr>
                  );
                })
              )}
            </m.tbody>
          </table>
        </LayoutGroup>
      </div>

        {/* Footer: Pagination */}
        <div
          className={cn(
            'flex h-12 w-full items-center justify-between text-xs text-fg-2 pt-3',
            variant === 'card' ? 'border-t border-line bg-surface px-4' : 'px-1 bg-transparent'
          )}
        >
          {/* Left: Summary text */}
          <div className="tnum font-medium text-fg-3">
            Showing <strong className="text-fg font-semibold">{startRecord}</strong>–
            <strong className="text-fg font-semibold">{endRecord}</strong> of{' '}
            <strong className="text-fg font-semibold">{totalCount}</strong>
          </div>

          {/* Right: Page Size & Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-fg-3 hidden sm:inline">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  onPaginationChange?.({
                    pageIndex: 0,
                    pageSize: Number(val),
                  });
                }}
              >
                <SelectTrigger size="sm" className="h-7 w-[68px] text-xs">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent align="end">
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onPaginationChange?.({
                    pageIndex: Math.max(0, pageIndex - 1),
                    pageSize,
                  });
                }}
                disabled={pageIndex === 0 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-medium text-fg-3 px-1 tnum">
                {pageIndex + 1} / {Math.max(1, pageCount)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onPaginationChange?.({
                    pageIndex: Math.min(pageCount - 1, pageIndex + 1),
                    pageSize,
                  });
                }}
                disabled={pageIndex >= pageCount - 1 || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TableRowActions helper component
 * Standardizes the 3-dots row menu across all tables
 */
export function TableRowActions({
  onView,
  onEdit,
  onShare,
  onDownload,
  onDelete,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-fg-3 hover:text-fg"
          aria-label="Actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {onView && (
          <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
        )}
        {onEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
        {onShare && <DropdownMenuItem onClick={onShare}>Share</DropdownMenuItem>}
        {onDownload && (
          <DropdownMenuItem onClick={onDownload}>Download</DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DataTable;
