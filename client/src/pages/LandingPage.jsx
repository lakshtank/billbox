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
import WarrantyRadarDemo from '../components/landing/WarrantyRadarDemo';
import AnalyticsPreviewDemo from '../components/landing/AnalyticsPreviewDemo';
import ComparisonMatrix from '../components/landing/ComparisonMatrix';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const FAQS = [
    {
      q: 'How does BillBox parse and extract my receipts?',
      a: 'BillBox utilizes automated document vision OCR to instantly extract merchant names, line items, purchase dates, taxes, and manufacturer warranty durations with high accuracy. Simply upload any receipt photo or PDF, and it is instantly organized.',
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
              Core Features
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
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105"
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
                  className="hidden sm:inline-flex h-9 px-3.5 text-xs font-semibold text-fg-2 hover:text-fg cursor-pointer transition-colors"
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
              transition={{ duration: 0.3 }}
              className="lg:hidden border-b border-line bg-surface/95 backdrop-blur-2xl overflow-hidden px-5 py-5 space-y-3 font-semibold text-sm"
            >
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg hover:text-accent transition-colors"
              >
                How It Works
              </a>
              <a
                href="#warranty-radar"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg transition-colors"
              >
                Warranty Radar
              </a>
              <a
                href="#analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg transition-colors"
              >
                Spending Analytics
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg transition-colors"
              >
                Comparison Matrix
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg transition-colors"
              >
                Core Features
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-fg-2 hover:text-fg transition-colors"
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
      <section className="relative pt-10 pb-16 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Subtle architectural dot grid & ambient spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,#000_60%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline & Call to Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <m.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 border border-line text-xs font-medium text-fg-2 shadow-xs backdrop-blur-md"
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="size-3.5 text-accent" />
                <span>Intelligent Receipt Archiving &amp; Warranty Tracking</span>
              </m.div>

              <m.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-fg leading-[1.12]"
              >
                Your Receipts Fade.{' '}
                <span className="text-fg-2">
                  Your Warranties Expire.
                </span>{' '}
                BillBox Protects Both.
              </m.h1>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base text-fg-3 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Transform crumpled thermal receipts and digital invoices into high-fidelity encrypted assets. Automatically extract merchants, itemized products, and 30d/90d warranty deadlines with instant cloud sync.
              </m.p>

              {/* Action Buttons */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
              >
                <m.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto h-12 px-7 rounded-xl text-sm font-semibold bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="size-4 fill-white" />
                    <span>Get Started Free</span>
                  </Button>
                </m.div>

                <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-hover cursor-pointer flex items-center justify-center gap-2 text-fg transition-colors"
                  >
                    <span>Explore How It Works</span>
                    <ArrowRight className="size-4" />
                  </a>
                </m.div>
              </m.div>

              {/* Guarantee Microcopy */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-[11px] text-fg-3 font-medium"
              >
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
              </m.div>

              {/* Trust Pillars */}
              <m.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="pt-6 grid grid-cols-3 gap-2 sm:gap-3 border-t border-line/60 max-w-lg mx-auto lg:mx-0 text-left"
              >
                <m.div whileHover={{ y: -4, scale: 1.02 }} className="p-2.5 sm:p-3 rounded-xl bg-surface/70 border border-line shadow-2xs transition-colors">
                  <p className="text-base sm:text-xl font-bold font-mono text-fg">&lt; 1.2s</p>
                  <p className="text-[10px] sm:text-[11px] text-fg-3">Scan Latency</p>
                </m.div>
                <m.div whileHover={{ y: -4, scale: 1.02 }} className="p-2.5 sm:p-3 rounded-xl bg-surface/70 border border-line shadow-2xs transition-colors">
                  <p className="text-base sm:text-xl font-bold font-mono text-amber-600">30d &amp; 90d</p>
                  <p className="text-[10px] sm:text-[11px] text-fg-3">Warranty Alerts</p>
                </m.div>
                <m.div whileHover={{ y: -4, scale: 1.02 }} className="p-2.5 sm:p-3 rounded-xl bg-surface/70 border border-line shadow-2xs transition-colors">
                  <p className="text-base sm:text-xl font-bold font-mono text-emerald-600">100%</p>
                  <p className="text-[10px] sm:text-[11px] text-fg-3">Cloud Synced</p>
                </m.div>
              </m.div>
            </div>

            {/* Right Column: Hero Stage for Interactive 3D Physical Receipt */}
            <m.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[460px] sm:min-h-[480px]"
            >
              <Hero3DReceipt />
            </m.div>
          </div>
        </div>
      </section>

      {/* ── 3. Supported Retailers Marquee Ticker ───────────────────────── */}
      <MerchantTicker />

      {/* ── 4. End-to-End Workflow / How It Works ───────────────────────── */}
      <div id="how-it-works">
        <WorkflowSteps />
      </div>

      {/* ── 5. Warranty Radar 30d / 90d Interactive Demo ──────────────── */}
      <section id="warranty-radar" className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (5 cols): Description & Milestones */}
            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-6 text-center lg:text-left"
            >
              <div className="space-y-3">
                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 font-mono">
                  Proactive Protection Radar
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-fg tracking-tight leading-tight">
                  Never Miss a Free Claim or Replacement
                </h2>
                <p className="text-xs sm:text-sm text-fg-3 leading-relaxed">
                  Most people forget their warranties until a week after they expire. BillBox automatically calculates expiry countdowns and triggers notifications before coverage lapses.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <m.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="p-4 rounded-xl bg-surface border border-line shadow-xs flex items-start gap-3.5 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-warn-bg text-warn-fg flex items-center justify-center font-bold text-xs shrink-0">
                    ≤30d
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-fg">Critical Milestone Alert</p>
                    <p className="text-fg-3 text-[11px] mt-0.5 leading-relaxed">
                      Instant alerts to schedule free manufacturer repairs, battery replacements, or exchange claims before coverage terminates.
                    </p>
                  </div>
                </m.div>

                <m.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="p-4 rounded-xl bg-surface border border-line shadow-xs flex items-start gap-3.5 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-subtle text-fg-2 flex items-center justify-center font-bold text-xs shrink-0">
                    90d
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-fg">Quarterly Review Horizon</p>
                    <p className="text-fg-3 text-[11px] mt-0.5 leading-relaxed">
                      Surfaces items entering their final quarter on your dashboard overview so you can plan service visits.
                    </p>
                  </div>
                </m.div>
              </div>
            </m.div>

            {/* Right Column (7 cols): Interactive Time Slider & Device Grid */}
            <div className="lg:col-span-7">
              <WarrantyRadarDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Spending & Warranty Intelligence Analytics Preview ──────── */}
      <section id="analytics" className="py-16 sm:py-24 bg-subtle/30 border-y border-line relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-3"
          >
            <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
              Dashboard Intelligence
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-fg tracking-tight text-balance">
              Track Spending Trends Across 30 Days, 90 Days &amp; Years
            </h2>
            <p className="text-xs sm:text-sm text-fg-3 leading-relaxed max-w-2xl mx-auto">
              Visualize hardware spending, active warranties, and quarterly budget allocations with interactive Recharts intelligence.
            </p>
          </m.div>

          <AnalyticsPreviewDemo />
        </div>
      </section>

      {/* ── 7. Comparison Matrix: Traditional vs BillBox Vault ─────────── */}
      <div id="comparison">
        <ComparisonMatrix />
      </div>

      {/* ── 8. Core Capabilities Feature Bento Grid ────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-subtle/20 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2"
          >
            <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
              Core Capabilities
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-fg tracking-tight">
              Engineered for Complete Peace of Mind
            </h2>
            <p className="text-xs sm:text-sm text-fg-3">
              Everything you need to eliminate receipt chaos and protect every rupee spent.
            </p>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                icon: Receipt,
                title: 'Instant Document OCR',
                description: 'Extracts itemized products, taxes, dates, and store branding in under 1.2 seconds with high precision.',
              },
              {
                icon: BarChart3,
                title: '30d & 90d Trend Graphs',
                description: 'Dynamic Recharts spending area charts that plot trajectories across 30 days, 90 days, 1 year, and store breakdowns.',
              },
              {
                icon: Clock,
                title: 'Automated Expiry Radar',
                description: 'Continuous background monitoring. Receive automated warnings 30 days, 15 days, and 7 days before coverage lapses.',
              },
              {
                icon: Share2,
                title: 'Public Receipt Sharing',
                description: 'Generate secure, shareable public web links for any invoice. Perfect for reimbursements, split costs, or insurance claims.',
              },
              {
                icon: Layers,
                title: 'Batch Concurrent Processing',
                description: 'Have multiple receipts from a shopping trip? Drag and drop files at once. Our concurrent queue processes them in parallel.',
              },
              {
                icon: Lock,
                title: 'Google One-Tap & AES-256',
                description: 'Seamless Google OAuth, strict CORS authentication, secure cloud storage fallback, and zero third-party data tracking.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <m.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-6 rounded-3xl bg-surface border border-line hover:border-accent/40 transition-all shadow-xs space-y-3 group cursor-default"
                >
                  <div className="size-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-fg">{feat.title}</h3>
                  <p className="text-xs text-fg-3 leading-relaxed">
                    {feat.description}
                  </p>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ Accordion Section ─────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12 space-y-2"
        >
          <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
            Got Questions?
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-fg tracking-tight">
            Frequently Asked Questions
          </h2>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="divide-y divide-line border border-line rounded-3xl bg-surface overflow-hidden shadow-xs"
        >
          {FAQS.map((faq, i) => (
            <details key={i} className="group p-5 sm:p-6 cursor-pointer text-left hover:bg-subtle/30 transition-colors">
              <summary className="flex items-center justify-between font-semibold text-sm sm:text-base text-fg list-none">
                <span>{faq.q}</span>
                <ChevronDown className="size-4 text-fg-3 transition-transform group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <p className="text-xs sm:text-sm text-fg-3 mt-3 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </m.div>
      </section>

      {/* ── 10. Bottom High-Converting Call to Action Banner ───────────── */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-b from-subtle/40 via-surface to-subtle/40 border-t border-line">
        <m.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-line text-xs font-medium text-fg-2 shadow-xs">
            <ShieldCheck className="size-3.5 text-accent" />
            <span>Setup in under 10 seconds • No credit card needed</span>
          </div>

          <h2 className="text-2xl sm:text-5xl font-extrabold text-fg tracking-tight">
            Ready to Never Lose Another Warranty?
          </h2>
          <p className="text-xs sm:text-base text-fg-3 max-w-xl mx-auto leading-relaxed">
            Join thousands of smart shoppers protecting verified purchases, tracking expiry dates, and saving thousands in replacement costs.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <m.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
              <Button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto h-12 px-8 rounded-xl text-sm font-semibold bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Create Free Vault</span>
                <ArrowRight className="size-4" />
              </Button>
            </m.div>
            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <a
                href="#how-it-works"
                className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-hover cursor-pointer flex items-center justify-center text-fg transition-colors"
              >
                <span>Explore How It Works</span>
              </a>
            </m.div>
          </div>
        </m.div>
      </section>

      {/* ── 11. Enterprise Multi-Column Footer ─────────────────────────── */}
      <footer className="border-t border-line bg-surface py-12 sm:py-14 text-xs text-fg-3 font-sans">
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
                  <a href="#how-it-works" className="hover:text-fg transition-colors">
                    How It Works
                  </a>
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
