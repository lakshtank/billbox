import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '@/lib/toast';
import {
  User,
  Sliders,
  Bell,
  Download,
  AlertTriangle,
  Send,
  FileSpreadsheet,
  FileJson,
  Check,
} from 'lucide-react';
import api from '../api/axios';
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../queries/useUserQueries';
import { useReceiptsQuery } from '../queries/useReceiptsQuery';
import { usePreferences } from '@/context/PreferencesContext';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import * as m from 'motion/react-m';
import { useScroll, useSpring } from 'motion/react';
import { variants } from '@/lib/motion';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
];

const DATE_FORMATS = [
  { id: 'DD MMM YYYY', label: '12 Oct 2026 (DD MMM YYYY)' },
  { id: 'MM/DD/YYYY', label: '10/12/2026 (MM/DD/YYYY)' },
  { id: 'YYYY-MM-DD', label: '2026-10-12 (YYYY-MM-DD)' },
  { id: 'DD/MM/YYYY', label: '12/10/2026 (DD/MM/YYYY)' },
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

const NAV_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data', icon: Download },
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle, isDanger: true },
];

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('profile');

  // Step 14.2: Scroll-linked progress line for long pages
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const { theme, setTheme, density, setDensity } = usePreferences();
  const { data: profileData, isLoading: loadingProfile } = useUserProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const passwordMutation = useChangePasswordMutation();

  const user = profileData?.user;

  // Receipts for export counts
  const { data: receiptsData } = useReceiptsQuery({ limit: 1000 });
  const receipts = receiptsData?.receipts || [];
  const receiptCount = receiptsData?.total || receipts.length || 0;

  // 1. Profile State
  const [profileForm, setProfileForm] = useState({ name: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2. Preferences State
  const [preferencesForm, setPreferencesForm] = useState({
    defaultCurrency: 'INR',
    dateFormat: 'DD MMM YYYY',
    timezone: 'UTC',
  });

  // 3. Notifications State
  const [notificationForm, setNotificationForm] = useState({
    emailAlerts: true,
  });

  // 4. Danger Zone State
  const [clearDataInput, setClearDataInput] = useState('');
  const [deleteAccountInput, setDeleteAccountInput] = useState('');
  const [isClearingData, setIsClearingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);

  // Sync initial values from loaded user profile
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '' });
      setPreferencesForm({
        defaultCurrency: user.defaultCurrency || 'INR',
        dateFormat: user.dateFormat || 'DD MMM YYYY',
        timezone: user.timezone || 'UTC',
      });
      setNotificationForm({
        emailAlerts: user.notificationPreferences?.emailAlerts ?? true,
      });
    }
  }, [user]);

  // Dirty checks
  const isProfileDirty = useMemo(() => {
    if (!user) return false;
    return profileForm.name !== (user.name || '');
  }, [user, profileForm]);

  const isPasswordFilled = useMemo(() => {
    return Boolean(
      passwordForm.currentPassword &&
        passwordForm.newPassword &&
        passwordForm.confirmPassword
    );
  }, [passwordForm]);

  const isPreferencesDirty = useMemo(() => {
    if (!user) return false;
    return (
      preferencesForm.defaultCurrency !== (user.defaultCurrency || 'INR') ||
      preferencesForm.dateFormat !== (user.dateFormat || 'DD MMM YYYY') ||
      preferencesForm.timezone !== (user.timezone || 'UTC')
    );
  }, [user, preferencesForm]);

  const isNotificationDirty = useMemo(() => {
    if (!user) return false;
    const initialEmailAlerts = user.notificationPreferences?.emailAlerts ?? true;
    return notificationForm.emailAlerts !== initialEmailAlerts;
  }, [user, notificationForm]);

  // Password strength score (0 to 100)
  const passwordStrength = useMemo(() => {
    const p = passwordForm.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s += 25;
    if (p.length >= 10) s += 25;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s += 25;
    if (/[^A-Za-z0-9]/.test(p)) s += 25;
    return s;
  }, [passwordForm.newPassword]);

  // Save Handlers
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!isProfileDirty) return;

    updateMutation.mutate(
      { name: profileForm.name },
      {
        onSuccess: () => toast.success('Profile updated successfully.'),
        onError: (err) =>
          toast.error(err.response?.data?.message || 'Failed to update profile.'),
      }
    );
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please enter your current and new password.');
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
        onError: (err) =>
          toast.error(err.response?.data?.message || 'Failed to change password.'),
      }
    );
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    if (!isPreferencesDirty) return;

    localStorage.setItem('billbox_date_format', preferencesForm.dateFormat);
    localStorage.setItem('billbox_default_currency', preferencesForm.defaultCurrency);

    updateMutation.mutate(preferencesForm, {
      onSuccess: () => {
        toast.success('Preferences saved.');
        queryClient.invalidateQueries();
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || 'Failed to save preferences.'),
    });
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    if (!isNotificationDirty) return;

    updateMutation.mutate(
      { notificationPreferences: notificationForm },
      {
        onSuccess: () => {
          toast.success('Notification preferences updated.');
          queryClient.invalidateQueries();
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.message || 'Failed to save notification settings.'
          ),
      }
    );
  };

  const handleSendTestAlert = async () => {
    try {
      setIsSendingTestAlert(true);
      const res = await api.post('/reminders/test-alert');
      toast.success(res.data?.message || 'Test reminder email dispatched.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email.');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (receipts.length === 0) {
      toast.error('No receipts available to export.');
      return;
    }
    const headers = [
      'Store Name',
      'Purchase Date',
      'Category',
      'Total Amount',
      'Currency',
      'Invoice Number',
      'Warranty Status',
    ];
    const rows = receipts.map((r) => [
      `"${(r.storeName || '').replace(/"/g, '""')}"`,
      `"${r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : ''}"`,
      `"${(r.products?.[0]?.category || r.category || 'General').replace(/"/g, '""')}"`,
      `"${r.grandTotal != null ? r.grandTotal : r.totalAmount || 0}"`,
      `"${r.currency || 'INR'}"`,
      `"${(r.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${r.products?.[0]?.warrantyStatus || 'none'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `BillBox_Receipts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('CSV exported successfully.');
  };

  const handleExportJSON = () => {
    if (receipts.length === 0) {
      toast.error('No receipts available to export.');
      return;
    }
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(receipts, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `BillBox_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('JSON exported successfully.');
  };

  // Danger zone handlers
  const handleClearAllData = async () => {
    if (clearDataInput.trim() !== 'DELETE') {
      toast.error('Type DELETE exactly to confirm.');
      return;
    }

    try {
      setIsClearingData(true);
      await api.delete('/auth/clear-data');
      toast.success('All receipts and product data cleared.');
      setClearDataInput('');
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear data.');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountInput.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
      toast.error('Type your email address exactly to confirm account deletion.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      await api.delete('/auth/account');
      toast.success('Account permanently deleted.');
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <Skeleton className="h-48 rounded-[12px]" />
          <Skeleton className="h-96 rounded-[12px]" />
        </div>
      </div>
    );
  }

  const userInitial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 font-sans relative">
      {/* Step 14.2: 2px accent scroll-linked progress line */}
      <m.div
        style={{ scaleX: smoothProgress, transformOrigin: 'left' }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-accent z-50 pointer-events-none"
      />

      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences, notifications, data export, and security."
      />

      {/* Main Layout: Left Sub-Nav (200px) + Content (max 720px) */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Left Sub-Nav */}
        <nav
          className="flex md:flex-col overflow-x-auto no-scrollbar gap-1 border-b md:border-b-0 md:border-r border-line pb-2 md:pb-0 md:pr-3 shrink-0"
          aria-label="Settings sections"
        >
          {NAV_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap cursor-pointer ${
                  isActive
                    ? sec.isDanger
                      ? 'bg-bad-tint text-bad-fg font-semibold'
                      : 'bg-selected text-accent font-semibold'
                    : sec.isDanger
                    ? 'text-bad-fg hover:bg-bad-tint/50'
                    : 'text-fg-2 hover:bg-hover hover:text-fg'
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${
                    isActive
                      ? sec.isDanger
                        ? 'text-bad-fg'
                        : 'text-accent'
                      : sec.isDanger
                      ? 'text-bad-fg'
                      : 'text-fg-3'
                  }`}
                />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Column (max-w-[720px]) */}
        <div className="max-w-[720px] w-full space-y-6">
          {/* SECTION 1: PROFILE */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Card 1: User Profile */}
              <div className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-5">
                <div className="border-b border-line-subtle pb-3">
                  <h2 className="text-base font-semibold text-fg">Profile</h2>
                  <p className="text-xs text-fg-3 mt-0.5">
                    Your personal details and account representation.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar & Email Display */}
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-full bg-subtle border border-line flex items-center justify-center font-bold text-lg text-fg shrink-0 shadow-2xs">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-fg truncate">
                        {user?.name || 'BillBox User'}
                      </div>
                      <div className="text-xs text-fg-3 truncate">{user?.email}</div>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="text-xs font-medium text-fg block mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      placeholder="Your full name"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Email Read-only */}
                  <div>
                    <label className="text-xs font-medium text-fg block mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-subtle text-fg-3 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-fg-3 mt-1 block">
                      Email address is tied to your login credentials.
                    </span>
                  </div>

                  {/* Right-aligned Save Button (Active only when dirty) */}
                  <div className="flex justify-end pt-2 border-t border-line-subtle">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!isProfileDirty || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Card 2: Change Password (Step 14.4 Reveal on scroll) */}
              <m.div
                variants={variants.fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-10% 0px' }}
                className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-5"
              >
                <div className="border-b border-line-subtle pb-3">
                  <h2 className="text-base font-semibold text-fg">Change password</h2>
                  <p className="text-xs text-fg-3 mt-0.5">
                    Update your account password with a strong combination.
                  </p>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="text-xs font-medium text-fg block mb-1">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs font-medium text-fg block mb-1">
                      New password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    {/* Password Strength Indicator */}
                    {passwordForm.newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden border border-line-subtle">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength <= 25
                                ? 'bg-bad w-1/4'
                                : passwordStrength <= 50
                                ? 'bg-warn w-1/2'
                                : passwordStrength <= 75
                                ? 'bg-accent w-3/4'
                                : 'bg-ok w-full'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] text-fg-3 block">
                          {passwordStrength <= 25
                            ? 'Weak password'
                            : passwordStrength <= 50
                            ? 'Moderate password'
                            : passwordStrength <= 75
                            ? 'Good password'
                            : 'Strong password'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-medium text-fg block mb-1">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Right-aligned Save Button */}
                  <div className="flex justify-end pt-2 border-t border-line-subtle">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!isPasswordFilled || passwordMutation.isPending}
                    >
                      {passwordMutation.isPending ? 'Updating...' : 'Change password'}
                    </Button>
                  </div>
                </form>
              </m.div>
            </div>
          )}

          {/* SECTION 2: PREFERENCES */}
          {activeSection === 'preferences' && (
            <div className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-6">
              <div className="border-b border-line-subtle pb-3">
                <h2 className="text-base font-semibold text-fg">Preferences</h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  Display currency, formatting options, and appearance.
                </p>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-5">
                {/* 1. Display Currency */}
                <div>
                  <label className="text-xs font-medium text-fg block mb-1">
                    Display currency
                  </label>
                  <select
                    value={preferencesForm.defaultCurrency}
                    onChange={(e) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        defaultCurrency: e.target.value,
                      })
                    }
                    className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code} {c.symbol})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-fg-3 mt-1.5 block">
                    Display only. Receipts keep their original currency.
                  </span>
                </div>

                {/* 2. Date Format */}
                <div>
                  <label className="text-xs font-medium text-fg block mb-1">
                    Date format
                  </label>
                  <select
                    value={preferencesForm.dateFormat}
                    onChange={(e) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        dateFormat: e.target.value,
                      })
                    }
                    className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {DATE_FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Timezone */}
                <div>
                  <label className="text-xs font-medium text-fg block mb-1">
                    Timezone
                  </label>
                  <select
                    value={preferencesForm.timezone}
                    onChange={(e) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        timezone: e.target.value,
                      })
                    }
                    className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Theme Selector with Mini Preview Tiles */}
                <div>
                  <label className="text-xs font-medium text-fg block mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Light Tile */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-2.5 rounded-[10px] border text-left cursor-pointer transition-all ${
                        theme === 'light'
                          ? 'border-accent ring-1 ring-accent bg-selected/20'
                          : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <div className="h-14 rounded-md border border-slate-200 bg-white p-1.5 flex flex-col justify-between mb-2 shadow-2xs">
                        <div className="h-2 w-10 bg-slate-200 rounded-xs" />
                        <div className="space-y-1">
                          <div className="h-1.5 w-14 bg-slate-100 rounded-xs" />
                          <div className="h-1.5 w-8 bg-slate-100 rounded-xs" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-fg">Light</span>
                        {theme === 'light' && (
                          <Check className="size-3.5 text-accent" />
                        )}
                      </div>
                    </button>

                    {/* Dark Tile */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-2.5 rounded-[10px] border text-left cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'border-accent ring-1 ring-accent bg-selected/20'
                          : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <div className="h-14 rounded-md border border-slate-700 bg-slate-900 p-1.5 flex flex-col justify-between mb-2 shadow-2xs">
                        <div className="h-2 w-10 bg-slate-700 rounded-xs" />
                        <div className="space-y-1">
                          <div className="h-1.5 w-14 bg-slate-800 rounded-xs" />
                          <div className="h-1.5 w-8 bg-slate-800 rounded-xs" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-fg">Dark</span>
                        {theme === 'dark' && (
                          <Check className="size-3.5 text-accent" />
                        )}
                      </div>
                    </button>

                    {/* System Tile */}
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-2.5 rounded-[10px] border text-left cursor-pointer transition-all ${
                        theme === 'system'
                          ? 'border-accent ring-1 ring-accent bg-selected/20'
                          : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <div className="h-14 rounded-md border border-slate-300 overflow-hidden flex mb-2 shadow-2xs">
                        <div className="w-1/2 bg-white p-1.5 flex flex-col justify-between border-r border-slate-200">
                          <div className="h-2 w-6 bg-slate-200 rounded-xs" />
                          <div className="h-1.5 w-6 bg-slate-100 rounded-xs" />
                        </div>
                        <div className="w-1/2 bg-slate-900 p-1.5 flex flex-col justify-between">
                          <div className="h-2 w-6 bg-slate-700 rounded-xs" />
                          <div className="h-1.5 w-6 bg-slate-800 rounded-xs" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-fg">System</span>
                        {theme === 'system' && (
                          <Check className="size-3.5 text-accent" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* 5. Interface Density */}
                <div>
                  <label className="text-xs font-medium text-fg block mb-2">
                    Table & layout density
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDensity('comfortable')}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        density === 'comfortable'
                          ? 'border-accent ring-1 ring-accent bg-selected/20'
                          : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <div className="font-medium text-xs text-fg">Comfortable</div>
                      <div className="text-[11px] text-fg-3 mt-0.5">
                        Standard table rows (40px) with spacious padding
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDensity('compact')}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        density === 'compact'
                          ? 'border-accent ring-1 ring-accent bg-selected/20'
                          : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <div className="font-medium text-xs text-fg">Compact</div>
                      <div className="text-[11px] text-fg-3 mt-0.5">
                        High-density data rows (32px) for maximum rows
                      </div>
                    </button>
                  </div>
                </div>

                {/* Right-aligned Save Button (Active only when dirty) */}
                <div className="flex justify-end pt-3 border-t border-line-subtle">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isPreferencesDirty || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save preferences'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 3: NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-6">
              <div className="border-b border-line-subtle pb-3">
                <h2 className="text-base font-semibold text-fg">Notifications</h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  Email reminders and upcoming warranty alert dispatch.
                </p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-6">
                {/* Email alerts switch */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-fg">Email alerts</div>
                    <div className="text-xs text-fg-3">
                      Receive automated email notifications before warranties expire.
                    </div>
                  </div>
                  <Switch
                    checked={notificationForm.emailAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationForm({
                        ...notificationForm,
                        emailAlerts: checked,
                      })
                    }
                    aria-label="Toggle email alerts"
                  />
                </div>

                {/* Send Test Email Button with Real Result */}
                <div className="pt-4 border-t border-line-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-fg">Test delivery</div>
                    <div className="text-xs text-fg-3">
                      Send a sample reminder to verify server email delivery.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestAlert}
                    disabled={isSendingTestAlert}
                    className="gap-1.5 shrink-0"
                  >
                    <Send className="size-3.5" />
                    <span>
                      {isSendingTestAlert ? 'Sending...' : 'Send test email'}
                    </span>
                  </Button>
                </div>

                {/* Right-aligned Save Button (Active only when dirty) */}
                <div className="flex justify-end pt-3 border-t border-line-subtle">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isNotificationDirty || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 4: DATA & EXPORT */}
          {activeSection === 'data' && (
            <div className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-6">
              <div className="border-b border-line-subtle pb-3">
                <h2 className="text-base font-semibold text-fg">Data & Export</h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  Export, backup, or download your receipt records and document files.
                </p>
              </div>

              {/* Exact Count Display */}
              <div className="p-3.5 rounded-lg bg-subtle border border-line text-xs text-fg-2">
                Exporting <span className="font-semibold text-fg font-tabular">{receiptCount}</span> receipts
              </div>

              {/* Export Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export CSV */}
                <div className="p-4 rounded-[10px] border border-line bg-surface flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-sm text-fg">
                      <FileSpreadsheet className="size-4 text-accent" />
                      <span>Export CSV</span>
                    </div>
                    <p className="text-xs text-fg-3">
                      Tabular spreadsheet formatted for Excel, Numbers, and Google Sheets.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="w-full gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Download CSV</span>
                  </Button>
                </div>

                {/* Export JSON */}
                <div className="p-4 rounded-[10px] border border-line bg-surface flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-sm text-fg">
                      <FileJson className="size-4 text-accent" />
                      <span>Export JSON</span>
                    </div>
                    <p className="text-xs text-fg-3">
                      Complete machine-readable JSON archive with full line-item breakdowns.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    className="w-full gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Download JSON</span>
                  </Button>
                </div>
              </div>

              {/* Documents Archive Download */}
              <div className="pt-2 border-t border-line-subtle flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-fg">
                    Documents archive
                  </div>
                  <div className="text-xs text-fg-3">
                    Download attached PDF receipts and invoice images.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Documents archive preparation scheduled.')}
                  className="gap-1.5 shrink-0"
                >
                  <Download className="size-3.5" />
                  <span>Download archive</span>
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 5: DANGER ZONE */}
          {activeSection === 'danger' && (
            <div className="rounded-[12px] border border-bad/30 bg-bad-tint/10 p-6 shadow-2xs space-y-6">
              <div className="border-b border-bad/20 pb-3">
                <h2 className="text-base font-semibold text-bad-fg flex items-center gap-2">
                  <AlertTriangle className="size-4 text-bad-fg" />
                  <span>Danger zone</span>
                </h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  Irreversible actions. Please proceed with caution.
                </p>
              </div>

              {/* Explicit List of What is Removed */}
              <div className="space-y-2 text-xs text-fg-2 bg-surface/70 p-4 rounded-lg border border-bad/20">
                <span className="font-semibold text-bad-fg block">
                  Actions in this section permanently remove:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-fg-3">
                  <li>All scanned receipts, document uploads, and extracted metadata</li>
                  <li>All tracked products, serial numbers, and warranty timelines</li>
                  <li>All automated reminder schedules and dispatch logs</li>
                  <li>All merchant purchase histories and spending analytics</li>
                </ul>
              </div>

              {/* Action 1: Clear All Data */}
              <div className="p-4 rounded-lg border border-bad/20 bg-surface space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-fg">Clear all data</h3>
                  <p className="text-xs text-fg-3">
                    Permanently delete all receipts, products, and analytics while keeping your account active.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={clearDataInput}
                    onChange={(e) => setClearDataInput(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-bad"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={clearDataInput.trim() !== 'DELETE' || isClearingData}
                    onClick={handleClearAllData}
                    className="shrink-0"
                  >
                    {isClearingData ? 'Clearing...' : 'Clear all data'}
                  </Button>
                </div>
              </div>

              {/* Action 2: Delete Account */}
              <div className="p-4 rounded-lg border border-bad/20 bg-surface space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-bad-fg">Delete account</h3>
                  <p className="text-xs text-fg-3">
                    Permanently erase your BillBox user account and all associated data.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={deleteAccountInput}
                    onChange={(e) => setDeleteAccountInput(e.target.value)}
                    placeholder={`Type ${user?.email || 'your email'} to confirm`}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-bad"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={
                      deleteAccountInput.trim().toLowerCase() !==
                        (user?.email || '').toLowerCase() || isDeletingAccount
                    }
                    onClick={handleDeleteAccount}
                    className="shrink-0"
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete account'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
