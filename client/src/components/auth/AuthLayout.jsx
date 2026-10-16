import * as React from 'react';
import { Logo } from '../brand/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { ReceiptText } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { useMotionTier } from '@/hooks/useMotionTier';

/**
 * Step 11 & Step 15: AuthLayout component
 * - Shared layout used by /login, /register, /forgot-password, /reset-password/:token
 * - Split at >=1024px: left form column, right brand panel. Below 1024 brand panel hidden.
 * - Container is min-h-dvh with w-full and max-w-*. No page scroll at 1366x768 and 1920x1080.
 * - Left column: wordmark top-left (ONE only). Theme toggle (32px, ghost) fixed top-right.
 * - Right brand panel (Cosmic Artistry):
 *   - Solid background: Light theme #124E66, Dark theme #212A31. No border.
 *   - Padding 64px (p-16). Flex column, vertically centered, max-w-[520px], left aligned.
 *   - Step 15 GSAP Intro (once): mock receipts table labelled "Preview", builds row by row,
 *     status badge flips Processing -> Matched at 1.2s, KPI ticks up via NumberFlow.
 *   - Step 15 Cursor spotlight: follows mouse pointer with accent-tint radial highlight.
 *   - Fixed text colors (no var(--fg-*) tokens):
 *     1. Overline: 12px, 500, uppercase, tracking 0.08em, #D3D9D4: "BillBox"
 *     2. Headline: 48px/52px, 600, -0.03em, #FFFFFF: "Never lose a receipt or miss a warranty again."
 *     3. Body: 18px/28px, #D3D9D4, max 44ch: "Upload a bill, BillBox reads it, and you always know what's covered."
 *     4. Steps list: 48px below body. 3 rows separated by 1px dividers (rgba(255,255,255,0.20)), py-5:
 *        - 01 Upload / "Add a photo or PDF of any bill."
 *        - 02 Review / "Check the details BillBox found."
 *        - 03 Track / "See every warranty and when it ends."
 *     5. Decorative mark: Oversized outlined ReceiptText cropped off bottom-right corner, stroke white at 10% opacity, 1.5px stroke, ~420px.
 *     6. Footer: pinned bottom-left, 13px, #D3D9D4: "© BillBox".
 */
