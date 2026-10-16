import { useState } from 'react';
import toast from '@/lib/toast';
import { useUpdateReceiptStatus } from '../../queries/useReceiptMutations';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Active',
    description: 'Currently tracked receipt',
    badgeClass: 'bg-accent-tint text-accent border-accent/25',
  },
  {
    value: 'nearing_expiry',
    label: 'Needs Attention',
    description: 'Action required on this item',
    badgeClass: 'bg-warn-bg text-warn-text border-warn-border',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    description: 'Warranty claimed or handled',
    badgeClass: 'bg-ok-bg text-ok-text border-ok-border',
  },
  {
    value: 'archived',
    label: 'Archived',
    description: 'Filed away / no longer tracking',
    badgeClass: 'bg-surface-subtle text-fg-muted border-line',
  },
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
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
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
      setNoteError('Resolution note is required when marking as resolved.');
      return;
    }

    updateStatusMutation.mutate(
      { id: receipt._id, status: 'resolved', resolvedNote: resolvedNoteInput.trim() },
      {
        onSuccess: () => {
          toast.success('Receipt marked as resolved');
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
        <span className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">Status:</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${currentStatusObj.badgeClass}`}
        >
          <span>{currentStatusObj.label}</span>
          <ChevronDown className="size-3 text-fg-muted" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-[12px] bg-surface shadow-md border border-line py-1 z-30 animate-in fade-in-0 duration-150"
          onMouseLeave={() => setIsOpen(false)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectStatus(opt.value)}
              className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-hover transition-colors cursor-pointer ${
                receipt?.status === opt.value ? 'bg-surface-subtle font-semibold' : ''
              }`}
            >
              <span className="text-fg font-medium">{opt.label}</span>
              <span className="text-[11px] text-fg-muted">{opt.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Modal for Resolved Note prompt */}
      {showResolvedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-[16px] max-w-md w-full p-6 shadow-xl border border-line space-y-4">
            <div>
              <h3 className="text-base font-semibold text-fg">Mark receipt as resolved</h3>
              <p className="text-xs text-fg-muted mt-1 leading-normal">
                Enter a note explaining how this warranty or receipt was resolved (e.g. warranty claimed, item replaced, refund received).
              </p>
            </div>

            <form onSubmit={handleConfirmResolved} className="space-y-4">
              <div>
                <label htmlFor="resolvedNoteInput" className="text-xs font-medium text-fg block mb-1">
                  Resolution note <span className="text-bad-solid">*</span>
                </label>
                <textarea
                  id="resolvedNoteInput"
                  rows={3}
                  value={resolvedNoteInput}
                  onChange={(e) => {
                    setResolvedNoteInput(e.target.value);
                    if (noteError) setNoteError('');
                  }}
                  placeholder="e.g. Warranty claim approved, replacement unit received."
                  className="w-full text-xs p-2.5 rounded-[8px] bg-surface border border-line text-fg placeholder:text-fg-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
                {noteError && <p className="text-xs text-bad-text font-medium mt-1">{noteError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResolvedModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Saving...' : 'Save & resolve'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptStatusControl;
