import React from 'react';
import { Camera, Sparkles, BellRing, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  {
    step: '01',
    icon: Camera,
    title: 'Snap, Upload, or Drop',
    description:
      'Photograph physical paper receipts on your smartphone, upload PDF e-invoices, or drag images directly into the browser.',
    badge: '< 1 Second',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'AI Document Vision Parsing',
    description:
      'Instantly identifies merchants, line items, prices, GST taxes, and manufacturer warranty durations with high OCR precision.',
    badge: 'Automated Extraction',
  },
  {
    step: '03',
    icon: BellRing,
    title: 'Proactive Warranty Shield',
    description:
      'Continuous expiry tracking dispatches automated alerts at 90 days and 30 days before expiration so you never forfeit free replacements.',
    badge: '30d / 90d Alerts',
  },
];

export default function WorkflowSteps() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="outline" className="text-xs text-accent border-accent/30 font-mono">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            From Crumpled Receipt to Guaranteed Protection
          </h2>
          <p className="text-sm text-fg-3 leading-relaxed">
            Three simple steps to end receipt anxiety and protect every rupee of your manufacturer coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative p-7 rounded-3xl bg-surface border border-line shadow-xs hover:border-accent/40 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-extrabold text-fg-muted group-hover:text-accent transition-colors">
                      {s.step}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-line-subtle">
                      {s.badge}
                    </Badge>
                  </div>

                  <div className="size-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="size-6" />
                  </div>

                  <h3 className="text-lg font-bold text-fg mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-fg-3 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-line-subtle mt-6 flex items-center gap-1 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explore workflow</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
