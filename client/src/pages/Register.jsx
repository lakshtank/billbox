import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { useRegister } from '../queries/useAuthMutations';
import { validateEmail, validatePassword, validateName } from '../utils/validators';

const Register = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const registerMutation = useRegister();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    const nameErr = validateName(form.name);
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);

    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerMutation.mutate(
      { name: form.name, email: form.email, password: form.password },
      {
        onSuccess: (data) => {
          loginUser(data.token, data.user);
          toast.success('Account created! Welcome to BillBox.');
          navigate('/');
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || 'Registration failed. Please try again.';
          toast.error(message);
        },
      }
    );
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white shadow-xs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Start tracking your receipts and warranties
          </p>
        </div>

        {/* Auth Surface Card */}
        <div className="surface-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-name" className="text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="register-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-0.5">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-email" className="text-xs font-semibold text-slate-700">
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-0.5">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-rose-500 mt-0.5">{errors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-confirm" className="text-xs font-semibold text-slate-700">
                Confirm Password
              </label>
              <input
                id="register-confirm"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-0.5">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn btn-primary w-full py-2.5 mt-2"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-700 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
