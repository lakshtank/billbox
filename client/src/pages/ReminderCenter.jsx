import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from '@/lib/toast';
import {
  Bell,
  History,
  AlertTriangle,
  Mail,
  Search,
  X,
} from 'lucide-react';
import {
  useRemindersQuery,
  useUpdateReminderMutation,
  useTestReminderMutation,
} from '../queries/useRemindersQuery';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { DateCell } from '../components/data/DateCell';
import { StatusBadge } from '../components/data/StatusBadge';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import RouteSkeleton from '@/components/common/RouteSkeleton';
import PageContentTransition from '@/components/common/PageContentTransition';
import * as m from 'motion/react-m';
import { LayoutGroup } from 'motion/react';
import { variants } from '@/lib/motion';

export default function ReminderCenter() {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [searchTerm, setSearchTerm] = useState('');

  const filters = {
    search: searchTerm.trim(),
  };

  const { data, isLoading, isError } = useRemindersQuery(filters);
  const updateMutation = useUpdateReminderMutation();
  const testMutation = useTestReminderMutation();

  const stats = data?.stats || {};
  const items = Array.isArray(data?.items) ? data.items : [];
  const logs = Array.isArray(data?.logs) ? data.logs : [];

  const handleToggleReminder = (product, nextState) => {
    updateMutation.mutate(
      {
        productId: product._id,
        reminderEnabled: nextState,
      },
      {
        onSuccess: () => {
          toast.success(
            nextState
              ? `Reminders enabled for ${product.productName}`
              : `Reminders muted for ${product.productName}`
          );
        },
        onError: () => {
          toast.error('Failed to update reminder status.');
        },
      }
    );
  };

  const handleSendTestEmail = (product) => {
    testMutation.mutate(product._id, {
      onSuccess: () => {
        toast.success(`Test reminder sent for ${product.productName}!`);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to send test reminder';
        toast.error(msg);
      },
    });
  };

  // Filter items locally if search is active
  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.productName?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.receipt?.storeName?.toLowerCase().includes(q)
    );
  });

  const hasAnimatedStagger = React.useRef(false);
  const shouldStagger = !hasAnimatedStagger.current && filteredItems.length > 0;
  React.useEffect(() => {
    if (filteredItems.length > 0) {
      hasAnimatedStagger.current = true;
    }
  }, [filteredItems.length]);

  return (
    <PageContentTransition
      isLoading={isLoading && !data}
      skeleton={<RouteSkeleton section="reminders" />}
      className="space-y-6 font-sans"
    >
      {/* 1. Warn Banner: Email Delivery Not Configured */}
      {!isLoading && stats.isEmailConfigured === false && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 p-3.5 rounded-[10px] border border-warn/30 bg-warn-tint text-warn-fg text-sm font-medium shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="size-4 shrink-0 text-warn-fg" />
            <span className="truncate">
              Email delivery isn't configured. Reminders won't be sent.
            </span>
          </div>
          <Link
            to="/settings"
            className="shrink-0 text-xs font-semibold underline hover:no-underline text-warn-fg"
          >
            Settings →
          </Link>
        </div>
      )}

      {/* 2. Page Header */}
      <PageHeader
        title="Reminders"
        description="Automated warranty expiration alerts and notification history."
      />

      {/* 3. Search & Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-line pb-1">
        {/* Tabs: Upcoming & History */}
        <div className="flex items-center gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`pb-2.5 px-1 transition-colors relative cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'text-fg border-b-2 border-accent'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            <Bell className="size-4" />
            <span>Upcoming ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-1 transition-colors relative cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-fg border-b-2 border-accent'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            <History className="size-4" />
            <span>History ({logs.length})</span>
          </button>
        </div>

        {/* Search Input (for Upcoming tab) */}
        {activeTab === 'upcoming' && (
          <div className="relative w-full sm:w-64 mb-2 sm:mb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter products..."
              className="w-full text-xs pl-9 pr-8 py-1.5 rounded-lg border border-line bg-surface text-fg placeholder:text-fg-3 focus:outline-none focus:border-line-focus transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>



      {/* 4. Tab 1: Upcoming Reminders Table */}
      {activeTab === 'upcoming' && (
        <div className="rounded-[12px] border border-line bg-surface shadow-2xs overflow-hidden">
          {isError ? (
            <div className="p-8">
              <EmptyState
                icon={Bell}
                title="Could not load reminders"
                description="Something went wrong fetching your reminders. Please refresh."
                actionLabel="Retry"
                onAction={() => window.location.reload()}
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Bell}
                title={searchTerm ? 'No matching products' : 'No upcoming reminders'}
                description={
                  searchTerm
                    ? `No products match "${searchTerm}".`
                    : 'Tracked products with active warranties will automatically appear here.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
              <LayoutGroup id="billbox-reminders-rows">
                <table className="w-full text-left border-collapse table-fixed text-sm">
                  <colgroup>
                    <col className="w-[35%] min-w-[200px]" />
                    <col className="w-[20%] min-w-[130px]" />
                    <col className="w-[20%] min-w-[130px]" />
                    <col className="w-[15%] min-w-[100px]" />
                    <col className="w-[10%] min-w-[80px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-line bg-subtle text-xs font-medium text-fg-3 uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Product</th>
                      <th className="py-2.5 px-4 font-semibold">Expiry</th>
                      <th className="py-2.5 px-4 font-semibold">Next reminder date</th>
                      <th className="py-2.5 px-4 font-semibold">Channel</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Alert</th>
                    </tr>
                  </thead>
                  <m.tbody
                    variants={variants.stagger(0.015)}
                    initial={shouldStagger ? 'hidden' : false}
                    animate="show"
                    className="divide-y divide-line-subtle"
                  >
                    {filteredItems.map((prod, index) => {
                        const isStaggered = index < 12;
                        const enableLayout = filteredItems.length <= 50;

                        return (
                          <m.tr
                            key={prod._id}
                            layout={enableLayout ? 'position' : false}
                            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                            variants={variants.fade}
                            initial={shouldStagger && isStaggered ? 'hidden' : false}
                            animate="show"
                            className="group hover:bg-hover/60 transition-colors"
                          >
                            {/* Product Name, Brand & Merchant */}
                            <td className="py-3 px-4">
                              <div className="min-w-0">
                                <Link
                                  to={`/products/${prod._id}`}
                                  className="font-medium text-fg hover:text-accent transition-colors truncate block"
                                >
                                  {prod.productName}
                                </Link>
                                <div className="flex items-center gap-1.5 text-xs text-fg-3 flex-wrap mt-0.5">
                                  {prod.brand && <span>{prod.brand}</span>}
                                  {prod.brand && prod.receipt?.storeName && <span>•</span>}
                                  {prod.receipt?.storeName && (
                                    <span>{prod.receipt.storeName}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Expiry Date */}
                            <td className="py-3 px-4">
                              <DateCell
                                value={prod.warrantyExpiryDate}
                                relative
                                daysRemaining={prod.daysRemaining}
                              />
                            </td>

                            {/* Next Reminder Date */}
                            <td className="py-3 px-4">
                              <DateCell value={prod.nextReminderDate} />
                            </td>

                            {/* Channel */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 text-xs text-fg-2 bg-subtle px-2 py-0.5 rounded border border-line">
                                <Mail className="size-3 text-fg-3" />
                                <span>Email</span>
                              </span>
                            </td>

                            {/* Switch & Test Trigger */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                <Switch
                                  checked={Boolean(prod.reminderEnabled)}
                                  onCheckedChange={(checked) =>
                                    handleToggleReminder(prod, checked)
                                  }
                                  aria-label={`Toggle reminder for ${prod.productName}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendTestEmail(prod)}
                                  disabled={testMutation.isPending || !prod.reminderEnabled}
                                  className="h-6 px-1.5 text-[11px] text-fg-3 hover:text-accent font-normal"
                                  title="Send a test reminder email"
                                >
                                  Test
                                </Button>
                              </div>
                            </td>
                          </m.tr>
                        );
                      })}
                  </m.tbody>
                </table>
              </LayoutGroup>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: History Table */}
      {activeTab === 'history' && (
        <div className="rounded-[12px] border border-line bg-surface shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-line-subtle last:border-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={History}
                title="No reminders sent yet"
                description="Dispatched reminder records and test notification logs will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed text-sm">
                <colgroup>
                  <col className="w-[20%] min-w-[130px]" />
                  <col className="w-[30%] min-w-[180px]" />
                  <col className="w-[30%] min-w-[180px]" />
                  <col className="w-[20%] min-w-[120px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-line bg-subtle text-xs font-medium text-fg-3 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Sent at</th>
                    <th className="py-2.5 px-4 font-semibold">Product</th>
                    <th className="py-2.5 px-4 font-semibold">Recipient</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Delivery status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {logs.map((log) => {
                    let statusProp = 'reconciled';
                    let statusLabel = 'Sent';

                    if (log.status === 'failed') {
                      statusProp = 'failed';
                      statusLabel = 'Failed';
                    } else if (log.status === 'skipped' || log.status === 'not_configured') {
                      statusProp = 'not_configured';
                      statusLabel = 'Not configured';
                    }

                    return (
                      <tr
                        key={log._id}
                        className="group hover:bg-hover/60 transition-colors"
                      >
                        {/* Sent At */}
                        <td className="py-3 px-4 font-medium text-fg">
                          <DateCell value={log.sentAt} />
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-fg truncate">
                            {log.productName}
                          </div>
                          {log.storeName && (
                            <div className="text-xs text-fg-3 truncate">
                              {log.storeName}
                            </div>
                          )}
                        </td>

                        {/* Recipient */}
                        <td className="py-3 px-4 text-xs font-mono text-fg-2 truncate">
                          {log.recipientEmail}
                        </td>

                        {/* Delivery Status */}
                        <td className="py-3 px-4 text-right">
                          <StatusBadge status={statusProp} label={statusLabel} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageContentTransition>
  );
}
