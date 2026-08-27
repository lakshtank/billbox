import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Package,
  ShieldCheck,
  Calendar,
  Wallet,
  ArrowRight,
  Shield,
  Check,
  Mail,
  X,
  FileText,
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
  const [showReminderBanner, setShowReminderBanner] = useState(true);

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
        { category: 'Electronics', count: 6, percentage: 65, barColor: 'bg-emerald-500' },
        { category: 'Appliances', count: 2, percentage: 25, barColor: 'bg-sky-500' },
        { category: 'Accessories', count: 2, percentage: 20, barColor: 'bg-purple-500' },
        { category: 'Others', count: 2, percentage: 15, barColor: 'bg-amber-500' },
      ];

  const categoryBarColors = ['bg-emerald-500', 'bg-sky-500', 'bg-purple-500', 'bg-amber-500'];

  const recentReceipts = Array.isArray(stats?.recentReceipts) ? stats.recentReceipts : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-7xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* 1. Header Greeting Section */}
      <div className="pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight flex items-center gap-2">
          <span>{greeting}, {firstName}!</span>
          <span>👋</span>
        </h1>
        <p className="text-xs text-[#64748B] font-medium mt-1">
          Here's what's happening with your purchases today.
        </p>
      </div>

      {/* 2. Top 5 Stat Cards (Exact Mockup Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Needs Attention */}
        <div
          onClick={() => navigate('/warranties')}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <Bell className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Needs Attention
              </span>
              <span className="text-2xl font-black text-rose-600 font-tabular">
                {stats?.expiringWarranties || 0}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Warranties expire soon</span>
            <span className="text-[11px] font-semibold text-sky-600 hover:underline inline-flex items-center gap-0.5">
              View all alerts <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Products Owned */}
        <div
          onClick={() => navigate('/products')}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Products Owned
              </span>
              <span className="text-2xl font-black text-slate-900 font-tabular">
                {stats?.totalProducts || 0}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Across {topCategories.length} categories</span>
            <span className="text-[11px] font-semibold text-sky-600 hover:underline inline-flex items-center gap-0.5">
              View all products <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Active Warranties */}
        <div
          onClick={() => navigate('/warranties')}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Active Warranties
              </span>
              <span className="text-2xl font-black text-slate-900 font-tabular">
                {stats?.activeWarranties || 0}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Under protection</span>
            <span className="text-[11px] font-semibold text-sky-600 hover:underline inline-flex items-center gap-0.5">
              View warranties <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Expiring Soon */}
        <div
          onClick={() => navigate('/warranties')}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Expiring Soon
              </span>
              <span className="text-2xl font-black text-slate-900 font-tabular">
                {stats?.expiringWarranties || 0}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Within 30 days</span>
            <span className="text-[11px] font-semibold text-amber-700 hover:underline inline-flex items-center gap-0.5">
              View details <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 5: Total Spent (This Year / Month) */}
        <div
          onClick={() => navigate('/receipts')}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Spent (This Month)
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-tabular">
                {formatCurrency(stats?.thisMonthSpent || 0, 'INR')}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Across all purchases</span>
            <span className="text-[11px] font-semibold text-sky-600 hover:underline inline-flex items-center gap-0.5">
              View receipts <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: 3 Columns Grid (Warranty Timeline, Recent Activity, Upcoming Expiries) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 h-full">
          <WarrantyTimelineWidget />
        </div>
        <div className="lg:col-span-4 h-full">
          <ActivityFeedWidget />
        </div>
        <div className="lg:col-span-3 h-full">
          <UpcomingExpiriesWidget />
        </div>
      </div>

      {/* 4. Bottom Section: 3 Columns Grid (Recent Receipts, Top Categories, Protection Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (5 cols): Recent Receipts */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Recent Receipts
              </h2>
              <Link
                to="/receipts"
                className="text-xs font-semibold text-[#0F172A] hover:text-[#047857] transition-colors inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentReceipts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent receipts found. Add your first invoice to see transactions here.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReceipts.slice(0, 4).map((rcpt, idx) => {
                  const itemCount = rcpt.products?.length || rcpt.itemsCount || 1;
                  const store = rcpt.storeName || 'Merchant';
                  const amt = rcpt.grandTotal != null ? rcpt.grandTotal : (rcpt.totalAmount != null ? rcpt.totalAmount : 0);

                  return (
                    <div
                      key={rcpt._id || idx}
                      onClick={() => navigate(`/receipts/${rcpt._id}`)}
                      className="py-3 px-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors rounded-xl group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-[#0F172A] text-xs truncate block group-hover:text-emerald-800 transition-colors">
                            {store}
                          </span>
                          <span className="text-[11px] text-slate-400 font-tabular block">
                            {formatDate(rcpt.purchaseDate)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#0F172A] font-tabular block">
                          {formatCurrency(amt, rcpt.currency || 'INR')}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full font-medium">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center Column (4 cols): Top Categories with Progress Bars */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Top Categories
              </h2>
              <Link
                to="/products"
                className="text-xs font-semibold text-[#0F172A] hover:text-[#047857] transition-colors inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              {topCategories.map((cat, idx) => {
                const colorClass = categoryBarColors[idx % categoryBarColors.length];
                const pct = cat.percentage || Math.max(10, 80 - idx * 20);

                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        {cat.category}
                      </span>
                      <span className="text-slate-500 text-[11px] font-tabular">
                        {cat.count ? `${cat.count} items` : `${formatCurrency(cat.total || 0, 'INR')}`}
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (3 cols): "Your purchases are protected" Trust Card */}
        <div className="lg:col-span-3 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Your purchases are protected
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                BillBox helps you track warranties, store invoices, and never miss an expiry.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Secure cloud backup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Smart expiry reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Easy invoice management</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Actionable Notification Reminder Banner */}
      {showReminderBanner && (
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Never miss an expiry again!
              </h4>
              <p className="text-[11px] text-slate-500">
                Enable email reminders and we'll notify you before any warranty expires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/warranties')}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Enable Reminders
            </button>
            <button
              type="button"
              onClick={() => setShowReminderBanner(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-sky-100 rounded-xl transition-colors cursor-pointer"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={() => setShowReminderBanner(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
