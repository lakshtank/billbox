import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import * as m from 'motion/react-m';
import { AnimatePresence, useScroll, useSpring } from 'motion/react';
import {
  ArrowLeft,
  Edit3,
  Share2,
  Download,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Package,
  Hash,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Plus,
  Eye,
  FileText,
  X,
  Upload,
} from 'lucide-react';
import toast from '@/lib/toast';
import { useReceiptQuery } from '../queries/useReceiptsQuery';
import { useDeleteReceipt, useUpdateReceipt } from '../queries/useReceiptMutations';
import { useCategoriesQuery } from '../queries/useCategoryQueries';
import { DocumentViewer } from '../components/data/DocumentViewer';
import { ReceiptForm } from '../components/receipts/ReceiptForm';
import { ProductListForm } from '../components/receipts/ProductListForm';
import { ShareModal } from '../components/receipts/ShareModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../components/common/EmptyState';
import ReceiptStatusControl from '../components/receipts/ReceiptStatusControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatCurrency, formatDateForInput, getCurrencySymbol } from '../utils/formatters';
import { getAuthenticatedFileUrl } from '../utils/fileUrl';
import { useViewTransitionNavigate } from '@/context/ViewTransitionContext';
import { DEFAULT_CATEGORIES } from '../constants/category.constants';
import { cn } from '@/lib/utils';
import { spring, ease } from '@/lib/motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.28,
      ease: ease.out,
    },
  }),
};

