import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Package, Smartphone, Laptop, Tv } from 'lucide-react';
import { useRemindersQuery } from '../../queries/useRemindersQuery';
import { formatDate } from '../../utils/formatters';

const getCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('phone') || cat.includes('mobile')) {
    return <Smartphone className="w-4 h-4 text-slate-700" />;
  }
  if (cat.includes('laptop') || cat.includes('computer') || cat.includes('electronic')) {
    return <Laptop className="w-4 h-4 text-slate-700" />;
  }
  if (cat.includes('appliance') || cat.includes('tv')) {
    return <Tv className="w-4 h-4 text-slate-700" />;
  }
  return <Package className="w-4 h-4 text-slate-700" />;
};

const UpcomingExpiriesWidget = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useRemindersQuery();
  const { items = [] } = data || {};

  // Sort by days remaining ascending (earliest expiring first)
  const upcomingItems = items
    .filter((i) => i.daysRemaining > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 3);

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xs flex flex-col justify-between font-sans h-full">
      <div className="flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Upcoming Expiries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Next scheduled warranty maturities
            </p>
          </div>
          <Link
            to="/warranties"
            className="text-xs font-medium text-brand-navy hover:text-brand-primary transition-colors inline-flex items-center gap-1 shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading expiries...</div>
        ) : upcomingItems.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs font-medium text-slate-700">No imminent expirations</p>
            <p className="text-[11px] text-slate-400">All registered warranties are in safe horizons.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 my-auto">
            {upcomingItems.map((prod) => {
              const days = prod.daysRemaining;
              const isUrgent = days <= 30;
              const isWarning = days > 30 && days <= 90;

              let badgeStyle = 'bg-brand-primary/10 text-brand-primary border-brand-primary/25 font-medium';
              if (isUrgent) {
                badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
              } else if (isWarning) {
                badgeStyle = 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 font-semibold';
              }

              return (
                <div
                  key={prod._id}
                  onClick={() => navigate(`/products/${prod._id}`)}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors rounded-xl px-1.5 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/25 text-brand-primary flex items-center justify-center shrink-0">
                      {getCategoryIcon(prod.category)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-medium text-slate-900 group-hover:text-brand-primary transition-colors truncate">
                        {prod.productName}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {prod.receipt?.storeName || prod.brand || 'Merchant'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-tabular border ${badgeStyle}`}
                    >
                      {days} {days === 1 ? 'day left' : 'days left'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-tabular">
                      {formatDate(prod.warrantyExpiryDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto border-t border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/warranties')}
          className="w-full py-2.5 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer text-center"
        >
          View All Warranties
        </button>
      </div>
    </div>
  );
};

export default UpcomingExpiriesWidget;
