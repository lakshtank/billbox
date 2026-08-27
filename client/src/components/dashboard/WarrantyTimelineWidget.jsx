import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

  const milestones = [
    {
      id: 'dueSoon',
      count: dueSoon.count,
      label: 'Expiring Soon',
      sublabel: 'Within 30 days',
      dotColor: 'bg-rose-500 ring-4 ring-rose-100',
      lineColor: 'from-rose-500 to-amber-500',
      numColor: 'text-rose-600',
    },
    {
      id: 'next3Months',
      count: next3Months.count,
      label: 'Next 3 Months',
      sublabel: '30 – 90 days',
      dotColor: 'bg-amber-500 ring-4 ring-amber-100',
      lineColor: 'from-amber-500 to-amber-400',
      numColor: 'text-amber-600',
    },
    {
      id: 'next6Months',
      count: next6Months.count,
      label: 'Next 6 Months',
      sublabel: '90 – 180 days',
      dotColor: 'bg-yellow-500 ring-4 ring-yellow-100',
      lineColor: 'from-yellow-500 to-emerald-500',
      numColor: 'text-yellow-600',
    },
    {
      id: 'later',
      count: later.count,
      label: 'Later',
      sublabel: '> 180 days',
      dotColor: 'bg-emerald-500 ring-4 ring-emerald-100',
      lineColor: '',
      numColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6 font-sans h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Warranty at a Glance
          </h2>
          <Link
            to="/warranties"
            className="text-xs font-semibold text-[#0F172A] hover:text-[#047857] transition-colors inline-flex items-center gap-1"
          >
            <span>View timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading timeline...</div>
        ) : (
          <div className="pt-6 pb-2 space-y-8">
            {/* Connected Track Line with Milestone Dots */}
            <div className="relative flex items-center justify-between px-4 sm:px-6">
              {/* Connecting Line Track */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-rose-500 via-amber-400 via-yellow-400 to-emerald-500 rounded-full z-0 opacity-80" />

              {/* Milestone Dots */}
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="relative z-10 flex flex-col items-center cursor-pointer"
                  onClick={() => navigate('/warranties')}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${m.dotColor} shadow-xs transition-transform hover:scale-125`} />
                </div>
              ))}
            </div>

            {/* Horizon Metrics 4-Column Grid */}
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate('/warranties')}
                  className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span className={`text-xl sm:text-2xl font-bold font-tabular block leading-none ${m.numColor}`}>
                    {m.count}
                  </span>
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {m.label}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate font-normal">
                    {m.sublabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyTimelineWidget;
