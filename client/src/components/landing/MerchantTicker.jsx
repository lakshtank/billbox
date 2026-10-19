import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

const MERCHANTS = [
  { name: 'Apple Store', category: 'Official Retail & Online' },
  { name: 'Amazon India', category: 'E-Commerce Invoices' },
  { name: 'Croma', category: 'Electronics & Appliances' },
  { name: 'Reliance Digital', category: 'Consumer Tech' },
  { name: 'IKEA', category: 'Furniture & Home Living' },
  { name: 'Flipkart', category: 'Online Purchases' },
  { name: 'Vijay Sales', category: 'Home Appliances' },
  { name: 'Samsung SmartCafé', category: 'Official Hardware' },
  { name: 'Tata CLiQ Luxury', category: 'Lifestyle & Watches' },
  { name: 'Decathlon', category: 'Sports & Gear' },
];

export default function MerchantTicker() {
  return (
    <section className="py-10 border-b border-line bg-subtle/20 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-5 text-center">
        <p className="text-xs uppercase tracking-widest font-mono font-semibold text-fg-3">
          Seamless Ingestion Across India&apos;s Leading Retailers &amp; E-Commerce
        </p>
      </div>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex items-center gap-4 animate-marquee whitespace-nowrap py-1">
          {[...MERCHANTS, ...MERCHANTS].map((m, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface/80 border border-line shadow-2xs hover:border-accent/40 transition-colors shrink-0"
            >
              <div className="size-2 rounded-full bg-accent/60" />
              <span className="text-xs font-bold text-fg font-sans">{m.name}</span>
              <span className="text-[11px] text-fg-muted font-mono hidden sm:inline">
                • {m.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
