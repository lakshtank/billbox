import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Lock,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  KeyRound,
  FileSpreadsheet,
  FileJson,
  Trash2,
  DollarSign,
  Calendar,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useUserProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from '../queries/useUserQueries';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import { useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
];

const DATE_FORMATS = [
  { id: 'DD MMM YYYY', label: '26 Aug 2026 (DD MMM YYYY)' },
  { id: 'MM/DD/YYYY', label: '08/26/2026 (MM/DD/YYYY)' },
  { id: 'YYYY-MM-DD', label: '2026-08-26 (YYYY-MM-DD)' },
  { id: 'DD/MM/YYYY', label: '26/08/2026 (DD/MM/YYYY)' },
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

const TABS = [
  { id: 'general', label: 'General & Preferences', icon: Globe },
  { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
  { id: 'security', label: 'Account Security', icon: Lock },
  { id: 'data', label: 'Data & Export', icon: Download },
];

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const { data: profileData, isLoading: loadingProfile } = useUserProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const passwordMutation = useChangePasswordMutation();

  const user = profileData?.user;

  // General Settings State
  const [generalForm, setGeneralForm] = useState({
    defaultCurrency: 'INR',
    dateFormat: 'DD MMM YYYY',
    timezone: 'UTC',
  });

  // Notification Settings State
  const [notificationForm, setNotificationForm] = useState({
    emailAlerts: true,
    expiryDaysNotice: 30,
    monthlyDigest: true,
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Test Alert Loading
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);

  // Clear Data Modal State
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [isClearingData, setIsClearingData] = useState(false);

  const { data: receiptsData } = useReceiptsQuery({ limit: 1000 });

  useEffect(() => {
    if (user) {
      setGeneralForm({
        defaultCurrency: user.defaultCurrency || 'INR',
        dateFormat: user.dateFormat || 'DD MMM YYYY',
        timezone: user.timezone || 'UTC',
      });
      if (user.notificationPreferences) {
        setNotificationForm({
          emailAlerts: user.notificationPreferences.emailAlerts ?? true,
          expiryDaysNotice: user.notificationPreferences.expiryDaysNotice || 30,
          monthlyDigest: user.notificationPreferences.monthlyDigest ?? true,
        });
      }
    }
  }, [user]);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    localStorage.setItem('billbox_date_format', generalForm.dateFormat);
    localStorage.setItem('billbox_default_currency', generalForm.defaultCurrency);

    updateMutation.mutate(generalForm, {
      onSuccess: () => {
        toast.success('General preferences saved successfully!');
        queryClient.invalidateQueries();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to save preferences.');
      },
    });
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    updateMutation.mutate(
      { notificationPreferences: notificationForm },
      {
        onSuccess: () => {
          toast.success('Notification preferences updated!');
          queryClient.invalidateQueries();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to save notifications.');
        },
      }
    );
  };

  const handleSendTestAlert = async () => {
    try {
      setIsSendingTestAlert(true);
      const res = await api.post('/reminders/test-alert');
      toast.success(res.data?.message || 'Test reminder notification sent!');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test alert.');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please enter current and new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    passwordMutation.mutate(
      {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
      {
        onSuccess: () => {
          toast.success('Password changed successfully.');
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to change password.');
        },
      }
    );
  };

  // Export Data Handlers
  const handleExportJSON = () => {
    const receipts = receiptsData?.receipts || [];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(receipts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BillBox_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Exported JSON successfully.');
  };

  const handleExportCSV = () => {
    const receipts = receiptsData?.receipts || [];
    if (receipts.length === 0) {
      toast.error('No receipts available to export.');
      return;
    }

    const headers = ['Store Name', 'Purchase Date', 'Category', 'Total Amount', 'Currency', 'Invoice Number', 'Warranty Status'];
    const rows = receipts.map((r) => [
      `"${(r.storeName || '').replace(/"/g, '""')}"`,
      `"${r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : ''}"`,
      `"${(r.products?.[0]?.category || 'General').replace(/"/g, '""')}"`,
      `"${r.grandTotal != null ? r.grandTotal : (r.totalAmount || 0)}"`,
      `"${r.currency || 'INR'}"`,
      `"${(r.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${r.products?.[0]?.warrantyStatus || 'none'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BillBox_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Exported CSV successfully.');
  };

  const handleClearAllData = async () => {
    if (clearConfirmationText.trim() !== 'DELETE') {
      toast.error('Please type DELETE to confirm data reset.');
      return;
    }

    try {
      setIsClearingData(true);
      await api.delete('/auth/clear-data');
      toast.success('All receipts and product data cleared.');
      setIsClearDataModalOpen(false);
      setClearConfirmationText('');
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear data.');
    } finally {
      setIsClearingData(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Password strength helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const pwdScore = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="min-h-screen bg-[#F8FAFC]/50 px-6 md:px-10 py-8 w-full max-w-6xl mx-auto space-y-6 text-[#0F172A] font-sans pb-24">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Configure system defaults, expiration notices, security, and account data exports.
          </p>
        </div>
      </div>

      {/* 2. Settings Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      {/* TAB 1: General & Localization */}
      {activeTab === 'general' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
              General & Regional Preferences
            </h3>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Set default currencies, date conventions, and timezones for the whole system.
            </p>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-5 max-w-2xl">
            {/* Preferred Currency */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Default Currency & Auto-Conversion
              </label>
              <select
                value={generalForm.defaultCurrency}
                onChange={(e) => setGeneralForm({ ...generalForm, defaultCurrency: e.target.value })}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-400 font-sans cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Display Date Format
              </label>
              <select
                value={generalForm.dateFormat}
                onChange={(e) => setGeneralForm({ ...generalForm, dateFormat: e.target.value })}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-400 font-sans cursor-pointer"
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.id} value={df.id}>
                    {df.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Account Timezone
              </label>
              <select
                value={generalForm.timezone}
                onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-400 font-sans cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#047857] hover:bg-[#059669] rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Notifications & Alerts */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                Notification & Expiration Alert Preferences
              </h3>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                Control email alerts and when you are notified prior to warranty expirations.
              </p>
            </div>

            {/* Live Test Alert Button */}
            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={isSendingTestAlert}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSendingTestAlert ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>Send Test Notification</span>
            </button>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-5 max-w-2xl">
            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Email Notifications
                </span>
                <p className="text-[11px] text-slate-500">
                  Receive automated reminders for upcoming warranty expirations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationForm.emailAlerts}
                onChange={(e) => setNotificationForm({ ...notificationForm, emailAlerts: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Expiry Advance Notice */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Warranty Expiry Advance Notice
              </label>
              <select
                value={notificationForm.expiryDaysNotice}
                onChange={(e) => setNotificationForm({ ...notificationForm, expiryDaysNotice: Number(e.target.value) })}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-400 font-sans cursor-pointer"
              >
                <option value={45}>45 Days Before Expiry</option>
                <option value={30}>30 Days Before Expiry (Recommended)</option>
                <option value={15}>15 Days Before Expiry</option>
                <option value={7}>7 Days Before Expiry</option>
              </select>
            </div>

            {/* Monthly Summary Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Monthly Spending Digest
                </span>
                <p className="text-[11px] text-slate-500">
                  Receive a concise monthly breakdown of new receipts and active warranty statuses.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationForm.monthlyDigest}
                onChange={(e) => setNotificationForm({ ...notificationForm, monthlyDigest: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#047857] hover:bg-[#059669] rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Update Notifications</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Account Security */}
      {activeTab === 'security' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
              Change Account Password
            </h3>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Ensure your account is protected with a secure, strong password.
            </p>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
            {/* Current Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans"
                  style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans"
                  style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              {/* Strength meter bar */}
              {passwordForm.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pwdScore <= 25
                          ? 'bg-rose-500 w-1/4'
                          : pwdScore <= 50
                          ? 'bg-amber-500 w-2/4'
                          : pwdScore <= 75
                          ? 'bg-sky-500 w-3/4'
                          : 'bg-emerald-500 w-full'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Strength: {pwdScore <= 25 ? 'Weak' : pwdScore <= 50 ? 'Fair' : pwdScore <= 75 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full text-xs py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition-colors font-sans"
                  style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#047857] hover:bg-[#059669] rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {passwordMutation.isPending ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Data & Export & Danger Zone */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                Data Portability & Archives
              </h3>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                Export your structured receipts and registered asset records at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Export as CSV</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Download a spreadsheet containing store names, dates, amounts, categories, and warranty statuses.
                </p>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Export as JSON</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Full structured JSON payload of all invoices, line items, and product associations.
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone: Reset Account Data */}
          <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-extrabold tracking-tight">Danger Zone: Reset Account Data</h3>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Permanently erase all logged receipts, tracked products, and reminder activity history for this account. This action cannot be undone.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setIsClearDataModalOpen(true)}
                className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Receipt Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Account Data */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-base font-extrabold text-slate-900">Confirm Data Reset</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsClearDataModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete all your stored receipts, products, store analytics, and warranty logs.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Type <span className="text-rose-600 font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={clearConfirmationText}
                onChange={(e) => setClearConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-400 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearDataModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearConfirmationText !== 'DELETE' || isClearingData}
                onClick={handleClearAllData}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isClearingData ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Permanently Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
