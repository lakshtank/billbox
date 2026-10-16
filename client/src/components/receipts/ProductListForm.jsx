import * as React from 'react';
import { Plus, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WarrantyInput } from './WarrantyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProductListForm({
  items = [],
  onItemChange,
  onAddItem,
  onRemoveItem,
  categoryOptions = [],
  currencySymbol = '₹',
  errors = {},
}) {
  return (
    <div className="space-y-3 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-fg">Line items</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-subtle border border-line-subtle text-fg-3 tnum">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {onAddItem && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
          >
            <Plus className="size-3.5 text-accent" />
            <span>Add item</span>
          </Button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto overflow-y-hidden no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-line-subtle text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
              <th className="py-2.5 px-2 w-8 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[220px]">Description & Brand</th>
              <th className="py-2.5 px-2 w-36">Category</th>
              <th className="py-2.5 px-2 w-16 text-center">Qty</th>
              <th className="py-2.5 px-2 w-28 text-right">Unit price</th>
              <th className="py-2.5 px-2 w-32 text-center">Warranty</th>
              <th className="py-2.5 px-2 w-28 text-right">Total</th>
              <th className="py-2.5 px-2 w-9 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {items.map((item, idx) => {
              const itemError = errors.products?.[item.id] || errors.items?.[item.id];
              return (
                <tr key={item.id || idx} className="hover:bg-subtle/30 transition-colors">
                  {/* Row index */}
                  <td className="py-2.5 px-2 text-xs font-mono text-fg-3 tnum text-center align-top pt-3.5">
                    {idx + 1}
                  </td>

                  {/* Description & Brand stacked */}
                  <td className="py-2.5 px-3 align-top space-y-1">
                    <Input
                      id={`product-name-${item.id}`}
                      type="text"
                      value={item.productName || ''}
                      onChange={(e) => onItemChange(item.id, 'productName', e.target.value)}
                      placeholder="Item name / title *"
                      className={`h-8 text-xs bg-surface ${itemError ? 'border-bad-line focus:ring-bad' : ''}`}
                      required
                    />
                    <Input
                      type="text"
                      value={item.brand || ''}
                      onChange={(e) => onItemChange(item.id, 'brand', e.target.value)}
                      placeholder="Brand (optional)"
                      className="h-6 text-[11px] bg-subtle/50 text-fg-2 border-line-subtle"
                    />
                    {itemError && (
                      <p className="text-[10px] text-bad-fg font-medium">{itemError}</p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-2 align-top pt-2.5">
                    <Select
                      value={item.category || 'General'}
                      onValueChange={(val) => onItemChange(item.id, 'category', val)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-surface">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Qty */}
                  <td className="py-2.5 px-2 align-top pt-2.5">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => onItemChange(item.id, 'quantity', e.target.value)}
                      className="h-8 text-xs tnum text-center bg-surface px-1"
                      required
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="py-2.5 px-2 align-top pt-2.5">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => onItemChange(item.id, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      className="h-8 text-xs tnum text-right font-mono bg-surface px-2"
                    />
                  </td>

                  {/* Warranty */}
                  <td className="py-2.5 px-2 align-top pt-2.5">
                    <div className="flex items-center justify-center">
                      <WarrantyInput
                        value={item.warrantyPeriodValue}
                        unit={item.warrantyPeriodUnit}
                        onValueChange={(val) => onItemChange(item.id, 'warrantyPeriodValue', val)}
                        onUnitChange={(val) => onItemChange(item.id, 'warrantyPeriodUnit', val)}
                      />
                    </div>
                  </td>

                  {/* Line Total */}
                  <td className="py-2.5 px-2 text-right align-top pt-3.5 font-mono text-xs font-semibold text-fg tnum whitespace-nowrap">
                    {currencySymbol}{' '}
                    {item.lineTotal ? Number(item.lineTotal).toFixed(2) : '0.00'}
                  </td>

                  {/* Remove */}
                  <td className="py-2.5 px-2 text-center align-top pt-2.5">
                    {items.length > 1 && onRemoveItem && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="size-7 p-0 text-fg-3 hover:text-bad-fg hover:bg-bad-bg/20"
                        title="Remove item"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Rows (visible only on small screens) */}
      <div className="md:hidden space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-3 rounded-[10px] border border-line bg-surface space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-fg-3">
                ITEM {idx + 1}
              </span>
              {items.length > 1 && onRemoveItem && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="size-7 p-0 text-fg-3 hover:text-bad-fg"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id={`product-name-mobile-${item.id}`}
                type="text"
                value={item.productName || ''}
                onChange={(e) => onItemChange(item.id, 'productName', e.target.value)}
                placeholder="Product name *"
                className="text-xs"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={item.brand || ''}
                  onChange={(e) => onItemChange(item.id, 'brand', e.target.value)}
                  placeholder="Brand (optional)"
                  className="text-xs"
                />
                <Select
                  value={item.category || 'General'}
                  onValueChange={(val) => onItemChange(item.id, 'category', val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-fg-3 block mb-1">Qty</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={(e) => onItemChange(item.id, 'quantity', e.target.value)}
                    className="text-xs tnum text-center"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-fg-3 block mb-1">Unit price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={(e) => onItemChange(item.id, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    className="text-xs tnum text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-line-subtle text-xs">
                <div className="flex items-center gap-1 text-[11px] text-fg-3">
                  <Shield className="size-3 text-accent" />
                  <span>Warranty:</span>
                  <input
                    type="number"
                    min="0"
                    value={item.warrantyPeriodValue || ''}
                    onChange={(e) => onItemChange(item.id, 'warrantyPeriodValue', e.target.value)}
                    placeholder="0"
                    className="w-10 text-center font-mono border-b border-line text-fg bg-transparent"
                  />
                  <span>mo</span>
                </div>
                <div className="font-mono font-semibold text-fg tnum">
                  Total: {currencySymbol}{' '}
                  {item.lineTotal ? Number(item.lineTotal).toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductListForm;
