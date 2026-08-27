import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Package,
  ShieldCheck,
  Trash2,
  Edit3,
  Scan,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { useActivityFeedQuery } from '../../queries/useDashboardExtraQueries';

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getActivityVisuals = (type) => {
  switch (type) {
    case 'receipt_ocr_scanned':
      return {
        icon: <Scan className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-100',
        action: 'Receipt scanned',
      };
    case 'receipt_created':
      return {
        icon: <Mail className="w-4 h-4 text-sky-600" />,
        bg: 'bg-sky-50 border-sky-100',
        action: 'Invoice imported',
      };
    case 'product_created':
      return {
        icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
        bg: 'bg-purple-50 border-purple-100',
        action: 'Warranty activated',
      };
    case 'product_updated':
      return {
        icon: <Edit3 className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-50 border-amber-100',
        action: 'Note added',
      };
    case 'receipt_deleted':
    case 'product_deleted':
      return {
        icon: <Trash2 className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-100',
        action: 'Item removed',
      };
    default:
      return {
        icon: <FileText className="w-4 h-4 text-slate-600" />,
        bg: 'bg-slate-50 border-slate-100',
        action: 'Activity recorded',
      };
  }
};

const ActivityFeedWidget = () => {
  const navigate = useNavigate();
  const { data: activities = [], isLoading } = useActivityFeedQuery(4);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 font-sans h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Recent Activity
          </h2>
          <Link
            to="/receipts"
            className="text-xs font-semibold text-[#0F172A] hover:text-[#047857] transition-colors inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs font-medium text-slate-700">No activity yet</p>
            <p className="text-[11px] text-slate-400">Your recent scans and updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => {
              const visuals = getActivityVisuals(act.type);

              return (
                <div
                  key={act._id}
                  className="py-3 px-1 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${visuals.bg}`}>
                      {visuals.icon}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 leading-none mb-1">
                        {visuals.action}
                      </p>
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {act.title !== visuals.action ? act.title : act.message}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-tabular shrink-0">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedWidget;
