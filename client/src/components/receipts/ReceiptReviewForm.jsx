import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import toast from '@/lib/toast';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  Eye,
  Edit3,
  Loader2,
} from 'lucide-react';
import { useCreateReceipt } from '../../queries/useReceiptMutations';
import { useCategoriesQuery } from '../../queries/useCategoryQueries';
import { formatDateForInput, getCurrencySymbol } from '../../utils/formatters';
import { DocumentViewer } from '@/components/data/DocumentViewer';
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
import { getAuthenticatedFileUrl } from '@/utils/fileUrl';
import { spring, ease } from '@/lib/motion';
import { firstReceiptMoment } from '@/lib/confetti';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export function ReceiptReviewForm({ ocrData, handwritingDetected = false, onCancel, onSuccess }) {
  const createMutation = useCreateReceipt();
  const { data: userCategories = [] } = useCategoriesQuery();
  const submitButtonRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);

  const extracted = useMemo(() => ocrData?.extracted || {}, [ocrData?.extracted]);
  const fileUrl = ocrData?.fileUrl || null;
  const fileData = ocrData?.fileData || null;
  const mimeType = ocrData?.mimeType || null;
  const fileType = ocrData?.fileType || 'image';
  const ocrRaw = ocrData?.ocrRaw || '';

  // Prefer data URI if available for instant display, fallback to authenticated fileUrl
  const documentSrc = useMemo(() => {
    if (fileData) {
      return fileData.startsWith('data:')
        ? fileData
        : `data:${mimeType || 'image/jpeg'};base64,${fileData}`;
    }
    if (fileUrl) {
      return getAuthenticatedFileUrl(fileUrl);
    }
    return null;
  }, [fileData, fileUrl, mimeType]);

  const userCatNames = Array.isArray(userCategories)
    ? userCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : [];
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...userCatNames]));

  // Mobile tab state: 'details' | 'document'
  const [mobileTab, setMobileTab] = useState('details');

  // Receipt Fields
  const [storeName, setStoreName] = useState(extracted.storeName?.value || '');
  const [invoiceNumber, setInvoiceNumber] = useState(extracted.invoiceNumber?.value || '');
  const [purchaseDate, setPurchaseDate] = useState(formatDateForInput(extracted.purchaseDate?.value));
  const dueDate = formatDateForInput(extracted.dueDate?.value);
  const [currency, setCurrency] = useState(extracted.currency?.value || 'INR');
  const [category, setCategory] = useState(extracted.category?.value || 'General');

  const currSym = getCurrencySymbol(currency);
  const [subtotal, setSubtotal] = useState(
    extracted.subtotal?.value != null ? String(extracted.subtotal.value) : ''
  );
  const [shippingAmount, setShippingAmount] = useState(
    extracted.shippingAmount?.value != null ? String(extracted.shippingAmount.value) : '0'
  );
  const [taxAmount, setTaxAmount] = useState(
    extracted.taxAmount?.value != null ? String(extracted.taxAmount.value) : '0'
  );
  const [discountAmount, setDiscountAmount] = useState(
    extracted.discountAmount?.value != null ? String(extracted.discountAmount.value) : '0'
  );
  const [grandTotal, setGrandTotal] = useState(
    extracted.grandTotal?.value != null
      ? String(extracted.grandTotal.value)
      : extracted.totalAmount?.value != null
      ? String(extracted.totalAmount.value)
      : ''
  );
  const [notes, setNotes] = useState('');

  // Confidence check helper
  const isLowConfidence = (field) => {
    const conf = extracted[field]?.confidence;
    return typeof conf === 'number' && conf < 80;
  };

  // Line items
  const initialItems = useMemo(() => {
    if (Array.isArray(extracted.items) && extracted.items.length > 0) {
      return extracted.items.map((item, idx) => ({
        id: item.id || `item-${idx + 1}-${Date.now()}`,
        productName: item.productName || '',
        brand: item.brand || '',
        category: item.category || category || 'General',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        lineTotal: item.lineTotal != null ? String(item.lineTotal) : '',
        warrantyPeriodValue: item.warrantyPeriodValue != null ? String(item.warrantyPeriodValue) : '',
        warrantyPeriodUnit: item.warrantyPeriodUnit || 'months',
        confidence: item.confidence ?? 85,
      }));
    }
    return [
      {
        id: `item-1-${Date.now()}`,
        productName: extracted.productName?.value || '',
        brand: extracted.brand?.value || '',
        category: category || 'General',
        quantity: 1,
        unitPrice:
          extracted.totalAmount?.value != null ? String(extracted.totalAmount.value) : '',
        lineTotal:
          extracted.totalAmount?.value != null ? String(extracted.totalAmount.value) : '',
        warrantyPeriodValue:
          extracted.warrantyPeriodValue?.value != null
            ? String(extracted.warrantyPeriodValue.value)
            : '',
        warrantyPeriodUnit: extracted.warrantyPeriodValue?.unit || 'months',
        confidence: 85,
      },
    ];
  }, [extracted, category]);

  const [items, setItems] = useState(initialItems);

  // Auto-recalculate line total and update subtotal & grand total
  const handleItemChange = (id, field, value) => {
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const up = { ...item, [field]: value };

        // Auto-recalculate line total when qty or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
          const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
          up.lineTotal = (qty * price).toFixed(2);
        }

        return up;
      });

      // Recalculate subtotal and grandTotal when quantities, prices, or lineTotals change
      if (field === 'quantity' || field === 'unitPrice' || field === 'lineTotal') {
        const newSum = updated.reduce((acc, it) => {
          const val = Number(it.lineTotal) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        const t = Number(taxAmount) || 0;
        const s = Number(shippingAmount) || 0;
        const d = Number(discountAmount) || 0;
        const newGrand = Math.max(0, newSum + t + s - d);
        setSubtotal(newSum > 0 ? newSum.toFixed(2) : '0');
        setGrandTotal(newGrand.toFixed(2));
      }

      return updated;
    });
  };

  const handleAddItem = () => {
    const newItemId = `item-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: newItemId,
        productName: '',
        brand: '',
        category: category || 'General',
        quantity: 1,
        unitPrice: '',
        lineTotal: '',
        warrantyPeriodValue: '',
        warrantyPeriodUnit: 'months',
        confidence: 100,
      },
    ]);

    // Auto-scroll and focus the newly added item's first input
    setTimeout(() => {
      const el = document.getElementById(`review-item-name-${newItemId}`);
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

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      toast.error('Receipt must contain at least one line item.');
      return;
    }
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const newSum = next.reduce((acc, it) => {
        const val = Number(it.lineTotal) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const t = Number(taxAmount) || 0;
      const s = Number(shippingAmount) || 0;
      const d = Number(discountAmount) || 0;
      const newGrand = Math.max(0, newSum + t + s - d);
      setSubtotal(newSum > 0 ? newSum.toFixed(2) : '0');
      setGrandTotal(newGrand.toFixed(2));
      return next;
    });
  };

  // Auto-recalculate grand total when subtotal, tax, shipping, or discount changes
  const handleSubtotalChange = (val) => {
    setSubtotal(val);
    const sub = Number(val) || 0;
    const t = Number(taxAmount) || 0;
    const s = Number(shippingAmount) || 0;
    const d = Number(discountAmount) || 0;
    setGrandTotal(Math.max(0, sub + t + s - d).toFixed(2));
  };

  const handleTaxChange = (val) => {
    setTaxAmount(val);
    const base = subtotal !== '' && !isNaN(Number(subtotal)) ? Number(subtotal) : sumLineTotals;
    const t = Number(val) || 0;
    const s = Number(shippingAmount) || 0;
    const d = Number(discountAmount) || 0;
    setGrandTotal(Math.max(0, base + t + s - d).toFixed(2));
  };

  const handleShippingChange = (val) => {
    setShippingAmount(val);
    const base = subtotal !== '' && !isNaN(Number(subtotal)) ? Number(subtotal) : sumLineTotals;
    const t = Number(taxAmount) || 0;
    const s = Number(val) || 0;
    const d = Number(discountAmount) || 0;
    setGrandTotal(Math.max(0, base + t + s - d).toFixed(2));
  };

  const handleDiscountChange = (val) => {
    setDiscountAmount(val);
    const base = subtotal !== '' && !isNaN(Number(subtotal)) ? Number(subtotal) : sumLineTotals;
    const t = Number(taxAmount) || 0;
    const s = Number(shippingAmount) || 0;
    const d = Number(val) || 0;
    setGrandTotal(Math.max(0, base + t + s - d).toFixed(2));
  };

  // Math Reconciliation calculations
  const sumLineTotals = useMemo(() => {
    return items.reduce((acc, item) => {
      const val = Number(item.lineTotal) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [items]);

  const grandVal = grandTotal !== '' && !isNaN(Number(grandTotal)) ? Number(grandTotal) : null;
  const subVal = subtotal !== '' && !isNaN(Number(subtotal)) ? Number(subtotal) : null;
  const taxVal = taxAmount !== '' && !isNaN(Number(taxAmount)) ? Number(taxAmount) : 0;
  const shipVal = shippingAmount !== '' && !isNaN(Number(shippingAmount)) ? Number(shippingAmount) : 0;
  const discVal = discountAmount !== '' && !isNaN(Number(discountAmount)) ? Number(discountAmount) : 0;

  const roundedSum = Number(sumLineTotals.toFixed(2));
  const roundedGrand = grandVal != null ? Number(grandVal.toFixed(2)) : null;

  // Expected reconciled total: base (subtotal or items sum) + tax + shipping - discount
  const baseForReconcile = subVal != null && subVal > 0 ? subVal : roundedSum;
  const reconciledExpected = Number(Math.max(0, baseForReconcile + taxVal + shipVal - discVal).toFixed(2));
  const itemsPlusTaxes = Number(Math.max(0, roundedSum + taxVal + shipVal - discVal).toFixed(2));

  // Multi-tier reconciliation check:
  // 1. Items + Tax + Shipping - Discount equals Grand Total (Standard itemized tax-exclusive)
  // 2. Subtotal + Tax + Shipping - Discount equals Grand Total and Items match Subtotal
  // 3. Tax-inclusive match: Items sum (+ shipping - discount) equals Grand Total
  // 4. Direct match: Items sum equals Grand Total
  const TOLERANCE = 0.02;
  const isReconciledMatch = grandVal != null && Math.abs(itemsPlusTaxes - grandVal) <= TOLERANCE;
  const isSubtotalReconciledMatch = grandVal != null && Math.abs(reconciledExpected - grandVal) <= TOLERANCE;
  const isTaxInclusiveMatch = grandVal != null && (Math.abs(roundedSum + shipVal - discVal - grandVal) <= TOLERANCE || Math.abs(roundedSum - grandVal) <= TOLERANCE);
  const isDirectMatch = grandVal != null && Math.abs(roundedSum - grandVal) <= TOLERANCE;

  const isMatch = isReconciledMatch || isSubtotalReconciledMatch || isTaxInclusiveMatch || isDirectMatch;
  const diff = grandVal != null ? Math.abs(reconciledExpected - grandVal) : 0;

  const handleUseItemSum = () => {
    setGrandTotal(reconciledExpected.toFixed(2));
    if (subVal == null || Math.abs(subVal - roundedSum) > TOLERANCE) {
      setSubtotal(roundedSum.toFixed(2));
    }
    toast.success(`Grand total updated to line items & tax total: ${currSym}${reconciledExpected.toFixed(2)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!storeName.trim()) {
      toast.error('Merchant or store name is required.');
      return;
    }

    const safeNum = (v, fallback = null) => {
      if (v === '' || v === null || v === undefined) return fallback;
      const num = Number(v);
      return isNaN(num) ? fallback : num;
    };

    const payload = {
      storeName: storeName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate: purchaseDate || new Date().toISOString(),
      dueDate: dueDate || undefined,
      category,
      subtotal: safeNum(subtotal, null),
      shippingAmount: safeNum(shippingAmount, 0),
      taxAmount: safeNum(taxAmount, 0),
      discountAmount: safeNum(discountAmount, 0),
      grandTotal: safeNum(grandTotal, roundedSum),
      totalAmount: safeNum(grandTotal, roundedSum),
      currency,
      notes: notes.trim(),
      fileUrl,
      fileData,
      mimeType,
      fileType,
      ocrRaw,
      products: items.map((item) => ({
        productName: item.productName.trim() || 'Product Item',
        brand: item.brand ? item.brand.trim() : '',
        category: item.category || category || 'General',
        quantity: Math.max(1, safeNum(item.quantity, 1)),
        unitPrice: safeNum(item.unitPrice, 0),
        lineTotal: safeNum(item.lineTotal, null),
        warrantyPeriodValue: safeNum(item.warrantyPeriodValue, null),
        warrantyPeriodUnit: item.warrantyPeriodUnit || 'months',
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        setIsSaved(true);
        firstReceiptMoment(submitButtonRef.current);
        const receiptId = data?.receipt?._id || data?._id;
        toast.success('Receipt saved', {
          description: 'Receipt reviewed and saved successfully.',
          action: receiptId
            ? {
                label: 'View receipt',
                onClick: () => {
                  if (onSuccess) onSuccess(data);
                },
              }
            : undefined,
        });
        setTimeout(() => {
          if (onSuccess) onSuccess(data);
        }, 360);
      },
      onError: (err) => {
        setIsSaved(false);
        const msg = err.response?.data?.message || 'Failed to save receipt.';
        toast.error(msg);
      },
    });
  };

  return (
    <div className="font-sans">
      {/* Mobile Tab Toggle */}
      <div className="flex lg:hidden items-center justify-between border-b border-line pb-3 mb-4">
        <div className="inline-flex items-center p-1 bg-subtle rounded-[8px] border border-line-subtle gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('details')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium transition-all ${
              mobileTab === 'details'
                ? 'bg-surface text-fg font-semibold shadow-xs'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            <Edit3 className="size-3.5" />
            <span>Details & items</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('document')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-medium transition-all ${
              mobileTab === 'document'
                ? 'bg-surface text-fg font-semibold shadow-xs'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            <Eye className="size-3.5" />
            <span>View document</span>
          </button>
        </div>
      </div>

      {/* Two-Pane Review Container: Viewport-filling grid with no outer vertical dead space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-215px)] lg:min-h-[580px] items-stretch">
        {/* LEFT PANE: Full-Height Document Viewer */}
        <div
          className={`lg:col-span-5 flex flex-col h-full min-h-[460px] ${
            mobileTab === 'details' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-3 flex items-center gap-1.5">
              <FileText className="size-3.5 text-accent" />
              <span>Original document</span>
            </h3>
            {handwritingDetected && (
              <span className="text-[11px] text-warn-fg bg-warn-bg border border-warn-line px-2 py-0.5 rounded-[4px] font-medium">
                Handwriting detected
              </span>
            )}
          </div>

          <m.div layoutId="doc-thumb" className="flex-1 min-h-0 rounded-[12px] overflow-hidden">
            {documentSrc ? (
              <DocumentViewer
                url={documentSrc}
                filename={`${storeName || 'Receipt'} Document`}
                type={fileType}
                className="h-full w-full shadow-xs"
              />
            ) : (
              <div className="h-full rounded-[12px] border border-line-dashed bg-subtle/50 flex flex-col items-center justify-center p-6 text-center text-fg-3">
                <FileText className="size-10 text-fg-3 mb-2" />
                <p className="text-xs font-medium text-fg">No document preview available</p>
                <p className="text-[11px] text-fg-3 mt-1">Details were extracted from text entry.</p>
              </div>
            )}
          </m.div>
        </div>

        {/* RIGHT PANE: Extracted Details, Line Items Table, Financials & Docked Action Bar */}
        <div
          className={`lg:col-span-7 flex flex-col h-full min-h-0 ${
            mobileTab === 'document' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* 1. Key Receipt Header Fields */}
              <div className="space-y-4">
                <div className="border-b border-line pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">Receipt details</h3>
                    <p className="text-xs text-fg-3">Verify extracted merchant and invoice data</p>
                  </div>
                  <span className="text-[11px] font-mono text-fg-3">Currency: {currency}</span>
                </div>

                <div className="space-y-3">
                  {/* Store / Merchant */}
                  <div data-field="storeName" className="space-y-1.5 field-reveal-highlight rounded-[8px]">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rev-store" className="text-xs font-medium text-fg flex items-center gap-1.5">
                        <span>Merchant / store *</span>
                        {isLowConfidence('storeName') && (
                          <m.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={spring.snappy}
                            className="size-1.5 rounded-full bg-warn-solid shrink-0"
                            title="Low OCR confidence - please verify"
                          />
                        )}
                      </Label>
                      {isLowConfidence('storeName') && (
                        <span className="text-[11px] text-warn-fg flex items-center gap-1 font-medium">
                          <span className="size-1.5 rounded-full bg-warn-solid" />
                          Check confidence
                        </span>
                      )}
                    </div>
                    <Input
                      id="rev-store"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Reliance Retail, Apple Store, Under Armour"
                      className="h-9 text-sm bg-surface"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Invoice / Order # */}
                    <div data-field="invoiceNumber" className="space-y-1.5 field-reveal-highlight rounded-[8px]">
                      <Label htmlFor="rev-invoice" className="text-xs font-medium text-fg flex items-center gap-1.5">
                        <span>Invoice / order #</span>
                        {isLowConfidence('invoiceNumber') && (
                          <m.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={spring.snappy}
                            className="size-1.5 rounded-full bg-warn-solid shrink-0"
                            title="Low OCR confidence"
                          />
                        )}
                      </Label>
                      <Input
                        id="rev-invoice"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="e.g. INV-2026-904"
                        className="font-mono text-xs h-9 bg-surface"
                      />
                    </div>

                    {/* Purchase Date */}
                    <div data-field="purchaseDate" className="space-y-1.5 field-reveal-highlight rounded-[8px]">
                      <Label htmlFor="rev-date" className="text-xs font-medium text-fg flex items-center gap-1.5">
                        <span>Purchase date *</span>
                        {isLowConfidence('purchaseDate') && (
                          <m.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={spring.snappy}
                            className="size-1.5 rounded-full bg-warn-solid shrink-0"
                            title="Low OCR confidence"
                          />
                        )}
                      </Label>
                      <Input
                        id="rev-date"
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="font-mono text-xs h-9 bg-surface"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div data-field="category" className="space-y-1.5 field-reveal-highlight rounded-[8px]">
                      <Label htmlFor="rev-cat" className="text-xs font-medium text-fg">
                        Primary category
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="rev-cat" className="text-xs h-9 bg-surface">
                          <SelectValue placeholder="Select category" />
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
                  </div>
                </div>
              </div>

              {/* 2. Line Items Editor Table */}
              <div data-field="items" className="space-y-3 pt-1">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-fg">Line items</h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-subtle border border-line-subtle text-fg-3 tnum">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="h-7 text-xs gap-1.5 font-medium cursor-pointer"
                  >
                    <Plus className="size-3.5 text-accent" />
                    <span>Add item</span>
                  </Button>
                </div>

                {/* High-density Table */}
                <div className="w-full">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-line-subtle text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                        <th className="py-2 px-1 w-6 text-center">#</th>
                        <th className="py-2 px-1.5 w-auto">Description & Brand</th>
                        <th className="py-2 px-1 w-12 text-center">Qty</th>
                        <th className="py-2 px-1.5 w-20 text-right">Unit price</th>
                        <th className="py-2 px-1.5 w-20 text-center">Warranty</th>
                        <th className="py-2 px-1.5 w-20 text-right">Total</th>
                        <th className="py-2 px-1 w-7 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-subtle/30 transition-colors">
                          <td className="py-2 px-1 text-xs font-mono text-fg-3 tnum text-center align-top pt-3">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-1.5 align-top space-y-1">
                            <Input
                              id={`review-item-name-${item.id}`}
                              value={item.productName}
                              onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                              placeholder="Product name *"
                              className="h-8 text-xs bg-surface"
                              required
                            />
                            <Input
                              value={item.brand || ''}
                              onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)}
                              placeholder="Brand (optional)"
                              className="h-6 text-[11px] bg-subtle/50 text-fg-2 border-line-subtle"
                            />
                          </td>
                          <td className="py-2 px-1 align-top pt-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                              className="h-8 text-xs tnum text-center bg-surface px-1"
                              required
                            />
                          </td>
                          <td className="py-2 px-1.5 align-top pt-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-xs tnum text-right font-mono bg-surface px-1.5"
                              required
                            />
                          </td>
                          <td className="py-2 px-1.5 align-top pt-2">
                            <div className="flex items-center gap-1 justify-center">
                              <Input
                                type="number"
                                min="0"
                                value={item.warrantyPeriodValue || ''}
                                onChange={(e) =>
                                  handleItemChange(item.id, 'warrantyPeriodValue', e.target.value)
                                }
                                placeholder="0"
                                className="h-8 text-xs tnum w-10 text-center bg-surface px-1"
                              />
                              <Select
                                value={item.warrantyPeriodUnit || 'months'}
                                onValueChange={(val) =>
                                  handleItemChange(item.id, 'warrantyPeriodUnit', val)
                                }
                              >
                                <SelectTrigger className="h-8 text-[11px] w-12 bg-surface px-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="months">mo</SelectItem>
                                  <SelectItem value="years">yr</SelectItem>
                                  <SelectItem value="days">d</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="py-2 px-1.5 text-right align-top pt-3.5 font-mono text-xs font-semibold text-fg tnum truncate">
                            {currSym} {Number(item.lineTotal || 0).toFixed(2)}
                          </td>
                          <td className="py-2 px-1 text-center align-top pt-2.5">
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="size-7 p-0 text-fg-3 hover:text-bad-fg hover:bg-bad-bg/20"
                                title="Remove item"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Financial Totals & Math Reconciliation */}
              <div className="space-y-3 pt-1">
                <div className="border-b border-line pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-fg">Financial amounts</h3>
                  <div className="w-24">
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="rev-curr" className="text-xs h-7">
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

                {/* Subtotal, Tax, Shipping, Discount Inputs */}
                <div data-field="financials" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="rev-subtotal" className="text-[11px] text-fg-3">
                      Subtotal
                    </Label>
                    <Input
                      id="rev-subtotal"
                      type="number"
                      step="0.01"
                      value={subtotal}
                      onChange={(e) => handleSubtotalChange(e.target.value)}
                      placeholder="0.00"
                      className="tnum text-xs bg-surface h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="rev-tax" className="text-[11px] text-fg-3">
                      Tax / GST
                    </Label>
                    <Input
                      id="rev-tax"
                      type="number"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => handleTaxChange(e.target.value)}
                      placeholder="0.00"
                      className="tnum text-xs bg-surface h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="rev-ship" className="text-[11px] text-fg-3">
                      Shipping
                    </Label>
                    <Input
                      id="rev-ship"
                      type="number"
                      step="0.01"
                      value={shippingAmount}
                      onChange={(e) => handleShippingChange(e.target.value)}
                      placeholder="0.00"
                      className="tnum text-xs bg-surface h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="rev-disc" className="text-[11px] text-fg-3">
                      Discount
                    </Label>
                    <Input
                      id="rev-disc"
                      type="number"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      placeholder="0.00"
                      className="tnum text-xs text-ok-fg bg-surface h-8"
                    />
                  </div>
                </div>

                {/* Grand Total Display */}
                <div data-field="grandTotal" className="p-3 rounded-[8px] bg-subtle/40 border border-line flex items-center justify-between gap-4 field-reveal-highlight">
                  <div>
                    <Label htmlFor="rev-total" className="text-xs font-semibold text-fg block">
                      Grand total amount
                    </Label>
                    <p className="text-[11px] text-fg-3">Final billed invoice value</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-fg-2">{currSym}</span>
                    <Input
                      id="rev-total"
                      type="number"
                      step="0.01"
                      value={grandTotal}
                      onChange={(e) => setGrandTotal(e.target.value)}
                      placeholder="0.00"
                      className="tnum font-bold text-lg text-right w-36 h-9 bg-surface border-line"
                      required
                    />
                  </div>
                </div>

                {/* Step 7.5: Math Reconciliation Banner with AnimatePresence & Icon morph */}
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait">
                    {isMatch ? (
                      <m.div
                        key="reconciled-match"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.14, ease: ease.out }}
                        className="flex items-center gap-2 p-2.5 rounded-[8px] border border-ok-line bg-ok-bg text-ok-fg text-xs font-medium transition-colors duration-150"
                      >
                        <m.div
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          transition={spring.snappy}
                          className="shrink-0"
                        >
                          <CheckCircle2 className="size-4 text-ok-fg" />
                        </m.div>
                        <span>
                          {taxVal > 0 || shipVal > 0 || discVal > 0
                            ? `Items add up to total with taxes & fees (${currSym}${roundedGrand != null ? roundedGrand.toFixed(2) : roundedSum.toFixed(2)})`
                            : `Items add up to total (${currSym}${roundedSum.toFixed(2)})`}
                        </span>
                      </m.div>
                    ) : (
                      <m.div
                        key="reconciled-diff"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.14, ease: ease.out }}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] border border-warn-line bg-warn-bg text-warn-fg text-xs font-medium flex-wrap transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <m.div
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            transition={spring.snappy}
                            className="shrink-0"
                          >
                            <AlertTriangle className="size-4 text-warn-fg" />
                          </m.div>
                          <span>
                            Items differ from total by {currSym}{diff.toFixed(2)} (Items sum: {currSym}{roundedSum.toFixed(2)}{taxVal > 0 ? ` + Tax: ${currSym}${taxVal.toFixed(2)}` : ''}{shipVal > 0 ? ` + Shipping: ${currSym}${shipVal.toFixed(2)}` : ''}{discVal > 0 ? ` - Disc: ${currSym}${discVal.toFixed(2)}` : ''}, Billed: {currSym}{roundedGrand != null ? roundedGrand.toFixed(2) : '0.00'})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUseItemSum}
                          className="h-7 text-xs border-warn-line hover:bg-warn-solid/10 text-warn-fg font-medium cursor-pointer"
                        >
                          Use item sum ({currSym}{reconciledExpected.toFixed(2)})
                        </Button>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notes */}
                <div className="space-y-1 pt-1">
                  <Label htmlFor="rev-notes" className="text-xs font-medium text-fg block">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="rev-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes, payment details, or return deadlines..."
                    className="text-xs bg-surface"
                  />
                </div>
              </div>
            </div>

            {/* DOCKED Action Row: Cleanly anchored at the bottom with zero dead whitespace */}
            <div className="flex items-center justify-end gap-3 pt-3 mt-3 border-t border-line shrink-0 bg-surface">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onCancel}
                disabled={createMutation.isPending || isSaved}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                ref={submitButtonRef}
                type="submit"
                variant="default"
                size="md"
                disabled={createMutation.isPending || isSaved}
                className="min-w-[140px] gap-2 font-medium cursor-pointer relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {isSaved ? (
                    <m.div
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-1.5"
                    >
                      <svg className="size-4" viewBox="0 0 16 16">
                        <m.path
                          d="M3 8.5l3.5 3.5 6.5-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.22, ease: ease.out }}
                        />
                      </svg>
                      <span>Saved</span>
                    </m.div>
                  ) : createMutation.isPending ? (
                    <m.div
                      key="saving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="size-4 animate-spin" />
                      <span>Saving receipt...</span>
                    </m.div>
                  ) : (
                    <m.div
                      key="save"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-2"
                    >
                      <span>Save receipt</span>
                      <ArrowRight className="size-4" />
                    </m.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReceiptReviewForm;
