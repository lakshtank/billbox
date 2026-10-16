import { useState } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useResetPassword } from '../queries/useAuthMutations';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import * as m from 'motion/react-m';
import { ease } from '@/lib/motion';
import { cn } from '../lib/utils';

const formContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: ease.out } },
};

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, "Passwords don't match."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const resetMutation = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [serverError, setServerError] = useState('');
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const currentPassword = watch('password', '');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (values) => {
    setServerError('');
    resetMutation.mutate(
      {
        token,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success('Password updated');
          navigate('/login');
        },
        onError: (err) => {
          const status = err.response?.status;
          if (status === 400 || status === 404 || status === 410) {
            setIsExpired(true);
          } else {
            const msg =
              err.response?.data?.message ||
              'Unable to update password. Please try again.';
            setServerError(msg);
            setShake(true);
            setTimeout(() => setShake(false), 260);
            setFocus('password');
          }
        },
      }
    );
  };

  const onInvalid = (fieldErrors) => {
    setShake(true);
    setTimeout(() => setShake(false), 260);
    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) {
      setFocus(firstField);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-4 sm:space-y-5">
        {isExpired ? (
          /* Invalid or expired token: replace the form with an error state,
             "This link has expired", button "Request a new link" (to /forgot-password) */
          <m.div
            variants={formContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4 sm:space-y-5"
          >
            <m.div variants={fieldVariants} className="w-10 h-10 rounded-lg bg-bad-bg border border-bad-line flex items-center justify-center text-bad-fg">
              <AlertCircle className="w-5 h-5 text-bad-solid" />
            </m.div>

            <m.div variants={fieldVariants} className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
                This link has expired
              </h1>
              <p className="text-sm text-fg-2 font-sans leading-relaxed">
                Password reset links are single-use and expire after a short period. Please request a new link to reset your password.
              </p>
            </m.div>

            <m.div variants={fieldVariants} className="pt-1">
              <Link to="/forgot-password" className="block w-full">
                <Button variant="primary" size="lg" className="w-full h-11 sm:h-12 text-sm font-medium">
                  Request a new link
                </Button>
              </Link>
            </m.div>
          </m.div>
        ) : (
          <m.div
            variants={formContainerVariants}
            initial="hidden"
            animate="show"
            className={cn('space-y-4 sm:space-y-5', shake && 'shake')}
          >
            {/* Header */}
            <m.div variants={fieldVariants} className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
                Set a new password
              </h1>
              <p className="text-sm text-fg-2 font-sans">
                {"Choose a password you haven't used before."}
              </p>
            </m.div>

            {/* Server Error Alert Banner */}
            {serverError && (
              <m.div
                variants={fieldVariants}
                role="alert"
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-bad-bg border border-bad-line text-bad-fg text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bad-solid" />
                <p className="flex-1">{serverError}</p>
              </m.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3 sm:space-y-3.5" noValidate>
              {/* New Password */}
              <m.div variants={fieldVariants} className="space-y-1">
                <Label htmlFor="reset-password">New password</Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    size="lg"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    error={Boolean(errors.password)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'reset-password-error' : undefined
                    }
                    className="pr-11"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg transition-colors cursor-pointer rounded"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={currentPassword} />
                {errors.password && (
                  <p
                    id="reset-password-error"
                    className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </m.div>

              {/* Confirm New Password */}
              <m.div variants={fieldVariants} className="space-y-1">
                <Label htmlFor="reset-confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    size="lg"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    error={Boolean(errors.confirmPassword)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword ? 'reset-confirm-error' : undefined
                    }
                    className="pr-11"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg transition-colors cursor-pointer rounded"
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    id="reset-confirm-error"
                    className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                    <span>{errors.confirmPassword.message}</span>
                  </p>
                )}
              </m.div>

              <m.div variants={fieldVariants} className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting || resetMutation.isPending}
                  className="w-full h-11 sm:h-12 text-sm font-medium"
                >
                  Update password
                </Button>
              </m.div>
            </form>

            <m.p variants={fieldVariants} className="text-center text-sm text-fg-2">
              <Link
                to="/login"
                className="font-medium text-fg-link hover:underline transition-colors"
              >
                Back to sign in
              </Link>
            </m.p>
          </m.div>
        )}
      </div>
    </AuthLayout>
  );
}

export default ResetPassword;
