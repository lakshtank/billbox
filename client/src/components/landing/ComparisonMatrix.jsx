import React from 'react';
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
    <section className="py-20 sm:py-28 relative overflow-hidden bg-subtle/30 border-t border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
            Why Switch to BillBox
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            Stop Losing Free Repairs to Lost Slips
          </h2>
          <p className="text-sm text-fg-3 leading-relaxed">
            See how smart document processing eliminates the frustrations of traditional paper receipt storage.
          </p>
        </div>

        {/* Matrix Card */}
        <div className="rounded-3xl bg-surface border border-line shadow-xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 border-b border-line bg-subtle/40 gap-4">
            <div className="md:col-span-4 font-bold text-sm text-fg uppercase tracking-wider">
              Capability
            </div>
            <div className="md:col-span-4 font-bold text-sm text-fg-3 uppercase tracking-wider flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>Crumpled Paper Receipts</span>
            </div>
            <div className="md:col-span-4 font-bold text-sm text-accent uppercase tracking-wider flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>BillBox Intelligent Vault</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-line">
            {COMPARISON_ROWS.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 p-5 sm:p-6 gap-3 sm:gap-4 items-center hover:bg-subtle/20 transition-colors text-xs sm:text-sm"
              >
                <div className="md:col-span-4 font-semibold text-fg">
                  {row.feature}
                </div>
                <div className="md:col-span-4 text-fg-3 flex items-start gap-2.5">
                  <X className="size-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{row.traditional}</span>
                </div>
                <div className="md:col-span-4 text-fg font-medium flex items-start gap-2.5 bg-accent/5 p-2 rounded-xl border border-accent/15">
                  <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{row.billbox}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
