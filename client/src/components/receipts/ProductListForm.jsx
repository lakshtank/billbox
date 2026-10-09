/**
 * Shared Product List Form Component used identically across:
 * - Single Receipt Review Form (ReceiptReviewForm.jsx)
 * - Single Receipt Manual Entry Form (ReceiptForm.jsx)
 * - Batch Receipt Review Screen (BatchReview.jsx)
 */
const ProductListForm = ({
  items = [],
  onItemChange,
  onAddItem,
  onRemoveItem,
  categoryOptions = [],
  errors = {},
}) => {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-4 shadow-2xs font-sans text-brand-navy">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-brand-border">
        <h2 className="text-base font-bold text-brand-navy tracking-tight">
          Purchased products ({items.length})
        </h2>

        {onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            className="px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-surface border border-brand-primary rounded-lg hover:bg-brand-border/30 transition-colors cursor-pointer flex items-center gap-1"
          >
            + Add product
          </button>
        )}
      </div>

      {/* Clean Repeating Product List */}
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className={idx > 0 ? 'border-t border-brand-border pt-6 space-y-4' : 'space-y-4'}
          >
            {/* Index Label & Review Flag & Remove Link */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  PRODUCT {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
              </div>

              {items.length > 1 && onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-xs font-semibold text-brand-navy hover:text-brand-primary hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Row 1: Product Name (Wide), Brand, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Product name *
                </label>
                <input
                  type="text"
                  value={item.productName || ''}
                  onChange={(e) => onItemChange(item.id, 'productName', e.target.value)}
                  placeholder="e.g. Tesa 51903 Hi-Lo Tack 12mmx66m"
                  className="w-full text-xs h-10 px-3 bg-brand-canvas border border-brand-border rounded-lg text-brand-navy placeholder-[#94A3B8] focus:outline-none focus:bg-brand-surface focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                />
                {errors.items?.[item.id] && (
                  <p className="text-xs text-brand-navy font-medium mt-1">{errors.items[item.id]}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Brand</label>
                <input
                  type="text"
                  value={item.brand || ''}
                  onChange={(e) => onItemChange(item.id, 'brand', e.target.value)}
                  placeholder="e.g. Tesa"
                  className="w-full text-xs h-10 px-3 bg-brand-canvas border border-brand-border rounded-lg text-brand-navy placeholder-[#94A3B8] focus:outline-none focus:bg-brand-surface focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Category</label>
                <select
                  value={item.category || 'Others'}
                  onChange={(e) => onItemChange(item.id, 'category', e.target.value)}
                  className="w-full text-xs h-10 pl-3 pr-8 bg-brand-canvas border border-brand-border rounded-lg text-brand-navy focus:outline-none focus:bg-brand-surface focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='%230F172A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 4L5 6.5L7.5 4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                  }}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Quantity, Unit Price, Line Total, Warranty */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity ?? 1}
                  onChange={(e) => onItemChange(item.id, 'quantity', e.target.value)}
                  className="w-full text-xs h-10 px-3 bg-brand-canvas border border-brand-border rounded-lg text-brand-navy focus:outline-none focus:bg-brand-surface focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors font-tabular"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Unit price</span>
                  {item.originalUnitPrice != null && Number(item.originalUnitPrice) > Number(item.unitPrice || 0) && (
                    <span className="text-[11px] text-[#64748B] line-through font-normal font-tabular">
                      ₹{Number(item.originalUnitPrice).toFixed(2)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.unitPrice ?? ''}
                  onChange={(e) => onItemChange(item.id, 'unitPrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs h-10 px-3 bg-brand-canvas border border-brand-border rounded-lg text-brand-navy placeholder-[#94A3B8] focus:outline-none focus:bg-brand-surface focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors font-tabular"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Line total</span>
                  {item.discountAmount != null && Number(item.discountAmount) > 0 && (
                    <span className="text-[11px] text-brand-primary font-medium font-tabular">
                      Saved ₹{Number(item.discountAmount).toFixed(2)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.lineTotal ?? ''}
                  onChange={(e) => onItemChange(item.id, 'lineTotal', e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs h-10 px-3 bg-brand-canvas border border-brand-border rounded-lg text-brand-navy placeholder-[#94A3B8] focus:outline-none focus:bg-brand-surface focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors font-tabular font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Warranty</label>
                <div className="input-group-warranty">
                  <input
                    type="text"
                    value={item.warrantyPeriodValue ?? ''}
                    onChange={(e) => onItemChange(item.id, 'warrantyPeriodValue', e.target.value)}
                    placeholder="-"
                    className="font-tabular"
                  />
                  <select
                    value={item.warrantyPeriodUnit || 'months'}
                    onChange={(e) => onItemChange(item.id, 'warrantyPeriodUnit', e.target.value)}
                    className="appearance-none"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductListForm;
