import { useNavigate, Link } from 'react-router-dom';
import { Clock, ArrowRight, ShieldAlert, Package, Smartphone, Laptop, Tv, Sparkles } from 'lucide-react';
import { useRemindersQuery } from '../../queries/useRemindersQuery';
import { formatDate } from '../../utils/formatters';

const getCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('phone') || cat.includes('mobile')) {
    return <Smartphone className="w-5 h-5 text-slate-700" />;
  }
  if (cat.includes('laptop') || cat.includes('computer') || cat.includes('electronic')) {
    return <Laptop className="w-5 h-5 text-slate-700" />;
  }
  if (cat.includes('appliance') || cat.includes('tv')) {
    return <Tv className="w-5 h-5 text-slate-700" />;
  }
  return <Package className="w-5 h-5 text-slate-700" />;
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
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 font-sans h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Upcoming Expiries
          </h2>
          <Link
            to="/warranties"
            className="text-xs font-semibold text-[#0F172A] hover:text-[#047857] transition-colors inline-flex items-center gap-1"
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
            <p className="text-[11px] text-slate-400">All your active warranties are in safe horizons.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingItems.map((prod) => {
              const days = prod.daysRemaining;
              const isUrgent = days <= 30;

              return (
                <div
                  key={prod._id}
                  onClick={() => navigate(`/products/${prod._id}`)}
                  className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors rounded-xl px-1 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                      {getCategoryIcon(prod.category)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                        {prod.productName}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {prod.receipt?.storeName || prod.brand || 'Merchant'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full font-tabular ${
                        isUrgent
                          ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {days} days left
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

      <button
        type="button"
        onClick={() => navigate('/warranties')}
        className="w-full py-2.5 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer text-center"
      >
        View All Expiring
      </button>
    </div>
  );
};

export default UpcomingExpiriesWidget;
