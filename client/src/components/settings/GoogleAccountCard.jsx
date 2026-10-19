import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Link2, Unlink, Loader2, KeyRound } from 'lucide-react';
import toast from '@/lib/toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useConnectGoogleMutation, useDisconnectGoogleMutation } from '@/queries/useUserQueries';
import { usePreferences } from '@/context/PreferencesContext';
import * as m from 'motion/react-m';
import { variants } from '@/lib/motion';

export function GoogleAccountCard({ user }) {
  const { theme } = usePreferences();
  const isDark = theme === 'dark' || theme === 'gentle';
  const buttonRef = useRef(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const connectMutation = useConnectGoogleMutation();
  const disconnectMutation = useDisconnectGoogleMutation();

  const isConnected = Boolean(user?.googleConnected || user?.googleId);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle GIS credential callback
  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response.credential) {
        toast.error('No credential received from Google.');
        return;
      }

      connectMutation.mutate(
        { credential: response.credential },
        {
          onSuccess: () => {
            toast.success('Google account linked! Password login is now disabled.');
          },
          onError: (err) => {
            const msg =
              err.response?.data?.message ||
              'Failed to link Google account. Please try again.';
            toast.error(msg);
          },
        }
      );
    },
    [connectMutation]
  );

  // Poll for window.google.accounts.id
  useEffect(() => {
    if (typeof window === 'undefined' || isConnected) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isConnected]);

  // Render Google button when not connected
  useEffect(() => {
    if (isConnected || !scriptLoaded || !buttonRef.current || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      buttonRef.current.innerHTML = '';
      const measuredWidth = buttonRef.current.offsetWidth || 280;
      const targetWidth = Math.min(Math.max(measuredWidth, 240), 360);

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: targetWidth,
      });

      setIsRendered(true);
    } catch (err) {
      console.warn('Failed to render Google button in Settings:', err);
    }
  }, [isConnected, scriptLoaded, clientId, isDark, handleCredentialResponse]);

  const handleDisconnectSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    disconnectMutation.mutate(
      { newPassword },
      {
        onSuccess: () => {
          setShowDisconnectModal(false);
          setNewPassword('');
          setConfirmPassword('');
          toast.success('Google disconnected. Password login is now active.');
        },
        onError: (err) => {
          const msg =
            err.response?.data?.message ||
            'Failed to disconnect Google account.';
          setPasswordError(msg);
        },
      }
    );
  };

  return (
    <>
      <m.div
        variants={variants.fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
        className="rounded-[12px] border border-line bg-surface p-6 shadow-2xs space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-fg">Google Account</h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-ok-tint text-ok-fg border border-ok/20">
                  <span className="size-1.5 rounded-full bg-ok animate-pulse" />
                  Active Login Method
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-subtle text-fg-3 border border-line">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-fg-3 mt-1">
              {isConnected
                ? 'Your account is exclusively authenticated with Google. Email & password login is disabled.'
                : 'Link your Google account to log into BillBox with 1-click. Once linked, password login will be disabled.'}
            </p>
          </div>

          {/* Google Icon Badge */}
          <div className="size-10 rounded-xl bg-subtle border border-line flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
        </div>

        {/* Content based on connection status */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border border-line bg-subtle/50 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8 rounded-full bg-ok-tint border border-ok/30 flex items-center justify-center shrink-0 text-ok-fg">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-fg truncate">
                    Google Single Sign-On Active
                  </div>
                  <div className="text-[11px] text-fg-3 truncate">
                    Old email and password login is disabled. You log in only via Google.
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPasswordError('');
                  setShowDisconnectModal(true);
                }}
                disabled={disconnectMutation.isPending}
                className="shrink-0 text-xs border-line hover:border-bad/40 hover:text-bad-fg transition-colors"
              >
                <Unlink className="size-3.5 mr-1.5" />
                Switch to Password Login
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-line bg-subtle/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-fg">
                <Link2 className="size-4 text-accent" />
                <span>Connect your Google account</span>
              </div>
              <p className="text-[11px] text-fg-3 leading-relaxed">
                Linking Google switches your authentication to Google Single Sign-On. Your old email & password will no longer work, keeping your account exclusively secured with Google.
              </p>

              {/* Rendered Google button or loading state */}
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {connectMutation.isPending ? (
                  <div className="h-10 px-4 flex items-center gap-2 rounded-lg border border-line bg-surface text-xs font-medium text-fg-2 shadow-2xs">
                    <Loader2 className="size-4 text-accent animate-spin" />
                    <span>Connecting Google account...</span>
                  </div>
                ) : (
                  <div className="min-h-[40px] flex items-center">
                    <div ref={buttonRef} data-testid="settings-google-connect-button" />
                    {!isRendered && (
                      <div className="h-10 px-4 rounded-lg border border-line bg-surface flex items-center gap-2 text-xs font-medium text-fg-3 animate-pulse shadow-2xs">
                        <Loader2 className="size-3.5 animate-spin text-fg-3" />
                        <span>Loading Google Sign-In...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </m.div>

      {/* Switch to Password Modal */}
      <Dialog
        open={showDisconnectModal}
        onOpenChange={(open) => {
          if (!open && !disconnectMutation.isPending) {
            setShowDisconnectModal(false);
          }
        }}
      >
        <DialogContent size="sm" showCloseButton={!disconnectMutation.isPending}>
          <form onSubmit={handleDisconnectSubmit} className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-[10px] flex items-center justify-center shrink-0 border bg-accent-tint border-accent-line text-accent">
                <KeyRound className="size-5 text-accent" />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <DialogTitle className="text-base font-semibold text-fg tracking-tight">
                  Switch to Password Login
                </DialogTitle>
                <DialogDescription className="text-xs text-fg-2 leading-relaxed font-normal mt-1">
                  To disconnect Google, set a new password. You will use this password and your email to sign in going forward.
                </DialogDescription>
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-lg bg-bad-bg border border-bad-line text-bad-fg text-xs">
                {passwordError}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium text-fg block mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:border-line-focus"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-fg block mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line bg-surface text-fg focus:outline-none focus:border-line-focus"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-line-subtle sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnectMutation.isPending}
              >
                Keep Google
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? 'Updating...' : 'Set Password & Disconnect'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GoogleAccountCard;
