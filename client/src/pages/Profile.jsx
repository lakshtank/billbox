import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from '@/lib/toast';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  DollarSign,
  ShieldCheck,
  Receipt,
  Package,
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useUserProfileQuery, useUpdateProfileMutation } from '../queries/useUserQueries';
import { Skeleton } from '../components/ui/skeleton';
import { Money } from '../components/data/Money';
import { Button } from '../components/ui/button';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
];

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function Profile() {
  const navigate = useNavigate();
  const { data, isLoading } = useUserProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const user = data?.user;
  const stats = data?.stats || {
    receiptCount: 0,
    productCount: 0,
    activeWarrantyCount: 0,
    totalSpent: 0,
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    timezone: 'UTC',
    defaultCurrency: 'INR',
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC',
        defaultCurrency: user.defaultCurrency || 'INR',
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    updateMutation.mutate(
      {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        timezone: formData.timezone,
        defaultCurrency: formData.defaultCurrency,
      },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
        },
        onError: (err) => {
          const msg = err.response?.data?.message || 'Failed to update profile.';
          toast.error(msg);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans select-none max-w-4xl" aria-busy="true">
        <div className="space-y-1.5 pb-2 border-b border-line">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="p-6 rounded-[12px] border border-line bg-surface space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-[12px] border border-line bg-surface space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recent Member';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-xl font-semibold text-fg tracking-tight">
            Account profile
          </h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Manage your personal profile and regional preferences.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
        >
          <SettingsIcon className="size-3.5" />
          <span>Account settings</span>
        </Button>
      </div>

      {/* 2. Hero Profile Identity Card */}
      <div className="bg-surface border border-line rounded-[12px] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar Image or Initials */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'User'}
                className="size-16 rounded-[12px] object-cover shrink-0 border border-line"
              />
            ) : (
              <div className="size-16 rounded-[12px] bg-accent text-accent-fg flex items-center justify-center font-medium text-xl shrink-0">
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-semibold text-fg tracking-tight">
                  {user?.name || 'Account User'}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-subtle text-fg border border-line">
                  Standard Member
                </span>
              </div>

              <div className="text-xs text-fg-muted flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-fg-muted" />
                  {user?.email}
                </span>
                <span className="text-line">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-fg-muted" />
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          <div className="self-end sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-ok-bg text-ok-text border border-ok-border text-xs font-medium">
              <CheckCircle2 className="size-3.5" />
              <span>Email verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Account Lifetime Metrics (4 Tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-line rounded-[12px] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Total Receipts
            </span>
            <Receipt className="size-3.5 text-fg-muted" />
          </div>
          <span className="text-2xl font-semibold text-fg font-tabular block leading-tight">
            {stats.receiptCount}
          </span>
          <span className="text-[11px] text-fg-muted mt-1 block">
            Archived transactions
          </span>
        </div>

        <div className="bg-surface border border-line rounded-[12px] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Tracked Items
            </span>
            <Package className="size-3.5 text-fg-muted" />
          </div>
          <span className="text-2xl font-semibold text-fg font-tabular block leading-tight">
            {stats.productCount}
          </span>
          <span className="text-[11px] text-fg-muted mt-1 block">
            Standalone items
          </span>
        </div>

        <div className="bg-surface border border-line rounded-[12px] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Active Warranties
            </span>
            <ShieldCheck className="size-3.5 text-accent" />
          </div>
          <span className="text-2xl font-semibold text-accent font-tabular block leading-tight">
            {stats.activeWarrantyCount}
          </span>
          <span className="text-[11px] text-fg-muted mt-1 block">
            Protected products
          </span>
        </div>

        <div className="bg-surface border border-line rounded-[12px] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Lifetime Spend
            </span>
            <DollarSign className="size-3.5 text-fg-muted" />
          </div>
          <div className="text-2xl font-semibold text-fg font-tabular block leading-tight truncate">
            <Money amount={stats.totalSpent} currency={formData.defaultCurrency} />
          </div>
          <span className="text-[11px] text-fg-muted mt-1 block">
            Aggregated purchases
          </span>
        </div>
      </div>

      {/* 4. Edit Personal Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-line rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-semibold text-fg tracking-tight">
              Personal information
            </h3>
            <p className="text-xs text-fg-muted mt-0.5">
              Update your personal details and how your profile is displayed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="profileNameInput" className="text-xs font-medium text-fg block mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
                  <input
                    id="profileNameInput"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs h-9 pl-9 pr-3 bg-surface border border-line rounded-[8px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="profileEmailInput" className="text-xs font-medium text-fg block mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
                  <input
                    id="profileEmailInput"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full text-xs h-9 pl-9 pr-3 bg-surface-subtle border border-line rounded-[8px] text-fg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="profilePhoneInput" className="text-xs font-medium text-fg block mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
                  <input
                    id="profilePhoneInput"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs h-9 pl-9 pr-3 bg-surface border border-line rounded-[8px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Preferred Currency */}
              <div>
                <label htmlFor="profileCurrencySelect" className="text-xs font-medium text-fg block mb-1.5">
                  Preferred currency
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
                  <select
                    id="profileCurrencySelect"
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className="w-full text-xs h-9 pl-9 pr-3 bg-surface border border-line rounded-[8px] text-fg focus:border-accent focus:outline-none transition-colors cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div className="sm:col-span-2">
                <label htmlFor="profileTimezoneSelect" className="text-xs font-medium text-fg block mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
                  <select
                    id="profileTimezoneSelect"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full text-xs h-9 pl-9 pr-3 bg-surface border border-line rounded-[8px] text-fg focus:border-accent focus:outline-none transition-colors cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
              <Button
                type="submit"
                size="sm"
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-[12px] p-5 shadow-2xs space-y-4">
            <h3 className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Security & Access
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-[8px] bg-surface-subtle border border-line space-y-1">
                <div className="flex items-center justify-between text-fg font-medium">
                  <span>Password status</span>
                  <span className="text-ok-text font-semibold">Active</span>
                </div>
                <p className="text-[11px] text-fg-muted">
                  Configured at account registration.
                </p>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/settings">Change password</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
