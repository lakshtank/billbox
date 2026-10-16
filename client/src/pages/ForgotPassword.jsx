import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useForgotPassword } from '../queries/useAuthMutations';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

export function ForgotPassword() {
  const { isAuthenticated } = useAuth();
  const forgotMutation = useForgotPassword();
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (values) => {
    setServerError('');
    forgotMutation.mutate(values, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (err) => {
        const msg =
          err.response?.data?.message ||
          'Something went wrong. Please check your email and try again.';
        setServerError(msg);
        setFocus('email');
      },
    });
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {isSuccess ? (
          /* Success state replaces the form:
             MailCheck icon in a 40px bg-subtle tile,
             "Check your email",
             text "If an account exists for that email, a reset link is on its way.",
             button "Back to sign in". Never reveal whether the email exists. */
          <div className="space-y-6">
            <div className="w-10 h-10 rounded-lg bg-subtle border border-line flex items-center justify-center text-fg">
              <MailCheck className="w-5 h-5 text-fg" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
                Check your email
              </h1>
              <p className="text-sm text-fg-2 font-sans leading-relaxed">
                If an account exists for that email, a reset link is on its way.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/login" className="block w-full">
                <Button variant="primary" size="lg" className="w-full h-12 text-sm font-medium">
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
                Reset your password
              </h1>
              <p className="text-sm text-fg-2 font-sans">
                {"Enter your email and we'll send a reset link."}
              </p>
            </div>

            {/* Server Error Alert Banner */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-lg bg-bad-bg border border-bad-line text-bad-fg text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bad-solid" />
                <p className="flex-1">{serverError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  size="lg"
                  autoComplete="email"
                  placeholder="you@company.com"
                  error={Boolean(errors.email)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p
                    id="forgot-email-error"
                    className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting || forgotMutation.isPending}
                  className="w-full h-12 text-sm font-medium"
                >
                  Send reset link
                </Button>
              </div>
            </form>

            <p className="text-center text-sm text-fg-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-medium text-fg-link hover:underline transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;
