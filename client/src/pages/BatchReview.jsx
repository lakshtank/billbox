import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from '@/lib/toast';
import { useBatchStatusQuery, useSaveBatchFile } from '../queries/useUploadMutations';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import { DocumentViewer } from '../components/data/DocumentViewer';
import { Skeleton } from '../components/ui/skeleton';
import { StatusBadge } from '../components/data/StatusBadge';
import { Money } from '../components/data/Money';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatDateForInput } from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../constants/category.constants';
import {
  FileText,
  Eye,
  Edit2,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  X,
  FileCheck,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getAuthenticatedFileUrl } from '../utils/fileUrl';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export default function BatchReview() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const { data: batchData, isLoading, isError } = useBatchStatusQuery(batchId);
  const saveBatchFileMutation = useSaveBatchFile();
  const { data: userCategories = [] } = useCategoriesQuery();

  const [viewingFile, setViewingFile] = useState(null);
  const [reviewingIndex, setReviewingIndex] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Local state map for file edits indexed by fileIndex
  const [fileEdits, setFileEdits] = useState({});

  const userCatList = Array.isArray(userCategories)
    ? userCategories
    : Array.isArray(userCategories?.categories)
    ? userCategories.categories
    : [];
  const userCatNames = userCatList.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...userCatNames]));

  const files = useMemo(() => batchData?.files || [], [batchData?.files]);

  // Initialize local edits from OCR extracted results
  useEffect(() => {
    if (files.length > 0) {
      setFileEdits((prev) => {
        const next = { ...prev };
        files.forEach((fileItem, idx) => {
          if (!next[idx]) {
            const extracted = fileItem.ocrResult?.extracted || {};
            const grandTotalVal =
              extracted.grandTotal?.value != null
                ? extracted.grandTotal.value
                : extracted.totalAmount?.value != null
                ? extracted.totalAmount.value
                : '';

            const itemsList =
              Array.isArray(extracted.items) && extracted.items.length > 0
                ? extracted.items.map((i, itemIdx) => ({
                    id: i.id || `item-${itemIdx + 1}-${Date.now()}`,
                    productName: (
                      i.productName ||
                      fileItem.originalName?.replace(/\.[^/.]+$/, '') ||
                      'Untitled Item'
                    ).trim(),
                    brand: (i.brand || '').trim(),
                    category: i.category || 'Others',
                    quantity: Number(i.quantity) || 1,
                    unitPrice: i.unitPrice != null ? String(i.unitPrice) : '',
                    discountAmount: i.discountAmount != null ? String(i.discountAmount) : '0',
                    lineTotal: i.lineTotal != null ? String(i.lineTotal) : '',
                    warrantyPeriodValue: i.warrantyPeriodValue != null ? String(i.warrantyPeriodValue) : '',
                    warrantyPeriodUnit: i.warrantyPeriodUnit || 'months',
                  }))
                : [
                    {
                      id: `item-1-${Date.now()}`,
                      productName: (
                        extracted.productName?.value ||
                        fileItem.originalName?.replace(/\.[^/.]+$/, '') ||
                        'Untitled Item'
                      ).trim(),
                      brand: (extracted.brand?.value || '').trim(),
                      category: extracted.category?.value || 'Others',
                      quantity: 1,
                      unitPrice: grandTotalVal ? String(grandTotalVal) : '',
                      discountAmount: '0',
                      lineTotal: grandTotalVal ? String(grandTotalVal) : '',
                      warrantyPeriodValue:
                        extracted.warrantyPeriodValue?.value != null
                          ? String(extracted.warrantyPeriodValue.value)
                          : '',
                      warrantyPeriodUnit: extracted.warrantyPeriodValue?.unit || 'months',
                    },
                  ];

            next[idx] = {
              storeName: (extracted.storeName?.value || '').trim(),
              invoiceNumber: (extracted.invoiceNumber?.value || '').trim(),
              purchaseDate: formatDateForInput(extracted.purchaseDate?.value),
              grandTotal: grandTotalVal ? String(grandTotalVal) : '',
              subtotal: extracted.subtotal?.value != null ? String(extracted.subtotal.value) : '',
              currency: extracted.currency?.value || 'INR',
              items: itemsList,
              isSaved: fileItem.status === 'saved',
            };
          }
        });
        return next;
      });
    }
  }, [files]);

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans select-none max-w-5xl mx-auto" aria-busy="true">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-6 rounded-[12px] border border-line bg-surface space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-6 p-6 rounded-[12px] border border-line bg-surface space-y-4">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !batchData) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="size-12 rounded-[12px] bg-warn-bg text-warn-text border border-warn-border flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-lg font-semibold text-fg">Batch session not found</h2>
        <p className="text-xs text-fg-muted">
          The batch upload session you are looking for does not exist or has expired.
        </p>
        <Button asChild size="sm">
          <Link to="/receipts/new">Back to add receipt</Link>
        </Button>
      </div>
    );
  }

  const safeNum = (val, defaultVal = null) => {
    if (val == null || val === '' || val === '-' || val === 'Not mentioned') return defaultVal;
    const n = Number(val);
    return isNaN(n) ? defaultVal : n;
  };

  const savedCount = files.filter(
    (f, idx) => f.status === 'saved' || fileEdits[idx]?.isSaved
  ).length;
  const totalCount = files.length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const pendingCount = totalCount - savedCount - failedCount;

  const handleUpdateEdit = (fileIndex, field, value) => {
    setFileEdits((prev) => ({
      ...prev,
      [fileIndex]: {
        ...prev[fileIndex],
        [field]: value,
      },
    }));
  };

  const handleItemField = (fileIndex, itemId, field, value) => {
    setFileEdits((prev) => {
      const current = prev[fileIndex] || {};
      const currentItems = current.items || [];
      const updatedItems = currentItems.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = Number(field === 'quantity' ? value : updated.quantity) || 1;
            const price = Number(field === 'unitPrice' ? value : updated.unitPrice) || 0;
            updated.lineTotal = String((qty * price).toFixed(2));
          }
          return updated;
        }
        return item;
      });
      return {
        ...prev,
        [fileIndex]: {
          ...current,
          items: updatedItems,
        },
      };
    });
  };

  const handleAddItem = (fileIndex) => {
    const newItemId = `item-${Date.now()}`;
    setFileEdits((prev) => {
      const current = prev[fileIndex] || {};
      const currentItems = current.items || [];
      const newItem = {
        id: newItemId,
        productName: '',
        brand: '',
        category: 'Others',
        quantity: 1,
        unitPrice: '',
        lineTotal: '',
        warrantyPeriodValue: '',
        warrantyPeriodUnit: 'months',
      };
      return {
        ...prev,
        [fileIndex]: {
          ...current,
          items: [...currentItems, newItem],
        },
      };
    });

    // Auto-scroll and focus the newly added item's first input
    setTimeout(() => {
      const el = document.getElementById(`batch-item-name-${newItemId}`);
      if (el) {
        const container = el.closest('.overflow-y-auto');
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

  const handleRemoveItem = (fileIndex, itemId) => {
    setFileEdits((prev) => {
      const current = prev[fileIndex] || {};
      const currentItems = current.items || [];
      if (currentItems.length <= 1) return prev;
      return {
        ...prev,
        [fileIndex]: {
          ...current,
          items: currentItems.filter((item) => item.id !== itemId),
        },
      };
    });
  };

  const buildReceiptPayload = (fileIndex) => {
    const edit = fileEdits[fileIndex] || {};
    const fileItem = files[fileIndex];
    const extracted = fileItem?.ocrResult?.extracted || {};

    let validPurchaseDate = new Date().toISOString();
    if (edit.purchaseDate) {
      const parsed = new Date(edit.purchaseDate);
      if (!isNaN(parsed.getTime())) {
        validPurchaseDate = parsed.toISOString();
      }
    }

    const finalGrandTotal = safeNum(edit.grandTotal, null);

    return {
      storeName: (edit.storeName || '').trim(),
      invoiceNumber: (edit.invoiceNumber || '').trim(),
      purchaseDate: validPurchaseDate,
      subtotal: safeNum(edit.subtotal, null),
      discountAmount: safeNum(extracted.discountAmount?.value, 0),
      grandTotal: finalGrandTotal,
      totalAmount: finalGrandTotal,
      currency: edit.currency || 'INR',
      fileUrl: fileItem.fileUrl,
      fileType: fileItem.fileType,
      ocrRaw: fileItem.ocrResult?.ocrRaw || '',
      products: (edit.items || []).map((i) => {
        const uPrice = safeNum(i.unitPrice, null);
        return {
          productName: (i.productName || 'Untitled Item').trim(),
          brand: (i.brand || '').trim(),
          category: i.category || 'Others',
          quantity: safeNum(i.quantity, 1) > 0 ? safeNum(i.quantity, 1) : 1,
          originalUnitPrice: safeNum(i.unitPrice, uPrice),
          unitPrice: uPrice,
          discountAmount: safeNum(i.discountAmount, 0),
          discountPercent: 0,
          lineTotal: safeNum(i.lineTotal, null),
          warrantyPeriodValue: safeNum(i.warrantyPeriodValue, null),
          warrantyPeriodUnit: i.warrantyPeriodUnit || 'months',
        };
      }),
    };
  };

  const handleSaveSingle = async (fileIndex, shouldAdvance = false) => {
    const receiptData = buildReceiptPayload(fileIndex);

    try {
      await saveBatchFileMutation.mutateAsync({
        batchId,
        fileIndex,
        receiptData,
      });
      setFileEdits((prev) => ({
        ...prev,
        [fileIndex]: { ...(prev[fileIndex] || {}), isSaved: true },
      }));
      toast.success(`Saved receipt #${fileIndex + 1}`);

      if (shouldAdvance && fileIndex < files.length - 1) {
        setReviewingIndex(fileIndex + 1);
      } else if (!shouldAdvance) {
        setReviewingIndex(null);
      }
    } catch (err) {
      console.error(`Error saving receipt #${fileIndex + 1}:`, err);
      toast.error(err.response?.data?.message || 'Failed to save receipt.');
    }
  };

  const handleSaveAll = async () => {
    const pendingIndexes = files
      .map((_, idx) => idx)
      .filter((idx) => {
        const f = files[idx];
        const edit = fileEdits[idx];
        return f.status !== 'failed' && !edit?.isSaved && f.status !== 'saved';
      });

    if (pendingIndexes.length === 0) {
      toast.error('No pending receipts left to save.');
      return;
    }

    setIsSavingAll(true);
    toast.loading(`Saving ${pendingIndexes.length} receipts...`, { id: 'save-all' });

    let count = 0;
    for (const idx of pendingIndexes) {
      const receiptData = buildReceiptPayload(idx);
      try {
        await saveBatchFileMutation.mutateAsync({
          batchId,
          fileIndex: idx,
          receiptData,
        });
        setFileEdits((prev) => ({
          ...prev,
          [idx]: { ...(prev[idx] || {}), isSaved: true },
        }));
        count++;
      } catch (err) {
        console.error(`Error saving batch file #${idx + 1}:`, err);
      }
    }

    setIsSavingAll(false);
    toast.success(`Successfully saved ${count} receipts`, { id: 'save-all' });
  };

  const reviewingEdit = reviewingIndex != null ? fileEdits[reviewingIndex] : null;
  const reviewingFileItem = reviewingIndex != null ? files[reviewingIndex] : null;

  // Calculate items sum & difference for reconciliation
  const itemsSum = reviewingEdit?.items
    ? reviewingEdit.items.reduce((acc, item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        return acc + qty * price;
      }, 0)
    : 0;

  const receiptTotalNum = Number(reviewingEdit?.grandTotal) || 0;
  const itemsSumDiff = Math.abs(itemsSum - receiptTotalNum);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1">
            <Link to="/receipts/new" className="hover:text-fg no-underline text-fg-muted">
              Add receipt
            </Link>
            <span className="text-line">•</span>
            <span className="text-fg font-medium">Batch review</span>
          </div>
          <h1 className="text-xl font-semibold text-fg tracking-tight">
            Batch review
          </h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Review OCR extracted receipts from your batch upload session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAll}
              disabled={isSavingAll}
            >
              {isSavingAll ? 'Saving all...' : `Save all (${pendingCount})`}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/receipts')}
          >
            <span>Go to receipts</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Status Summary Strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs bg-surface border border-line rounded-[12px] p-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <FileCheck className="size-4 text-accent" />
          <span className="font-semibold text-fg">
            {pendingCount === 0 && savedCount > 0
              ? 'All receipts in batch saved'
              : `${pendingCount} receipts pending review and save`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-fg-muted font-tabular">
          <span>{totalCount} total</span>
          <span className="text-line">•</span>
          <span className="text-ok-text font-medium">{savedCount} saved</span>
          <span className="text-line">•</span>
          <span className="text-warn-text font-medium">{pendingCount} pending</span>
          {failedCount > 0 && (
            <>
              <span className="text-line">•</span>
              <span className="text-bad-text font-medium">{failedCount} failed</span>
            </>
          )}
        </div>
      </div>

      {/* 3. Status Table (Step 14.2) */}
      <div className="bg-surface border border-line rounded-[12px] overflow-hidden shadow-2xs">
        <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">File</th>
                <th className="py-3 px-4 w-36">State</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4 text-right w-36">Total</th>
                <th className="py-3 px-4 text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {files.map((fileItem, idx) => {
                const edit = fileEdits[idx] || {};
                const isSaved = fileItem.status === 'saved' || edit.isSaved;
                const isFailed = fileItem.status === 'failed';
                const statusKey = isSaved
                  ? 'saved'
                  : isFailed
                  ? 'failed'
                  : 'needs_review';

                const totalVal =
                  edit.grandTotal != null && edit.grandTotal !== ''
                    ? Number(edit.grandTotal)
                    : null;

                return (
                  <tr
                    key={fileItem._id || idx}
                    className="hover:bg-hover transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-fg-muted font-tabular">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="size-4 text-fg-muted shrink-0" />
                        <span className="font-medium text-fg truncate max-w-[200px] sm:max-w-xs block">
                          {fileItem.originalName || `Receipt #${idx + 1}`}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-subtle border border-line text-fg-muted uppercase shrink-0">
                          {fileItem.fileType || 'file'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={statusKey} />
                    </td>
                    <td className="py-3.5 px-4 text-fg">
                      {edit.storeName || (
                        <span className="text-fg-muted italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-tabular">
                      {totalVal != null && !isNaN(totalVal) ? (
                        <Money amount={totalVal} currency={edit.currency || 'INR'} />
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {fileItem.fileUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingFile(fileItem)}
                            className="h-8 px-2 text-xs"
                            title="View document"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        )}
                        {!isSaved && !isFailed ? (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => setReviewingIndex(idx)}
                            className="h-8 text-xs gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="size-3" />
                            <span>Review</span>
                          </Button>
                        ) : isSaved ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewingIndex(idx)}
                            className="h-8 text-xs gap-1.5 text-ok-text border-ok-border"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Edit</span>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Spacious Two-Pane Review Modal */}
      {reviewingIndex !== null && reviewingEdit && reviewingFileItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in-0 duration-200"
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
        >
          <div
            className="bg-surface border border-line rounded-[16px] shadow-2xl w-full max-w-6xl h-[92vh] max-h-[900px] flex flex-col overflow-hidden text-fg font-sans"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            {/* Modal Header */}
            <div className="h-14 px-5 border-b border-line flex items-center justify-between gap-3 bg-surface shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-subtle border border-line text-accent shrink-0">
                  #{reviewingIndex + 1} of {files.length}
                </span>
                <span className="text-sm font-semibold text-fg truncate">
                  {reviewingFileItem.originalName || `Receipt #${reviewingIndex + 1}`}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-subtle border border-line text-fg-muted shrink-0 hidden sm:inline">
                  {reviewingFileItem.fileType || 'file'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Stepping controls */}
                <div className="flex items-center border border-line rounded-[8px] overflow-hidden bg-surface-subtle">
                  <button
                    type="button"
                    onClick={() => setReviewingIndex(reviewingIndex - 1)}
                    disabled={reviewingIndex <= 0}
                    className="p-1.5 text-fg-muted hover:text-fg hover:bg-hover disabled:opacity-30 transition-colors cursor-pointer"
                    title="Previous receipt"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div className="w-px h-4 bg-line" />
                  <button
                    type="button"
                    onClick={() => setReviewingIndex(reviewingIndex + 1)}
                    disabled={reviewingIndex >= files.length - 1}
                    className="p-1.5 text-fg-muted hover:text-fg hover:bg-hover disabled:opacity-30 transition-colors cursor-pointer"
                    title="Next receipt"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveSingle(reviewingIndex)}
                  disabled={saveBatchFileMutation.isPending}
                  className="gap-1.5 text-xs h-8"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{saveBatchFileMutation.isPending ? 'Saving...' : 'Save receipt'}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setReviewingIndex(null)}
                  className="size-8 rounded-[8px] flex items-center justify-center text-fg-muted hover:text-fg hover:bg-hover transition-colors cursor-pointer"
                  aria-label="Close review"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Two-Pane Split */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Pane: Document Viewer */}
              <div className="w-full lg:w-1/2 h-64 lg:h-full border-b lg:border-b-0 lg:border-r border-line bg-subtle flex flex-col overflow-hidden shrink-0">
                <div className="h-9 px-4 border-b border-line flex items-center justify-between text-xs text-fg-muted bg-surface/50">
                  <span className="font-medium">Original scanned document</span>
                  {reviewingFileItem.fileUrl && (
                    <a
                      href={getAuthenticatedFileUrl(reviewingFileItem.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                    >
                      <span>Open in tab</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <div className="flex-1 min-h-0 relative">
                  <DocumentViewer
                    fileUrl={reviewingFileItem.fileUrl}
                    fileData={reviewingFileItem.fileData}
                    fileName={reviewingFileItem.originalName}
                    fileType={reviewingFileItem.fileType}
                    mimeType={reviewingFileItem.mimeType}
                  />
                </div>
              </div>

              {/* Right Pane: Editable Fields & Line Items */}
              <div
                className="w-full lg:w-1/2 h-full min-h-0 flex flex-col overflow-hidden bg-surface"
                data-lenis-prevent
              >
                {/* Scrollable Form Content */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5"
                  data-lenis-prevent
                >
                  {/* Core Receipt Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Merchant Name */}
                    <div>
                      <Label htmlFor="reviewStoreName" className="text-xs font-medium text-fg block mb-1">
                        Merchant / Store name *
                      </Label>
                      <Input
                        id="reviewStoreName"
                        type="text"
                        value={reviewingEdit.storeName}
                        onChange={(e) =>
                          handleUpdateEdit(reviewingIndex, 'storeName', e.target.value)
                        }
                        placeholder="e.g. Apple Store"
                        className="text-xs h-9 bg-surface"
                        required
                      />
                    </div>

                    {/* Invoice Number */}
                    <div>
                      <Label htmlFor="reviewInvoiceNumber" className="text-xs font-medium text-fg block mb-1">
                        Invoice number
                      </Label>
                      <Input
                        id="reviewInvoiceNumber"
                        type="text"
                        value={reviewingEdit.invoiceNumber}
                        onChange={(e) =>
                          handleUpdateEdit(reviewingIndex, 'invoiceNumber', e.target.value)
                        }
                        placeholder="e.g. INV-2026-001"
                        className="text-xs h-9 font-mono bg-surface"
                      />
                    </div>

                    {/* Purchase Date */}
                    <div>
                      <Label htmlFor="reviewPurchaseDate" className="text-xs font-medium text-fg block mb-1">
                        Purchase date
                      </Label>
                      <Input
                        id="reviewPurchaseDate"
                        type="date"
                        value={reviewingEdit.purchaseDate}
                        onChange={(e) =>
                          handleUpdateEdit(reviewingIndex, 'purchaseDate', e.target.value)
                        }
                        className="text-xs h-9 bg-surface"
                      />
                    </div>

                    {/* Total & Currency */}
                    <div>
                      <Label htmlFor="reviewGrandTotal" className="text-xs font-medium text-fg block mb-1">
                        Total amount *
                      </Label>
                      <div className="flex items-center gap-2">
                        <select
                          value={reviewingEdit.currency}
                          onChange={(e) =>
                            handleUpdateEdit(reviewingIndex, 'currency', e.target.value)
                          }
                          className="w-20 shrink-0 h-9 px-2 text-xs bg-surface border border-line rounded-[8px] text-fg font-medium focus:outline-none focus:border-accent cursor-pointer"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <Input
                          id="reviewGrandTotal"
                          type="number"
                          step="any"
                          value={reviewingEdit.grandTotal}
                          onChange={(e) =>
                            handleUpdateEdit(reviewingIndex, 'grandTotal', e.target.value)
                          }
                          placeholder="0.00"
                          className="text-xs h-9 font-tabular bg-surface flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Items Section Header */}
                  <div className="pt-2 border-t border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-fg">Line items</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-line text-fg-muted font-tabular">
                          {reviewingEdit.items?.length || 0}{' '}
                          {reviewingEdit.items?.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddItem(reviewingIndex)}
                        className="text-xs h-8 gap-1.5 cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        <span>Add item</span>
                      </Button>
                    </div>

                    {/* Item Cards List - Structured, 100% visible, Zero Squishing */}
                    <div className="space-y-3">
                      {(reviewingEdit.items || []).map((item, itemIdx) => {
                        const itemQty = Number(item.quantity) || 1;
                        const itemPrice = Number(item.unitPrice) || 0;
                        const itemTotal = (itemQty * itemPrice).toFixed(2);

                        return (
                          <div
                            key={item.id || itemIdx}
                            className="p-3.5 rounded-[10px] border border-line bg-surface-subtle/40 hover:border-accent/40 space-y-3 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-semibold text-fg-muted">
                                  ITEM #{itemIdx + 1}
                                </span>
                                <span className="text-xs font-semibold text-fg font-tabular">
                                  {reviewingEdit.currency} {itemTotal}
                                </span>
                              </div>
                              {reviewingEdit.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(reviewingIndex, item.id)}
                                  className="size-7 rounded-[6px] flex items-center justify-center text-fg-muted hover:text-bad-solid hover:bg-hover transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Full-width Product Description */}
                            <div>
                              <label
                                htmlFor={`batch-item-name-${item.id}`}
                                className="text-[11px] font-medium text-fg-muted block mb-1"
                              >
                                Product description *
                              </label>
                              <Input
                                id={`batch-item-name-${item.id}`}
                                type="text"
                                value={item.productName || ''}
                                onChange={(e) =>
                                  handleItemField(
                                    reviewingIndex,
                                    item.id,
                                    'productName',
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. Sony WH-1000XM5 Headphones"
                                className="w-full text-xs h-9 bg-surface"
                                required
                              />
                            </div>

                            {/* Responsive 4-Column Grid for Brand, Category, Qty, Unit Price */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <label className="text-[10px] font-medium text-fg-muted block mb-1">
                                  Brand
                                </label>
                                <Input
                                  type="text"
                                  value={item.brand || ''}
                                  onChange={(e) =>
                                    handleItemField(
                                      reviewingIndex,
                                      item.id,
                                      'brand',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Brand (optional)"
                                  className="w-full text-xs h-8 bg-surface"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-medium text-fg-muted block mb-1">
                                  Category
                                </label>
                                <select
                                  value={item.category || 'Others'}
                                  onChange={(e) =>
                                    handleItemField(
                                      reviewingIndex,
                                      item.id,
                                      'category',
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-xs h-8 px-2 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent cursor-pointer"
                                >
                                  {categoryOptions.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-medium text-fg-muted block mb-1">
                                  Qty
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity || 1}
                                  onChange={(e) =>
                                    handleItemField(
                                      reviewingIndex,
                                      item.id,
                                      'quantity',
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-xs h-8 text-center font-tabular bg-surface"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-medium text-fg-muted block mb-1">
                                  Unit price ({reviewingEdit.currency})
                                </label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.unitPrice || ''}
                                  onChange={(e) =>
                                    handleItemField(
                                      reviewingIndex,
                                      item.id,
                                      'unitPrice',
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-full text-xs h-8 font-tabular bg-surface"
                                />
                              </div>
                            </div>

                            {/* Warranty Period Row */}
                            <div className="flex items-center gap-2 pt-0.5 text-xs">
                              <span className="text-[11px] font-medium text-fg-muted shrink-0">
                                Warranty cover:
                              </span>
                              <Input
                                type="number"
                                min="0"
                                value={item.warrantyPeriodValue || ''}
                                onChange={(e) =>
                                  handleItemField(
                                    reviewingIndex,
                                    item.id,
                                    'warrantyPeriodValue',
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-16 text-xs h-7 text-center font-tabular bg-surface"
                              />
                              <select
                                value={item.warrantyPeriodUnit || 'months'}
                                onChange={(e) =>
                                  handleItemField(
                                    reviewingIndex,
                                    item.id,
                                    'warrantyPeriodUnit',
                                    e.target.value
                                  )
                                }
                                className="w-24 text-xs h-7 px-2 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent cursor-pointer"
                              >
                                <option value="months">months</option>
                                <option value="years">years</option>
                                <option value="days">days</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step 14.1 Reconciliation Banner */}
                    <div
                      className={`p-3 rounded-[8px] border text-xs flex items-center justify-between gap-3 ${
                        itemsSumDiff < 0.05
                          ? 'bg-ok-bg text-ok-text border-ok-border'
                          : 'bg-warn-bg text-warn-text border-warn-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {itemsSumDiff < 0.05 ? (
                          <CheckCircle2 className="size-4 shrink-0 text-ok-text" />
                        ) : (
                          <AlertTriangle className="size-4 shrink-0 text-warn-text" />
                        )}
                        <span>
                          {itemsSumDiff < 0.05
                            ? `Items sum matches total (${reviewingEdit.currency} ${itemsSum.toFixed(2)})`
                            : `Items sum (${reviewingEdit.currency} ${itemsSum.toFixed(2)}) differs from receipt total by ${reviewingEdit.currency} ${itemsSumDiff.toFixed(2)}`}
                        </span>
                      </div>
                      {itemsSumDiff >= 0.05 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5 bg-surface text-fg shrink-0 cursor-pointer"
                          onClick={() =>
                            handleUpdateEdit(
                              reviewingIndex,
                              'grandTotal',
                              String(itemsSum.toFixed(2))
                            )
                          }
                        >
                          Use item sum
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Docked Modal Bottom Controls */}
                <div className="p-4 border-t border-line bg-surface flex items-center justify-between gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingIndex(null)}
                  >
                    Close
                  </Button>
                  <div className="flex items-center gap-2">
                    {reviewingIndex < files.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveSingle(reviewingIndex, true)}
                        disabled={saveBatchFileMutation.isPending}
                        className="cursor-pointer"
                      >
                        Save & next →
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveSingle(reviewingIndex, false)}
                      disabled={saveBatchFileMutation.isPending}
                      className="cursor-pointer"
                    >
                      {saveBatchFileMutation.isPending ? 'Saving...' : 'Save receipt'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Standalone Document Viewer Modal */}
      {viewingFile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          data-lenis-prevent
        >
          <div
            className="bg-surface rounded-[16px] max-w-4xl w-full h-[85vh] border border-line shadow-2xl flex flex-col overflow-hidden"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-subtle">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-4 text-fg-muted" />
                <span className="text-xs font-semibold text-fg truncate">
                  {viewingFile.originalName || 'Batch document'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {viewingFile.fileUrl && (
                  <a
                    href={getAuthenticatedFileUrl(viewingFile.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mr-1"
                  >
                    <span>Open in tab</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingFile(null)}
                  className="size-8 rounded-[8px] flex items-center justify-center hover:bg-hover text-fg-muted transition-colors cursor-pointer"
                  aria-label="Close document viewer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-subtle">
              <DocumentViewer
                fileUrl={viewingFile.fileUrl}
                fileData={viewingFile.fileData}
                fileName={viewingFile.originalName}
                fileType={viewingFile.fileType}
                mimeType={viewingFile.mimeType}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
