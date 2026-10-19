import React, { useState } from 'react';
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from '@/lib/toast';

export function EmailPreviewModal({
  open,
  onClose,
  product = null,
  user = null,
  isEmailConfigured = false,
  onSendTest = null,
  onOpenSmtpConfig = null,
}) {
  const [isSending, setIsSending] = useState(false);
  const [lastPreviewUrl, setLastPreviewUrl] = useState(null);

  if (!open || !product) return null;

  const daysRemaining = product.daysRemaining != null ? product.daysRemaining : 28;
  const productName = product.productName || 'Purchased Item';
  const storeName = product.receipt?.storeName || 'Official Merchant';
  const formattedExpiry = product.warrantyExpiryDate
    ? new Date(product.warrantyExpiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '28 Days Remaining';

  const recipientEmail = user?.email || 'user@example.com';
  const subject = `[BillBox] Warranty Expiry Notice: ${productName} (${daysRemaining} days remaining)`;

  const handleSend = async () => {
    if (!onSendTest) return;
    setIsSending(true);
    try {
      const res = await onSendTest(product);
      if (res?.previewUrl) {
        setLastPreviewUrl(res.previewUrl);
        toast.success('Test email dispatched via Ethereal Sandbox!', {
          action: {
            label: 'View Email',
            onClick: () => window.open(res.previewUrl, '_blank'),
          },
        });
      } else if (res?.isLive) {
        toast.success(`Live warranty email delivered to ${recipientEmail}! Check your inbox and spam folder.`);
      } else {
        toast.success('Test email dispatched successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not dispatch test email.';
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-surface text-fg border border-line shadow-2xl p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-3 border-b border-line">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Mail className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-fg">Warranty Alert Email Preview</DialogTitle>
            </div>
            {isEmailConfigured ? (
              <Badge variant="ok" className="text-[10px] gap-1 py-0.5">
                <CheckCircle2 className="size-3" />
                <span>Live Delivery</span>
              </Badge>
            ) : (
              <Badge variant="warn" className="text-[10px] gap-1 py-0.5">
                <AlertTriangle className="size-3" />
                <span>Sandbox Mode</span>
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-fg-3">
            This exact high-fidelity template is dispatched automatically at 30d, 15d, and 7d milestones.
          </DialogDescription>
        </DialogHeader>

        {/* Live Delivery vs Sandbox Notice */}
        {!isEmailConfigured && (
          <div className="my-2.5 p-3 rounded-xl bg-warn-tint/60 border border-warn/30 text-warn-fg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 shrink-0" />
                Real emails to your inbox require SMTP
              </span>
              {onOpenSmtpConfig && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSmtpConfig();
                  }}
                  className="font-bold underline text-warn-fg hover:opacity-80 text-[11px] cursor-pointer"
                >
                  Connect Gmail →
                </button>
              )}
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              No mail server is configured in <code className="font-mono bg-subtle px-1 py-0.2 rounded">server/.env</code>. Test emails will open in an active Ethereal web mailbox for verification.
            </p>
          </div>
        )}

        {/* Ethereal Delivered Banner (When test email was sent) */}
        {lastPreviewUrl && (
          <div className="my-2 p-3 rounded-xl bg-ok-tint border border-ok-line text-ok-fg text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-ok shrink-0" />
              <span className="font-medium">Test message successfully delivered to Ethereal mailbox!</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.open(lastPreviewUrl, '_blank')}
              className="h-7 text-xs gap-1 font-semibold border-ok-line text-ok-fg hover:bg-ok-bg"
            >
              <span>Open in Web Mailbox</span>
              <ExternalLink className="size-3" />
            </Button>
          </div>
        )}

        {/* Email Header Metadata Box */}
        <div className="my-2 p-3 rounded-2xl bg-subtle/50 border border-line-subtle space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-fg-3">Recipient:</span>
            <span className="font-semibold text-fg font-mono">{recipientEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-fg-3">Subject Line:</span>
            <span className="font-semibold text-fg truncate max-w-[320px]">{subject}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-fg-3">Milestone Cadence:</span>
            <Badge variant="warn" className="text-[10px] font-mono px-2 py-0.2">
              {daysRemaining <= 7 ? 'Critical (≤7d)' : daysRemaining <= 30 ? 'Proactive (≤30d)' : 'Upcoming (90d)'}
            </Badge>
          </div>
        </div>

        {/* Rendered HTML Container */}
        <div className="border border-line rounded-2xl overflow-hidden shadow-xs bg-white text-slate-800 p-6 space-y-4 text-sm font-sans select-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xl font-extrabold text-[#23778E] tracking-tight">BillBox</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 uppercase tracking-wider">
              Warranty Shield Alert
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Warranty Expiry Milestone Notice</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Hello <strong>{user?.name || 'Valued User'}</strong>, this is an automated priority notification from your BillBox Vault.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Covered Item:</span>
              <span className="font-bold text-slate-800">{productName}</span>
            </div>
            {storeName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor / Merchant:</span>
                <span className="font-medium text-slate-700">{storeName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Official Expiry:</span>
              <span className="font-medium text-slate-700">{formattedExpiry}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Deadline Countdown:</span>
              <span className={`font-bold ${daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 30 ? 'text-amber-600' : 'text-blue-600'}`}>
                {daysRemaining} days remaining
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Please test your item for any faults or performance wear. You can claim free replacements or repair service before this coverage terminates.
          </p>

          <div className="pt-2">
            <div className="inline-block px-4 py-2 rounded-lg bg-[#23778E] text-white text-xs font-semibold shadow-xs">
              View Warranty in BillBox
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-line">
          <Button variant="ghost" type="button" onClick={onClose} className="h-9 px-3 text-xs">
            Close
          </Button>

          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="h-9 px-4 text-xs font-semibold bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 cursor-pointer flex items-center gap-1.5"
          >
            <Send className="size-3.5" />
            <span>{isSending ? 'Sending...' : isEmailConfigured ? 'Send Live Email to Inbox' : 'Send Test via Sandbox'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
