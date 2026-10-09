import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useWarrantyTimelineQuery } from '../../queries/useDashboardExtraQueries';

const WarrantyTimelineWidget = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useWarrantyTimelineQuery();
  const { buckets = {}, totalProducts = 0 } = data || {};

  const {
    dueSoon = { count: 0, items: [] },
    next3Months = { count: 0, items: [] },
    next6Months = { count: 0, items: [] },
    later = { count: 0, items: [] },
  } = buckets;

  const totalTracked = (dueSoon.count || 0) + (next3Months.count || 0) + (next6Months.count || 0) + (later.count || 0);

  const milestones = [
    {
      id: 'dueSoon',
      count: dueSoon.count,
      label: 'Expiring Soon',
      range: '≤ 30 days',
      hasItems: dueSoon.count > 0,
      numColor: dueSoon.count > 0 ? 'text-brand-navy font-bold' : 'text-slate-900',
      dotColor: dueSoon.count > 0 ? 'bg-brand-navy ring-4 ring-brand-border' : 'bg-slate-300',
      barColor: dueSoon.count > 0 ? 'bg-brand-navy' : 'bg-slate-200',
    },
    {
      id: 'next3Months',
      count: next3Months.count,
      label: 'Next 3 Months',
      range: '31 – 90 days',
      hasItems: next3Months.count > 0,
      numColor: next3Months.count > 0 ? 'text-brand-primary font-bold' : 'text-slate-900',
      dotColor: next3Months.count > 0 ? 'bg-brand-primary ring-4 ring-brand-border' : 'bg-slate-300',
      barColor: next3Months.count > 0 ? 'bg-brand-primary' : 'bg-slate-200',
    },
    {
      id: 'next6Months',
      count: next6Months.count,
      label: 'Next 6 Months',
      range: '91 – 180 days',
      hasItems: next6Months.count > 0,
      numColor: 'text-slate-900',
      dotColor: next6Months.count > 0 ? 'bg-slate-600 ring-4 ring-slate-100' : 'bg-slate-300',
      barColor: next6Months.count > 0 ? 'bg-slate-600' : 'bg-slate-200',
    },
    {
      id: 'later',
      count: later.count,
      label: 'Long Term',
      range: '> 180 days',
      hasItems: later.count > 0,
      numColor: later.count > 0 ? 'text-brand-primary font-semibold' : 'text-slate-900',
      dotColor: later.count > 0 ? 'bg-brand-primary ring-4 ring-brand-border' : 'bg-slate-300',
      barColor: later.count > 0 ? 'bg-brand-primary' : 'bg-slate-200',
    },
  ];

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xs flex flex-col justify-between font-sans h-full">
      <div className="flex-1 flex flex-col justify-between space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Warranty Horizon</span>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60 font-tabular">
                {totalTracked} {totalTracked === 1 ? 'asset' : 'assets'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Lifecycle status across your registered product portfolio
            </p>
          </div>
          <Link
            to="/warranties"
            className="text-xs font-medium text-slate-700 hover:text-brand-primary transition-colors inline-flex items-center gap-1 shrink-0"
          >
            <span>View timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading warranty timeline...</div>
        ) : (
          <div className="space-y-6 py-1">
            {/* Segmented Horizon Progress Track */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-normal text-slate-400 px-1">
                <span>Immediate Attention (≤30d)</span>
                <span>Extended Protection (&gt;180d)</span>
              </div>

              {/* Segmented Bar */}
              <div className="grid grid-cols-4 gap-1.5 h-2 w-full bg-transparent">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    title={`${m.label}: ${m.count} items (${m.range})`}
                    className={`h-full rounded-full transition-all duration-300 ${
                      m.hasItems ? m.barColor : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4 Interactive Milestone Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate('/warranties')}
                  className="group relative bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-normal text-slate-500">
                      {m.range}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${m.hasItems ? m.dotColor : 'bg-slate-300'}`} />
                  </div>

                  <div className="my-2.5">
                    <span className={`text-2xl font-semibold font-tabular block leading-none ${m.numColor}`}>
                      {m.count}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-slate-800 truncate block group-hover:text-brand-primary transition-colors">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reassurance Subtext - pinned to bottom */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-normal">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          <span>
            {dueSoon.count === 0 ? 'All warranties are currently in safe horizons.' : `${dueSoon.count} item(s) require action within 30 days.`}
          </span>
        </span>
        <button
          onClick={() => navigate('/warranties')}
          className="text-xs font-medium text-brand-navy hover:text-brand-primary hover:underline cursor-pointer"
        >
          Manage Coverage
        </button>
      </div>
    </div>
  );
};

export default WarrantyTimelineWidget;
