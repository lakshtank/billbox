import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useBatchStatusQuery, useSaveBatchFile } from '../queries/useUploadMutations';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import ReceiptViewer from '../components/receipts/ReceiptViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDateForInput } from '../utils/formatters';
import ProductListForm from '../components/receipts/ProductListForm';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const BatchReview = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const { data: batchData, isLoading, isError } = useBatchStatusQuery(batchId);
  const saveBatchFileMutation = useSaveBatchFile();

  const [viewingFile, setViewingFile] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !batchData) {
    return (
      <EmptyState
        title="Batch session not found"
        description="The batch upload session you are looking for does not exist."
        actionLabel="Back to Add Receipt"
        onAction={() => navigate('/receipts/new')}
      />
    );
  }

  const files = batchData.files || [];
  const savedCount = files.filter((f) => f.status === 'saved').length;
  const totalCount = files.length;
  const needsReviewCount = files.filter((f) => f.status === 'needs_review').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;

  const handleSaveAll = async () => {
    const pendingFiles = files
      .map((f, idx) => ({ ...f, originalIndex: idx }))
      .filter((f) => f.status !== 'saved' && f.status !== 'failed');

    if (pendingFiles.length === 0) {
      toast.error('No pending receipts left to save.');
      return;
    }

    setIsSavingAll(true);
    toast.loading(`Saving ${pendingFiles.length} receipts in batch...`, { id: 'save-all' });

    let count = 0;
    for (const item of pendingFiles) {
      const extracted = item.ocrResult?.extracted || {};
      const storeName = extracted.storeName?.value || '';
      const invoiceNumber = extracted.invoiceNumber?.value || '';
      const purchaseDate = extracted.purchaseDate?.value
        ? new Date(extracted.purchaseDate.value).toISOString()
        : new Date().toISOString();
      const grandTotal = extracted.grandTotal?.value != null ? Number(extracted.grandTotal.value) : (extracted.totalAmount?.value != null ? Number(extracted.totalAmount.value) : null);
      const subtotal = extracted.subtotal?.value != null ? Number(extracted.subtotal.value) : null;
      const shippingAmount = extracted.shippingAmount?.value != null ? Number(extracted.shippingAmount.value) : 0;
      const taxAmount = extracted.taxAmount?.value != null ? Number(extracted.taxAmount.value) : 0;

      const itemsList = Array.isArray(extracted.items) && extracted.items.length > 0
        ? extracted.items.map((i) => ({
            productName: i.productName || item.originalName?.replace(/\.[^/.]+$/, '') || 'Untitled Item',
            brand: i.brand || '',
            category: i.category || 'Others',
            quantity: Number(i.quantity) || 1,
            originalUnitPrice: i.originalUnitPrice != null ? Number(i.originalUnitPrice) : (i.unitPrice != null ? Number(i.unitPrice) : null),
            unitPrice: i.unitPrice != null ? Number(i.unitPrice) : null,
            discountAmount: i.discountAmount != null ? Number(i.discountAmount) : 0,
            discountPercent: i.discountPercent != null ? Number(i.discountPercent) : 0,
            lineTotal: i.lineTotal != null ? Number(i.lineTotal) : null,
            warrantyPeriodValue: i.warrantyPeriodValue != null ? Number(i.warrantyPeriodValue) : null,
            warrantyPeriodUnit: i.warrantyPeriodUnit || 'months',
          }))
        : [
            {
              productName: extracted.productName?.value || item.originalName?.replace(/\.[^/.]+$/, '') || 'Untitled Item',
              brand: extracted.brand?.value || '',
              category: extracted.category?.value || 'Others',
              quantity: 1,
              originalUnitPrice: grandTotal,
              unitPrice: grandTotal,
              discountAmount: 0,
              discountPercent: 0,
              lineTotal: grandTotal,
              warrantyPeriodValue: extracted.warrantyPeriodValue?.value != null ? Number(extracted.warrantyPeriodValue.value) : null,
              warrantyPeriodUnit: extracted.warrantyPeriodValue?.unit || 'months',
            },
          ];

      const receiptData = {
        storeName,
        invoiceNumber,
        purchaseDate,
        subtotal,
        discountAmount: extracted.discountAmount?.value != null ? Number(extracted.discountAmount.value) : 0,
        shippingAmount,
        taxAmount,
        grandTotal,
        totalAmount: grandTotal,
        currency: extracted.currency?.value || 'INR',
        products: itemsList,
        notes: '',
        fileUrl: item.fileUrl,
        fileType: item.fileType,
        ocrRaw: item.ocrResult?.ocrRaw || '',
      };

      try {
        await saveBatchFileMutation.mutateAsync({
          batchId,
          fileIndex: item.originalIndex,
          receiptData,
        });
        count++;
      } catch (err) {
        console.error(`Error saving batch file #${item.originalIndex}:`, err);
      }
    }

    setIsSavingAll(false);
    toast.success(`Successfully saved ${count} receipts!`, { id: 'save-all' });
  };

  return (
    <div className="min-h-screen bg-white px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-8 text-[#0F172A] font-sans">
      {/* Document Viewer Modal */}
      {viewingFile && (
        <ReceiptViewer
          fileUrl={viewingFile.fileUrl}
          fileName={viewingFile.originalName || 'Batch Receipt Document'}
          fileType={viewingFile.fileType}
          onClose={() => setViewingFile(null)}
        />
      )}

      {/* 1. Page Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/receipts/new" className="hover:text-[#0F172A] no-underline text-[#64748B]">
              Add receipt
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#0F172A] font-medium">Batch review</span>
          </div>
          <h1 className="text-[30px] font-bold text-[#0F172A] tracking-[-0.02em] leading-none">
            Batch receipt review
          </h1>
          <p className="text-xs text-[#64748B] font-normal mt-1.5">
            Review OCR extracted data for each receipt and save them to your account
          </p>
        </div>

        <div className="flex items-center gap-3">
          {needsReviewCount > 0 && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#059669] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {isSavingAll ? 'Saving all...' : `Save all (${needsReviewCount})`}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/receipts')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Go to receipts →
          </button>
        </div>
      </div>

      {/* 2. Progress Status Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs pt-1">
        <div>
          <span className="text-sm font-bold text-[#0F172A] block">
            {needsReviewCount === 0 && savedCount > 0
              ? 'All receipts in batch saved successfully'
              : `${needsReviewCount} receipts pending review and save`}
          </span>
          <span className="text-[#64748B] font-tabular font-normal block mt-0.5">
            {savedCount} saved · {needsReviewCount} pending review · {failedCount} failed
          </span>
        </div>
      </div>

      {/* 3. Stacked Batch Receipt Review Blocks */}
      <div className="space-y-12">
        {files.map((fileItem, index) => (
          <BatchFileReviewCard
            key={fileItem._id || index}
            fileItem={fileItem}
            fileIndex={index}
            batchId={batchId}
            onViewFile={(file) => setViewingFile(file)}
            saveMutation={saveBatchFileMutation}
          />
        ))}
      </div>
    </div>
  );
};

