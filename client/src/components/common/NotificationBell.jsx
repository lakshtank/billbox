import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Clock,
  ShieldCheck,
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

  const { items = [] } = data || {};

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
        className="relative p-2 rounded-lg text-fg-2 hover:text-fg hover:bg-hover transition-colors cursor-pointer"
        aria-label="Notifications and Warranty Reminders"
        title="Notifications & Warranty Reminders"
      >
        <Bell className="w-5 h-5" />
        {activeAlertsCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent shadow-xs tnum">
            {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl border border-line shadow-lg z-dropdown overflow-hidden font-sans text-fg">
          {/* Header */}
          <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-subtle">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-fg">Warranty Reminders</span>
              {activeAlertsCount > 0 && (
                <span className="text-[10px] font-semibold text-accent bg-accent-tint border border-accent/25 px-2 py-0.5 rounded-full tnum">
                  {activeAlertsCount} expiring soon
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-fg-3 hover:text-fg p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-line-subtle text-xs">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-fg-3">Loading reminders...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-fg-3 mx-auto" />
                <p className="text-xs font-medium text-fg">No active warranty items</p>
                <p className="text-[11px] text-fg-3">
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
                    className={`p-3.5 flex items-start justify-between gap-3 hover:bg-hover transition-colors cursor-pointer group ${
                      !prod.reminderEnabled ? 'opacity-60 bg-subtle/30' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs font-semibold text-fg group-hover:text-accent transition-colors truncate">
                          {prod.productName}
                        </strong>
                        {prod.brand && (
                          <span className="text-[10px] text-accent font-medium bg-accent-tint border border-accent/20 px-1.5 py-0.2 rounded">
                            {prod.brand}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-fg-3 flex items-center gap-2">
                        {prod.receipt?.storeName && (
                          <span>{prod.receipt.storeName}</span>
                        )}
                        <span>•</span>
                        <span>Expires {formatDate(prod.warrantyExpiryDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpired ? (
                        <span className="text-[10px] font-semibold text-bad-fg bg-bad-bg border border-bad-border px-2 py-0.5 rounded-full tnum">
                          Expired
                        </span>
                      ) : isUrgent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warn-fg bg-warn-bg border border-warn-border px-2 py-0.5 rounded-full tnum">
                          <Clock className="w-3 h-3 text-warn-solid" />
                          <span>{days}d left</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-accent bg-accent-tint border border-accent/25 px-2 py-0.5 rounded-full tnum">
                          {days}d left
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleToggleReminder(e, prod)}
                        className={`p-1.5 rounded-md hover:bg-subtle transition-colors cursor-pointer ${
                          prod.reminderEnabled ? 'text-accent' : 'text-fg-3'
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
          <div className="px-4 py-2.5 border-t border-line bg-subtle text-center">
            <Link
              to="/warranties"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
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
