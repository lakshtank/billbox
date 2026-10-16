import * as React from 'react';
import { toast } from 'sonner';
import { Check, AlertTriangle, XCircle, Info } from 'lucide-react';

const buzz = (ms = 8) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms);
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }
};

/**
 * notify - Universal unified notification API for BillBox (Step 12.2)
 *
 * Provides:
 * - notify.success(title, opts)
 * - notify.error(title, opts) (persists with duration: Infinity unless explicitly overridden)
 * - notify.warn(title, opts)
 * - notify.info(title, opts)
 * - notify.promise(promise, { loading, success, error })
 * - notify.undo({ title, onUndo, onCommit, ms })
 */
export const notify = {
  success: (title, opts) => {
    buzz();
    return toast.success(title, {
      icon: <Check className="size-4 text-ok-solid" />,
      ...opts,
    });
  },

  error: (title, opts) => {
    buzz(20);
    return toast.error(title, {
      icon: <XCircle className="size-4 text-bad-solid" />,
      duration: Infinity,
      ...opts,
    });
  },

  warn: (title, opts) => {
    return toast.warning(title, {
      icon: <AlertTriangle className="size-4 text-warn-solid" />,
      ...opts,
    });
  },

  info: (title, opts) => {
    return toast.info(title, {
      icon: <Info className="size-4 text-accent" />,
      ...opts,
    });
  },

  // loading → success/error in the SAME toast (icon morphs)
  promise: (p, msgs) => {
    return toast.promise(p, {
      loading: msgs.loading,
      success: msgs.success,
      error: msgs.error,
    });
  },

  // destructive with undo + visible countdown
  undo: ({ title, onUndo, onCommit, ms = 6000 }) => {
    let committed = false;
    const commitTimer = setTimeout(() => {
      if (!committed && onCommit) {
        committed = true;
        onCommit();
      }
    }, ms);

    return toast(title, {
      duration: ms,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(commitTimer);
          committed = true;
          onUndo?.();
        },
      },
      onDismiss: () => {
        if (!committed && onCommit) {
          committed = true;
          clearTimeout(commitTimer);
          onCommit();
        }
      },
      onAutoClose: () => {
        if (!committed && onCommit) {
          committed = true;
          onCommit();
        }
      },
    });
  },

  dismiss: (id) => toast.dismiss(id),
};

export default notify;
