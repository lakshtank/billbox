import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Trash2,
  Edit3,
  Scan,
  ArrowRight,
  Clock,
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
        icon: <Scan className="w-3.5 h-3.5 text-slate-700" />,
        action: 'Receipt scanned',
      };
    case 'receipt_created':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-slate-700" />,
        action: 'Invoice imported',
      };
    case 'product_created':
      return {
        icon: <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />,
        action: 'Warranty activated',
      };
    case 'product_updated':
      return {
        icon: <Edit3 className="w-3.5 h-3.5 text-slate-700" />,
        action: 'Note added',
      };
    case 'receipt_deleted':
    case 'product_deleted':
      return {
        icon: <Trash2 className="w-3.5 h-3.5 text-brand-navy/70" />,
        action: 'Item removed',
      };
    default:
      return {
        icon: <Clock className="w-3.5 h-3.5 text-slate-700" />,
        action: 'Activity recorded',
      };
  }
};

const ActivityFeedWidget = () => {
  const navigate = useNavigate();
  const { data: activities = [], isLoading } = useActivityFeedQuery(4);

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xs flex flex-col justify-between font-sans h-full">
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit log of changes and document imports
            </p>
          </div>
          <Link
            to="/receipts"
            className="text-xs font-medium text-brand-navy hover:text-brand-primary transition-colors inline-flex items-center gap-1 shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs font-medium text-slate-700">No activity logged yet</p>
            <p className="text-[11px] text-slate-400">Your recent scans and updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 my-auto">
            {activities.map((act) => {
              const visuals = getActivityVisuals(act.type);

              return (
                <div
                  key={act._id}
                  className="py-3 px-1.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0">
                      {visuals.icon}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-400 leading-none mb-1">
                        {visuals.action}
                      </p>
                      <h3 className="text-xs font-medium text-slate-900 truncate">
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

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time event logging active</span>
        </span>
        <button
          onClick={() => navigate('/receipts')}
          className="text-xs font-medium text-brand-navy hover:text-brand-primary hover:underline cursor-pointer"
        >
          Audit History
        </button>
      </div>
    </div>
  );
};

export default ActivityFeedWidget;
