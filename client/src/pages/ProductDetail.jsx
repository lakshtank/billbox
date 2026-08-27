import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Package,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Store,
  DollarSign,
  Info,
} from 'lucide-react';
import { useProductQuery } from '../queries/useProductsQuery';
import { useUpdateProduct, useDeleteProduct } from '../queries/useProductMutations';
import ReceiptViewer from '../components/receipts/ReceiptViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatters';

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Appliances',
  'Medical',
  'Fashion',
  'Furniture',
  'Groceries',
  'Others',
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProductQuery(id);
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isEditing, setIsEditing] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    productName: '',
    brand: '',
    category: 'Electronics',
    quantity: 1,
    unitPrice: '',
    warrantyExpiryDate: '',
    warrantyStatus: 'none',
  });

  const product = data?.product;

  const handleOpenEdit = () => {
    if (!product) return;
    setEditForm({
      productName: product.productName || '',
      brand: product.brand || '',
      category: product.category || 'Electronics',
      quantity: product.quantity || 1,
      unitPrice: product.unitPrice != null ? String(product.unitPrice) : '',
      warrantyExpiryDate: product.warrantyExpiryDate
        ? new Date(product.warrantyExpiryDate).toISOString().split('T')[0]
        : '',
      warrantyStatus: product.warrantyStatus || 'none',
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
    const qtyNum = parseInt(editForm.quantity, 10) || 1;

    updateMutation.mutate(
      {
        id,
        updates: {
          productName: editForm.productName.trim(),
          brand: editForm.brand.trim(),
          category: editForm.category,
          quantity: qtyNum,
          unitPrice: priceNum,
          lineTotal: priceNum ? priceNum * qtyNum : null,
          warrantyExpiryDate: editForm.warrantyExpiryDate || null,
          warrantyStatus: editForm.warrantyStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success('Product updated successfully');
          setIsEditing(false);
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to update product';
          toast.error(msg);
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Product deleted');
        navigate('/products');
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to delete product';
        toast.error(msg);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <EmptyState
        title="Product not found"
        description="The product you are looking for does not exist or has been removed."
        actionLabel="Back to Products"
        onAction={() => navigate('/products')}
      />
    );
  }

  const receipt = product.receiptId;
  const currency = receipt?.currency || 'INR';
  const price = product.lineTotal || product.unitPrice;

  // Calculate warranty days left
  let daysLeft = null;
  if (product.warrantyExpiryDate) {
    const expiry = new Date(product.warrantyExpiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* Original Receipt Viewer Modal */}
      {showViewer && receipt?.fileUrl && (
        <ReceiptViewer
          fileUrl={receipt.fileUrl}
          fileName={`${receipt.storeName || product.productName} Receipt`}
          fileType={receipt.fileType}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* 1. Breadcrumb Row */}
      <div className="flex items-center justify-between gap-4 text-xs font-normal text-slate-500">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/products" className="hover:text-slate-900 transition-colors text-slate-500 font-medium">
            Products
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate">{product.productName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEdit}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleting(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 2. Product Hero Title Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {product.category || 'Others'}
            </span>

            {product.warrantyStatus === 'active' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Under Warranty</span>
              </span>
            )}
            {product.warrantyStatus === 'expiring_soon' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Expiring Soon</span>
              </span>
            )}
            {product.warrantyStatus === 'expired' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Expired</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            {product.productName}
          </h1>

          {product.brand && (
            <p className="text-xs text-slate-500 font-medium mt-1">
              Brand: <strong className="text-slate-800 font-semibold">{product.brand}</strong>
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Spend
          </span>
          <span className="text-3xl font-bold text-slate-900 font-tabular tracking-tight">
            {price != null ? formatCurrency(price, currency) : '—'}
          </span>
        </div>
      </div>

      {/* 3. Main Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linked Receipt Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              <span>Purchase & Receipt</span>
            </h2>
            {receipt && (
              <Link
                to={`/receipts/${receipt._id}`}
                className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                <span>View Receipt</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {receipt ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Merchant / Store</span>
                <span className="font-bold text-slate-900">{receipt.storeName || 'Merchant'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Purchase Date</span>
                <span className="font-semibold text-slate-900 font-tabular">
                  {formatDate(receipt.purchaseDate)}
                </span>
              </div>
              {receipt.invoiceNumber && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Invoice Number</span>
                  <span className="font-mono text-slate-700">{receipt.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Original File</span>
                {receipt.fileUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowViewer(true)}
                    className="text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View document</span>
                  </button>
                ) : (
                  <span className="text-slate-400">Manual Entry</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 space-y-2">
              <p>This product was added directly without an attached receipt document.</p>
            </div>
          )}
        </div>

        {/* Warranty Coverage Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Warranty Coverage</span>
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-bold text-slate-900 uppercase">{product.warrantyStatus || 'None'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Expiry Date</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {product.warrantyExpiryDate ? formatDate(product.warrantyExpiryDate) : 'Not Specified'}
              </span>
            </div>

            {product.warrantyPeriodMonths && (
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Duration</span>
                <span className="font-semibold text-slate-900 font-tabular">
                  {product.warrantyPeriodMonths} Months
                </span>
              </div>
            )}

            {daysLeft != null && (
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Time Remaining</span>
                  <span
                    className={`font-bold font-tabular ${
                      daysLeft <= 0
                        ? 'text-rose-600'
                        : daysLeft <= 30
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Financial Breakdown Strip */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 font-sans">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Financial Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block mb-1">Unit Price</span>
            <span className="font-bold text-slate-900 text-base font-tabular">
              {product.unitPrice != null ? formatCurrency(product.unitPrice, currency) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block mb-1">Quantity</span>
            <span className="font-bold text-slate-900 text-base font-tabular">
              {product.quantity || 1}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block mb-1">Discounts</span>
            <span className="font-bold text-slate-900 text-base font-tabular">
              {product.discountAmount ? formatCurrency(product.discountAmount, currency) : '0.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block mb-1">Line Total</span>
            <span className="font-bold text-emerald-800 text-base font-tabular">
              {price != null ? formatCurrency(price, currency) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Product</h3>
                <p className="text-xs text-slate-500">Update product specifications and warranty.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-400 font-sans text-xs"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.unitPrice}
                    onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warranty Expiry Date</label>
                  <input
                    type="date"
                    value={editForm.warrantyExpiryDate}
                    onChange={(e) => setEditForm({ ...editForm, warrantyExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warranty Status</label>
                  <select
                    value={editForm.warrantyStatus}
                    onChange={(e) => setEditForm({ ...editForm, warrantyStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-slate-400 font-sans text-xs"
                  >
                    <option value="none">None</option>
                    <option value="active">Active</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 font-sans">
            <h3 className="text-lg font-bold text-slate-900">Delete Product</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{product.productName}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
