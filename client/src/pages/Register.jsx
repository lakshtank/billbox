import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useRegister } from '../queries/useAuthMutations';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required.'),
    email: z.string().trim().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, "Passwords don't match."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, loginUser } = useAuth();
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
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
    registerMutation.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: (data) => {
          loginUser(data.token, data.user);
          toast.success('Account created');
          navigate('/');
        },
        onError: (err) => {
          const msg =
            err.response?.data?.message ||
            'Registration failed. Please check your information and try again.';
          setServerError(msg);
          setFocus('email');
        },
      }
    );
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
            Create your account
          </h1>
          <p className="text-sm text-fg-2 font-sans">
            Start tracking receipts and warranties.
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
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              type="text"
              size="lg"
              autoComplete="name"
              placeholder="Jane Doe"
              error={Boolean(errors.name)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'register-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p
                id="register-name-error"
                className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              size="lg"
              autoComplete="email"
              placeholder="you@company.com"
              error={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p
                id="register-email-error"
                className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          {/* Password with 4-segment strength bar and text label */}
          <div className="space-y-1.5">
            <Label htmlFor="register-password">Password</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                size="lg"
                autoComplete="new-password"
                placeholder="Create a password"
                error={Boolean(errors.password)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? 'register-password-error'
                    : 'register-password-hint'
                }
                className="pr-11"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg transition-colors cursor-pointer rounded"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <PasswordStrengthMeter password={currentPassword} />
            <p id="register-password-hint" className="text-xs text-fg-3">
              At least 8 characters.
            </p>
            {errors.password && (
              <p
                id="register-password-error"
                className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                <span>{errors.password.message}</span>
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="register-confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                size="lg"
                autoComplete="new-password"
                placeholder="Confirm your password"
                error={Boolean(errors.confirmPassword)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? 'register-confirm-error' : undefined
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
                id="register-confirm-error"
                className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                <span>{errors.confirmPassword.message}</span>
              </p>
            )}
          </div>

          {/* Terms line 12px fg-3 */}
          <p className="text-xs text-fg-3 leading-relaxed">
            By creating an account you agree to the{' '}
            <a href="#" className="underline hover:text-fg transition-colors">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-fg transition-colors">
              Privacy Policy
            </a>
            .
          </p>

          {/* Primary full-width button (48px) */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting || registerMutation.isPending}
              className="w-full h-12 text-sm font-medium"
            >
              Create account
            </Button>
          </div>
        </form>

        {/* Secondary link */}
        <p className="text-center text-sm text-fg-2">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-fg-link hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
