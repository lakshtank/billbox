import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateReceipt } from '../../queries/useReceiptMutations';
import { useCategoriesQuery } from '../../queries/useCategoryQueries';
import { formatDateForInput, getCurrencySymbol } from '../../utils/formatters';
import ProductListForm from './ProductListForm';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const ReceiptReviewForm = ({ ocrData, onCancel, onSuccess }) => {
  const createMutation = useCreateReceipt();
  const { data: userCategories = [] } = useCategoriesQuery();

  const extracted = ocrData?.extracted || {};
  const fileUrl = ocrData?.fileUrl || null;
  const fileData = ocrData?.fileData || null;
  const mimeType = ocrData?.mimeType || null;
  const fileType = ocrData?.fileType || 'image';
  const ocrRaw = ocrData?.ocrRaw || '';

  const userCatNames = Array.isArray(userCategories)
    ? userCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : [];
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...userCatNames]));

  // Initialize receipt-level fields
  const [storeName, setStoreName] = useState(extracted.storeName?.value || '');
  const [invoiceNumber, setInvoiceNumber] = useState(extracted.invoiceNumber?.value || '');
  const [purchaseDate, setPurchaseDate] = useState(formatDateForInput(extracted.purchaseDate?.value));
  const [dueDate, setDueDate] = useState(formatDateForInput(extracted.dueDate?.value));
  const [currency, setCurrency] = useState(extracted.currency?.value || 'INR');

  const currSym = getCurrencySymbol(currency);
  const [subtotal, setSubtotal] = useState(extracted.subtotal?.value != null ? String(extracted.subtotal.value) : '');
  const [shippingAmount, setShippingAmount] = useState(extracted.shippingAmount?.value != null ? String(extracted.shippingAmount.value) : '0');
  const [taxAmount, setTaxAmount] = useState(extracted.taxAmount?.value != null ? String(extracted.taxAmount.value) : '0');
  const [grandTotal, setGrandTotal] = useState(extracted.grandTotal?.value != null ? String(extracted.grandTotal.value) : (extracted.totalAmount?.value != null ? String(extracted.totalAmount.value) : ''));
  const [notes, setNotes] = useState('');

  // Initialize line items
  const initialItems = Array.isArray(extracted.items) && extracted.items.length > 0
    ? extracted.items.map((item, idx) => ({
        id: item.id || `item-${idx + 1}-${Date.now()}`,
        productName: item.productName || '',
        brand: item.brand || '',
        category: item.category || 'Others',
        quantity: item.quantity || 1,
        originalUnitPrice: item.originalUnitPrice != null ? String(item.originalUnitPrice) : (item.unitPrice != null ? String(item.unitPrice) : ''),
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        discountAmount: item.discountAmount != null ? String(item.discountAmount) : '0',
        discountPercent: item.discountPercent != null ? String(item.discountPercent) : '0',
        lineTotal: item.lineTotal != null ? String(item.lineTotal) : '',
        warrantyPeriodValue: item.warrantyPeriodValue != null ? String(item.warrantyPeriodValue) : '',
        warrantyPeriodUnit: item.warrantyPeriodUnit || 'months',
        confidence: item.confidence ?? 85,
        needsReview: item.needsReview ?? false,
      }))
    : [
        {
          id: `item-1-${Date.now()}`,
          productName: extracted.productName?.value || '',
          brand: extracted.brand?.value || '',
          category: extracted.category?.value || 'Others',
          quantity: 1,
          originalUnitPrice: extracted.totalAmount?.value != null ? String(extracted.totalAmount.value) : '',
          unitPrice: extracted.totalAmount?.value != null ? String(extracted.totalAmount.value) : '',
          discountAmount: '0',
          discountPercent: '0',
          lineTotal: extracted.totalAmount?.value != null ? String(extracted.totalAmount.value) : '',
          warrantyPeriodValue: extracted.warrantyPeriodValue?.value != null ? String(extracted.warrantyPeriodValue.value) : '',
          warrantyPeriodUnit: extracted.warrantyPeriodValue?.unit || 'months',
          confidence: 85,
          needsReview: false,
        },
      ];

  const [items, setItems] = useState(initialItems);
  const [errors, setErrors] = useState({});

  // Line total math mismatch calculation
  const sumLineTotals = items.reduce((sum, item) => sum + (Number(item.lineTotal) || (Number(item.unitPrice) * Number(item.quantity)) || 0), 0);
  const grandVal = grandTotal ? Number(grandTotal) : null;
  const subVal = subtotal ? Number(subtotal) : null;
  const taxVal = Number(taxAmount || 0);
  const shipVal = Number(shippingAmount || 0);
  const discVal = Number(extracted?.discountAmount?.value || 0);

  const matchesGrand = grandVal != null && Math.abs(sumLineTotals - grandVal) <= 1.00;
  const matchesSub = subVal != null && Math.abs(sumLineTotals - subVal) <= 1.00;
  const matchesReconciled = grandVal != null && Math.abs((sumLineTotals - discVal + taxVal + shipVal) - grandVal) <= 1.00;

  const isSubtotalMismatch = items.length > 0 && grandVal != null && !matchesGrand && !matchesSub && !matchesReconciled;

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = Number(field === 'quantity' ? value : item.quantity) || 1;
          const price = Number(field === 'unitPrice' ? value : item.unitPrice);
          if (!isNaN(price)) {
            updated.lineTotal = String((qty * price).toFixed(2));
          }
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${prev.length + 1}-${Date.now()}`,
        productName: '',
        brand: '',
        category: 'Others',
        quantity: 1,
        originalUnitPrice: '',
        unitPrice: '',
        discountAmount: '0',
        discountPercent: '0',
        lineTotal: '',
        warrantyPeriodValue: '',
        warrantyPeriodUnit: 'months',
        confidence: 100,
        needsReview: false,
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      toast.error('Receipt must have at least one product row.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validate = () => {
    const newErrors = {};
    if (!purchaseDate) newErrors.purchaseDate = 'Purchase date is required.';
    if (grandTotal && isNaN(Number(grandTotal))) newErrors.grandTotal = 'Must be a valid number.';

    const itemErrors = {};
    items.forEach((item) => {
      if (!item.productName.trim()) {
        itemErrors[item.id] = 'Product name required.';
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    let validPurchaseDate = new Date().toISOString();
    if (purchaseDate) {
      const parsed = new Date(purchaseDate);
      if (!isNaN(parsed.getTime())) {
        validPurchaseDate = parsed.toISOString();
      }
    }

    let validDueDate = null;
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        validDueDate = parsed.toISOString();
      }
    }

    const normalizedFileType =
      fileType === 'pdf' ||
      mimeType === 'application/pdf' ||
      fileUrl?.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : fileType === 'manual'
        ? 'manual'
        : 'image';

    const payload = {
      storeName: storeName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate: validPurchaseDate,
      dueDate: validDueDate,
      subtotal: subtotal ? Number(subtotal) : null,
      shippingAmount: Number(shippingAmount || 0),
      taxAmount: Number(taxAmount || 0),
      grandTotal: grandTotal ? Number(grandTotal) : null,
      totalAmount: grandTotal ? Number(grandTotal) : null,
      currency,
      notes: notes.trim(),
      fileUrl,
      fileData,
      mimeType,
      fileType: normalizedFileType,
      ocrRaw,
      products: items.map((item) => ({
        productName: item.productName.trim(),
        brand: item.brand ? item.brand.trim() : '',
        category: item.category || 'Others',
        quantity: Number(item.quantity) || 1,
        originalUnitPrice: item.originalUnitPrice ? Number(item.originalUnitPrice) : (item.unitPrice ? Number(item.unitPrice) : null),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        discountAmount: item.discountAmount ? Number(item.discountAmount) : 0,
        discountPercent: item.discountPercent ? Number(item.discountPercent) : 0,
        lineTotal: item.lineTotal ? Number(item.lineTotal) : null,
        warrantyPeriodValue: item.warrantyPeriodValue ? Number(item.warrantyPeriodValue) : null,
        warrantyPeriodUnit: item.warrantyPeriodUnit || 'months',
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success('Multi-product receipt saved!');
        if (onSuccess) onSuccess(data);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to save receipt.';
        toast.error(msg);
      },
    });
  };

  const flaggedCount = items.filter((i) => i.needsReview).length;

  const totalSavings = items.reduce((acc, item) => {
    if (item.discountAmount != null && Number(item.discountAmount) > 0) {
      return acc + Number(item.discountAmount);
    }
    if (item.originalUnitPrice != null && item.unitPrice != null && Number(item.originalUnitPrice) > Number(item.unitPrice)) {
      const qty = Number(item.quantity) || 1;
      return acc + ((Number(item.originalUnitPrice) - Number(item.unitPrice)) * qty);
    }
    return acc;
  }, 0) + Number(extracted.discountAmount?.value || extracted.discountAmount || 0);

  return (
    <div className="space-y-8 font-sans text-[#0F172A]">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Review extracted receipt
          </h2>
          <p className="text-xs text-[#64748B] font-normal mt-0.5">
            Verify extracted totals and products before saving
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors"
          >
            Scan again
          </button>
        )}
      </div>



      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Receipt Header & Totals Section Card Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight border-b border-[#E2E8F0] pb-3">
            Receipt header & totals
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ocr-store" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V9a2 2 0 012-2h2a2 2 0 012 2v12" />
                </svg>
                Store / merchant
              </label>
              <input
                id="ocr-store"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Reliance Retail"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="ocr-invoice" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="text-slate-500 font-bold text-xs">#</span>
                Invoice / order #
              </label>
              <input
                id="ocr-invoice"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-90428"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="ocr-date" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Purchase date
              </label>
              <input
                id="ocr-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
              />
              {errors.purchaseDate && <p className="text-xs text-rose-500 mt-1">{errors.purchaseDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div>
              <label htmlFor="ocr-subtotal" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Subtotal
              </label>
              <input
                id="ocr-subtotal"
                type="number"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
              />
            </div>

            <div>
              <label htmlFor="ocr-shipping" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Shipping / handling
              </label>
              <input
                id="ocr-shipping"
                type="number"
                step="0.01"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(e.target.value)}
                placeholder="0"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
              />
            </div>

            <div>
              <label htmlFor="ocr-tax" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Tax (GST)
              </label>
              <input
                id="ocr-tax"
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
              />
            </div>

            <div>
              <label htmlFor="ocr-grandtotal" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Grand total</span>
                {totalSavings > 0 && (
                  <span className="text-[11px] text-[#047857] font-medium font-tabular">
                    Saved {currSym}{totalSavings.toFixed(2)}
                  </span>
                )}
              </label>
              <div className="input-group">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="appearance-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  id="ocr-grandtotal"
                  type="number"
                  step="0.01"
                  value={grandTotal}
                  onChange={(e) => setGrandTotal(e.target.value)}
                  placeholder="0.00"
                  className="font-bold font-tabular"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Shared Product List Form */}
        <ProductListForm
          items={items}
          onItemChange={handleItemChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          categoryOptions={categoryOptions}
          errors={errors}
        />

        {/* 4. Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#059669] rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            {createMutation.isPending ? 'Saving receipt...' : 'Confirm & save receipt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptReviewForm;
