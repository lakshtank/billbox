import { useState } from 'react';
import toast from 'react-hot-toast';
import { useUpdateReceiptStatus } from '../../queries/useReceiptMutations';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', description: 'Currently tracked receipt', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { value: 'nearing_expiry', label: 'Needs Attention', description: 'Action required on this item', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'resolved', label: 'Resolved', description: 'Warranty claimed or handled', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'archived', label: 'Archived', description: 'Filed away / no longer tracking', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const ReceiptStatusControl = ({ receipt }) => {
  const updateStatusMutation = useUpdateReceiptStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [showResolvedModal, setShowResolvedModal] = useState(false);
  const [resolvedNoteInput, setResolvedNoteInput] = useState(receipt?.resolvedNote || '');
  const [noteError, setNoteError] = useState('');

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.value === receipt?.status) || STATUS_OPTIONS[0];

  const handleSelectStatus = (newStatus) => {
    setIsOpen(false);
    if (newStatus === receipt?.status) return;

    if (newStatus === 'resolved') {
      setResolvedNoteInput(receipt?.resolvedNote || '');
      setNoteError('');
      setShowResolvedModal(true);
    } else {
      updateStatusMutation.mutate(
        { id: receipt._id, status: newStatus },
        {
          onSuccess: () => {
            toast.success(`Lifecycle status updated to ${newStatus.replace('_', ' ')}`);
          },
          onError: (err) => {
            const msg = err.response?.data?.message || 'Failed to update status.';
            toast.error(msg);
          },
        }
      );
    }
  };

  const handleConfirmResolved = (e) => {
    e.preventDefault();
    if (!resolvedNoteInput.trim()) {
      setNoteError('Resolved note is required when marking as resolved.');
      return;
    }

    updateStatusMutation.mutate(
      { id: receipt._id, status: 'resolved', resolvedNote: resolvedNoteInput.trim() },
      {
        onSuccess: () => {
          toast.success('Receipt marked as resolved!');
          setShowResolvedModal(false);
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to update status.';
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer transition-all ${currentStatusObj.color}`}
        >
          <span>{currentStatusObj.label}</span>
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-slate-200 py-1.5 z-20"
          onMouseLeave={() => setIsOpen(false)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectStatus(opt.value)}
              className={`w-full text-left px-3.5 py-2 text-xs flex flex-col gap-0.5 hover:bg-slate-50 transition-colors ${
                receipt?.status === opt.value ? 'bg-slate-50/80 font-bold' : ''
              }`}
            >
              <span className="text-slate-800 font-semibold">{opt.label}</span>
              <span className="text-[11px] text-slate-500">{opt.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Modal for Resolved Note prompt */}
      {showResolvedModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Mark Receipt as Resolved</h3>
              <p className="text-xs text-slate-600 mt-1">
                Please enter a note explaining how this warranty/receipt was resolved (e.g. warranty claim approved, item replaced, refund received).
              </p>
            </div>

            <form onSubmit={handleConfirmResolved} className="space-y-4">
              <div>
                <label htmlFor="resolvedNoteInput" className="text-xs font-semibold text-slate-700 block mb-1">
                  Resolution Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="resolvedNoteInput"
                  rows={3}
                  value={resolvedNoteInput}
                  onChange={(e) => {
                    setResolvedNoteInput(e.target.value);
                    if (noteError) setNoteError('');
                  }}
                  placeholder="e.g. Returned to Sony store on Aug 2. Received replacement unit S/N #90248."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                {noteError && <p className="text-xs text-rose-500 mt-1">{noteError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResolvedModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="btn btn-primary text-xs"
                >
                  {updateStatusMutation.isPending ? 'Saving...' : 'Save & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptStatusControl;