const BatchFileReviewCard = ({ fileItem, fileIndex, batchId, onViewFile, saveMutation }) => {
  const { data: userCategories = [] } = useCategoriesQuery();
  const ocrResult = fileItem.ocrResult || {};
  const extracted = ocrResult.extracted || {};
  const isLowConfidence = ocrResult.hasAnyLowConfidence || fileItem.status === 'needs_review';

  const userCatNames = Array.isArray(userCategories)
    ? userCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : [];
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...userCatNames]));

  const [storeName, setStoreName] = useState(extracted.storeName?.value || '');
  const [invoiceNumber, setInvoiceNumber] = useState(extracted.invoiceNumber?.value || '');
  const [purchaseDate, setPurchaseDate] = useState(formatDateForInput(extracted.purchaseDate?.value));
  const [grandTotal, setGrandTotal] = useState(
    extracted.grandTotal?.value != null
      ? String(extracted.grandTotal.value)
      : extracted.totalAmount?.value != null
      ? String(extracted.totalAmount.value)
      : ''
  );
  const [currency, setCurrency] = useState(extracted.currency?.value || 'INR');
  const [subtotal, setSubtotal] = useState(extracted.subtotal?.value != null ? String(extracted.subtotal.value) : '');

  const initialItems = Array.isArray(extracted.items) && extracted.items.length > 0
    ? extracted.items.map((i, idx) => ({
        id: i.id || `item-${idx + 1}-${Date.now()}`,
        productName: i.productName || fileItem.originalName?.replace(/\.[^/.]+$/, '') || 'Untitled Item',
        brand: i.brand || '',
        category: i.category || 'Others',
        quantity: i.quantity || 1,
        originalUnitPrice: i.originalUnitPrice != null ? String(i.originalUnitPrice) : (i.unitPrice != null ? String(i.unitPrice) : ''),
        unitPrice: i.unitPrice != null ? String(i.unitPrice) : '',
        discountAmount: i.discountAmount != null ? String(i.discountAmount) : '0',
        discountPercent: i.discountPercent != null ? String(i.discountPercent) : '0',
        lineTotal: i.lineTotal != null ? String(i.lineTotal) : '',
        warrantyPeriodValue: i.warrantyPeriodValue != null ? String(i.warrantyPeriodValue) : '',
        warrantyPeriodUnit: i.warrantyPeriodUnit || 'months',
        needsReview: isLowConfidence,
      }))
    : [
        {
          id: `item-1-${Date.now()}`,
          productName: extracted.productName?.value || fileItem.originalName?.replace(/\.[^/.]+$/, '') || 'Untitled Item',
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
          needsReview: isLowConfidence,
        },
      ];

  const [items, setItems] = useState(initialItems);
  const [errors, setErrors] = useState({});
  const [isSavedLocally, setIsSavedLocally] = useState(fileItem.status === 'saved');
  const isSaved = fileItem.status === 'saved' || isSavedLocally;

  const isPdf = fileItem.fileType === 'pdf' || fileItem.originalName?.toLowerCase().endsWith('.pdf');

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
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
        needsReview: false,
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const validate = () => {
    const newErrors = {};
    if (!purchaseDate) newErrors.purchaseDate = 'Purchase date is required.';
    const itemErrs = {};
    items.forEach((item) => {
      if (!item.productName.trim()) itemErrs[item.id] = 'Required';
    });
    if (Object.keys(itemErrs).length > 0) newErrors.items = itemErrs;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const receiptData = {
      storeName: storeName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate: new Date(purchaseDate).toISOString(),
      subtotal: subtotal ? Number(subtotal) : null,
      discountAmount: extracted.discountAmount?.value != null ? Number(extracted.discountAmount.value) : 0,
      grandTotal: grandTotal ? Number(grandTotal) : null,
      totalAmount: grandTotal ? Number(grandTotal) : null,
      currency: extracted.currency?.value || 'INR',
      fileUrl: fileItem.fileUrl,
      fileType: fileItem.fileType,
      ocrRaw: ocrResult.ocrRaw || '',
      products: items.map((i) => ({
        productName: i.productName.trim(),
        brand: i.brand.trim(),
        category: i.category,
        quantity: Number(i.quantity) || 1,
        originalUnitPrice: i.originalUnitPrice ? Number(i.originalUnitPrice) : (i.unitPrice ? Number(i.unitPrice) : null),
        unitPrice: i.unitPrice ? Number(i.unitPrice) : null,
        discountAmount: i.discountAmount ? Number(i.discountAmount) : 0,
        discountPercent: i.discountPercent ? Number(i.discountPercent) : 0,
        lineTotal: i.lineTotal ? Number(i.lineTotal) : null,
        warrantyPeriodValue: i.warrantyPeriodValue ? Number(i.warrantyPeriodValue) : null,
        warrantyPeriodUnit: i.warrantyPeriodUnit || 'months',
      })),
    };

    saveMutation.mutate(
      { batchId, fileIndex, receiptData },
      {
        onSuccess: () => {
          setIsSavedLocally(true);
          toast.success(`Saved receipt #${fileIndex + 1}!`);
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to save receipt.';
          toast.error(msg);
        },
      }
    );
  };

  const totalSavings = items.reduce((acc, i) => {
    if (i.discountAmount != null && Number(i.discountAmount) > 0) {
      return acc + Number(i.discountAmount);
    }
    if (i.originalUnitPrice != null && i.unitPrice != null && Number(i.originalUnitPrice) > Number(i.unitPrice)) {
      const qty = Number(i.quantity) || 1;
      return acc + ((Number(i.originalUnitPrice) - Number(i.unitPrice)) * qty);
    }
    return acc;
  }, 0) + Number(extracted.discountAmount?.value || 0);

  return (
    <div className="border-t border-[#E2E8F0] pt-6 space-y-6 font-sans text-[#0F172A]">
      {/* Block Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-[#64748B] font-mono">
            #{fileIndex + 1}
          </span>
          <div className="min-w-0 flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] truncate max-w-[280px] sm:max-w-md">
              {fileItem.originalName || `Receipt file #${fileIndex + 1}`}
            </h3>
            <span className="text-[11px] font-medium text-[#64748B] font-mono">
              {isPdf ? 'PDF' : 'Image'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {fileItem.fileUrl && (
            <button
              type="button"
              onClick={() => onViewFile(fileItem)}
              className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              View document
            </button>
          )}

          {isSaved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              <svg className="w-3.5 h-3.5 text-[#047857] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Saved
            </span>
          ) : fileItem.status === 'failed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
              <svg className="w-3.5 h-3.5 text-[#DC2626] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              <svg className="w-3.5 h-3.5 text-[#047857] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ready for review
            </span>
          )}
        </div>
      </div>

      {/* Form Fields for Review */}
      {!isSaved && fileItem.status !== 'failed' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V9a2 2 0 012-2h2a2 2 0 012 2v12" />
                </svg>
                Store / merchant
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Reliance Digital"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="text-slate-500 font-bold text-xs">#</span>
                Invoice / order #
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-9042"
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Purchase date *
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full text-xs h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#047857] focus:ring-1 focus:ring-[#047857] transition-colors font-tabular"
              />
              {errors.purchaseDate && <p className="text-xs text-rose-500 mt-1">{errors.purchaseDate}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Grand total</span>
                {totalSavings > 0 && (
                  <span className="text-[11px] text-[#047857] font-medium font-tabular">
                    Saved ₹{totalSavings.toFixed(2)}
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

          {/* Shared Product List Component (Identical to Single Review & Manual Entry) */}
          <ProductListForm
            items={items}
            onItemChange={handleItemChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            categoryOptions={categoryOptions}
            errors={errors}
          />

          <div className="flex items-center justify-end pt-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#059669] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save receipt'}
            </button>
          </div>
        </form>
      )}

      {isSaved && (
        <div className="text-xs text-[#64748B] font-normal flex items-center justify-between pt-1">
          <span>Receipt saved to database.</span>
          {fileItem.receiptId && (
            <Link
              to={`/receipts/${fileItem.receiptId}`}
              className="text-xs font-semibold text-[#0F172A] hover:underline no-underline"
            >
              View receipt →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchReview;
