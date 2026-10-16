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
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/');
          }, 120);
        },
        onError: (err) => {
          const msg =
            err.response?.data?.message ||
            'Registration failed. Please check your information and try again.';
          setServerError(msg);
          setShake(true);
          setTimeout(() => setShake(false), 260);
          setFocus('email');
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
      <m.div
        variants={formContainerVariants}
        initial="hidden"
        animate={isSuccess ? { opacity: 0, transition: { duration: 0.12 } } : 'show'}
        className={cn('space-y-6', shake && 'shake')}
      >
        {/* Header */}
        <m.div variants={fieldVariants} className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-fg font-sans">
            Create your account
          </h1>
          <p className="text-sm text-fg-2 font-sans">
            Start tracking receipts and warranties.
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
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
          {/* Full Name */}
          <m.div variants={fieldVariants} className="space-y-1.5">
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
          </m.div>

          {/* Email */}
          <m.div variants={fieldVariants} className="space-y-1.5">
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
          </m.div>

          {/* Password with 4-segment strength bar and text label */}
          <m.div variants={fieldVariants} className="space-y-1.5">
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
          </m.div>

          {/* Confirm Password */}
          <m.div variants={fieldVariants} className="space-y-1.5">
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
          </m.div>

          {/* Terms line 12px fg-3 */}
          <m.p variants={fieldVariants} className="text-xs text-fg-3 leading-relaxed">
            By creating an account you agree to the{' '}
            <a href="#" className="underline hover:text-fg transition-colors">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-fg transition-colors">
              Privacy Policy
            </a>
            .
          </m.p>

          {/* Primary full-width button (48px) */}
          <m.div variants={fieldVariants} className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting || registerMutation.isPending}
              className="w-full h-12 text-sm font-medium"
            >
              Create account
            </Button>
          </m.div>
        </form>

        {/* Secondary link */}
        <m.p variants={fieldVariants} className="text-center text-sm text-fg-2">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-fg-link hover:underline transition-colors"
          >
            Sign in
          </Link>
        </m.p>
      </m.div>
    </AuthLayout>
  );
}

export default Register;
