import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  BellOff,
  Send,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Store,
  History,
  Sliders,
} from 'lucide-react';
import {
  useRemindersQuery,
  useUpdateReminderMutation,
  useTestReminderMutation,
} from '../queries/useRemindersQuery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';

const LEAD_DAYS_OPTIONS = [
  { value: 7, label: '7 days before' },
  { value: 14, label: '14 days before' },
  { value: 30, label: '30 days before (Recommended)' },
  { value: 60, label: '60 days before' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'due_soon', label: 'Expiring Soon' },
  { id: 'active', label: 'Active Alerts' },
  { id: 'disabled', label: 'Alerts Muted' },
  { id: 'expired', label: 'Expired' },
];

const ReminderCenter = () => {
  const [activeMainTab, setActiveMainTab] = useState('reminders'); // 'reminders' | 'logs'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filters = {
    status: statusFilter,
    search: searchTerm.trim(),
  };

  const { data, isLoading, isError } = useRemindersQuery(filters);
  const updateMutation = useUpdateReminderMutation();
  const testMutation = useTestReminderMutation();

  const { stats = {}, items = [], logs = [] } = data || {};

  const handleToggleReminder = (product) => {
    const nextState = !product.reminderEnabled;
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
          toast.error('Failed to update reminder settings');
        },
      }
    );
  };

  const handleLeadDaysChange = (product, newDays) => {
    const daysNum = parseInt(newDays, 10);
    updateMutation.mutate(
      {
        productId: product._id,
        reminderLeadDays: daysNum,
      },
      {
        onSuccess: () => {
          toast.success(`Reminder alert lead time set to ${daysNum} days`);
        },
        onError: () => {
          toast.error('Failed to update lead time');
        },
      }
    );
  };

  const handleSendTestEmail = (product) => {
    testMutation.mutate(product._id, {
      onSuccess: () => {
        toast.success(`Test reminder dispatched for ${product.productName}!`);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Failed to send test reminder';
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

  if (isError) {
    return (
      <EmptyState
        title="Could not load Reminder Center"
        description="Something went wrong loading your notification settings. Please refresh."
      />
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-slate-900 font-sans pb-24">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
            Reminder Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage automated email alerts and lead-time settings for upcoming warranty expirations.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Stat Tiles (4 Tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            WARRANTY TRACKERS
          </span>
          <span className="text-2xl font-bold text-slate-900 font-tabular">
            {stats.totalTracked || 0}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Total warrantied items
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            REMINDERS ACTIVE
          </span>
          <span className="text-2xl font-bold text-emerald-800 font-tabular">
            {stats.remindersEnabled || 0}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Notifications enabled
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            DUE SOON (&le;30 DAYS)
          </span>
          <span className="text-2xl font-bold text-amber-700 font-tabular">
            {stats.dueSoonCount || 0}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Approaching expiry
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            NOTIFICATIONS SENT
          </span>
          <span className="text-2xl font-bold text-slate-900 font-tabular">
            {stats.logsSentCount || 0}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Total email alerts logged
          </span>
        </div>
      </div>

      {/* 3. Main Tabs Navigation Strip */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMainTab('reminders')}
            className={`pb-3 px-1 transition-colors relative cursor-pointer inline-flex items-center gap-1.5 ${
              activeMainTab === 'reminders'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Active Reminders ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('logs')}
            className={`pb-3 px-1 transition-colors relative cursor-pointer inline-flex items-center gap-1.5 ${
              activeMainTab === 'logs'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sent Logs & History ({logs.length})</span>
          </button>
        </div>

        {/* Tab Content: Reminders Settings */}
        {activeMainTab === 'reminders' && (
          <div className="space-y-4">
            {/* Search & Filter Pills Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products or brands..."
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }}
                  className="w-full text-xs py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                      statusFilter === tab.id
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminders List */}
            {items.length === 0 ? (
              <EmptyState
                title={searchTerm ? 'No items match your search' : 'No items under warranty'}
                description="Products with active warranties will automatically appear here with notification controls."
              />
            ) : (
              <div className="divide-y divide-slate-100 border-b border-slate-100">
                {items.map((prod) => {
                  const daysLeft = prod.daysRemaining;

                  let countdownPill = (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-tabular">
                      Expired
                    </span>
                  );

                  if (daysLeft > 30) {
                    countdownPill = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-tabular">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        <span>{daysLeft} days left</span>
                      </span>
                    );
                  } else if (daysLeft > 0) {
                    countdownPill = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 font-tabular">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{daysLeft} days left</span>
                      </span>
                    );
                  }

                  return (
                    <div
                      key={prod._id}
                      className="py-4 md:py-4.5 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors rounded-lg"
                    >
                      {/* Left: Product Name, Brand, Expiry Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            to={`/products/${prod._id}`}
                            className="text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-800 transition-colors"
                          >
                            {prod.productName}
                          </Link>
                          {prod.brand && (
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {prod.brand}
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                            {prod.category}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 font-normal flex items-center gap-2 flex-wrap">
                          {prod.receipt?.storeName && (
                            <>
                              <span className="font-semibold text-slate-700">{prod.receipt.storeName}</span>
                              <span className="text-slate-300">•</span>
                            </>
                          )}
                          <span>
                            Expires: <strong className="text-slate-800 font-semibold font-tabular">{formatDate(prod.warrantyExpiryDate)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Center: Countdown Status Pill */}
                      <div className="shrink-0">{countdownPill}</div>

                      {/* Right: Controls Strip (Lead-time dropdown, Toggle, Test send) */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap self-end md:self-auto">
                        {/* Lead Time Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={prod.reminderLeadDays || 30}
                            onChange={(e) => handleLeadDaysChange(prod, e.target.value)}
                            disabled={!prod.reminderEnabled || daysLeft <= 0}
                            className="text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            {LEAD_DAYS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Test Email Button */}
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail(prod)}
                          disabled={testMutation.isPending}
                          title="Send test notification email now"
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-3 h-3 text-slate-500" />
                          <span className="hidden sm:inline">Test Alert</span>
                        </button>

                        {/* Enable/Disable Toggle Switch */}
                        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(prod)}
                            disabled={updateMutation.isPending}
                            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                              prod.reminderEnabled ? 'bg-emerald-700' : 'bg-slate-200'
                            }`}
                            title={prod.reminderEnabled ? 'Reminders active (click to mute)' : 'Reminders muted (click to activate)'}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                prod.reminderEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Sent Logs Audit History */}
        {activeMainTab === 'logs' && (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <EmptyState
                title="No notifications sent yet"
                description="When the background cron job or test alerts send reminder emails, their dispatch records will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100 border-b border-slate-100 text-xs">
                {logs.map((log) => (
                  <div
                    key={log._id}
                    className="py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 font-semibold text-sm">
                          {log.productName}
                        </strong>
                        {log.storeName && (
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-sans">
                            {log.storeName}
                          </span>
                        )}
                        <span className="text-slate-400 font-tabular">
                          ({log.leadDays} days lead alert)
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-2">
                        <span>Sent to: <strong className="text-slate-700">{log.recipientEmail}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span className="font-tabular">{new Date(log.sentAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderCenter;
