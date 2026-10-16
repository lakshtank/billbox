import * as React from 'react';
import { Logo } from '../brand/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { ReceiptText } from 'lucide-react';

/**
 * Step 11: AuthLayout component
 * - Shared layout used by /login, /register, /forgot-password, /reset-password/:token
 * - Split at >=1024px: left form column, right brand panel. Below 1024 brand panel hidden.
 * - Container is min-h-dvh with w-full and max-w-*. No page scroll at 1366x768 and 1920x1080.
 * - Left column: wordmark top-left (ONE only). Theme toggle (32px, ghost) fixed top-right.
 * - Right brand panel (Cosmic Artistry):
 *   - Solid background: Light theme #124E66, Dark theme #212A31. No border.
 *   - Padding 64px (p-16). Flex column, vertically centered, max-w-[520px], left aligned.
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
  return (
    <div className="min-h-dvh w-full flex flex-col lg:flex-row bg-bg-app font-sans relative selection:bg-accent-tint">
      {/* Fixed theme toggle: 32px ghost button top-right, no bar behind it */}
      <div className="fixed top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle
          variant="ghost"
          className="w-8 h-8 lg:text-[#D3D9D4] lg:hover:text-white lg:hover:bg-white/10"
        />
      </div>

      {/* Left (Form side) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-10 min-h-dvh w-full lg:max-w-[50%]">
        {/* Top-left Wordmark (ONE only) */}
        <div className="shrink-0">
          <Logo size="md" showWordmark={true} />
        </div>

        {/* Vertically & horizontally centered form block: max-w-[400px] */}
        <div className="w-full max-w-[400px] mx-auto py-6 my-auto">
          {children}
        </div>

        {/* Bottom copyright */}
        <div className="shrink-0 text-xs text-fg-3">
          <p>© BillBox</p>
        </div>
      </div>

      {/* Right (Brand panel, visible >=1024px only, hidden below) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 bg-[#124E66] dark:bg-[#212A31] border-l-0 select-none relative overflow-hidden min-h-dvh">
        {/* Decorative mark: Oversized outlined ReceiptText cropped off bottom-right corner */}
        <ReceiptText
          strokeWidth={1.5}
          className="absolute -bottom-16 -right-16 w-[420px] h-[420px] text-white/10 pointer-events-none select-none z-0"
          aria-hidden="true"
        />

        {/* Centered Content Block: max-w-[520px] */}
        <div className="my-auto w-full max-w-[520px] mx-auto relative z-10 text-left">
          {/* 1. Overline */}
          <div className="text-[12px] font-medium uppercase tracking-[0.08em] !text-[#D3D9D4]">
            BillBox
          </div>

          {/* 2. Headline */}
          <h2 className="text-[48px] leading-[52px] font-semibold tracking-[-0.03em] !text-[#FFFFFF] mt-4 [text-wrap:balance]">
            Never lose a receipt or miss a warranty again.
          </h2>

          {/* 3. Body */}
          <p className="text-[18px] leading-[28px] !text-[#D3D9D4] max-w-[44ch] mt-5">
            Upload a bill, BillBox reads it, and you always know what&apos;s covered.
          </p>

          {/* 4. Steps list: 48px below body, 3 rows separated by 1px dividers, py-5 */}
          <div className="mt-12 border-t border-white/20 divide-y divide-white/20">
            {/* Step 1 */}
            <div className="flex items-start gap-4 py-5">
              <div className="w-10 shrink-0 font-mono text-[13px] !text-[#D3D9D4] pt-0.5">
                01
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-medium !text-[#FFFFFF] leading-snug">
                  Upload
                </h3>
                <p className="text-[14px] leading-[20px] !text-[#D3D9D4] mt-1">
                  Add a photo or PDF of any bill.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 py-5">
              <div className="w-10 shrink-0 font-mono text-[13px] !text-[#D3D9D4] pt-0.5">
                02
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-medium !text-[#FFFFFF] leading-snug">
                  Review
                </h3>
                <p className="text-[14px] leading-[20px] !text-[#D3D9D4] mt-1">
                  Check the details BillBox found.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 py-5">
              <div className="w-10 shrink-0 font-mono text-[13px] !text-[#D3D9D4] pt-0.5">
                03
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-medium !text-[#FFFFFF] leading-snug">
                  Track
                </h3>
                <p className="text-[14px] leading-[20px] !text-[#D3D9D4] mt-1">
                  See every warranty and when it ends.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Footer: pinned bottom-left, 13px, #D3D9D4 */}
        <div className="w-full max-w-[520px] mx-auto relative z-10 pt-6 text-left">
          <span className="text-[13px] !text-[#D3D9D4]">© BillBox</span>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