export function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useViewTransitionNavigate();
  const [searchParams] = useSearchParams();
  const isEditParam = searchParams.get('edit') === 'true';

  // Step 14.2: Scroll-linked progress line for long pages
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [isEditing, setIsEditing] = useState(isEditParam);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFullFormModal, setShowFullFormModal] = useState(false);


  // Step 16.3: Mobile review tabs: Document | Details (< lg)
  const [mobileReviewTab, setMobileReviewTab] = useState('details');
  const [tabDirection, setTabDirection] = useState(1);

  const handleTabChange = useCallback((nextTab) => {
    if (nextTab === mobileReviewTab) return;
    const tabOrder = { document: 0, details: 1 };
    setTabDirection((tabOrder[nextTab] ?? 0) > (tabOrder[mobileReviewTab] ?? 0) ? 1 : -1);
    setMobileReviewTab(nextTab);
  }, [mobileReviewTab]);

  const { data, isLoading, isError } = useReceiptQuery(id);
  const { data: userCategories = [] } = useCategoriesQuery();
  const deleteMutation = useDeleteReceipt();
  const updateMutation = useUpdateReceipt();

  const receipt = data?.receipt || data;
  const products = Array.isArray(receipt?.products) ? receipt.products : [];

  const userCatNames = Array.isArray(userCategories)
    ? userCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : [];
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...userCatNames]));

  // Inline Edit Form State
  const [editStoreName, setEditStoreName] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Standard');
  const [editSubtotal, setEditSubtotal] = useState('');
  const [editTaxAmount, setEditTaxAmount] = useState('0');
  const [editShippingAmount, setEditShippingAmount] = useState('0');
  const [editDiscountAmount, setEditDiscountAmount] = useState('0');
  const [editGrandTotal, setEditGrandTotal] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [receiptTags, setReceiptTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editProducts, setEditProducts] = useState([]);

  // Map receipt products to edit format
  const mapProductsForEdit = useCallback(
    (prodsList) => {
      if (Array.isArray(prodsList) && prodsList.length > 0) {
        return prodsList.map((p, idx) => ({
          id: p._id || `item-${idx + 1}-${Date.now()}`,
          _id: p._id,
          productName: p.productName || '',
          brand: p.brand || '',
          category: p.category || receipt?.category || 'General',
          quantity: p.quantity != null ? p.quantity : 1,
          unitPrice: p.unitPrice != null ? String(p.unitPrice) : '',
          lineTotal:
            p.lineTotal != null
              ? String(p.lineTotal)
              : p.unitPrice != null
              ? String((Number(p.quantity || 1) * Number(p.unitPrice)).toFixed(2))
              : '',
          warrantyPeriodValue: p.warrantyPeriodValue != null ? String(p.warrantyPeriodValue) : '',
          warrantyPeriodUnit: p.warrantyPeriodUnit || 'months',
        }));
      }
      return [
        {
          id: `item-1-${Date.now()}`,
          productName: receipt?.productName || receipt?.storeName || 'Item',
          brand: receipt?.brand || '',
          category: receipt?.category || 'General',
          quantity: 1,
          unitPrice:
            receipt?.totalAmount != null
              ? String(receipt.totalAmount)
              : receipt?.grandTotal != null
              ? String(receipt.grandTotal)
              : '',
          lineTotal:
            receipt?.totalAmount != null
              ? String(receipt.totalAmount)
              : receipt?.grandTotal != null
              ? String(receipt.grandTotal)
              : '',
          warrantyPeriodValue: '',
          warrantyPeriodUnit: 'months',
        },
      ];
    },
    [receipt]
  );

  // Sync edit form state whenever receipt loads or isEditing activates
  useEffect(() => {
    if (receipt) {
      setEditStoreName(receipt.storeName || '');
      setEditInvoiceNumber(receipt.invoiceNumber || '');
      setEditPurchaseDate(formatDateForInput(receipt.purchaseDate));
      setEditCategory(receipt.category || 'General');
      setEditPaymentMethod(receipt.paymentMethod || 'Standard');
      setEditSubtotal(receipt.subtotal != null ? String(receipt.subtotal) : '');
      setEditTaxAmount(receipt.taxAmount != null ? String(receipt.taxAmount) : '0');
      setEditShippingAmount(receipt.shippingAmount != null ? String(receipt.shippingAmount) : '0');
      setEditDiscountAmount(receipt.discountAmount != null ? String(receipt.discountAmount) : '0');
      setEditGrandTotal(
        receipt.grandTotal != null
          ? String(receipt.grandTotal)
          : receipt.totalAmount != null
          ? String(receipt.totalAmount)
          : ''
      );
      setEditNotes(receipt.notes || '');
      setReceiptTags(Array.isArray(receipt.tags) ? receipt.tags : []);
      setEditProducts(mapProductsForEdit(receipt.products));
    }
  }, [receipt, isEditing, mapProductsForEdit]);

  const handleAddTag = async (tagToAdd) => {
    const raw = (tagToAdd || newTagInput).trim();
    if (!raw) return;
    const formatted = raw.startsWith('#') ? raw : `#${raw}`;
    if (receiptTags.includes(formatted)) {
      setNewTagInput('');
      return;
    }
    const nextTags = [...receiptTags, formatted];
    setReceiptTags(nextTags);
    setNewTagInput('');
    try {
      await updateMutation.mutateAsync({ id, tags: nextTags });
      toast.success(`Tag ${formatted} added!`);
    } catch {
      toast.error('Failed to update tags.');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const nextTags = receiptTags.filter((t) => t !== tagToRemove);
    setReceiptTags(nextTags);
    try {
      await updateMutation.mutateAsync({ id, tags: nextTags });
      toast.success(`Tag ${tagToRemove} removed.`);
    } catch {
      toast.error('Failed to update tags.');
    }
  };

  // Real-time recalculation handlers
  const handleProductChange = (id, field, value) => {
    setEditProducts((prev) => {
      const updated = prev.map((p) => {
        if ((p.id || p._id) !== id) return p;
        const next = { ...p, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = Number(field === 'quantity' ? value : next.quantity) || 1;
          const price = Number(field === 'unitPrice' ? value : next.unitPrice);
          if (!isNaN(price) && next.unitPrice !== '') {
            next.lineTotal = String((qty * price).toFixed(2));
          } else {
            next.lineTotal = '';
          }
        }
        return next;
      });

      // Recalculate subtotal and grandTotal automatically
      const sum = updated.reduce((acc, p) => acc + (Number(p.lineTotal) || 0), 0);
      const tax = Number(editTaxAmount) || 0;
      const ship = Number(editShippingAmount) || 0;
      const disc = Number(editDiscountAmount) || 0;
      const grand = Math.max(0, sum + tax + ship - disc);

      setEditSubtotal(sum > 0 ? String(sum.toFixed(2)) : '0');
      setEditGrandTotal(String(grand.toFixed(2)));

      return updated;
    });
  };

  const handleAddProduct = () => {
    const newId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setEditProducts((prev) => [
      ...prev,
      {
        id: newId,
        productName: '',
        brand: '',
        category: editCategory || 'General',
        quantity: 1,
        unitPrice: '',
        lineTotal: '',
        warrantyPeriodValue: '',
        warrantyPeriodUnit: 'months',
      },
    ]);
  };

  const handleRemoveProduct = (id) => {
    if (editProducts.length <= 1) {
      toast.error('A receipt must have at least one product.');
      return;
    }
    setEditProducts((prev) => {
      const updated = prev.filter((p) => (p.id || p._id) !== id);
      const sum = updated.reduce((acc, p) => acc + (Number(p.lineTotal) || 0), 0);
      const tax = Number(editTaxAmount) || 0;
      const ship = Number(editShippingAmount) || 0;
      const disc = Number(editDiscountAmount) || 0;
      const grand = Math.max(0, sum + tax + ship - disc);

      setEditSubtotal(sum > 0 ? String(sum.toFixed(2)) : '0');
      setEditGrandTotal(String(grand.toFixed(2)));

      return updated;
    });
  };

  const handleTaxChange = (val) => {
    setEditTaxAmount(val);
    const sub = Number(editSubtotal) || 0;
    const tax = Number(val) || 0;
    const ship = Number(editShippingAmount) || 0;
    const disc = Number(editDiscountAmount) || 0;
    setEditGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleShippingChange = (val) => {
    setEditShippingAmount(val);
    const sub = Number(editSubtotal) || 0;
    const tax = Number(editTaxAmount) || 0;
    const ship = Number(val) || 0;
    const disc = Number(editDiscountAmount) || 0;
    setEditGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleDiscountChange = (val) => {
    setEditDiscountAmount(val);
    const sub = Number(editSubtotal) || 0;
    const tax = Number(editTaxAmount) || 0;
    const ship = Number(editShippingAmount) || 0;
    const disc = Number(val) || 0;
    setEditGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleSubtotalChange = (val) => {
    setEditSubtotal(val);
    const sub = Number(val) || 0;
    const tax = Number(editTaxAmount) || 0;
    const ship = Number(editShippingAmount) || 0;
    const disc = Number(editDiscountAmount) || 0;
    setEditGrandTotal(String(Math.max(0, sub + tax + ship - disc).toFixed(2)));
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Receipt deleted successfully.');
        navigate('/receipts');
      },
      onError: () => {
        toast.error('Failed to delete receipt.');
        setShowDeleteModal(false);
      },
    });
  };

  const handleCopyInvoice = (e) => {
    e.stopPropagation();
    if (!receipt?.invoiceNumber) return;
    navigator.clipboard.writeText(receipt.invoiceNumber);
    setCopiedInvoice(true);
    toast.success('Invoice number copied.');
    setTimeout(() => setCopiedInvoice(false), 1600);
  };

  const handleCancelEdit = () => {
    if (receipt) {
      setEditStoreName(receipt.storeName || '');
      setEditInvoiceNumber(receipt.invoiceNumber || '');
      setEditPurchaseDate(formatDateForInput(receipt.purchaseDate));
      setEditCategory(receipt.category || 'General');
      setEditPaymentMethod(receipt.paymentMethod || 'Standard');
      setEditSubtotal(receipt.subtotal != null ? String(receipt.subtotal) : '');
      setEditTaxAmount(receipt.taxAmount != null ? String(receipt.taxAmount) : '0');
      setEditShippingAmount(receipt.shippingAmount != null ? String(receipt.shippingAmount) : '0');
      setEditDiscountAmount(receipt.discountAmount != null ? String(receipt.discountAmount) : '0');
      setEditGrandTotal(
        receipt.grandTotal != null
          ? String(receipt.grandTotal)
          : receipt.totalAmount != null
          ? String(receipt.totalAmount)
          : ''
      );
      setEditNotes(receipt.notes || '');
      setEditProducts(mapProductsForEdit(receipt.products));
    }
    setIsEditing(false);
  };

  const handleSaveEdit = (formPayload) => {
    // If called from ReceiptForm modal onSubmit(payload)
    if (formPayload && formPayload.storeName && typeof formPayload.preventDefault !== 'function') {
      updateMutation.mutate(
        { id, ...formPayload },
        {
          onSuccess: () => {
            toast.success('Receipt updated successfully.');
            setShowFullFormModal(false);
            setIsEditing(false);
          },
          onError: () => {
            toast.error('Failed to update receipt.');
          },
        }
      );
      return;
    }

    if (!editStoreName.trim()) {
      toast.error('Merchant or store name is required.');
      return;
    }

    // Ensure all products have names
    for (const p of editProducts) {
      if (!p.productName || !p.productName.trim()) {
        toast.error('All line items must have a product name.');
        return;
      }
    }

    const payload = {
      storeName: editStoreName.trim(),
      invoiceNumber: editInvoiceNumber.trim(),
      purchaseDate: editPurchaseDate ? new Date(editPurchaseDate) : receipt?.purchaseDate,
      category: editCategory,
      paymentMethod: editPaymentMethod,
      subtotal: editSubtotal !== '' ? Number(editSubtotal) : null,
      taxAmount: editTaxAmount !== '' ? Number(editTaxAmount) : 0,
      shippingAmount: editShippingAmount !== '' ? Number(editShippingAmount) : 0,
      discountAmount: editDiscountAmount !== '' ? Number(editDiscountAmount) : 0,
      grandTotal: editGrandTotal !== '' ? Number(editGrandTotal) : null,
      totalAmount: editGrandTotal !== '' ? Number(editGrandTotal) : null,
      notes: editNotes.trim(),
      tags: receiptTags,
      products: editProducts.map((p) => ({
        _id:
          p._id ||
          (p.id && !String(p.id).startsWith('item-') && !String(p.id).startsWith('prod-')
            ? p.id
            : undefined),
        productName: p.productName.trim(),
        brand: p.brand ? p.brand.trim() : '',
        category: p.category || editCategory || 'General',
        quantity: Number(p.quantity) || 1,
        unitPrice: p.unitPrice !== '' && p.unitPrice != null ? Number(p.unitPrice) : null,
        lineTotal: p.lineTotal !== '' && p.lineTotal != null ? Number(p.lineTotal) : null,
        warrantyPeriodValue:
          p.warrantyPeriodValue !== '' && p.warrantyPeriodValue != null
            ? Number(p.warrantyPeriodValue)
            : null,
        warrantyPeriodUnit: p.warrantyPeriodUnit || 'months',
      })),
    };

    updateMutation.mutate(
      { id, ...payload },
      {
        onSuccess: () => {
          toast.success('Receipt updated successfully.');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Failed to update receipt.');
        },
      }
    );
  };

  const vendorName = receipt?.storeName?.trim() || 'Merchant Receipt';
  const hasDocument = Boolean(receipt?.fileUrl || receipt?.fileData);
  const isPdf = receipt?.fileType === 'pdf' || receipt?.fileUrl?.toLowerCase().endsWith('.pdf');

  // Resolve best document preview URL (public stream endpoint or authenticated file URL or base64)
  const documentUrl = useMemo(() => {
    if (!receipt) return null;
    if (receipt.publicToken) {
      return `/api/public/receipts/${receipt.publicToken}/file`;
    }
    if (receipt.fileData) {
      return receipt.fileData.startsWith('data:')
        ? receipt.fileData
        : `data:${receipt.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg')};base64,${receipt.fileData}`;
    }
    if (receipt.fileUrl) {
      return getAuthenticatedFileUrl(receipt.fileUrl);
    }
    return null;
  }, [receipt, isPdf]);

  const handleDownload = () => {
    if (!receipt) return;
    const targetUrl = documentUrl || getAuthenticatedFileUrl(receipt.fileUrl);
    if (targetUrl) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = `${vendorName}-Receipt.${receipt.fileType || (isPdf ? 'pdf' : 'png')}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Document download started.');
    } else {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans select-none" aria-busy="true">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <Skeleton className="h-6 w-32 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Hero header skeleton */}
        <div className="p-6 rounded-[12px] border border-line bg-surface space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>

        {/* 2-column split skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-[12px] border border-line bg-surface space-y-4">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 p-6 rounded-[12px] border border-line bg-surface space-y-4">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="py-8">
        <EmptyState
          title="Receipt not found"
          description="The receipt you are looking for does not exist or was deleted."
          actionLabel="Back to receipts"
          onAction={() => navigate('/receipts')}
        />
      </div>
    );
  }

  // Calculations for savings and reconciliation
  const totalReceiptSavings = products.reduce((acc, prod) => {
    if (prod.discountAmount != null && Number(prod.discountAmount) > 0) {
      return acc + Number(prod.discountAmount);
    }
    if (
      prod.originalUnitPrice != null &&
      prod.unitPrice != null &&
      Number(prod.originalUnitPrice) > Number(prod.unitPrice)
    ) {
      const qty = Number(prod.quantity) || 1;
      return acc + (Number(prod.originalUnitPrice) - Number(prod.unitPrice)) * qty;
    }
    return acc;
  }, 0) + Number(receipt?.discountAmount || 0);

  const sumLineTotals = products.reduce(
    (acc, prod) => acc + Number(prod.lineTotal || prod.unitPrice || 0),
    0
  );
  const grandVal = receipt.grandTotal != null ? Number(receipt.grandTotal) : Number(receipt.totalAmount || 0);
  const subVal = receipt.subtotal != null ? Number(receipt.subtotal) : null;
  const taxVal = Number(receipt.taxAmount || 0);
  const shipVal = Number(receipt.shippingAmount || 0);
  const discVal = Number(receipt.discountAmount || 0);

  const matchesGrand = Math.abs(sumLineTotals - grandVal) <= 0.01;
  const matchesSub = subVal != null && Math.abs(sumLineTotals - subVal) <= 0.01;
  const matchesReconciled = Math.abs(sumLineTotals - discVal + taxVal + shipVal - grandVal) <= 0.01;
  const isTrueMismatch = receipt.needsReview && products.length > 0 && !matchesGrand && !matchesSub && !matchesReconciled;

  return (
    <div className={cn("space-y-4 w-full font-sans relative", isEditing && "pb-16")}>
      {/* Step 14.2: 2px accent scroll-linked progress line */}
      <m.div
        style={{ scaleX: smoothProgress, transformOrigin: 'left' }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-accent z-50 pointer-events-none"
      />

      {/* 1. Compact Header Row with Step 3.2 View Transition Morph & Step 13.4 Copy Action */}
      <div className="space-y-1.5 pb-2 border-b border-line">
        <div className="flex items-center gap-2">
          <Link
            to="/receipts"
            viewTransition
            onClick={(e) => {
              if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                navigate('/receipts');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-fg-3 hover:text-fg font-medium transition-colors no-underline cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Receipts</span>
          </Link>
          <span className="text-fg-3 select-none">/</span>
          <span className="text-xs text-fg-2 font-medium truncate max-w-xs">{vendorName}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            {/* Avatar with shared-element view transition morph */}
            <div
              style={{ viewTransitionName: `receipt-avatar-${receipt._id}` }}
              className="size-9 rounded-[9px] bg-accent-tint text-accent border border-accent/20 font-semibold text-xs flex items-center justify-center shrink-0 tracking-tight shadow-2xs"
            >
              {(vendorName || 'M').slice(0, 2).toUpperCase()}
            </div>

            {/* Editable or View Title with AnimatePresence mode="popLayout" and layout="position" */}
            <AnimatePresence mode="popLayout" initial={false}>
              {isEditing ? (
                <m.div
                  key="edit-title"
                  layout="position"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={spring.snappy}
                  className="min-w-[220px]"
                >
                  <Input
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    placeholder="Merchant Name"
                    className="h-9 text-base font-semibold"
                    aria-label="Merchant name"
                  />
                </m.div>
              ) : (
                <m.h1
                  key="read-title"
                  layout="position"
                  style={{ viewTransitionName: `receipt-title-${receipt._id}` }}
                  className="text-2xl font-semibold text-fg tracking-tight leading-tight truncate"
                >
                  {vendorName}
                </m.h1>
              )}
            </AnimatePresence>

            {/* Invoice Number Badge with Step 13.4 Copy -> Check Morph */}
            <AnimatePresence mode="popLayout" initial={false}>
              {isEditing ? (
                <m.div
                  key="edit-inv"
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={spring.snappy}
                >
                  <Input
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    placeholder="Invoice #"
                    className="h-8 font-mono text-xs w-36"
                    aria-label="Invoice number"
                  />
                </m.div>
              ) : receipt.invoiceNumber ? (
                <m.button
                  key="read-inv"
                  layout="position"
                  type="button"
                  onClick={handleCopyInvoice}
                  title="Click to copy invoice number"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium bg-subtle border border-line-subtle text-fg-2 hover:text-fg hover:border-line hover:bg-hover transition-colors cursor-pointer select-none"
                >
                  <Hash className="size-3 text-fg-3" />
                  <span>{receipt.invoiceNumber}</span>
                  <AnimatePresence mode="wait" initial={false}>
                    <m.span
                      key={copiedInvoice ? 'ok' : 'copy'}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="inline-flex items-center ml-0.5"
                    >
                      {copiedInvoice ? (
                        <Check className="size-3 text-ok-fg" />
                      ) : (
                        <Copy className="size-3 text-fg-3" />
                      )}
                    </m.span>
                  </AnimatePresence>
                </m.button>
              ) : null}
            </AnimatePresence>

            <ReceiptStatusControl receipt={receipt} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={isEditing ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                if (isEditing) {
                  handleCancelEdit();
                } else {
                  setIsEditing(true);
                }
              }}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <Edit3 className="size-3.5" />
              <span>{isEditing ? 'Cancel edit' : 'Edit'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteMutation.isPending}
              className="size-8 p-0 text-fg-3 hover:text-bad-fg hover:bg-bad-bg/20 cursor-pointer"
              title="Delete receipt"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Flagged Review Alert */}
      {isTrueMismatch && (
        <div className="p-3 rounded-[10px] bg-warn-bg border border-warn-line flex items-center justify-between gap-3 text-fg text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-warn-fg shrink-0" />
            <span>
              <strong className="text-warn-fg font-semibold">Review required:</strong> Line item sum differs from grand total. Please verify extracted amounts.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 text-xs border-warn-line hover:bg-warn-bg/50 cursor-pointer"
          >
            Edit details
          </Button>
        </div>
      )}

      {hasDocument ? (
        <div className="space-y-4">
          {/* Mobile review tabs: Document | Details (< lg) */}
          <div className="lg:hidden flex items-center p-1 bg-subtle border border-line rounded-[8px] select-none">
            <button
              type="button"
              onClick={() => handleTabChange('details')}
              className={cn(
                'flex-1 py-1.5 px-3 text-xs font-medium rounded-[6px] transition-all cursor-pointer text-center',
                mobileReviewTab === 'details'
                  ? 'bg-surface text-fg font-semibold shadow-xs'
                  : 'text-fg-3 hover:text-fg'
              )}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('document')}
              className={cn(
                'flex-1 py-1.5 px-3 text-xs font-medium rounded-[6px] transition-all cursor-pointer text-center',
                mobileReviewTab === 'document'
                  ? 'bg-surface text-fg font-semibold shadow-xs'
                  : 'text-fg-3 hover:text-fg'
              )}
            >
              Document
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Pane: Document Viewer with layoutId="doc-thumb" morph */}
            <m.div
              layoutId="doc-thumb"
              initial={{ opacity: 0, x: tabDirection === 1 ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: ease.out }}
              className={cn(
                "lg:col-span-6 lg:sticky lg:top-4 h-[460px] lg:h-[min(560px,calc(100vh-160px))] rounded-[12px] overflow-hidden border border-line bg-surface",
                mobileReviewTab !== 'document' && "hidden lg:block"
              )}
            >
              <DocumentViewer
                url={documentUrl}
                fileUrl={documentUrl}
                fileData={receipt.fileData}
                mimeType={receipt.mimeType}
                fileName={`${vendorName} Receipt`}
                fileType={receipt.fileType}
              />
            </m.div>

            {/* Right Pane: Staggered sections entrance with 40ms stagger & inline edit swap */}
            <m.div
              initial={{ opacity: 0, x: tabDirection === 1 ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: ease.out }}
              className={cn("lg:col-span-6 space-y-4", mobileReviewTab !== 'details' && "hidden lg:block")}
            >
            {/* Section 0: Grand Total & Key Facts Card */}
            <m.div
              custom={0}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="p-5 rounded-[12px] bg-surface border border-line space-y-4 shadow-2xs"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                    Grand total
                  </span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isEditing ? (
                      <m.div
                        key="edit-gt"
                        layout="position"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="mt-1"
                      >
                        <Input
                          type="number"
                          step="0.01"
                          value={editGrandTotal}
                          onChange={(e) => setEditGrandTotal(e.target.value)}
                          placeholder="0.00"
                          className="h-10 text-xl font-mono font-bold w-48"
                        />
                      </m.div>
                    ) : (
                      <m.div
                        key="read-gt"
                        layout="position"
                        className="text-3xl font-bold font-mono text-fg tnum tracking-tight mt-0.5"
                      >
                        {formatCurrency(grandVal, receipt.currency)}
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
                {totalReceiptSavings > 0 && !isEditing && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-ok-bg text-ok-fg border border-ok-line font-mono tnum">
                    Saved {formatCurrency(totalReceiptSavings, receipt.currency)}
                  </span>
                )}
              </div>

              {/* Key Facts Definition Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-line-subtle text-xs">
                <div>
                  <span className="text-fg-3 block text-[11px]">Purchase date</span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isEditing ? (
                      <m.div
                        key="edit-pdate"
                        layout="position"
                        className="mt-1"
                      >
                        <Input
                          type="date"
                          value={editPurchaseDate}
                          onChange={(e) => setEditPurchaseDate(e.target.value)}
                          className="h-8 text-xs font-sans"
                        />
                      </m.div>
                    ) : (
                      <m.span
                        key="read-pdate"
                        layout="position"
                        className="font-medium text-fg mt-0.5 block"
                      >
                        {formatDate(receipt.purchaseDate)}
                      </m.span>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <span className="text-fg-3 block text-[11px]">Category</span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isEditing ? (
                      <m.div
                        key="edit-cat"
                        layout="position"
                        className="mt-1"
                      >
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </m.div>
                    ) : (
                      <m.span
                        key="read-cat"
                        layout="position"
                        className="font-medium text-fg mt-0.5 block"
                      >
                        {receipt.category || 'General'}
                      </m.span>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <span className="text-fg-3 block text-[11px]">Payment</span>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isEditing ? (
                      <m.div
                        key="edit-pm"
                        layout="position"
                        className="mt-1"
                      >
                        <Input
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value)}
                          placeholder="Payment"
                          className="h-8 text-xs"
                        />
                      </m.div>
                    ) : (
                      <m.span
                        key="read-pm"
                        layout="position"
                        className="font-medium text-fg mt-0.5 block"
                      >
                        {receipt.paymentMethod || 'Standard'} ({receipt.currency || 'INR'})
                      </m.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </m.div>

            {/* Section 1: Financial Breakdown Card */}
            <m.div
              custom={1}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="p-4 rounded-[12px] bg-surface border border-line space-y-2.5 shadow-2xs"
            >
              <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider">
                Breakdown
              </h3>
              <div className="divide-y divide-line-subtle text-xs">
                <div className="flex items-center justify-between py-1.5 gap-4">
                  <span className="text-fg-2">Subtotal</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editSubtotal}
                      onChange={(e) => handleSubtotalChange(e.target.value)}
                      placeholder="0.00"
                      className="h-7 text-xs font-mono text-right w-28"
                    />
                  ) : (
                    <span className="font-mono text-fg tnum">
                      {subVal != null ? formatCurrency(subVal, receipt.currency) : '—'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 gap-4">
                  <span className="text-fg-2">Tax / GST</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editTaxAmount}
                      onChange={(e) => handleTaxChange(e.target.value)}
                      placeholder="0.00"
                      className="h-7 text-xs font-mono text-right w-28"
                    />
                  ) : (
                    <span className="font-mono text-fg tnum">
                      {formatCurrency(taxVal, receipt.currency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 gap-4">
                  <span className="text-fg-2">Shipping</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editShippingAmount}
                      onChange={(e) => handleShippingChange(e.target.value)}
                      placeholder="0.00"
                      className="h-7 text-xs font-mono text-right w-28"
                    />
                  ) : (
                    <span className="font-mono text-fg tnum">
                      {formatCurrency(shipVal, receipt.currency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 gap-4 text-ok-fg">
                  <span className="font-medium">Discount applied</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editDiscountAmount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      placeholder="0.00"
                      className="h-7 text-xs font-mono text-right w-28"
                    />
                  ) : (
                    <span className="font-mono font-semibold tnum">
                      -{formatCurrency(discVal, receipt.currency)}
                    </span>
                  )}
                </div>
              </div>
            </m.div>

            {/* Section 2: Line Items Card */}
            <m.div
              custom={2}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="p-4 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between pb-1 border-b border-line-subtle">
                <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider">
                  Line items ({isEditing ? editProducts.length : products.length})
                </h3>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddProduct}
                    className="h-7 text-xs gap-1 font-medium cursor-pointer"
                  >
                    <Plus className="size-3 text-accent" />
                    <span>Add item</span>
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {editProducts.map((prod, idx) => (
                    <div
                      key={prod.id || prod._id || idx}
                      className="p-3 rounded-[10px] border border-line bg-subtle/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-fg-3">
                          #{idx + 1}
                        </span>
                        {editProducts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(prod.id || prod._id)}
                            className="size-6 p-0 text-fg-3 hover:text-bad-fg hover:bg-bad-bg/20"
                            title="Remove item"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Item description *
                          </label>
                          <Input
                            type="text"
                            value={prod.productName || ''}
                            onChange={(e) =>
                              handleProductChange(prod.id || prod._id, 'productName', e.target.value)
                            }
                            placeholder="Product name *"
                            className="h-8 text-xs bg-surface"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Brand (optional)
                          </label>
                          <Input
                            type="text"
                            value={prod.brand || ''}
                            onChange={(e) =>
                              handleProductChange(prod.id || prod._id, 'brand', e.target.value)
                            }
                            placeholder="Brand"
                            className="h-8 text-xs bg-surface"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Qty
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={prod.quantity || 1}
                            onChange={(e) =>
                              handleProductChange(prod.id || prod._id, 'quantity', e.target.value)
                            }
                            className="h-8 text-xs font-mono text-center bg-surface px-1"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Unit price
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={prod.unitPrice ?? ''}
                            onChange={(e) =>
                              handleProductChange(prod.id || prod._id, 'unitPrice', e.target.value)
                            }
                            placeholder="0.00"
                            className="h-8 text-xs font-mono text-right bg-surface px-2"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Line total
                          </label>
                          <div className="h-8 flex items-center justify-end px-2 text-xs font-mono font-semibold text-fg bg-surface rounded-[6px] border border-line-subtle">
                            {formatCurrency(
                              prod.lineTotal != null && prod.lineTotal !== ''
                                ? prod.lineTotal
                                : Number(prod.quantity || 1) * Number(prod.unitPrice || 0),
                              receipt.currency
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line-subtle items-center">
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Category
                          </label>
                          <Select
                            value={prod.category || 'General'}
                            onValueChange={(val) =>
                              handleProductChange(prod.id || prod._id, 'category', val)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs bg-surface">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs">
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] text-fg-3 block mb-0.5 font-medium">
                            Warranty
                          </label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              value={prod.warrantyPeriodValue ?? ''}
                              onChange={(e) =>
                                handleProductChange(
                                  prod.id || prod._id,
                                  'warrantyPeriodValue',
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="h-7 text-xs font-mono w-14 text-center bg-surface px-1"
                            />
                            <Select
                              value={prod.warrantyPeriodUnit || 'months'}
                              onValueChange={(val) =>
                                handleProductChange(
                                  prod.id || prod._id,
                                  'warrantyPeriodUnit',
                                  val
                                )
                              }
                            >
                              <SelectTrigger className="h-7 text-[11px] w-16 bg-surface px-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="months">mo</SelectItem>
                                <SelectItem value="years">yr</SelectItem>
                                <SelectItem value="days">d</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  {/* Mobile Native Line Items (< sm) */}
                  <div className="sm:hidden space-y-3 divide-y divide-line-subtle">
                    {products.map((prod, idx) => (
                      <div key={prod._id || idx} className="pt-3 first:pt-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-fg leading-snug flex-1">
                            {prod.productName}
                          </span>
                          <span className="text-right shrink-0 font-mono font-bold text-sm text-fg tnum">
                            {formatCurrency(
                              prod.lineTotal != null && prod.lineTotal !== ''
                                ? prod.lineTotal
                                : Number(prod.quantity || 1) * Number(prod.unitPrice || 0),
                              receipt.currency
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-fg-3">
                          <span className="font-mono tnum">
                            {prod.quantity || 1} × {formatCurrency(prod.unitPrice, receipt.currency)}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] truncate max-w-[160px]">
                            {prod.brand && <span>{prod.brand}</span>}
                            {prod.category && <span>· {prod.category}</span>}
                          </div>
                        </div>
                        {prod.warrantyPeriodValue > 0 && (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent-tint/60 px-2 py-0.5 rounded-full border border-accent/20">
                              <ShieldCheck className="size-3" />
                              <span>{prod.warrantyPeriodValue} {prod.warrantyPeriodUnit || 'mo'} warranty</span>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= sm) */}
                  <div className="hidden sm:block w-full overflow-hidden">
                    <table className="w-full text-left border-collapse table-fixed text-xs">
                      <thead>
                        <tr className="border-b border-line-subtle text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                          <th className="py-2 px-1">Item</th>
                          <th className="py-2 px-1 text-center w-12">Qty</th>
                          <th className="py-2 px-1 text-right w-24">Unit</th>
                          <th className="py-2 px-1 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-subtle">
                        {products.map((prod, idx) => (
                          <tr key={prod._id || idx} className="hover:bg-subtle/30 transition-colors">
                            <td className="py-2.5 px-1 pr-2">
                              <div className="font-medium text-fg leading-snug">{prod.productName}</div>
                              <div className="text-[11px] text-fg-3 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                {prod.brand && <span>Brand: {prod.brand}</span>}
                                {prod.category && <span>· {prod.category}</span>}
                                {prod.warrantyPeriodValue > 0 && (
                                  <span className="inline-flex items-center gap-1 text-accent font-medium">
                                    <ShieldCheck className="size-3" />
                                    <span>
                                      {prod.warrantyPeriodValue} {prod.warrantyPeriodUnit || 'mo'} warranty
                                    </span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-1 text-center font-mono text-fg-2 tnum align-top pt-3">
                              {prod.quantity || 1}
                            </td>
                            <td className="py-2.5 px-1 text-right font-mono text-fg-2 tnum align-top pt-3 whitespace-nowrap">
                              {formatCurrency(prod.unitPrice, receipt.currency)}
                            </td>
                            <td className="py-2.5 px-1 text-right font-mono font-semibold text-fg tnum align-top pt-3 whitespace-nowrap">
                              {formatCurrency(prod.lineTotal || prod.unitPrice, receipt.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </m.div>

            {/* Section 3: Linked Products Section */}
            {products.length > 0 && (
              <m.div
                custom={3}
                initial="hidden"
                animate="show"
                variants={sectionVariants}
                className="p-4 rounded-[12px] bg-surface border border-line space-y-2.5 shadow-2xs"
              >
                <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider">
                  Linked products & warranties
                </h3>
                <div className="space-y-2">
                  {products.map((prod, idx) => (
                    <Link
                      key={prod._id || idx}
                      to={prod._id ? `/products/${prod._id}` : '/warranties'}
                      className="flex items-center justify-between p-2.5 rounded-[8px] border border-line-subtle hover:border-line bg-surface hover:bg-subtle/30 transition-all no-underline group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 rounded-[6px] bg-subtle border border-line-subtle flex items-center justify-center shrink-0 text-fg-3 group-hover:text-accent group-hover:border-accent-line transition-colors">
                          <Package className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-fg group-hover:text-accent transition-colors truncate">
                            {prod.productName}
                          </div>
                          <div className="text-[11px] text-fg-3">
                            {prod.brand || receipt.storeName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {prod.warrantyPeriodValue > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-tint text-accent border border-accent-line">
                            <ShieldCheck className="size-3" />
                            <span>{prod.warrantyPeriodValue} {prod.warrantyPeriodUnit || 'mo'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-fg-3 font-medium">No warranty</span>
                        )}
                        <ExternalLink className="size-3 text-fg-3 group-hover:text-fg transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </m.div>
            )}

            {/* Section 4: Notes & Provenance */}
            <m.div
              custom={4}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="p-4 rounded-[12px] bg-surface border border-line space-y-2 shadow-2xs"
            >
              <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                Notes
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                {isEditing ? (
                  <m.div
                    key="edit-notes"
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add notes, tags, or references..."
                      className="text-xs min-h-[80px]"
                    />
                  </m.div>
                ) : (
                  <m.p
                    key="read-notes"
                    layout="position"
                    className="text-xs text-fg-2 leading-relaxed whitespace-pre-wrap"
                  >
                    {receipt.notes || 'No notes recorded.'}
                  </m.p>
                )}
              </AnimatePresence>

              <div className="pt-2 border-t border-line-subtle flex items-center justify-between text-[11px] text-fg-3 flex-wrap gap-2">
                <span>Created: {formatDate(receipt.createdAt)}</span>
                {receipt.extractionConfidence != null && (
                  <span>OCR Confidence: {Math.round(receipt.extractionConfidence * 100)}%</span>
                )}
              </div>
            </m.div>

            {/* Section 5: Smart Tags & Folders */}
            <m.div
              custom={5}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="p-4 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                  <Hash className="size-3.5 text-accent" />
                  <span>Smart Tags & Organization</span>
                </div>
                <span className="text-[11px] text-fg-3 font-mono">{receiptTags.length} active</span>
              </div>

              {/* Active Tag Chips */}
              <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                {receiptTags.length === 0 ? (
                  <span className="text-xs text-fg-3 italic">No tags assigned. Click quick tags below or create one.</span>
                ) : (
                  receiptTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-accent-tint text-accent border border-accent/20"
                    >
                      <span>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="size-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-accent/80 hover:text-accent cursor-pointer"
                        title="Remove tag"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Tag Input & Suggestions */}
              <div className="pt-2 border-t border-line-subtle space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 font-mono text-xs">#</span>
                    <Input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Tag..."
                      className="h-8 text-xs font-mono pl-6 bg-surface"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTag()}
                    disabled={!newTagInput.trim()}
                    className="h-8 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="size-3 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-fg-3">Quick add:</span>
                  {['#Business', '#Personal', '#TaxDeductible', '#Hardware', '#Office', '#Travel'].map((preset) => {
                    const isAlreadyAdded = receiptTags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleAddTag(preset)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          isAlreadyAdded
                            ? 'opacity-40 bg-subtle text-fg-3 border-line cursor-not-allowed'
                            : 'bg-subtle/50 text-fg-2 border-line hover:border-accent hover:text-accent'
                        }`}
                      >
                        +{preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </m.div>
          </m.div>
        </div>
      </div>
      ) : (
        /* Full-Width Workspace when no document file attached */
        <div className="space-y-5 w-full">
          {/* Key Facts & Total Strip */}
          <m.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={sectionVariants}
            className="p-6 rounded-[12px] bg-surface border border-line flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                  Purchase date
                </span>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editPurchaseDate}
                    onChange={(e) => setEditPurchaseDate(e.target.value)}
                    className="h-8 text-xs font-sans mt-1"
                  />
                ) : (
                  <span className="text-sm font-medium text-fg mt-1 block">
                    {formatDate(receipt.purchaseDate)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                  Category
                </span>
                {isEditing ? (
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-medium text-fg mt-1 block">
                    {receipt.category || 'General'}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                  Payment
                </span>
                {isEditing ? (
                  <Input
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                ) : (
                  <span className="text-sm font-medium text-fg mt-1 block">
                    {receipt.paymentMethod || 'Standard'} ({receipt.currency || 'INR'})
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                  Invoice #
                </span>
                {isEditing ? (
                  <Input
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    className="h-8 text-xs font-mono mt-1"
                  />
                ) : (
                  <span className="text-sm font-mono text-fg mt-1 block">
                    {receipt.invoiceNumber || '—'}
                  </span>
                )}
              </div>
            </div>

            <div className="md:text-right border-t md:border-t-0 md:border-l border-line-subtle pt-4 md:pt-0 md:pl-6 shrink-0">
              <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                Grand total
              </span>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editGrandTotal}
                  onChange={(e) => setEditGrandTotal(e.target.value)}
                  className="h-10 text-xl font-mono font-bold w-44 mt-1"
                />
              ) : (
                <div className="text-3xl font-bold font-mono text-fg tnum tracking-tight mt-0.5">
                  {formatCurrency(grandVal, receipt.currency)}
                </div>
              )}
            </div>
          </m.div>

          {/* Full-Width Line Items Table */}
          <m.div
            custom={1}
            initial="hidden"
            animate="show"
            variants={sectionVariants}
            className="space-y-3"
          >
            {isEditing ? (
              <ProductListForm
                items={editProducts}
                onItemChange={handleProductChange}
                onAddItem={handleAddProduct}
                onRemoveItem={handleRemoveProduct}
                categoryOptions={categoryOptions}
                currencySymbol={getCurrencySymbol(receipt.currency)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <h3 className="text-sm font-semibold text-fg">
                    Line items ({products.length})
                  </h3>
                </div>

                <div className="w-full">
                  {/* Mobile Native Line Items (< sm) */}
                  <div className="sm:hidden space-y-3 p-3 rounded-[12px] border border-line bg-surface shadow-2xs divide-y divide-line-subtle">
                    {products.map((prod, idx) => (
                      <div key={prod._id || idx} className="pt-3 first:pt-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-fg leading-snug flex-1">
                            {prod.productName}
                          </span>
                          <span className="text-right shrink-0 font-mono font-bold text-sm text-fg tnum">
                            {formatCurrency(
                              prod.lineTotal != null && prod.lineTotal !== ''
                                ? prod.lineTotal
                                : Number(prod.quantity || 1) * Number(prod.unitPrice || 0),
                              receipt.currency
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-fg-3">
                          <span className="font-mono tnum">
                            {prod.quantity || 1} × {formatCurrency(prod.unitPrice, receipt.currency)}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] truncate max-w-[160px]">
                            {prod.brand && <span>{prod.brand}</span>}
                            {prod.category && <span>· {prod.category}</span>}
                          </div>
                        </div>
                        {prod.warrantyPeriodValue > 0 && (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent-tint/60 px-2 py-0.5 rounded-full border border-accent/20">
                              <ShieldCheck className="size-3" />
                              <span>{prod.warrantyPeriodValue} {prod.warrantyPeriodUnit || 'mo'} warranty</span>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= sm) */}
                  <div className="hidden sm:block w-full overflow-hidden rounded-[12px] border border-line bg-surface shadow-2xs">
                    <table className="w-full text-left border-collapse table-fixed text-xs">
                      <thead>
                        <tr className="bg-subtle/50 border-b border-line text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                          <th className="py-3 px-4 w-10 text-center">#</th>
                          <th className="py-3 px-4">Item description & details</th>
                          <th className="py-3 px-3 w-32">Category</th>
                          <th className="py-3 px-3 w-16 text-center">Qty</th>
                          <th className="py-3 px-4 w-28 text-right">Unit price</th>
                          <th className="py-3 px-4 w-32 text-center">Warranty</th>
                          <th className="py-3 px-4 w-28 text-right">Line total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-subtle">
                        {products.map((prod, idx) => (
                          <tr key={prod._id || idx} className="hover:bg-subtle/30 transition-colors">
                            <td className="py-3.5 px-4 text-center font-mono text-fg-3 tnum">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-sm text-fg leading-snug">
                                {prod.productName}
                              </div>
                              {prod.brand && (
                                <div className="text-xs text-fg-3 mt-0.5">Brand: {prod.brand}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-fg-2">
                              {prod.category || 'General'}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-fg-2 tnum">
                              {prod.quantity || 1}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-fg-2 tnum whitespace-nowrap">
                              {formatCurrency(prod.unitPrice, receipt.currency)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {prod.warrantyPeriodValue > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-tint text-accent border border-accent-line">
                                  <ShieldCheck className="size-3.5" />
                                  <span>{prod.warrantyPeriodValue} {prod.warrantyPeriodUnit || 'mo'}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-fg-3">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-fg tnum whitespace-nowrap">
                              {formatCurrency(prod.lineTotal || prod.unitPrice, receipt.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </m.div>

          {/* Bottom Split: Notes & Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <m.div
              custom={2}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="lg:col-span-7 space-y-4"
            >
              <div className="p-5 rounded-[12px] bg-surface border border-line space-y-2 shadow-2xs">
                <h3 className="text-sm font-semibold text-fg">Notes & reference</h3>
                {isEditing ? (
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes, tags, or references..."
                    className="text-xs min-h-[90px]"
                  />
                ) : (
                  <p className="text-xs text-fg-2 leading-relaxed whitespace-pre-wrap">
                    {receipt.notes || 'No notes recorded for this receipt.'}
                  </p>
                )}
              </div>

              {/* Smart Tags & Folders Card */}
              <div className="p-5 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
                    <Hash className="size-3.5 text-accent" />
                    <span>Smart Tags & Organization</span>
                  </div>
                  <span className="text-[11px] text-fg-3 font-mono">{receiptTags.length} active</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                  {receiptTags.length === 0 ? (
                    <span className="text-xs text-fg-3 italic">No tags assigned.</span>
                  ) : (
                    receiptTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-accent-tint text-accent border border-accent/20"
                      >
                        <span>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="size-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-accent/80 hover:text-accent cursor-pointer"
                          title="Remove tag"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-line-subtle space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 font-mono text-xs">#</span>
                      <Input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Tag..."
                        className="h-8 text-xs font-mono pl-6 bg-surface"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddTag()}
                      disabled={!newTagInput.trim()}
                      className="h-8 text-xs font-medium cursor-pointer"
                    >
                      <Plus className="size-3 mr-1" />
                      Add Tag
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-fg-3">Quick add:</span>
                    {['#Business', '#Personal', '#TaxDeductible', '#Hardware', '#Office', '#Travel'].map((preset) => {
                      const isAlreadyAdded = receiptTags.includes(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => handleAddTag(preset)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            isAlreadyAdded
                              ? 'opacity-40 bg-subtle text-fg-3 border-line cursor-not-allowed'
                              : 'bg-subtle/50 text-fg-2 border-line hover:border-accent hover:text-accent'
                          }`}
                        >
                          +{preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Linked Products */}
              {products.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-fg">
                    Linked products ({products.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.map((prod, idx) => (
                      <Link
                        key={prod._id || idx}
                        to={prod._id ? `/products/${prod._id}` : '/warranties'}
                        className="flex items-center justify-between p-3.5 rounded-[10px] border border-line bg-surface hover:bg-subtle/40 transition-colors no-underline group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-[8px] bg-subtle border border-line-subtle flex items-center justify-center shrink-0 text-fg-3 group-hover:text-accent transition-colors">
                            <Package className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-fg group-hover:text-accent transition-colors truncate">
                              {prod.productName}
                            </div>
                            <div className="text-[11px] text-fg-3">{prod.brand || 'General'}</div>
                          </div>
                        </div>
                        <ExternalLink className="size-3.5 text-fg-3 group-hover:text-fg shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </m.div>

            <m.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={sectionVariants}
              className="lg:col-span-5 space-y-4"
            >
              <div className="p-5 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs">
                <h3 className="text-sm font-semibold text-fg pb-2 border-b border-line-subtle">
                  Financial summary
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-3">Subtotal</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editSubtotal}
                        onChange={(e) => handleSubtotalChange(e.target.value)}
                        placeholder="0.00"
                        className="h-7 text-xs font-mono text-right w-28"
                      />
                    ) : (
                      <span className="font-mono text-fg tnum">
                        {subVal != null ? formatCurrency(subVal, receipt.currency) : '—'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-3">Tax / GST</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editTaxAmount}
                        onChange={(e) => handleTaxChange(e.target.value)}
                        placeholder="0.00"
                        className="h-7 text-xs font-mono text-right w-28"
                      />
                    ) : (
                      <span className="font-mono text-fg tnum">
                        {formatCurrency(taxVal, receipt.currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-3">Shipping</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editShippingAmount}
                        onChange={(e) => handleShippingChange(e.target.value)}
                        placeholder="0.00"
                        className="h-7 text-xs font-mono text-right w-28"
                      />
                    ) : (
                      <span className="font-mono text-fg tnum">
                        {formatCurrency(shipVal, receipt.currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-ok-fg">
                    <span className="font-medium">Discount</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editDiscountAmount}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        placeholder="0.00"
                        className="h-7 text-xs font-mono text-right w-28"
                      />
                    ) : (
                      <span className="font-mono font-semibold tnum">
                        -{formatCurrency(discVal, receipt.currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-line font-medium text-sm">
                    <span className="text-fg font-semibold">Grand total</span>
                    <span className="font-mono font-bold text-fg tnum text-base">
                      {formatCurrency(isEditing ? (Number(editGrandTotal) || 0) : grandVal, receipt.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      )}

      {/* 3. Sticky Save Bar: Slides up from bottom (y: 100% -> 0, spring.soft) during inline edit */}
      <AnimatePresence>
        {isEditing && (
          <m.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={spring.soft}
            className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md px-6 py-3 shadow-lg"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-fg">Editing receipt details</span>
                <span className="text-line-strong hidden sm:inline">·</span>
                <span className="text-[11px] text-fg-3 hidden sm:inline">
                  Original document remains visible on the left for side-by-side verification
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="min-w-[120px] cursor-pointer text-xs"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
                  )}
                </Button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Upgraded Share Modal with Step 8 Share Switch & Copy Morph */}
      {showShareModal && (
        <ShareModal
          receipt={receipt}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Accessible Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete receipt"
        message={`Are you sure you want to delete the receipt from ${vendorName}? This will permanently remove this invoice and all associated products and warranty records.`}
        confirmText="Delete receipt"
        cancelText="Keep receipt"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Full Form Modal with ReceiptForm */}
      {showFullFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-line rounded-[14px] p-6 max-w-2xl w-full shadow-xl">
            <ReceiptForm
              initialData={receipt}
              onSubmit={handleSaveEdit}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setShowFullFormModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default ReceiptDetail;
