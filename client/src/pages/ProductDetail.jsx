import * as React from 'react';
import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from '@/lib/toast';
import {
  ShieldCheck,
  Edit2,
  Trash2,
  Store,
  ArrowLeft,
  Tag,
  ReceiptText,
} from 'lucide-react';
import { useProductQuery } from '../queries/useProductsQuery';
import { useUpdateProduct, useDeleteProduct } from '../queries/useProductMutations';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/data/StatusBadge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, formatCurrency } from '../utils/formatters';
import { DEFAULT_CATEGORIES } from '../constants/category.constants';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProductQuery(id);
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const product = data?.product || data;

  const [editForm, setEditForm] = useState({
    productName: '',
    brand: '',
    category: 'Electronics',
    quantity: 1,
    unitPrice: '',
    purchaseDate: '',
    warrantyPeriodValue: 12,
    warrantyPeriodUnit: 'months',
  });

  const handleOpenEdit = () => {
    if (!product) return;
    const pDate = product.purchaseDate || product.receiptId?.purchaseDate;
    setEditForm({
      productName: product.productName || '',
      brand: product.brand || '',
      category: product.category || 'Electronics',
      quantity: product.quantity || 1,
      unitPrice: product.unitPrice != null ? String(product.unitPrice) : '',
      purchaseDate: pDate ? new Date(pDate).toISOString().split('T')[0] : '',
      warrantyPeriodValue:
        product.warrantyPeriodValue || product.warrantyPeriodMonths || 12,
      warrantyPeriodUnit: product.warrantyPeriodUnit || 'months',
    });
    setIsEditing(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.productName.trim()) {
      toast.error('Product name cannot be empty');
      return;
    }

    const priceNum = editForm.unitPrice ? parseFloat(editForm.unitPrice) : null;
    const periodVal = parseInt(editForm.warrantyPeriodValue, 10) || 0;
    const purchDate = editForm.purchaseDate ? new Date(editForm.purchaseDate) : new Date();

    // Calculate updated expiry on save
    let expiryDate = null;
    let warrantyStatus = 'none';

    if (periodVal > 0) {
      const d = new Date(purchDate);
      if (editForm.warrantyPeriodUnit === 'years') {
        d.setFullYear(d.getFullYear() + periodVal);
      } else if (editForm.warrantyPeriodUnit === 'days') {
        d.setDate(d.getDate() + periodVal);
      } else {
        d.setMonth(d.getMonth() + periodVal);
      }
      expiryDate = d;
      const now = new Date();
      warrantyStatus = expiryDate < now ? 'expired' : 'active';
    }

    updateMutation.mutate(
      {
        id,
        updates: {
          productName: editForm.productName.trim(),
          brand: editForm.brand.trim(),
          category: editForm.category,
          quantity: parseInt(editForm.quantity, 10) || 1,
          unitPrice: priceNum,
          lineTotal: priceNum ? priceNum * (parseInt(editForm.quantity, 10) || 1) : null,
          purchaseDate: editForm.purchaseDate || null,
          warrantyPeriodValue: periodVal,
          warrantyPeriodUnit: editForm.warrantyPeriodUnit,
          warrantyPeriodMonths:
            editForm.warrantyPeriodUnit === 'years'
              ? periodVal * 12
              : editForm.warrantyPeriodUnit === 'months'
              ? periodVal
              : Math.round(periodVal / 30),
          warrantyExpiryDate: expiryDate,
          warrantyStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success('Product updated. Reminder schedule reset.');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Failed to update product');
        },
      }
    );
  };

  const handleToggleReminder = (enabled) => {
    updateMutation.mutate(
      { id, updates: { reminderEnabled: enabled } },
      {
        onSuccess: () => {
          toast.success(`Warranty reminders ${enabled ? 'enabled' : 'disabled'}.`);
        },
        onError: () => {
          toast.error('Failed to update reminder.');
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Product removed successfully');
        navigate('/products');
      },
      onError: () => {
        toast.error('Failed to delete product');
        setShowDeleteModal(false);
      },
    });
  };

  // Warranty timeline computation
  const timelineMetrics = useMemo(() => {
    if (!product) return null;
    const expiry = product.warrantyExpiryDate;
    const purchase = product.purchaseDate || product.receiptId?.purchaseDate || product.createdAt;

    if (!expiry) {
      return {
        hasWarranty: false,
        daysText: 'No warranty attached',
        statusKey: 'none',
        elapsedPercent: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exp = new Date(expiry);
    exp.setHours(0, 0, 0, 0);

    const purch = purchase ? new Date(purchase) : new Date(exp.getTime() - 365 * 24 * 60 * 60 * 1000);
    purch.setHours(0, 0, 0, 0);

    const totalTime = Math.max(1, exp.getTime() - purch.getTime());
    const elapsedTime = Math.max(0, today.getTime() - purch.getTime());
    const elapsedPercent = Math.min(100, Math.max(0, Math.round((elapsedTime / totalTime) * 100)));

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        hasWarranty: true,
        daysLeft: diffDays,
        daysText: `Expired ${Math.abs(diffDays)} days ago`,
        statusKey: 'expired',
        elapsedPercent: 100,
        timelineColor: 'bg-bad',
        textColor: 'text-bad-fg',
        purchaseFormatted: formatDate(purch),
        expiryFormatted: formatDate(exp),
      };
    }

    if (diffDays <= 30) {
      return {
        hasWarranty: true,
        daysLeft: diffDays,
        daysText: diffDays === 0 ? 'Expires today' : `${diffDays} days left`,
        statusKey: 'expiring',
        elapsedPercent,
        timelineColor: 'bg-warn',
        textColor: 'text-warn-fg',
        purchaseFormatted: formatDate(purch),
        expiryFormatted: formatDate(exp),
      };
    }

    return {
      hasWarranty: true,
      daysLeft: diffDays,
      daysText:
        diffDays > 365
          ? `${(diffDays / 365).toFixed(1)} years left`
          : `${diffDays} days left`,
      statusKey: 'active',
      elapsedPercent,
      timelineColor: 'bg-accent',
      textColor: 'text-ok-fg',
      purchaseFormatted: formatDate(purch),
      expiryFormatted: formatDate(exp),
    };
  }, [product]);

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans select-none" aria-busy="true">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <Skeleton className="h-6 w-32 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        <div className="p-6 rounded-[12px] border border-line bg-surface space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-[12px] border border-line bg-surface space-y-4">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 p-6 rounded-[12px] border border-line bg-surface space-y-4">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-8">
        <EmptyState
          title="Product not found"
          description="The product you are looking for does not exist or was removed."
          actionLabel="Back to products"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const receipt = product.receiptId;
  const storeName = receipt?.storeName || 'Merchant';
  const statusKey = timelineMetrics?.statusKey || 'none';

  return (
    <div className="space-y-5 w-full font-sans">
      {/* 1. Header Toolbar */}
      <div className="space-y-1.5 pb-2 border-b border-line">
        <div className="flex items-center gap-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs text-fg-3 hover:text-fg font-medium transition-colors no-underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Products</span>
          </Link>
          <span className="text-fg-3 select-none">/</span>
          <span className="text-xs text-fg-2 font-medium truncate max-w-xs">
            {product.productName}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <h1 className="text-2xl font-semibold text-fg tracking-tight leading-tight truncate">
              {product.productName}
            </h1>
            <StatusBadge status={statusKey} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <Edit2 className="size-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="size-8 p-0 text-fg-3 hover:text-bad-fg hover:bg-bad-bg/20 cursor-pointer"
              title="Delete product"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {product.brand && (
          <p className="text-xs text-fg-3">
            Brand: <span className="font-medium text-fg-2">{product.brand}</span> · Category:{' '}
            <span className="font-medium text-fg-2">{product.category || 'General'}</span>
          </p>
        )}
      </div>

      {/* 2. Warranty Timeline Banner */}
      {timelineMetrics?.hasWarranty && (
        <div className="p-5 rounded-[12px] bg-surface border border-line space-y-4 shadow-2xs">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                Warranty status
              </span>
              <div
                className={`text-3xl font-bold font-mono tnum tracking-tight mt-0.5 ${timelineMetrics.textColor}`}
              >
                {timelineMetrics.daysText}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                Coverage elapsed
              </span>
              <span className="font-mono text-sm font-semibold text-fg tnum">
                {timelineMetrics.elapsedPercent}%
              </span>
            </div>
          </div>

          {/* Timeline Bar & Nodes */}
          <div className="space-y-2 pt-2">
            <div className="relative w-full h-2 rounded-full bg-subtle overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${timelineMetrics.timelineColor}`}
                style={{ width: `${timelineMetrics.elapsedPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-fg-3 pt-1">
              <span>Purchased: {timelineMetrics.purchaseFormatted}</span>
              <span className="font-sans font-medium text-fg-2">Today</span>
              <span>Expires: {timelineMetrics.expiryFormatted}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: Purchase & Cost Information */}
        <div className="p-5 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs h-full flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-line-subtle text-fg">
              <Store className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Purchase details</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-fg-3">Merchant / Store</span>
                <span className="font-medium text-fg">{storeName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Purchase Date</span>
                <span className="font-mono text-fg tnum">
                  {product.purchaseDate || receipt?.purchaseDate
                    ? formatDate(product.purchaseDate || receipt.purchaseDate)
                    : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Quantity</span>
                <span className="font-mono text-fg tnum">{product.quantity || 1}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Unit Price</span>
                <span className="font-mono text-fg tnum">
                  {product.unitPrice != null
                    ? formatCurrency(product.unitPrice, receipt?.currency)
                    : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line-subtle font-semibold">
                <span className="text-fg">Total Value</span>
                <span className="font-mono text-fg tnum">
                  {formatCurrency(
                    product.lineTotal ||
                      (product.unitPrice != null ? product.unitPrice * (product.quantity || 1) : 0),
                    receipt?.currency
                  )}
                </span>
              </div>
            </div>
          </div>

          {receipt?._id && (
            <div className="pt-3 border-t border-line-subtle mt-auto">
              <Link
                to={`/receipts/${receipt._id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] border border-line bg-subtle hover:bg-subtle/80 text-fg text-xs font-medium transition-colors no-underline cursor-pointer"
              >
                <ReceiptText className="size-3.5 text-accent" />
                <span>View source receipt</span>
              </Link>
            </div>
          )}
        </div>

        {/* Card 2: Warranty & Coverage */}
        <div className="p-5 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs h-full flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-line-subtle text-fg">
              <ShieldCheck className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Warranty coverage</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-fg-3">Duration</span>
                <span className="font-medium text-fg">
                  {product.warrantyPeriodValue
                    ? `${product.warrantyPeriodValue} ${product.warrantyPeriodUnit || 'months'}`
                    : product.warrantyPeriodMonths
                    ? `${product.warrantyPeriodMonths} months`
                    : 'None specified'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Expiration Date</span>
                <span className="font-mono text-fg tnum">
                  {product.warrantyExpiryDate ? formatDate(product.warrantyExpiryDate) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-line-subtle mt-auto">
            <div>
              <span className="font-medium text-fg block text-xs">Expiry alerts</span>
              <span className="text-[11px] text-fg-3 block">Notify before coverage ends</span>
            </div>
            <Switch
              checked={Boolean(product.reminderEnabled)}
              onCheckedChange={handleToggleReminder}
              aria-label="Toggle warranty reminder"
            />
          </div>
        </div>

        {/* Card 3: Identifiers & Metadata */}
        <div className="p-5 rounded-[12px] bg-surface border border-line space-y-3 shadow-2xs h-full flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-line-subtle text-fg">
              <Tag className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Asset details</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-fg-3">Category</span>
                <span className="font-medium text-fg">{product.category || 'General'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Brand</span>
                <span className="font-medium text-fg">{product.brand || 'Unbranded'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Registered on</span>
                <span className="font-mono text-fg tnum">{formatDate(product.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-fg-3">Last updated</span>
                <span className="font-mono text-fg tnum">{formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Edit Product Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent size="md" className="p-6">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>
              Update product details, purchase date, and warranty coverage period.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-name" className="text-xs">
                Product name *
              </Label>
              <Input
                id="edit-prod-name"
                value={editForm.productName}
                onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-brand" className="text-xs">
                  Brand
                </Label>
                <Input
                  id="edit-prod-brand"
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-cat" className="text-xs">
                  Category
                </Label>
                <select
                  id="edit-prod-cat"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full text-xs h-9 px-2.5 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-price" className="text-xs">
                  Unit price (₹)
                </Label>
                <Input
                  id="edit-prod-price"
                  type="number"
                  step="0.01"
                  value={editForm.unitPrice}
                  onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-date" className="text-xs">
                  Purchase date
                </Label>
                <Input
                  id="edit-prod-date"
                  type="date"
                  value={editForm.purchaseDate}
                  onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-wval" className="text-xs">
                  Warranty period
                </Label>
                <Input
                  id="edit-prod-wval"
                  type="number"
                  min="0"
                  value={editForm.warrantyPeriodValue}
                  onChange={(e) =>
                    setEditForm({ ...editForm, warrantyPeriodValue: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-wunit" className="text-xs">
                  Period unit
                </Label>
                <select
                  id="edit-prod-wunit"
                  value={editForm.warrantyPeriodUnit}
                  onChange={(e) =>
                    setEditForm({ ...editForm, warrantyPeriodUnit: e.target.value })
                  }
                  className="w-full text-xs h-9 px-2.5 bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:border-accent"
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-[8px] bg-subtle border border-line-subtle text-[11px] text-fg-3">
              Expiry date and warranty status are calculated automatically. Changing the warranty period will reset the reminder schedule.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving changes...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete product"
        message={`Are you sure you want to remove "${product.productName}"? This will permanently delete this asset and its associated warranty timeline.`}
        confirmText="Delete product"
        cancelText="Keep product"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

export default ProductDetail;
