import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAuth from '../../hooks/useAuth';
import { useGoogleAuth } from '../../queries/useAuthMutations';
import { useTheme } from '../../context/ThemeContext';

/**
 * GoogleLoginButton component using Google Identity Services (GIS)
 * Integrates directly with BillBox AuthContext and backend /api/auth/google endpoint.
 */
export function GoogleLoginButton({
  text = 'continue_with',
  onSuccess,
  onError,
  className = '',
}) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { resolvedTheme } = useTheme();
  const googleAuthMutation = useGoogleAuth();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'gentle';

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response.credential) {
        toast.error('No credential received from Google.');
        onError?.(new Error('No credential received'));
        return;
      }

      googleAuthMutation.mutate(
        { credential: response.credential },
        {
          onSuccess: (data) => {
            loginUser(data.token, data.user);
            toast.success('Signed in with Google');
            if (onSuccess) {
              onSuccess(data);
            } else {
              navigate('/');
            }
          },
          onError: (err) => {
            const msg =
              err.response?.data?.message ||
              'Google sign-in failed. Please try again.';
            toast.error(msg);
            onError?.(err);
          },
        }
      );
    },
    [googleAuthMutation, loginUser, navigate, onSuccess, onError]
  );

  // Poll or detect when window.google.accounts.id is available
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
  }, []);

  // Render Google button once GIS script and container are ready
  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear previous button DOM if re-rendering (e.g. on theme change)
      buttonRef.current.innerHTML = '';

      // Determine width: clamp between 240 and 400 per Google Identity API constraints
      const measuredWidth = buttonRef.current.offsetWidth || 380;
      const targetWidth = Math.min(Math.max(measuredWidth, 240), 400);

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: text, // 'signin_with' | 'signup_with' | 'continue_with'
        shape: 'rectangular',
        logo_alignment: 'left',
        width: targetWidth,
      });

      setIsRendered(true);
    } catch (err) {
      console.warn('Failed to render Google Sign-In button:', err);
    }
  }, [scriptLoaded, clientId, text, isDark, handleCredentialResponse]);

  if (!clientId) {
    return (
      <div className="p-3 text-xs text-center rounded-lg bg-subtle border border-line text-fg-3">
        Google Client ID is missing in configuration.
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {googleAuthMutation.isPending ? (
        <div className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-lg border border-line bg-surface text-sm text-fg-2 font-medium animate-pulse shadow-2xs">
          <svg
            className="animate-spin h-4 w-4 text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Signing in with Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center relative min-h-[44px]">
          {/* Skeleton placeholder while Google script loads to prevent layout shift */}
          {!isRendered && (
            <div className="w-full max-w-[400px] h-11 sm:h-12 rounded-lg border border-line bg-surface flex items-center justify-center gap-3 text-sm font-medium text-fg-3 shadow-2xs animate-pulse">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{text === 'signup_with' ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </div>
          )}
          <div
            ref={buttonRef}
            className={`w-full flex justify-center ${!isRendered ? 'hidden' : ''}`}
            data-testid="google-signin-container"
          />
        </div>
      )}
    </div>
  );
}

export default GoogleLoginButton;
