import * as React from 'react';
import {
  ShieldCheck,
  Clock,
  ShieldOff,
  Minus,
  AlertTriangle,
  Check,
  XCircle,
  Loader2,
  PlugZap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';

/**
 * StatusBadge map (single source of truth)
 * Step 9.4:
 * Server values passed in directly; never client-invented.
 */
export const STATUS_MAP = {
  active: {
    variant: 'ok',
    icon: ShieldCheck,
    label: 'Covered',
  },
  expiring: {
    variant: 'warn',
    icon: Clock,
    label: 'Expiring',
  },
  expired: {
    variant: 'bad',
    icon: ShieldOff,
    label: 'Expired',
  },
  none: {
    variant: 'neutral',
    icon: Minus,
    label: 'No cover',
  },
  needs_review: {
    variant: 'warn',
    icon: AlertTriangle,
    label: 'Needs review',
  },
  reconciled: {
    variant: 'ok',
    icon: Check,
    label: 'Matched',
  },
  saved: {
    variant: 'ok',
    icon: Check,
    label: 'Saved',
  },
  failed: {
    variant: 'bad',
    icon: XCircle,
    label: 'Failed',
  },
  processing: {
    variant: 'accent',
    icon: Loader2,
    label: 'Processing',
    iconClassName: 'animate-spin',
  },
  not_configured: {
    variant: 'neutral',
    icon: PlugZap,
    label: 'Not configured',
  },
};

export function StatusBadge({ status, label: customLabel, className, ...props }) {
  const normalizedKey = (status || '').toLowerCase().trim();
  const config = STATUS_MAP[normalizedKey] || {
    variant: 'neutral',
    icon: Minus,
    label: customLabel || status || 'Unknown',
  };

  const Icon = config.icon;
  const label = customLabel || config.label;

  return (
    <Badge
      variant={config.variant}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    >
      <Icon className={cn('size-3 shrink-0', config.iconClassName)} />
      <span>{label}</span>
    </Badge>
  );
}

export default StatusBadge;
