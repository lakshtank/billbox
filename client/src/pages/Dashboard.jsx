import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Mail,
  X,
  FileText,
  Plus,
  Lock,
  UploadCloud,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useDashboardQuery } from '../queries/useDashboardQuery';
import WarrantyTimelineWidget from '../components/dashboard/WarrantyTimelineWidget';
import ActivityFeedWidget from '../components/dashboard/ActivityFeedWidget';
import UpcomingExpiriesWidget from '../components/dashboard/UpcomingExpiriesWidget';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isLoading, isError } = useDashboardQuery();

  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'month'
  const [showReminderBanner, setShowReminderBanner] = useState(() => {
    return localStorage.getItem('billbox_hide_reminder_banner') !== 'true';
  });

  const handleDismissBanner = () => {
    setShowReminderBanner(false);
    localStorage.setItem('billbox_hide_reminder_banner', 'true');
  };

  // Extract user's display first name
  const firstName = useMemo(() => {
    if (user?.name) return user.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Laksh';
  }, [user]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

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
        title="Unable to load dashboard"
        description="We ran into an issue fetching your dashboard data. Please try refreshing."
      />
    );
  }

  const currency = user?.defaultCurrency || (typeof window !== 'undefined' ? localStorage.getItem('billbox_default_currency') : null) || stats?.baseCurrency || 'INR';

  // Process Category Spending List
  const topCategories = Array.isArray(stats?.topCategoriesThisMonth) && stats.topCategoriesThisMonth.length > 0
    ? stats.topCategoriesThisMonth
    : [
        { category: 'Electronics', count: 6, total: 980206.99, percentage: 65 },
        { category: 'Groceries', count: 4, total: 506.00, percentage: 20 },
        { category: 'Hardware', count: 2, total: 410.00, percentage: 10 },
        { category: 'Appliances', count: 1, total: 172.00, percentage: 5 },
      ];

  // Tiered palette matching user's cold winter gradient (#112D4E -> #3F72AF -> #DBE2EF)
  const categoryBarTones = [
    'bg-brand-navy',
    'bg-brand-primary',
    'bg-brand-primary/70',
    'bg-brand-primary/40',
    'bg-brand-border',
  ];

  const recentReceipts = Array.isArray(stats?.recentReceipts) ? stats.recentReceipts : [];

  const displaySpend = timeframe === 'month'
    ? (stats?.thisMonthSpent || 0)
    : (stats?.totalSpent || stats?.thisMonthSpent || 0);

  const coveragePercent = stats?.totalProducts > 0
    ? Math.min(100, Math.round(((stats.activeWarranties || 0) / stats.totalProducts) * 100))
    : 100;

  return (
    <div className="min-h-screen bg-brand-canvas px-4 sm:px-6 md:px-8 lg:px-10 py-8 w-full space-y-6 text-brand-navy font-sans pb-24">
      {/* 1. Executive Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy tracking-tight leading-snug">
              {greeting}, {firstName} 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-border/60 text-brand-navy border border-brand-border">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span>{stats?.activeWarranties || 0} Warranties Protected</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Here is the portfolio overview of your documented purchases and warranties.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {/* Timeframe selector pill */}
          <div className="inline-flex items-center p-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-brand-navy text-white shadow-2xs'
                  : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-brand-navy text-white shadow-2xs'
                  : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Quick Add Receipt Button */}
          <button
            type="button"
            onClick={() => navigate('/receipts/new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Receipt</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Balanced KPI Metric Cards (Equal Height Stretch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* KPI 1: Expenditure */}
        <div
          onClick={() => navigate('/receipts')}
          className="bg-brand-surface border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group h-full"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 group-hover:bg-slate-200/80 transition-colors">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">
                {timeframe === 'month' ? 'Spent This Month' : 'Total Expenditure'}
              </span>
              <span className="text-2xl font-semibold text-slate-900 font-tabular tracking-tight">
                {formatCurrency(displaySpend, currency)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-normal">
              {stats?.totalReceipts || 0} {stats?.totalReceipts === 1 ? 'receipt' : 'receipts'} logged
            </span>
            <span className="text-[11px] font-medium text-slate-700 group-hover:text-brand-primary transition-colors inline-flex items-center gap-0.5">
              Ledger <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Tracked Products */}
        <div
          onClick={() => navigate('/products')}
          className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col justify-between group h-full"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-brand-border flex items-center justify-center text-slate-700 group-hover:bg-brand-border/60 transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">
                Cataloged Products
              </span>
              <span className="text-2xl font-semibold text-brand-navy font-tabular tracking-tight">
                {stats?.totalProducts || 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-normal">
              Across {topCategories.length} categories
            </span>
            <span className="text-[11px] font-medium text-slate-700 group-hover:text-brand-primary transition-colors inline-flex items-center gap-0.5">
              Inventory <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: Active Warranties */}
        <div
          onClick={() => navigate('/warranties')}
          className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col justify-between group h-full"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-brand-border/60 border border-brand-border flex items-center justify-center text-brand-primary group-hover:bg-brand-border transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">
                Active Warranties
              </span>
              <span className="text-2xl font-semibold text-brand-navy font-tabular tracking-tight">
                {stats?.activeWarranties || 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-normal">
              {coveragePercent}% portfolio covered
            </span>
            <span className="text-[11px] font-medium text-slate-700 group-hover:text-brand-primary transition-colors inline-flex items-center gap-0.5">
              Coverage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: Action Status / Expiring Soon */}
        <div
          onClick={() => navigate('/warranties')}
          className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col justify-between group h-full"
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                (stats?.expiringWarranties || 0) > 0
                  ? 'bg-brand-border border-brand-primary/40 text-brand-navy'
                  : 'bg-slate-100 border-brand-border text-slate-700'
              }`}
            >
              {(stats?.expiringWarranties || 0) > 0 ? (
                <AlertCircle className="w-5 h-5 text-brand-primary" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-brand-primary" />
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">
                Action Required
              </span>
              <span
                className={`text-2xl font-semibold font-tabular tracking-tight ${
                  (stats?.expiringWarranties || 0) > 0 ? 'text-brand-primary' : 'text-slate-900'
                }`}
              >
                {stats?.expiringWarranties || 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-normal">
              {(stats?.expiringWarranties || 0) > 0 ? 'Warranties expire soon' : 'All warranties safe'}
            </span>
            <span
              className={`text-[11px] font-medium transition-colors inline-flex items-center gap-0.5 ${
                (stats?.expiringWarranties || 0) > 0
                  ? 'text-brand-primary font-bold'
                  : 'text-brand-navy group-hover:text-brand-primary'
              }`}
            >
              {(stats?.expiringWarranties || 0) > 0 ? 'Review alerts' : 'View all'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Paired Structured Sections (Exact Equal Heights Side-by-Side) */}
      <div className="space-y-6">
        {/* ROW 1: Warranty Horizon (8 cols) + Upcoming Expiries (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 flex flex-col">
            <WarrantyTimelineWidget />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <UpcomingExpiriesWidget />
          </div>
        </div>

        {/* ROW 2: Recent Receipts Ledger (8 cols) + Vault Protection Health (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Box: Recent Receipts Ledger */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between font-sans h-full">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                      Recent Receipts & Invoices
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-normal">
                      Latest documented merchant purchases
                    </p>
                  </div>
                  <Link
                    to="/receipts"
                    className="text-xs font-medium text-brand-navy hover:text-brand-primary transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentReceipts.length === 0 ? (
                  <div className="py-10 text-center space-y-2 my-auto">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium text-slate-700">No recent receipts found</p>
                    <p className="text-[11px] text-slate-400">Add your first invoice to see transactions here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 my-auto">
                    {recentReceipts.slice(0, 4).map((rcpt, idx) => {
                      const itemCount = rcpt.products?.length || rcpt.itemsCount || 1;
                      const store = rcpt.storeName || 'Merchant';
                      const amt = rcpt.grandTotal != null ? rcpt.grandTotal : (rcpt.totalAmount != null ? rcpt.totalAmount : 0);
                      const storeInitials = store.substring(0, 2).toUpperCase();

                      return (
                        <div
                          key={rcpt._id || idx}
                          onClick={() => navigate(`/receipts/${rcpt._id}`)}
                          className="py-3 px-1.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors rounded-xl group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/70 font-semibold text-xs text-slate-700 flex items-center justify-center shrink-0">
                              {storeInitials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-slate-900 text-xs truncate block group-hover:text-brand-primary transition-colors">
                                {store}
                              </span>
                              <span className="text-[11px] text-slate-400 font-tabular block">
                                {formatDate(rcpt.purchaseDate)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-slate-900 font-tabular block">
                              {formatCurrency(amt, rcpt.currency || 'INR')}
                            </span>
                            <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full font-normal inline-block mt-0.5">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pinned Bottom Footer */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {Math.min(4, recentReceipts.length)} of {stats?.totalReceipts || recentReceipts.length} recorded purchases
                </span>
                <Link
                  to="/receipts"
                  className="font-medium text-brand-navy hover:text-brand-primary hover:underline"
                >
                  View Complete Ledger
                </Link>
              </div>
            </div>
          </div>

          {/* Right Box: Warranty Vault Protection */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between font-sans h-full">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 text-slate-800 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-brand-primary" />
                    </div>
                    <span className="text-[11px] font-medium text-brand-navy bg-brand-border/60 border border-brand-border px-2.5 py-0.5 rounded-full">
                      Vault Active
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                      Warranty Vault Protection
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                      Continuous monitoring, cloud invoice archival, and automated warranty tracking.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 py-3 text-xs font-normal text-slate-700 my-auto">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-2 text-slate-600">
                      <UploadCloud className="w-4 h-4 text-slate-400" />
                      <span>Cloud Invoice Backup</span>
                    </span>
                    <span className="font-medium text-brand-primary text-[11px]">Synced</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>Expiry Alerts</span>
                    </span>
                    <span className="font-medium text-slate-900 text-[11px]">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Digital Vault</span>
                    </span>
                    <span className="font-medium text-slate-900 text-[11px]">Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Pinned Bottom Button */}
              <div className="pt-4 mt-auto border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/warranties')}
                  className="w-full py-2.5 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Configure Expiry Alerts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Top Spending Categories (8 cols) + Activity Feed (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Box: Top Spending Categories */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between font-sans h-full">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                      Top Spending Categories
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-normal">
                      Portfolio expenditure breakdown by department
                    </p>
                  </div>
                  <Link
                    to="/products"
                    className="text-xs font-medium text-brand-navy hover:text-brand-primary transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4 py-2.5 my-auto">
                  {topCategories.map((cat, idx) => {
                    const barColor = categoryBarTones[idx % categoryBarTones.length];
                    const pct = cat.percentage || Math.max(10, 80 - idx * 20);

                    return (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800 text-xs flex items-center gap-2">
                            <span>{cat.category}</span>
                            {cat.count && (
                              <span className="text-[10px] text-slate-400 font-normal font-tabular">
                                ({cat.count} items)
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 text-xs font-semibold font-tabular">
                              {cat.total ? formatCurrency(cat.total, currency) : ''}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 font-tabular bg-slate-100 px-1.5 py-0.5 rounded">
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Clean Segment Track */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pinned Bottom Footer */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Categorized across {topCategories.length} product classifications
                </span>
                <Link
                  to="/products"
                  className="font-medium text-brand-navy hover:text-brand-primary hover:underline"
                >
                  Manage Categories
                </Link>
              </div>
            </div>
          </div>

          {/* Right Box: Activity Feed */}
          <div className="lg:col-span-4 flex flex-col">
            <ActivityFeedWidget />
          </div>
        </div>
      </div>

      {/* 4. Actionable Reminder Notification Banner */}
      {showReminderBanner && (
        <div className="bg-brand-surface border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-slate-900">
                Never miss a warranty claim deadline
              </h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Enable automated notifications to receive an alert before manufacturer warranties expire.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/warranties')}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Enable Reminders
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="px-2.5 py-1.5 text-xs font-normal text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
