import React from 'react';
import * as m from 'motion/react-m';
import { Check, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COMPARISON_ROWS = [
  {
    feature: 'Receipt Longevity',
    traditional: 'Thermal ink fades completely in 3 to 6 months',
    billbox: 'Permanent 256-bit encrypted digital vault forever',
  },
  {
    feature: 'Warranty Claim Success',
    traditional: '43% denied due to lost or unreadable slips',
    billbox: '100% claim-ready with original invoice proof',
  },
  {
    feature: 'Expiry Tracking',
    traditional: 'Zero notice; discovered after warranty expires',
    billbox: 'Automated proactive 30d & 90d milestone alerts',
  },
  {
    feature: 'Search & Retrieval',
    traditional: 'Digging through shoeboxes & drawers (15+ mins)',
    billbox: 'Instant search by store, item, or date in <100ms',
  },
  {
    feature: 'Tax & GST Tabulation',
    traditional: 'Manual calculation & paper receipts for accountants',
    billbox: 'Auto-itemized CGST, SGST, and 1-click CSV/PDF export',
  },
  {
    feature: 'Public Sharing',
    traditional: 'Take blurry phone photo of crumpled paper',
    billbox: 'Cryptographically secured shareable web links',
  },
];

export default function ComparisonMatrix() {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden bg-subtle/30 border-t border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <m.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3"
        >
          <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
            Why Switch to BillBox
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-fg tracking-tight">
            Stop Losing Free Repairs to Lost Slips
          </h2>
          <p className="text-xs sm:text-sm text-fg-3 leading-relaxed">
            See how smart document processing eliminates the frustrations of traditional paper receipt storage.
          </p>
        </m.div>

        {/* Matrix Card */}
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-surface border border-line shadow-xl overflow-hidden"
        >
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-12 p-5 sm:p-6 border-b border-line bg-subtle/40 gap-4">
            <div className="col-span-4 font-bold text-xs sm:text-sm text-fg uppercase tracking-wider">
              Capability
            </div>
            <div className="col-span-4 font-bold text-xs sm:text-sm text-fg-3 uppercase tracking-wider flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>Crumpled Paper Receipts</span>
            </div>
            <div className="col-span-4 font-bold text-xs sm:text-sm text-accent uppercase tracking-wider flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>BillBox Intelligent Vault</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-line">
            {COMPARISON_ROWS.map((row, idx) => (
              <m.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-6 gap-2 sm:gap-4 items-center hover:bg-subtle/30 transition-colors text-xs sm:text-sm"
              >
                <div className="sm:col-span-4 font-bold text-fg sm:font-semibold flex items-center justify-between">
                  <span>{row.feature}</span>
                  <span className="sm:hidden text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-subtle text-fg-3">
                    Comparison
                  </span>
                </div>

                {/* Traditional (Failure) */}
                <div className="sm:col-span-4 text-fg-3 flex items-start gap-2.5 p-2 sm:p-0 rounded-lg bg-rose-500/5 sm:bg-transparent border border-rose-500/10 sm:border-0">
                  <X className="size-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{row.traditional}</span>
                </div>

                {/* BillBox (Victory) */}
                <div className="sm:col-span-4 text-fg font-medium flex items-start gap-2.5 bg-accent/5 p-2 sm:p-2.5 rounded-xl border border-accent/20">
                  <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{row.billbox}</span>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
