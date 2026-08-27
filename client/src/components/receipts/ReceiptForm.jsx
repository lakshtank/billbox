import { useState, useEffect } from 'react';
import { formatDateForInput } from '../../utils/formatters';
import ProductListForm from './ProductListForm';

const CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const ReceiptForm = ({ initialData = null, onSubmit, isSubmitting = false }) => {
  const [storeName, setStoreName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [subtotal, setSubtotal] = useState('');
  const [shippingAmount, setShippingAmount] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [grandTotal, setGrandTotal] = useState('');
  const [notes, setNotes] = useState('');

  const [products, setProducts] = useState([
    {
      id: `item-1-${Date.now()}`,
      productName: '',
      brand: '',
      category: 'Others',
      quantity: 1,
      unitPrice: '',
      lineTotal: '',
      warrantyPeriodValue: '',
      warrantyPeriodUnit: 'months',
    },
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setStoreName(initialData.storeName || '');
      setInvoiceNumber(initialData.invoiceNumber || '');
      setPurchaseDate(formatDateForInput(initialData.purchaseDate));
      setDueDate(formatDateForInput(initialData.dueDate));
      setCurrency(initialData.currency || 'INR');
      setSubtotal(initialData.subtotal != null ? String(initialData.subtotal) : '');
      setShippingAmount(initialData.shippingAmount != null ? String(initialData.shippingAmount) : '0');
      setTaxAmount(initialData.taxAmount != null ? String(initialData.taxAmount) : '0');
      setGrandTotal(
        initialData.grandTotal != null
          ? String(initialData.grandTotal)
          : initialData.totalAmount != null
          ? String(initialData.totalAmount)
          : ''
      );
      setNotes(initialData.notes || '');

      const initialProds = Array.isArray(initialData.products) && initialData.products.length > 0
        ? initialData.products.map((p, idx) => ({
            id: p._id || `item-${idx + 1}-${Date.now()}`,
            productName: p.productName || '',
            brand: p.brand || '',
            category: p.category || 'Others',
            quantity: p.quantity || 1,
            unitPrice: p.unitPrice != null ? String(p.unitPrice) : '',
            lineTotal: p.lineTotal != null ? String(p.lineTotal) : '',
            warrantyPeriodValue: p.warrantyPeriodValue != null ? String(p.warrantyPeriodValue) : '',
            warrantyPeriodUnit: p.warrantyPeriodUnit || 'months',
          }))
        : [
            {
              id: `item-1-${Date.now()}`,
              productName: initialData.productName || '',
              brand: initialData.brand || '',
              category: initialData.category || 'Others',
              quantity: 1,
              unitPrice: initialData.totalAmount != null ? String(initialData.totalAmount) : '',
              lineTotal: initialData.totalAmount != null ? String(initialData.totalAmount) : '',
              warrantyPeriodValue:
                initialData.warrantyPeriodValue != null
                  ? String(initialData.warrantyPeriodValue)
                  : initialData.warrantyPeriodMonths != null
                  ? String(initialData.warrantyPeriodMonths)
                  : '',
              warrantyPeriodUnit: initialData.warrantyPeriodUnit || 'months',
            },
          ];

      setProducts(initialProds);
    }
  }, [initialData]);

  const handleProductChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = Number(field === 'quantity' ? value : p.quantity) || 1;
          const price = Number(field === 'unitPrice' ? value : p.unitPrice);
          if (!isNaN(price)) {
            updated.lineTotal = String((qty * price).toFixed(2));
          }
        }
        return updated;
      })
    );
  };

  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: `item-${prev.length + 1}-${Date.now()}`,
        productName: '',
        brand: '',
        category: 'Others',
        quantity: 1,
        unitPrice: '',
        lineTotal: '',
        warrantyPeriodValue: '',
        warrantyPeriodUnit: 'months',
      },
    ]);
  };

  const handleRemoveProduct = (id) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const validate = () => {
    const newErrors = {};
    if (!purchaseDate) newErrors.purchaseDate = 'Purchase date is required.';
    if (grandTotal && isNaN(Number(grandTotal))) newErrors.grandTotal = 'Must be a valid number.';

    const prodErrs = {};
    products.forEach((p) => {
      if (!p.productName.trim()) prodErrs[p.id] = 'Product name required.';
    });

    if (Object.keys(prodErrs).length > 0) newErrors.products = prodErrs;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      storeName: storeName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate: new Date(purchaseDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      subtotal: subtotal ? Number(subtotal) : null,
      shippingAmount: Number(shippingAmount || 0),
      taxAmount: Number(taxAmount || 0),
      grandTotal: grandTotal ? Number(grandTotal) : null,
      totalAmount: grandTotal ? Number(grandTotal) : null,
      currency,
      notes: notes.trim(),
      products: products.map((p) => ({
        productName: p.productName.trim(),
        brand: p.brand.trim(),
        category: p.category,
        quantity: Number(p.quantity) || 1,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        lineTotal: p.lineTotal ? Number(p.lineTotal) : null,
        warrantyPeriodValue: p.warrantyPeriodValue ? Number(p.warrantyPeriodValue) : null,
        warrantyPeriodUnit: p.warrantyPeriodUnit || 'months',
      })),
    };

    onSubmit(payload);
  };

  const totalSavings = products.reduce((acc, p) => {
    if (p.discountAmount != null && Number(p.discountAmount) > 0) {
      return acc + Number(p.discountAmount);
    }
    if (p.originalUnitPrice != null && p.unitPrice != null && Number(p.originalUnitPrice) > Number(p.unitPrice)) {
      const qty = Number(p.quantity) || 1;
      return acc + ((Number(p.originalUnitPrice) - Number(p.unitPrice)) * qty);
    }
    return acc;
  }, 0) + Number(initialData?.discountAmount || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-[#0F172A]">
      {/* 1. Receipt Header & Totals Section Card Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4 shadow-2xs">
        <h3 className="text-base font-bold text-[#0F172A] tracking-tight border-b border-[#E2E8F0] pb-3">
          Receipt header & totals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="manual-store" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V9a2 2 0 012-2h2a2 2 0 012 2v12" />
              </svg>
              Store / merchant
            </label>
            <input
              id="manual-store"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Reliance Retail"
              className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="manual-invoice" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-xs">#</span>
              Invoice / order #
            </label>
            <input
              id="manual-invoice"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-90428"
              className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-mono"
            />
          </div>

          <div>
            <label htmlFor="manual-date" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Purchase date *
            </label>
            <input
              id="manual-date"
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
            <label htmlFor="manual-subtotal" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Subtotal
            </label>
            <input
              id="manual-subtotal"
              type="number"
              step="0.01"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
            />
          </div>

          <div>
            <label htmlFor="manual-shipping" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Shipping / handling
            </label>
            <input
              id="manual-shipping"
              type="number"
              step="0.01"
              value={shippingAmount}
              onChange={(e) => setShippingAmount(e.target.value)}
              placeholder="0"
              className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
            />
          </div>

          <div>
            <label htmlFor="manual-tax" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Tax (GST)
            </label>
            <input
              id="manual-tax"
              type="number"
              step="0.01"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="0"
              className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
            />
          </div>

          <div>
            <div>
              <label htmlFor="manual-grandtotal" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
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
                  id="manual-grandtotal"
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
      </div>

      {/* 2. Shared Product List Form */}
      <ProductListForm
        items={products}
        onItemChange={handleProductChange}
        onAddItem={handleAddProduct}
        onRemoveItem={handleRemoveProduct}
        categoryOptions={CATEGORIES}
        errors={errors}
      />

      {/* 3. Notes Section Card Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-2 shadow-2xs">
        <label htmlFor="manual-notes" className="text-xs font-semibold text-slate-700 block">
          Notes
        </label>
        <textarea
          id="manual-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this purchase or receipt..."
          className="w-full text-xs p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-sans"
        />
      </div>

      {/* 4. Action Buttons Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#059669] rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          {isSubmitting ? 'Saving receipt...' : initialData ? 'Save changes' : 'Save receipt'}
        </button>
      </div>
    </form>
  );
};

export default ReceiptForm;
