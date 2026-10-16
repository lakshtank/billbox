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
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 120);
      },
      onError: (err) => {
        const status = err.response?.status;
        const msg = !err.response
          ? 'Unable to connect to the server. Please check your connection.'
          : status === 401
          ? 'Incorrect email or password.'
          : err.response?.data?.message || 'Incorrect email or password.';
        setServerError(msg);
        setShake(true);
        setTimeout(() => setShake(false), 260);
        setFocus('email');
      },
    });
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
      <m.div
        variants={formContainerVariants}
        initial="hidden"
        animate={isSuccess ? { opacity: 0, transition: { duration: 0.12 } } : 'show'}
        className={cn('space-y-4 sm:space-y-5', shake && 'shake')}
      >
        {/* Header */}
        <m.div variants={fieldVariants} className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
            Sign in
          </h1>
          <p className="text-sm text-fg-2 font-sans">
            Welcome back to BillBox.
          </p>
        </m.div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <m.div
            variants={fieldVariants}
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-lg bg-bad-bg border border-bad-line text-bad-fg text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bad-solid" />
            <p className="flex-1">{serverError}</p>
          </m.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3.5 sm:space-y-4" noValidate>
          {/* Email field */}
          <m.div variants={fieldVariants} className="space-y-1.5">
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
          </m.div>

          {/* Password field with show/hide toggle */}
          <m.div variants={fieldVariants} className="space-y-1.5">
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
          </m.div>

          {/* Submit button: 48px, full width, primary */}
          <m.div variants={fieldVariants} className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting || loginMutation.isPending}
              className="w-full h-12 text-sm font-medium"
            >
              Sign in
            </Button>
          </m.div>
        </form>

        {/* Secondary link */}
        <m.p variants={fieldVariants} className="text-center text-sm text-fg-2">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-fg-link hover:underline transition-colors"
          >
            Create one
          </Link>
        </m.p>
      </m.div>
    </AuthLayout>
  );
}

export default Login;
