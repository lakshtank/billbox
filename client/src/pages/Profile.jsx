import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  Settings,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useUserProfileQuery, useUpdateProfileMutation } from '../queries/useUserQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/formatters';

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

const Profile = () => {
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
          toast.success('Profile updated successfully!');
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
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
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-6xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Account Profile
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Manage your personal profile, regional preferences, and account metadata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-2 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* 2. Hero Profile Identity Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-50/60 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar Initials Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#047857] to-[#059669] text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-md shrink-0 border-2 border-white">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  {user?.name || 'User Profile'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Standard Member</span>
                </span>
              </div>

              <p className="text-xs text-[#64748B] font-medium flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member since {memberSince}
                </span>
              </p>
            </div>
          </div>

          <div className="self-end sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Email Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Account Lifetime Metrics (4 Tiles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Receipts
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-tabular block leading-tight">
            {stats.receiptCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Archived transactions
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tracked Items
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-tabular block leading-tight">
            {stats.productCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Standalone assets
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Warranties
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-tabular block leading-tight">
            {stats.activeWarrantyCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Protected products
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Lifetime Spend
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-tabular block leading-tight truncate">
            {formatCurrency(stats.totalSpent, 'INR')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Aggregated purchases
          </span>
        </div>
      </div>

      {/* 4. Edit Personal Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
              Personal Information
            </h3>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Update your personal details and how your profile is displayed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans"
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    placeholder="Your Full Name"
                    required
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full text-xs py-2.5 bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-500 font-sans cursor-not-allowed"
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans"
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Default Currency */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Preferred Currency
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans cursor-pointer"
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
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
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans cursor-pointer"
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#047857] hover:bg-[#059669] rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Security & Access
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-slate-800 font-bold">
                  <span>Password Status</span>
                  <span className="text-emerald-700">Protected</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Password was set on account registration.
                </p>
              </div>

              <Link
                to="/settings"
                className="w-full py-2 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2 no-underline"
              >
                <span>Change Password</span>
              </Link>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Encrypted Data Storage</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your invoices, receipts, and personal data are stored in a private, encrypted environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
