import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
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
  Menu,
  X,
  Check,
  Database,
  Smartphone,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import useAuth from '@/hooks/useAuth';
import Hero3DReceipt from '../components/landing/Hero3DReceipt';
import MerchantTicker from '../components/landing/MerchantTicker';
import WorkflowSteps from '../components/landing/WorkflowSteps';
import LiveScannerDemo from '../components/landing/LiveScannerDemo';
import WarrantyRadarDemo from '../components/landing/WarrantyRadarDemo';
import AnalyticsPreviewDemo from '../components/landing/AnalyticsPreviewDemo';
import ComparisonMatrix from '../components/landing/ComparisonMatrix';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scannerRef = useRef(null);

  // Recalculate smooth scroll limits on mount & after elements stabilize
  useEffect(() => {
    const t1 = setTimeout(() => window.lenis?.resize(), 100);
    const t2 = setTimeout(() => window.lenis?.resize(), 600);
    const t3 = setTimeout(() => window.lenis?.resize(), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const scrollToScanner = () => {
    setMobileMenuOpen(false);
    if (scannerRef.current) {
      scannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const FAQS = [
    {
      q: 'Can I really scan receipts without creating an account?',
      a: 'Yes! Our live demo scanner lets you test real AI extraction or verified sample invoices immediately with zero registration. When you decide to permanently store it and enable automated 30d/90d warranty tracking, click "Sign up to save" and your scan transfers directly into your new vault.',
    },
    {
      q: 'How does the proactive 30-day and 90-day warranty radar work?',
      a: 'BillBox automatically parses warranty terms from receipts and store invoices (e.g., 12 months, 2 years, 10-year guarantees). It calculates exact calendar expiration dates and categorizes them into 30-day urgent warnings and 90-day upcoming reviews, sending automated alerts before coverage lapses.',
    },
    {
      q: 'What receipt types and file formats are supported?',
      a: 'You can photograph crumpled paper receipts with your smartphone camera, upload PNG/JPEG scans, drop digital PDF tax invoices from Amazon, Apple, Croma, IKEA, or forward email receipts. Our document vision engine handles faded thermal paper, multi-page PDFs, and complex tax breakdowns.',
    },
    {
      q: 'Is BillBox free to use?',
      a: 'Yes! BillBox offers a generous, fully featured free tier for personal expense archiving and warranty tracking, complete with cloud sync on MongoDB Atlas, spending graphs, and unlimited receipt scans.',
    },
    {
      q: 'How is my financial and personal data protected?',
      a: 'All documents and metadata are encrypted in transit via TLS 1.3 and at rest with AES-256 bank-grade encryption. You own 100% of your data and can export everything to CSV or PDF at any time with zero vendor lock-in.',
    },
    {
      q: 'Can I share receipts for reimbursements or insurance claims?',
      a: 'Yes! You can generate secure, cryptographically signed public links for any receipt in your vault. Anyone with the link can view verified items, tax breakdowns, and warranty certificates without needing a BillBox account.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-app text-fg font-sans selection:bg-accent selection:text-white overflow-x-hidden relative">
      {/* ── 1. Sticky Glass Top Navigation Bar ──────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-surface/85 border-b border-line/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Logo size="md" showWordmark={true} to="/" />
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-fg-2">
            <button
              type="button"
              onClick={scrollToScanner}
              className="hover:text-fg transition-colors cursor-pointer"
            >
              Live Scanner
            </button>
            <a href="#how-it-works" className="hover:text-fg transition-colors">
              How It Works
            </a>
            <a href="#warranty-radar" className="hover:text-fg transition-colors">
              Warranty Radar
            </a>
            <a href="#analytics" className="hover:text-fg transition-colors">
              Spending Analytics
            </a>
            <a href="#comparison" className="hover:text-fg transition-colors">
              Comparison
            </a>
            <a href="#features" className="hover:text-fg transition-colors">
              Features
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
                  className="hidden sm:inline-flex h-9 px-3.5 text-xs font-semibold text-fg-2 hover:text-fg cursor-pointer"
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

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-fg-2 hover:text-fg hover:bg-hover transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-b border-line bg-surface/95 backdrop-blur-2xl overflow-hidden px-5 py-5 space-y-3 font-semibold text-sm"
            >
              <button
                type="button"
                onClick={scrollToScanner}
                className="block w-full text-left py-2 text-fg hover:text-accent transition-colors"
              >
                Live Scanner (No Login)
              </button>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg"
              >
                How It Works
              </a>
              <a
                href="#warranty-radar"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg"
              >
                Warranty Radar
              </a>
              <a
                href="#analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg"
              >
                Spending Analytics
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg"
              >
                Comparison Matrix
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg"
              >
                Core Features
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg"
              >
                FAQ
              </a>

              <div className="pt-4 border-t border-line flex flex-col gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full justify-center h-10 text-xs"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full justify-center h-10 text-xs bg-accent text-white"
                >
                  Create Free Account
                </Button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
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
                Transform crumpled thermal receipts and digital invoices into high-fidelity encrypted assets. Automatically extract merchants, itemized products, and 30d/90d warranty deadlines with instant cloud sync.
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

              {/* Guarantee Microcopy */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-[11px] text-fg-3 font-medium">
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  Instant 10s setup
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  100% Free personal tier
                </span>
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
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[480px]">
              <Hero3DReceipt />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Supported Retailers Marquee Ticker ───────────────────────── */}
      <MerchantTicker />

      {/* ── 4. End-to-End Workflow / How It Works ───────────────────────── */}
      <div id="how-it-works">
        <WorkflowSteps />
      </div>

      {/* ── 5. Live Interactive Scanner Demo (No Auth Required) ────────── */}
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

      {/* ── 6. Warranty Radar 30d / 90d Interactive Demo ──────────────── */}
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

      {/* ── 7. Spending & Warranty Intelligence Analytics Preview ──────── */}
      <section id="analytics" className="py-20 sm:py-28 bg-subtle/30 border-y border-line relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
              Dashboard Intelligence
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight text-balance">
              Track Spending Trends Across 30 Days, 90 Days &amp; Years
            </h2>
            <p className="text-sm text-fg-3 leading-relaxed max-w-2xl mx-auto">
              Visualize hardware spending, active warranties, and quarterly budget allocations with interactive Recharts intelligence.
            </p>
          </div>

          <AnalyticsPreviewDemo />
        </div>
      </section>

      {/* ── 8. Comparison Matrix: Traditional vs BillBox Vault ─────────── */}
      <div id="comparison">
        <ComparisonMatrix />
      </div>

      {/* ── 9. Core Capabilities Feature Bento Grid ────────────────────── */}
      <section id="features" className="py-20 sm:py-28 bg-subtle/20 border-t border-line">
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
            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Receipt className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Instant Document OCR</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Extracts itemized products, taxes, dates, and store branding in under 1.2 seconds with high precision.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <BarChart3 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">30d &amp; 90d Trend Graphs</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Dynamic Recharts spending area charts that plot trajectories across 30 days, 90 days, 1 year, and store breakdowns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Clock className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Automated Expiry Radar</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Continuous background monitoring. Receive automated warnings 30 days, 15 days, and 7 days before coverage lapses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Share2 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Public Receipt Sharing</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Generate secure, shareable public web links for any invoice. Perfect for reimbursements, split costs, or insurance claims.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Layers className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Batch Concurrent Processing</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Have multiple receipts from a shopping trip? Drag and drop files at once. Our concurrent queue processes them in parallel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group">
              <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <Lock className="size-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Google One-Tap &amp; AES-256</h3>
              <p className="text-xs text-fg-3 leading-relaxed">
                Seamless Google OAuth, strict CORS authentication, secure cloud storage fallback, and zero third-party data tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. FAQ Accordion Section ─────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
            Got Questions?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-line border border-line rounded-3xl bg-surface overflow-hidden shadow-xs">
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

      {/* ── 11. Bottom High-Converting Call to Action Banner ───────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden bg-gradient-to-b from-subtle/40 via-surface to-subtle/40 border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-line text-xs font-medium text-fg-2 shadow-xs">
            <ShieldCheck className="size-3.5 text-accent" />
            <span>Setup in under 10 seconds • No credit card needed</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight">
            Ready to Never Lose Another Warranty?
          </h2>
          <p className="text-sm sm:text-base text-fg-3 max-w-xl mx-auto leading-relaxed">
            Join thousands of smart shoppers protecting verified purchases, tracking expiry dates, and saving thousands in replacement costs.
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
              Test Live Scanner First
            </Button>
          </div>
        </div>
      </section>

      {/* ── 12. Enterprise Multi-Column Footer ─────────────────────────── */}
      <footer className="border-t border-line bg-surface py-14 text-xs text-fg-3 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-line">
            {/* Col 1: Brand & Tagline */}
            <div className="md:col-span-4 space-y-4">
              <Logo size="md" showWordmark={true} />
              <p className="text-xs text-fg-3 max-w-xs leading-relaxed">
                Intelligent receipt vault and proactive warranty radar. Built for seamless expense archiving and zero-loss warranty management.
              </p>

              {/* Status pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-subtle border border-line text-[11px] font-mono text-fg-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational • OCR Latency 1.1s</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="md:col-span-2 space-y-3">
              <p className="font-bold text-fg uppercase tracking-wider text-[11px]">
                Product
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <button type="button" onClick={scrollToScanner} className="hover:text-fg transition-colors">
                    Live Demo Scanner
                  </button>
                </li>
                <li>
                  <a href="#warranty-radar" className="hover:text-fg transition-colors">
                    Warranty Radar
                  </a>
                </li>
                <li>
                  <a href="#analytics" className="hover:text-fg transition-colors">
                    Spending Trends
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-fg transition-colors">
                    Feature Bento
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Security & Trust */}
            <div className="md:col-span-3 space-y-3">
              <p className="font-bold text-fg uppercase tracking-wider text-[11px]">
                Security &amp; Architecture
              </p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-accent" />
                  <span>256-bit AES Vault Encryption</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Database className="size-3.5 text-emerald-600" />
                  <span>MongoDB Atlas Cloud Sync</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-ok-fg" />
                  <span>100% Data Export Guarantee</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="size-3.5 text-fg-muted" />
                  <span>Zero Ad Tracking &amp; Strict CORS</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Account & Code */}
            <div className="md:col-span-3 space-y-3">
              <p className="font-bold text-fg uppercase tracking-wider text-[11px]">
                Access &amp; Open Source
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="hover:text-fg transition-colors">
                    User Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-fg transition-colors">
                    Create Free Vault
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/lakshtank/billbox"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-fg transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="size-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-fg-muted">
            <p>© {new Date().getFullYear()} BillBox Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-fg transition-colors">
                Privacy Policy
              </Link>
              <Link to="/login" className="hover:text-fg transition-colors">
                Terms of Service
              </Link>
              <a
                href="https://github.com/lakshtank/billbox"
                target="_blank"
                rel="noreferrer"
                className="hover:text-fg transition-colors"
              >
                v1.0 Production
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
