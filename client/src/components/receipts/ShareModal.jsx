import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import toast from '@/lib/toast';
import { formatDate } from '../../utils/formatters';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { spring } from '@/lib/motion';

// Public Base URL configuration for share links & QR codes.
const PUBLIC_BASE_URL = (
  import.meta.env.VITE_PUBLIC_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
).replace(/\/$/, '');

export function ShareModal({ receipt, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharingEnabled, setIsSharingEnabled] = useState(Boolean(receipt?.publicToken));
  const linkInputRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 639px)');

  if (!receipt) return null;

  const realPublicUrl = receipt.publicToken ? `${PUBLIC_BASE_URL}/public/r/${receipt.publicToken}` : '';
  const vendorName = receipt.storeName?.trim() || 'Merchant Receipt';
  const formattedDate = receipt.purchaseDate ? formatDate(receipt.purchaseDate) : '';

  const handleToggleShare = (checked) => {
    setIsSharingEnabled(checked);
    if (checked) {
      toast.success('Sharing turned on', { duration: 4000 });
      setTimeout(() => {
        if (linkInputRef.current) {
          linkInputRef.current.focus();
          linkInputRef.current.select();
        }
      }, 100);
    } else {
      toast.info('Sharing turned off', { duration: 4000 });
    }
  };

  const handleCopyLink = () => {
    if (!realPublicUrl) {
      toast.error('Shareable link not available for this receipt.');
      return;
    }
    navigator.clipboard.writeText(realPublicUrl);
    setCopiedLink(true);
    toast.success('Link copied', { duration: 2000 });
    setTimeout(() => setCopiedLink(false), 1600);
  };

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleNativeShare = async () => {
    if (!canNativeShare || !realPublicUrl) return;
    try {
      await navigator.share({
        title: `Receipt from ${vendorName}`,
        text: `View receipt from ${vendorName}`,
        url: realPublicUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const modalBody = (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {/* Share Switch Control */}
      <div className="flex items-center justify-between p-3 rounded-[10px] bg-subtle/50 border border-line-subtle gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <Label htmlFor="share-toggle" className="text-xs font-semibold text-fg block cursor-pointer">
            Public link sharing
          </Label>
          <span className="text-[11px] text-fg-3 block leading-tight">
            {isSharingEnabled ? 'Anyone with the link can view receipt' : 'Sharing is currently disabled'}
          </span>
        </div>
        <Switch
          id="share-toggle"
          checked={isSharingEnabled}
          onCheckedChange={handleToggleShare}
        />
      </div>

      {/* Collapsible / Expandable Link & QR Section */}
      <AnimatePresence initial={false}>
        {isSharingEnabled && (
          <m.div
            layout
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={spring.soft}
            className="space-y-4"
          >
            {/* QR Code Container */}
            <div className="w-[200px] mx-auto p-3.5 rounded-[12px] border border-line bg-subtle/40 flex flex-col items-center justify-center gap-2.5">
              {realPublicUrl ? (
                <div className="bg-white p-2.5 rounded-[8px] border border-line-subtle shadow-xs inline-flex items-center justify-center">
                  <QRCodeSVG
                    value={realPublicUrl}
                    size={140}
                    level="M"
                    fgColor="#0F172A"
                    bgColor="#FFFFFF"
                    includeMargin={false}
                  />
                </div>
              ) : (
                <div className="size-36 bg-subtle rounded-[8px] flex flex-col items-center justify-center gap-2 text-fg-3">
                  <QrCode className="size-8 text-fg-3" />
                  <p className="text-xs">No share token</p>
                </div>
              )}
              <span className="text-[11px] text-fg-3 font-medium text-center">
                Scan to view receipt on mobile
              </span>
            </div>

            {/* Public Link Input + Copy Button Group */}
            <div className="w-full min-w-0 flex items-center gap-2 rounded-[8px] border border-line bg-subtle/50 pl-3 pr-1 py-1">
              <input
                ref={linkInputRef}
                readOnly
                type="text"
                value={realPublicUrl || 'No link available'}
                onClick={(e) => e.target.select()}
                className="text-xs font-mono text-fg-2 truncate flex-1 min-w-0 bg-transparent border-0 outline-none select-all"
                title={realPublicUrl}
              />
              <Button
                type="button"
                size="sm"
                variant={copiedLink ? 'secondary' : 'default'}
                className="h-8 px-3 text-xs gap-1.5 shrink-0"
                onClick={handleCopyLink}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <m.span
                    key={copiedLink ? 'ok' : 'copy'}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="size-3.5 text-ok-fg" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </m.span>
                </AnimatePresence>
              </Button>
            </div>

            {/* Native share button (mobile) */}
            {canNativeShare && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={handleNativeShare}
              >
                <Share2 className="size-3.5" />
                <span>More sharing options</span>
              </Button>
            )}

            {/* Footer Note */}
            <p className="text-[11px] text-fg-3 text-center leading-normal">
              Anyone with this link can view and download this receipt.
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={Boolean(receipt)}
        onOpenChange={(open) => !open && onClose()}
        shouldScaleBackground
      >
        <DrawerContent className="px-5 pt-1 pb-[calc(20px+env(safe-area-inset-bottom))] gap-3">
          <DrawerHeader className="pr-6 text-left">
            <DrawerTitle className="text-base font-semibold text-fg tracking-tight">
              Share receipt
            </DrawerTitle>
            <DrawerDescription className="text-xs text-fg-3 truncate mt-0.5">
              {vendorName} {formattedDate && `· ${formattedDate}`}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[75vh]">
            {modalBody}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={Boolean(receipt)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" className="w-[calc(100vw-32px)] sm:max-w-[420px] p-6 gap-4 overflow-hidden">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="text-base font-semibold text-fg tracking-tight">
            Share receipt
          </DialogTitle>
          <DialogDescription className="text-xs text-fg-3 truncate mt-0.5">
            {vendorName} {formattedDate && `· ${formattedDate}`}
          </DialogDescription>
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
}

export default ShareModal;