export function AuthLayout({ children }) {
  const brandScopeRef = React.useRef(null);
  const tier = useMotionTier();
  const [kpiCount, setKpiCount] = React.useState(0);
  const [statusBadge, setStatusBadge] = React.useState('Processing');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || tier === 'lite') {
      setKpiCount(3);
      setStatusBadge('Matched');
      return;
    }

    if (sessionStorage.getItem('billbox_auth_intro_played')) {
      setKpiCount(3);
      setStatusBadge('Matched');
      return;
    }
    sessionStorage.setItem('billbox_auth_intro_played', '1');

    const badgeTimer = setTimeout(() => {
      setStatusBadge('Matched');
      setKpiCount(3);
    }, 1200);

    let isCancelled = false;
    import('gsap').then(({ gsap }) => {
      if (isCancelled || !brandScopeRef.current) return;
      const container = brandScopeRef.current;
      const header = container.querySelector('[data-auth-intro="header"]');
      const rows = container.querySelectorAll('[data-auth-intro="row"]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (header) {
        tl.from(header, { opacity: 0, y: -4, duration: 0.3 });
      }
      if (rows.length) {
        tl.from(rows, { opacity: 0, x: -12, duration: 0.35, stagger: 0.07 }, '-=0.15');
      }
    });

    return () => {
      isCancelled = true;
      clearTimeout(badgeTimer);
    };
  }, [tier]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--spotlight-x', `${x}px`);
    e.currentTarget.style.setProperty('--spotlight-y', `${y}px`);
  };

  return (
    <div className="min-h-dvh h-dvh max-h-dvh w-full flex flex-col lg:flex-row bg-bg-app font-sans relative selection:bg-accent-tint overflow-y-auto lg:overflow-hidden">
      {/* Fixed theme toggle: 32px ghost button top-right, no bar behind it */}
      <div className="fixed top-3 right-3 z-20 sm:top-5 sm:right-5">
        <ThemeToggle
          variant="ghost"
          className="w-8 h-8 lg:text-[#D3D9D4] lg:hover:text-white lg:hover:bg-white/10"
        />
      </div>

      {/* Left (Form side) */}
      <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 lg:p-8 min-h-dvh lg:min-h-0 h-full max-h-dvh w-full lg:max-w-[50%] overflow-y-auto lg:overflow-hidden">
        {/* Top-left Wordmark (ONE only) */}
        <div className="shrink-0">
          <Logo size="md" showWordmark={true} />
        </div>

        {/* Vertically & horizontally centered form block: max-w-[400px] */}
        <div className="w-full max-w-[400px] mx-auto py-2 my-auto">
          {children}
        </div>

        {/* Bottom copyright */}
        <div className="shrink-0 text-xs text-fg-3 pt-2">
          <p>© BillBox</p>
        </div>
      </div>

      {/* Right (Brand panel, visible >=1024px only, hidden below) */}
      <div
        onMouseMove={handleMouseMove}
        className="hidden lg:flex flex-1 flex-col justify-between p-6 xl:p-8 2xl:p-12 bg-[#124E66] dark:bg-[#212A31] border-l-0 select-none relative overflow-hidden min-h-dvh lg:min-h-0 h-full max-h-dvh group"
      >
        {/* Step 15 Cursor spotlight: follows pointer with soft radial highlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{
            background:
              'radial-gradient(540px circle at var(--spotlight-x, -1000px) var(--spotlight-y, -1000px), rgba(35, 119, 142, 0.35), transparent 70%)',
          }}
        />

        {/* Decorative mark: Oversized outlined ReceiptText cropped off bottom-right corner */}
        <ReceiptText
          strokeWidth={1.5}
          className="absolute -bottom-16 -right-16 w-[420px] h-[420px] text-white/10 pointer-events-none select-none z-0"
          aria-hidden="true"
        />

        {/* Centered Content Block: max-w-[520px] */}
        <div className="my-auto w-full max-w-[520px] mx-auto relative z-10 text-left">
          {/* 1. Overline */}
          <div className="text-[11px] xl:text-[12px] font-medium uppercase tracking-[0.08em] !text-[#D3D9D4]">
            BillBox
          </div>

          {/* 2. Headline */}
          <h2 className="text-[26px] xl:text-[32px] 2xl:text-[38px] leading-[1.15] font-semibold tracking-[-0.03em] !text-[#FFFFFF] mt-2 xl:mt-3 [text-wrap:balance]">
            Never lose a receipt or miss a warranty again.
          </h2>

          {/* 3. Body */}
          <p className="text-[13px] xl:text-[15px] leading-snug xl:leading-normal !text-[#D3D9D4] max-w-[44ch] mt-2 xl:mt-2.5">
            Upload a bill, BillBox reads it, and you always know what&apos;s covered.
          </p>

          {/* Step 15 Mock Receipts Table (labelled "Preview", builds in row by row via GSAP) */}
          <div
            ref={brandScopeRef}
            className="mt-3 xl:mt-4 rounded-[10px] xl:rounded-[12px] border border-white/20 bg-white/10 p-2.5 xl:p-3 backdrop-blur-xs shadow-lg max-w-[480px]"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/15">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider !text-[#D3D9D4]">
                  Preview
                </span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] xl:text-[11px] font-mono">
                <span className="!text-[#D3D9D4]">Tracked:</span>
                <NumberFlow value={kpiCount} />
              </div>
            </div>

            <table className="w-full text-left text-xs mt-1.5 border-collapse">
              <thead data-auth-intro="header">
                <tr className="text-white/60 text-[10px] uppercase font-semibold border-b border-white/10">
                  <th className="py-1">Merchant</th>
                  <th className="py-1">Date</th>
                  <th className="py-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr data-auth-intro="row" className="border-b border-white/10 text-white">
                  <td className="py-1 font-medium text-xs">Apple Store</td>
                  <td className="py-1 text-xs !text-[#D3D9D4]">12 Oct</td>
                  <td className="py-1 text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors duration-300 ${
                        statusBadge === 'Matched'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                          : 'bg-amber-500/25 text-amber-200 border border-amber-400/30'
                      }`}
                    >
                      {statusBadge}
                    </span>
                  </td>
                </tr>
                <tr data-auth-intro="row" className="border-b border-white/10 text-white">
                  <td className="py-1 font-medium text-xs">Amazon</td>
                  <td className="py-1 text-xs !text-[#D3D9D4]">08 Oct</td>
                  <td className="py-1 text-right">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                      Matched
                    </span>
                  </td>
                </tr>
                <tr data-auth-intro="row" className="text-white">
                  <td className="py-1 font-medium text-xs">IKEA</td>
                  <td className="py-1 text-xs !text-[#D3D9D4]">29 Sep</td>
                  <td className="py-1 text-right">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                      Matched
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Steps list: 3 rows separated by 1px dividers */}
          <div className="mt-3 xl:mt-4 border-t border-white/20 divide-y divide-white/20">
            {/* Step 1 */}
            <div className="flex items-start gap-3 py-1.5 xl:py-2">
              <div className="w-8 shrink-0 font-mono text-[12px] xl:text-[13px] !text-[#D3D9D4] pt-0.5">
                01
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] xl:text-[14px] font-medium !text-[#FFFFFF] leading-snug">
                  Upload
                </h3>
                <p className="text-[11px] xl:text-[12px] leading-[16px] !text-[#D3D9D4] mt-0.5">
                  Add a photo or PDF of any bill.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 py-1.5 xl:py-2">
              <div className="w-8 shrink-0 font-mono text-[12px] xl:text-[13px] !text-[#D3D9D4] pt-0.5">
                02
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] xl:text-[14px] font-medium !text-[#FFFFFF] leading-snug">
                  Review
                </h3>
                <p className="text-[11px] xl:text-[12px] leading-[16px] !text-[#D3D9D4] mt-0.5">
                  Check the details BillBox found.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 py-1.5 xl:py-2">
              <div className="w-8 shrink-0 font-mono text-[12px] xl:text-[13px] !text-[#D3D9D4] pt-0.5">
                03
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] xl:text-[14px] font-medium !text-[#FFFFFF] leading-snug">
                  Track
                </h3>
                <p className="text-[11px] xl:text-[12px] leading-[16px] !text-[#D3D9D4] mt-0.5">
                  See every warranty and when it ends.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Footer: pinned bottom-left, 13px, #D3D9D4 */}
        <div className="w-full max-w-[520px] mx-auto relative z-10 pt-2 xl:pt-3 text-left">
          <span className="text-[12px] xl:text-[13px] !text-[#D3D9D4]">© BillBox</span>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
