import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react';
import { useRemindersQuery, useUpdateReminderMutation } from '../../queries/useRemindersQuery';
import { formatDate } from '../../utils/formatters';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data, isLoading } = useRemindersQuery();
  const updateMutation = useUpdateReminderMutation();

  const { stats = {}, items = [], logs = [] } = data || {};

  // Find items expiring soon (<= 30 days) or active alerts
  const urgentItems = items.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 30);
  const activeAlertsCount = urgentItems.filter((i) => i.reminderEnabled).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleReminder = (e, product) => {
    e.stopPropagation();
    updateMutation.mutate({
      productId: product._id,
      reminderEnabled: !product.reminderEnabled,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Notifications and Warranty Reminders"
        title="Notifications & Warranty Reminders"
      >
        <Bell className="w-5 h-5" />
        {activeAlertsCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs font-tabular">
            {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden font-sans text-slate-900 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Warranty Reminders</span>
              {activeAlertsCount > 0 && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-tabular">
                  {activeAlertsCount} expiring soon
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading reminders...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-700">No active warranty items</p>
                <p className="text-[11px] text-slate-400">
                  Products with warranties will notify you here before expiration.
                </p>
              </div>
            ) : (
              items.slice(0, 8).map((prod) => {
                const days = prod.daysRemaining;
                const isUrgent = days > 0 && days <= 30;
                const isExpired = days <= 0;

                return (
                  <div
                    key={prod._id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/products/${prod._id}`);
                    }}
                    className={`p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                      !prod.reminderEnabled ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                          {prod.productName}
                        </strong>
                        {prod.brand && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {prod.brand}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        {prod.receipt?.storeName && (
                          <span>{prod.receipt.storeName}</span>
                        )}
                        <span>•</span>
                        <span>Expires {formatDate(prod.warrantyExpiryDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpired ? (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full font-tabular">
                          Expired
                        </span>
                      ) : isUrgent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full font-tabular">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{days}d left</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-tabular">
                          {days}d left
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleToggleReminder(e, prod)}
                        className={`p-1.5 rounded-md hover:bg-slate-200/70 transition-colors cursor-pointer ${
                          prod.reminderEnabled ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                        title={prod.reminderEnabled ? 'Mute alert' : 'Enable alert'}
                      >
                        {prod.reminderEnabled ? (
                          <Bell className="w-3.5 h-3.5" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer link to Warranty Tracker */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <Link
              to="/warranties"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
            >
              <span>View all in Warranty Tracker</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
