import * as React from 'react';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatDateForInput, getCurrencySymbol } from '../../utils/formatters';
import { ProductListForm } from './ProductListForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_CATEGORIES } from '../../constants/category.constants';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export function ReceiptForm({ initialData = null, onSubmit, isSubmitting = false, onCancel = null }) {
  const [storeName, setStoreName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [category, setCategory] = useState('General');
  const [subtotal, setSubtotal] = useState('');
  const [shippingAmount, setShippingAmount] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [grandTotal, setGrandTotal] = useState('');
  const [notes, setNotes] = useState('');

  const [products, setProducts] = useState([
    {
      id: `item-1-${Date.now()}`,
      productName: '',
      brand: '',
      category: 'General',
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
      setCategory(initialData.category || 'General');
      setSubtotal(initialData.subtotal != null ? String(initialData.subtotal) : '');
      setShippingAmount(initialData.shippingAmount != null ? String(initialData.shippingAmount) : '0');
      setTaxAmount(initialData.taxAmount != null ? String(initialData.taxAmount) : '0');
      setDiscountAmount(initialData.discountAmount != null ? String(initialData.discountAmount) : '0');
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
            _id: p._id,
            productName: p.productName || '',
            brand: p.brand || '',
            category: p.category || 'General',
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
              category: initialData.category || 'General',
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

  const recalculateFromList = (itemList, tax = taxAmount, ship = shippingAmount, disc = discountAmount) => {
    const sum = itemList.reduce((acc, p) => acc + (Number(p.lineTotal) || 0), 0);
    const sub = sum;
    const t = Number(tax) || 0;
    const s = Number(ship) || 0;
    const d = Number(disc) || 0;
    const grand = Math.max(0, sub + t + s - d);

    setSubtotal(sub > 0 ? String(sub.toFixed(2)) : '0');
    setGrandTotal(String(grand.toFixed(2)));
  };

  const handleProductChange = (id, field, value) => {
    setProducts((prev) => {
      const updatedList = prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = Number(field === 'quantity' ? value : p.quantity) || 1;
          const price = Number(field === 'unitPrice' ? value : p.unitPrice);
          if (!isNaN(price) && updated.unitPrice !== '') {
            updated.lineTotal = String((qty * price).toFixed(2));
          } else {
            updated.lineTotal = '';
          }
        }
        return updated;
      });

      if (field === 'quantity' || field === 'unitPrice') {
        recalculateFromList(updatedList);
      }

      return updatedList;
    });
  };

  const handleAddProduct = () => {
    const newId = `prod-${Date.now()}`;
    setProducts((prev) => [
      ...prev,
      {
        id: newId,
        productName: '',
        brand: '',
        category: category || 'General',
        quantity: 1,
        unitPrice: '',
        lineTotal: '',
        warrantyPeriodValue: '',
        warrantyPeriodUnit: 'months',
      },
    ]);

    // Auto-scroll and focus the newly added item's first input
    setTimeout(() => {
      const el =
        document.getElementById(`product-name-${newId}`) ||
        document.getElementById(`product-name-mobile-${newId}`);
      if (el) {
        const container = document.getElementById('main') || el.closest('.overflow-y-auto');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const offset = elRect.top - containerRect.top - (containerRect.height / 2) + (elRect.height / 2);
          container.scrollBy({ top: offset, behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        el.focus({ preventScroll: true });
      }
    }, 60);
  };

  const handleRemoveProduct = (id) => {
    if (products.length <= 1) return;
    setProducts((prev) => {
      const updatedList = prev.filter((p) => p.id !== id);
      recalculateFromList(updatedList);
      return updatedList;
    });
  };

  const handleTaxChange = (val) => {
    setTaxAmount(val);
    const sub = Number(subtotal) || 0;
    const tax = Number(val) || 0;
    const ship = Number(shippingAmount) || 0;
    const disc = Number(discountAmount) || 0;
    setGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleShippingChange = (val) => {
    setShippingAmount(val);
    const sub = Number(subtotal) || 0;
    const tax = Number(taxAmount) || 0;
    const ship = Number(val) || 0;
    const disc = Number(discountAmount) || 0;
    setGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleDiscountChange = (val) => {
    setDiscountAmount(val);
    const sub = Number(subtotal) || 0;
    const tax = Number(taxAmount) || 0;
    const ship = Number(shippingAmount) || 0;
    const disc = Number(val) || 0;
    setGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleSubtotalChange = (val) => {
    setSubtotal(val);
    const sub = Number(val) || 0;
    const tax = Number(taxAmount) || 0;
    const ship = Number(shippingAmount) || 0;
    const disc = Number(discountAmount) || 0;
    setGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const validate = () => {
    const newErrors = {};
    if (!storeName.trim()) newErrors.storeName = 'Store or merchant name is required.';
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

    const payload = {
      storeName: storeName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate: validPurchaseDate,
      dueDate: validDueDate,
      category,
      subtotal: subtotal ? Number(subtotal) : null,
      shippingAmount: Number(shippingAmount || 0),
      taxAmount: Number(taxAmount || 0),
      discountAmount: Number(discountAmount || 0),
      grandTotal: grandTotal ? Number(grandTotal) : null,
      totalAmount: grandTotal ? Number(grandTotal) : null,
      notes: notes.trim(),
      fileType: initialData?.fileType || 'manual',
      products: products.map((p) => ({
        _id: p._id || (p.id && !String(p.id).startsWith('item-') ? p.id : undefined),
        productName: p.productName.trim(),
        brand: p.brand ? p.brand.trim() : '',
        category: p.category || category || 'General',
        quantity: Number(p.quantity) || 1,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        lineTotal: p.lineTotal ? Number(p.lineTotal) : null,
        warrantyPeriodValue: p.warrantyPeriodValue ? Number(p.warrantyPeriodValue) : null,
        warrantyPeriodUnit: p.warrantyPeriodUnit || 'months',
      })),
    };

    onSubmit(payload);
  };

  const currSym = getCurrencySymbol(currency);

  const calculateFromItems = () => {
    const sum = products.reduce((acc, p) => acc + (Number(p.lineTotal) || 0), 0);
    const sub = sum;
    const tax = Number(taxAmount) || 0;
    const ship = Number(shippingAmount) || 0;
    const disc = Number(discountAmount) || 0;
    const grand = Math.max(0, sub + tax + ship - disc);

    setSubtotal(sub > 0 ? String(sub.toFixed(2)) : '');
    setGrandTotal(grand > 0 ? String(grand.toFixed(2)) : '');
  };

  return (
    <form onSubmit={handleSubmit} className="font-sans space-y-8 w-full">
      {/* 1. Basic Details Across 4 Columns */}
      <div className="space-y-4">
        <div className="border-b border-line pb-2">
          <h3 className="text-sm font-semibold text-fg">Receipt details</h3>
          <p className="text-xs text-fg-3">Enter merchant, invoice number, and transaction date</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="manual-store" className="text-xs font-medium text-fg">
              Merchant / store *
            </Label>
            <Input
              id="manual-store"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Apple Store, Amazon"
              className="text-sm h-9 bg-surface"
              required
            />
            {errors.storeName && (
              <p className="text-xs text-bad-fg font-medium">{errors.storeName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-invoice" className="text-xs font-medium text-fg">
              Invoice / order #
            </Label>
            <Input
              id="manual-invoice"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-90428"
              className="text-xs font-mono h-9 bg-surface"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-date" className="text-xs font-medium text-fg">
              Purchase date *
            </Label>
            <Input
              id="manual-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="text-xs font-mono h-9 bg-surface"
              required
            />
            {errors.purchaseDate && (
              <p className="text-xs text-bad-fg font-medium">{errors.purchaseDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-cat" className="text-xs font-medium text-fg">
              Primary category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="manual-cat" className="text-xs h-9 bg-surface">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Full-Width Line Items Table */}
      <div className="space-y-2">
        <ProductListForm
          items={products}
          onItemChange={handleProductChange}
          onAddItem={handleAddProduct}
          onRemoveItem={handleRemoveProduct}
          categoryOptions={DEFAULT_CATEGORIES}
          currencySymbol={currSym}
          errors={errors}
        />
      </div>

      {/* 3. Bottom Split: Notes (Left 7 cols) & Summary Breakdown (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Notes & Reference */}
        <div className="lg:col-span-7 space-y-2">
          <div className="border-b border-line pb-2">
            <Label htmlFor="manual-notes" className="text-sm font-semibold text-fg block">
              Notes & reference
            </Label>
            <p className="text-xs text-fg-3">Add return policy, warranty claim notes, or payment references</p>
          </div>
          <Textarea
            id="manual-notes"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Return window within 14 days, serial numbers, warranty support contact..."
            className="text-xs bg-surface leading-relaxed"
          />
        </div>

        {/* Financial Summary & Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[12px] border border-line bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle">
              <h3 className="text-sm font-semibold text-fg">Summary</h3>
              <div className="w-28">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="manual-currency" className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grand Total Callout */}
            <div className="space-y-1.5 p-3 rounded-[8px] bg-subtle/50 border border-line-subtle">
              <div className="flex items-center justify-between">
                <Label htmlFor="manual-grandtotal" className="text-xs font-semibold text-fg">
                  Grand total
                </Label>
                <span className="text-[11px] font-mono text-fg-3">{currency}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-fg-2">{currSym}</span>
                <Input
                  id="manual-grandtotal"
                  type="number"
                  step="0.01"
                  value={grandTotal}
                  onChange={(e) => setGrandTotal(e.target.value)}
                  placeholder="0.00"
                  className="text-xl font-bold font-mono tnum text-right h-10 bg-surface border-line"
                  required
                />
              </div>
              {errors.grandTotal && (
                <p className="text-xs text-bad-fg font-medium">{errors.grandTotal}</p>
              )}
            </div>

            {/* Breakdown Inputs */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="manual-subtotal" className="text-fg-3">Subtotal</Label>
                <Input
                  id="manual-subtotal"
                  type="number"
                  step="0.01"
                  value={subtotal}
                  onChange={(e) => handleSubtotalChange(e.target.value)}
                  placeholder="0.00"
                  className="w-32 h-8 text-xs tnum text-right font-mono bg-surface"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="manual-tax" className="text-fg-3">Tax / GST</Label>
                <Input
                  id="manual-tax"
                  type="number"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => handleTaxChange(e.target.value)}
                  placeholder="0.00"
                  className="w-32 h-8 text-xs tnum text-right font-mono bg-surface"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="manual-shipping" className="text-fg-3">Shipping</Label>
                <Input
                  id="manual-shipping"
                  type="number"
                  step="0.01"
                  value={shippingAmount}
                  onChange={(e) => handleShippingChange(e.target.value)}
                  placeholder="0.00"
                  className="w-32 h-8 text-xs tnum text-right font-mono bg-surface"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="manual-discount" className="text-fg-3">Discount</Label>
                <Input
                  id="manual-discount"
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-32 h-8 text-xs tnum text-right font-mono text-ok-fg bg-surface"
                />
              </div>
            </div>

            {/* Quick Auto-calculate Helper */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={calculateFromItems}
              className="w-full text-xs text-accent hover:text-accent font-medium h-7"
            >
              Recalculate total from items
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Action Row */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-line">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            className="px-5 cursor-pointer"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          size="md"
          disabled={isSubmitting}
          className="px-6 gap-2 font-medium cursor-pointer"
        >
          {isSubmitting ? 'Saving receipt...' : initialData ? 'Save changes' : 'Save receipt'}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

export default ReceiptForm;
