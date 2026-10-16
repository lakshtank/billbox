import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useLogin } from '../queries/useAuthMutations';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loginUser } = useAuth();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (values) => {
    setServerError('');
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        loginUser(data.token, data.user);
        toast.success('Signed in');
        navigate('/');
      },
      onError: (err) => {
        const status = err.response?.status;
        const msg = !err.response
          ? 'Unable to connect to the server. Please check your connection.'
          : status === 401
          ? 'Incorrect email or password.'
          : err.response?.data?.message || 'Incorrect email or password.';
        setServerError(msg);
        setFocus('email');
      },
    });
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
            Sign in
          </h1>
          <p className="text-sm text-fg-2 font-sans">
            Welcome back to BillBox.
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
          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              size="lg"
              autoComplete="email"
              placeholder="you@company.com"
              error={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p
                id="login-email-error"
                className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          {/* Password field with show/hide toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-fg-link hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                size="lg"
                autoComplete="current-password"
                placeholder="••••••••"
                error={Boolean(errors.password)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
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
            {errors.password && (
              <p
                id="login-password-error"
                className="text-xs text-bad-fg flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-bad-solid" />
                <span>{errors.password.message}</span>
              </p>
            )}
          </div>

          {/* Submit button: 48px, full width, primary */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting || loginMutation.isPending}
              className="w-full h-12 text-sm font-medium"
            >
              Sign in
            </Button>
          </div>
        </form>

        {/* Secondary link */}
        <p className="text-center text-sm text-fg-2">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-fg-link hover:underline transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
