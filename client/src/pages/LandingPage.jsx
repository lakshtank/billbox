import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as m from 'motion/react-m';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Receipt,
  Clock,
  TrendingUp,
  FileCheck,
  Share2,
  Lock,
  ChevronDown,
  CheckCircle2,
  Layers,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import useAuth from '@/hooks/useAuth';
import Hero3DReceipt from '../components/landing/Hero3DReceipt';
import LiveScannerDemo from '../components/landing/LiveScannerDemo';
import WarrantyRadarDemo from '../components/landing/WarrantyRadarDemo';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const scannerRef = useRef(null);

  const scrollToScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const FAQS = [
    {
      q: 'Can I really scan receipts without an account?',
      a: 'Yes! Our live demo scanner lets you test real AI extraction or sample receipts instantly without logging in. When you want to permanently store it and track warranties, simply click "Sign up to save" and your scanned receipt will be waiting in your new account.',
    },
    {
      q: 'How does the 30-day and 90-day warranty tracker work?',
      a: 'BillBox automatically parses warranty durations from receipts or store invoices (e.g. 12 months, 2 years). It calculates the exact expiry date and groups them into 30-day urgent warnings, 90-day upcoming reviews, and safe active warranties, sending timely notifications so you never miss a claim.',
    },
    {
      q: 'What formats and bill types are supported?',
      a: 'You can upload photos from your smartphone camera, PNG/JPEG images, scanned PDFs, and e-commerce digital invoices from Amazon, Apple, Croma, IKEA, Reliance, and more. Even crumpled or faded thermal receipts are handled with high accuracy by intelligent document processing.',
    },
    {
      q: 'Is BillBox free to use?',
      a: 'Yes, BillBox offers a generous free tier for personal expense and warranty tracking, complete with cloud storage on MongoDB Atlas and unlimited receipt scans.',
    },
    {
      q: 'Is my financial data secure?',
      a: 'All documents and metadata are stored securely with bank-grade encryption in transit and at rest. You own 100% of your data and can export it to CSV/PDF or delete it at any time.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-app text-fg font-sans selection:bg-accent selection:text-white overflow-x-hidden relative">
      {/* ── 1. Sticky Glass Top Navigation Bar ──────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-surface/80 border-b border-line/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Logo size="md" showWordmark={true} to="/" />
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-fg-2">
            <button
              type="button"
              onClick={scrollToScanner}
              className="hover:text-fg transition-colors cursor-pointer"
            >
              Live Scanner
            </button>
            <a href="#features" className="hover:text-fg transition-colors">
              Features
            </a>
            <a href="#warranty-radar" className="hover:text-fg transition-colors">
              Warranty Radar
            </a>
            <a href="#faq" className="hover:text-fg transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Button
                type="button"
                onClick={() => navigate('/receipts')}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>Go to Receipts</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => navigate('/login')}
                  className="h-9 px-3.5 text-xs font-medium text-fg-2 hover:text-fg cursor-pointer"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="h-9 px-4 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section with 3D Canvas & Value Proposition ──────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Subtle architectural dot grid & ambient spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,#000_60%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline & Call to Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 border border-line text-xs font-medium text-fg-2 shadow-xs backdrop-blur-md">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="size-3.5 text-accent" />
                <span>Intelligent Receipt Archiving &amp; Warranty Tracking</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-fg leading-[1.12]">
                Your Receipts Fade.{' '}
                <span className="text-fg-2">
                  Your Warranties Expire.
                </span>{' '}
                BillBox Protects Both.
              </h1>

              <p className="text-sm sm:text-base text-fg-3 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Transform crumpled paper receipts into high-fidelity digital assets. Automatically detect store merchants, itemized line totals, and 30d/90d warranty deadlines with instant cloud sync.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  type="button"
                  onClick={scrollToScanner}
                  className="w-full sm:w-auto h-12 px-7 rounded-xl text-sm font-semibold bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/25 transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="size-4 fill-white" />
                  <span>Try Live Scanner (Free)</span>
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-medium border-line hover:bg-hover cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Create Free Vault</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              {/* Trust Pillars */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-line/60 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="p-3 rounded-xl bg-surface/70 border border-line shadow-2xs">
                  <p className="text-lg sm:text-xl font-bold font-mono text-fg">&lt; 1.2s</p>
                  <p className="text-[11px] text-fg-3">Scan Latency</p>
                </div>
                <div className="p-3 rounded-xl bg-surface/70 border border-line shadow-2xs">
                  <p className="text-lg sm:text-xl font-bold font-mono text-amber-600">30d &amp; 90d</p>
                  <p className="text-[11px] text-fg-3">Warranty Alerts</p>
                </div>
                <div className="p-3 rounded-xl bg-surface/70 border border-line shadow-2xs">
                  <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600">100%</p>
                  <p className="text-[11px] text-fg-3">Cloud Synced</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Stage for Interactive 3D Physical Receipt */}
            <div className="lg:col-span-5 flex items-center justify-center relative min-h-[480px]">
              <Hero3DReceipt />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Live Interactive Scanner Demo (No Auth Required) ────────── */}
      <section ref={scannerRef} id="scanner" className="py-20 sm:py-28 bg-subtle/40 border-y border-line relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
              Live Interactive Demo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
              Test Real Document Processing Now
            </h2>
            <p className="text-sm text-fg-3 leading-relaxed">
              Click any verified sample invoice or drag &amp; drop your own bill. Watch instant OCR parsing, warranty detection, and tax calculations with zero sign-in required.
            </p>
          </div>

          <LiveScannerDemo />
        </div>
      </section>

      {/* ── 4. Warranty Radar 30d / 90d Interactive Demo ──────────────── */}
      <section id="warranty-radar" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (5 cols): Description & Milestones */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div className="space-y-3">
                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 font-mono">
                  Proactive Protection Radar
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight leading-tight">
                  Never Miss a Free Claim or Replacement
                </h2>
                <p className="text-sm text-fg-3 leading-relaxed">
                  Most people forget their warranties until a week after they expire. BillBox automatically calculates expiry countdowns and triggers notifications before coverage lapses.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-surface border border-line shadow-xs flex items-start gap-3.5">
                  <div className="size-8 rounded-lg bg-warn-bg text-warn-fg flex items-center justify-center font-bold text-xs shrink-0">
                    ≤30d
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-fg">Critical Milestone Alert</p>
                    <p className="text-fg-3 text-[11px] mt-0.5 leading-relaxed">
                      Instant alerts to schedule free manufacturer repairs, battery replacements, or exchange claims before coverage terminates.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-line shadow-xs flex items-start gap-3.5">
                  <div className="size-8 rounded-lg bg-subtle text-fg-2 flex items-center justify-center font-bold text-xs shrink-0">
                    90d
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-fg">Quarterly Review Horizon</p>
                    <p className="text-fg-3 text-[11px] mt-0.5 leading-relaxed">
                      Surfaces items entering their final quarter on your dashboard overview so you can plan service visits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Interactive Time Slider & Device Grid */}
            <div className="lg:col-span-7">
              <WarrantyRadarDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Feature Showcase Grid ───────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-subtle/30 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
              Core Capabilities
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-fg">
              Engineered for Complete Peace of Mind
            </h2>
            <p className="text-xs sm:text-sm text-fg-3">
              Everything you need to eliminate receipt chaos and protect every rupee spent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Receipt className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Instant Document OCR</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Extracts itemized products, taxes, dates, and store branding in under 1.2 seconds with high precision.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <BarChart3 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">30d &amp; 90d Trend Graphs</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Dynamic Recharts spending area charts that plot trajectories across 30 days, 90 days, 1 year, and all-time store breakdowns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Clock className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Automated Expiry Radar</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Continuous background monitoring. Receive automated warnings 30 days, 15 days, and 7 days before coverage lapses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Share2 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Public Receipt Sharing</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Generate secure, shareable public web links for any invoice. Perfect for business reimbursements, split costs, or insurance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Layers className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Batch Processing</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Have multiple receipts? Drag and drop files at once. Our concurrent queue processes them in parallel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Lock className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Google One-Tap &amp; Security</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Seamless Google OAuth, strict CORS authentication, secure cloud storage fallback, and zero third-party data tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ Accordion Section ──────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
            Got Questions?
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-fg">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-line border border-line rounded-2xl bg-surface overflow-hidden shadow-xs">
          {FAQS.map((faq, i) => (
            <details key={i} className="group p-5 sm:p-6 cursor-pointer text-left">
              <summary className="flex items-center justify-between font-semibold text-sm sm:text-base text-fg list-none">
                <span>{faq.q}</span>
                <ChevronDown className="size-4 text-fg-3 transition-transform group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <p className="text-xs sm:text-sm text-fg-3 mt-3 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── 7. Bottom High-Converting Call to Action ──────────────────── */}
      <section className="py-16 sm:py-20 relative overflow-hidden bg-subtle/40 border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-line text-xs font-medium text-fg-2 shadow-xs">
            <ShieldCheck className="size-3.5 text-accent" />
            <span>Setup in under 10 seconds</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight">
            Ready to Never Lose Another Receipt?
          </h2>
          <p className="text-sm sm:text-base text-fg-3 max-w-xl mx-auto">
            Join thousands tracking verified expenses and active warranty coverage.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-semibold bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/25 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={scrollToScanner}
              className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-medium border-line hover:bg-hover cursor-pointer"
            >
              Test Scanner First
            </Button>
          </div>
        </div>
      </section>

      {/* ── 8. Production Footer ───────────────────────────────────────── */}
      <footer className="border-t border-line bg-surface py-10 text-xs text-fg-3 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" showWordmark={true} />
            <span className="text-[11px] text-fg-muted">
              © {new Date().getFullYear()} BillBox. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/login" className="hover:text-fg transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-fg transition-colors">
              Create Account
            </Link>
            <a
              href="https://github.com/lakshtank/billbox"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg transition-colors inline-flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
